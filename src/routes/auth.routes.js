import {Router} from "express";
import {login, registerUser} from "../controllers/auth.controllers.js";
import { validateRequest } from "../middlewares/validator.middleware.js";
import { userLoginValidator, userRegisterValidator } from "../validators/index.js";

const router = Router();

router.route("/register").post(userRegisterValidator(), validateRequest, registerUser);
router.route("/login").post(userLoginValidator(), validateRequest, login);


export default router;