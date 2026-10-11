import {Router} from "express";
import {logoutUser, login, registerUser} from "../controllers/auth.controllers.js";
import { validateRequest } from "../middlewares/validator.middleware.js";
import { userLoginValidator, userRegisterValidator } from "../validators/index.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(userRegisterValidator(), validateRequest, registerUser);
router.route("/login").post(userLoginValidator(), validateRequest, login);
router.route("/logout").post(verifyJWT, logoutUser);


export default router;