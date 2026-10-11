import { body, param } from "express-validator";
import { AvailableUserRole } from "../utils/constants.js";

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

const createProjectValidator = () => {
    return [
        body("name")
        .trim()
        .notEmpty()
        .withMessage("Project name is required")
        .isLength({ max: 100 })
        .withMessage("Project name must be at most 100 characters"),
    body("description")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Description must be at most 500 characters"),
    ]
}

const projectIdParamValidator = () => {
    return [
        param("projectId").isMongoId().withMessage("Invalid project id"),
    ]
}

const updateProjectValidator = () => {
    return [
        body("name")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Project name cannot be empty")
        .isLength({ max: 100 })
        .withMessage("Project name must be at most 100 characters"),
    body("description")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Description must be at most 500 characters"),

    ]
}

const addMemberValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Email is invalid"),
        body("role")
            .optional()
            .isIn(AvailableUserRole)
            .withMessage(`Role must be one of: ${AvailableUserRole.join(", ")}`),
    ]
}

const updateMemberRoleValidator = () => {
    return [
        body("role")
            .notEmpty()
            .withMessage("Role is required")
            .isIn(AvailableUserRole)
            .withMessage(`Role must be one of: ${AvailableUserRole.join(", ")}`),
    ];
};

const memberParamValidator = () => {
    return [
        param("projectId").isMongoId().withMessage("Invalid project id"),
        param("userId").isMongoId().withMessage("Invalid user id"),
    ];
};

export {
    userRegisterValidator,
    userLoginValidator,
    userChangeCurrentPasswordValidator,
    userForgetPasswordValidator,
    userResetForgetPasswordValidator,
    createProjectValidator,
    projectIdParamValidator,
    updateProjectValidator,
    addMemberValidator,
    updateMemberRoleValidator,
    memberParamValidator,
};