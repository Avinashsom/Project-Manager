import {User} from "../models/user.models.js";
import { ApiResponse} from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError} from "../utils/api-error.js"
import {emailVerificationMailgenContent, forgetPasswordMailgenContent, sendEmail} from "../utils/mail.js"
import crypto from "crypto";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Access and refesh generate error")
    }
}

const registerUser = asyncHandler( async (req,res) => {
    const {email, username, password, role} = req.body

   const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if(existedUser){
        throw new ApiError(409, "User with email already exists", [])
    }

    const user = await User.create({
        email,
        password,
        username,
        isEmailVerified: false
    })

    const {unHashedToken, hashedToken, tokenExpiry} = user.generateTemporaryToken()

    user.emailVerificationToken = hashedToken
    user.emailVerificationExpiry = tokenExpiry

    await user.save({validateBeforeSave: false})

    await sendEmail(
        {
            email: user?.email,
            subject: "Please verify your email",
            mailgenContent: emailVerificationMailgenContent(
                user.username,
                `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`
            )
        }
    )

    const createduser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
    )
    if(!createduser){
        throw new ApiError(500, "Something went wrong while register user");
    }

    return res
    .status(201)
    .json(
        new ApiResponse(
            200,
            {createduser},
            "User register succesfully and verification email is sent on your email"
        )
    )
});

const login = asyncHandler(async (req,res) => {
    const {email, password,username} = req.body

    if(!email){
        throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({email});
    if(!user){
        throw new ApiError(400, "user does not exists");
    }
    
    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(400, "Invalid crendential");
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
    );
    
    const options ={
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken",  refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,
                accessToken,
                refreshToken
            },
            "user logged in successfully"
        )
    )
});
    
const logoutUser = asyncHandler(async (req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: ""
            }
        },
        {
            new: true,
        },
    );

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(
            200,
            {},
            "user logged out successfully"
        )
    )
});

const getCurrentUser = asyncHandler(async (req,res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            req.user,
            "Current user fetched successfully" 
        )
    )
});

const verifyEmail = asyncHandler(async (req,res) => {
    //take data from url by params
    const {verificationToken} = req.params

    if(!verificationToken){
        throw new ApiError(400, "Email Verification token is required")
    }

    //given hashed value from unhashed token
    let hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex")

    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: {$gt: Date.now()}
    })

    if(!user){
        throw new ApiError(400, "Invalid or expired email verification token")
    }

    user.isEmailVerified = true;

    //remove the email verification token and expiry after successful verification
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;

    //what done validatebeforesave: false is used to skip the validation of the model before saving it to the database.
    //In Mongoose, when you call the save() method on a document, it runs validation checks based on the schema defined for that model.
    //If any of the fields do not meet the validation criteria, an error will be thrown, and the document will not be saved.
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                isEmailVerified: true,
            },
            "EMAIL VERIFICATION SUCCESSFUL"
        )
    )
});

const resendEmailVerification = asyncHandler(async (req,res) => {
    const user = await User.findById(req.user?._id);

    if(!user){
        throw new ApiError(404, "User not found");
    }

    if(user.isEmailVerified){
        throw new ApiError(409, "Email is already verified");
    }

    const {unHashedToken, hashedToken, tokenExpiry} = user.generateTemporaryToken()

    user.emailVerificationToken = hashedToken
    user.emailVerificationExpiry = tokenExpiry

    await user.save({validateBeforeSave: false})

    await sendEmail(
        {
            email: user?.email,
            subject: "Please verify your email",
            mailgenContent: emailVerificationMailgenContent(
                user.username,
                `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`
            )
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Verification email resent successfully"
        )
    )
});

const refreshAccessToken = asyncHandler(async (req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized Access: Refresh token is required");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id);

        if(!user){
            throw new ApiError(401, "Unauthorized: User not found");
        }

        if(user?.refreshToken !== incomingRefreshToken){
            throw new ApiError(401, "refresh token is expired or does not match");
        }

        const options ={
            httpOnly: true,
            secure: true
        }

        const {accessToken, refreshToken: newRefreshToken} = await generateAccessAndRefreshToken(user._id)

        user.refreshToken = newRefreshToken
        await user.save({validateBeforeSave: false})

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken: newRefreshToken
                },
                "Refresh token refreshed successfully"
            )
        )
    }catch (error) {
        throw new ApiError(401, "Invalid refresh token");
    }
})

const forgetPasswordRequest = asyncHandler(async (req,res) => {
    const {email} = req.body

    const user = await User.findOne({email})
    if(!user){
        throw new ApiError(404, "User not found", []);
    }

    const {unHashedToken, hashedToken, tokenExpiry} = user.generateTemporaryToken()

    user.forgetPasswordToken = hashedToken
    user.forgetPasswordExpiry = tokenExpiry

    await user.save({validateBeforeSave: false})

    await sendEmail(
        {
            email: user?.email,
            subject: "Password Reset Request",
            mailgenContent: forgetPasswordMailgenContent(
                user.username,
                `${process.env.FORGET_PASSWORD_REDIRECT_URL}/${unHashedToken}`
            )
        }
    );

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Password reset email sent successfully"
        )
    )

})

const resetForgetPassword = asyncHandler(async (req,res) => {
    const {resetToken} = req.params
    const {newPassword} = req.body

    if(!resetToken){
        throw new ApiError(400, "Reset token is required");
    }
    //crypto will change unhashed token to hashed token to match with the hashed token in the database
    let hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex")

    const user = await User.findOne({
        forgetPasswordToken: hashedToken,
        forgetPasswordExpiry: {$gt: Date.now()}
    })

    if(!user){
        throw new ApiError(489, "Invalid or expired reset token");
    }

    user.forgetPasswordToken = undefined;
    user.forgetPasswordExpiry = undefined;

    //the new password will be hashed before saving to the database because of the pre save hook in the user model
    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Password reset successful"
        )
    )
})

const changeCurrentPassword = asyncHandler(async (req,res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id);

    const isPasswordValid = await user.isPasswordCorrect(oldPassword);
    if(!isPasswordValid){
        throw new ApiError(400, "Old password is incorrect");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Password changed successfully"
        )
    )
})


export{
    registerUser,
    login,
    logoutUser,
    getCurrentUser,
    verifyEmail,
    resendEmailVerification,
    refreshAccessToken,
    forgetPasswordRequest,
    resetForgetPassword,
    changeCurrentPassword
};