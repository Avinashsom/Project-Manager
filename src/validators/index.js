import { body } from "express-validator";

const userRegisterValidator = () => {
    return[
        body("email")
            .trim()
            .notEmpty()
            .withMessage("email is required")
            .isEmail()
            .withMessage("email is invalid"),
        body("username")
            .trim()
            .notEmpty()
            .withMessage("username is required")
            .isLowercase()
            .withMessage("username in lower case")
            .isLength({min:3})
            .withMessage("username must be at least 3 char"),
        body("password")
            .trim()
            .notEmpty()
            .withMessage("password is required"),
        body("fullname")
            .optional()
            .trim()
    ]
}

const userLoginValidator = () => {
    return [
        body("email")
        .optional()
        .isEmail()
        .withMessage("email is invalid"),
        body("password")
            .notEmpty()
            .withMessage("password is required")
    ]
}

const userChangeCurrentPasswordValidator = () => {
    return [
        body("oldPassword")
            .notEmpty()
            .withMessage("Old password is required"),
        body("newPassword")
            .notEmpty()
            .withMessage("New password is required")
    ]
}

const userForgetPasswordValidator = () => {
    return [
        body("email")
            .notEmpty()
            .withMessage("email is required")
            .isEmail()
            .withMessage("email is invalid")
    ]
}

const userResetForgetPasswordValidator = () => {
    return [
        body("newPassword")
            .notEmpty()
            .withMessage("New password is required")

    ]
}
export {
    userRegisterValidator,
    userLoginValidator,
    userChangeCurrentPasswordValidator,
    userForgetPasswordValidator,
    userResetForgetPasswordValidator
}