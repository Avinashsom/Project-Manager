import {User} from "../models/user.models.js";
import { ApiResponse} from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError} from "../utils/api-error.js"
import {emailVerificationMailgenContent, sendEmail} from "../utils/mail.js"

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
    

export{
    registerUser,
    login
};