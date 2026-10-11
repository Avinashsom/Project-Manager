import {Router} from "express";
import {
    logoutUser, 
    login, 
    registerUser, 
    refreshAccessToken,
    getCurrentUser,
    changeCurrentPassword,
    verifyEmail,
    resendEmailVerification,
    forgetPasswordRequest,
    resetForgetPassword
} 
from "../controllers/auth.controllers.js";

import { validateRequest } from "../middlewares/validator.middleware.js";
import {
    userLoginValidator, 
    userRegisterValidator,
    userChangeCurrentPasswordValidator,
    userForgetPasswordValidator,
    userResetForgetPasswordValidator
} from "../validators/index.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

//unsecured routes
router.route("/register").post(userRegisterValidator(), validateRequest, registerUser);
router.route("/login").post(userLoginValidator(), validateRequest, login);
router.route("/verify-email/:verificationToken").get(verifyEmail);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/forget-password").post(userForgetPasswordValidator(), validateRequest, forgetPasswordRequest);
router.route("/reset-password/:resetToken").post(userResetForgetPasswordValidator(), validateRequest, resetForgetPassword);

//secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/current-user").post(verifyJWT, getCurrentUser);
router.route("/change-password").post(verifyJWT, userChangeCurrentPasswordValidator(), validateRequest, changeCurrentPassword);
router.route("/resend-email-verification").post(verifyJWT, resendEmailVerification);


export default router;