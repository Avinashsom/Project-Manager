import { User } from '../models/user.models.js';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/api-error.js';
import  { asyncHandler } from '../utils/async-handler.js';
import { ProjectMember } from "../models/projectmember.models.js";


export const verifyJWT = asyncHandler(async (req, res, next) => {
    //get token from cookie and header.because cookie is not in mobile app
    const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '')

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

export const validateProjectPermission = (allowedRoles = []) =>
    asyncHandler(async (req, res, next) => {
        const { projectId } = req.params;

        const membership = await ProjectMember.findOne({
            user: req.user._id,
            project: projectId,
        });

        // 404 for non-members so we don't leak which projects exist
        if (!membership) {
            throw new ApiError(404, "Project not found");
        }

        // An empty allowedRoles array means "any member is allowed"
        if (allowedRoles.length && !allowedRoles.includes(membership.role)) {
            throw new ApiError(
                403,
                "You do not have permission to perform this action",
            );
        }

        req.projectMember = membership;
        next();
    });