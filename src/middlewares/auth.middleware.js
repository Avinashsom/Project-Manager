import { User } from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/apiError.js';
import  { asyncHandler } from '../utils/async-handler.js';

export const verifyJWT = asyncHandler(async (req, res, next) => {
    //get token from cookie and header.because cookie is not in mobile app
    const token = req.cookie?.accessToken || req.header('Authorization')?.replace('Bearer ', '')

    if(!token){
        throw new ApiError(401, "Unauthorized access")
    }
    try {
        //verify the cookie token and usertoken
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
        )

        if(!user){
            throw new ApiError(401, "Invalid access token")
        }

        req.user = user;
        next();
    }catch (error) {
        throw new ApiError(401, "Invalid access token")
    }

})