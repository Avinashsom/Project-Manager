import { body, param } from "express-validator";
import { AvailableUserRole } from "../utils/constants.js";
import { AvailableTaskStatus } from "../utils/constants.js";


const userRegisterValidator = () => {
    return [
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
            .isLength({ min: 3 })
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

const createTaskValidator = () => {
    return [
        body("title")
            .trim()
            .notEmpty()
            .withMessage("Task title is required")
            .isLength({ max: 150 })
            .withMessage("Title must be at most 150 characters"),
        body("description")
            .optional()
            .trim()
            .isLength({ max: 1000 })
            .withMessage("Description must be at most 1000 characters"),
        // checkFalsy means an empty value is treated as "not sent"
        body("assignedTo")
            .optional({ checkFalsy: true })
            .isMongoId()
            .withMessage("Invalid assignedTo user id"),
        body("status")
            .optional()
            .isIn(AvailableTaskStatus)
            .withMessage(`Status must be one of: ${AvailableTaskStatus.join(", ")}`),
    ]
};

const updateTaskValidator = () => {
    return [
        body("title")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("Title cannot be empty")
            .isLength({ max: 150 })
            .withMessage("Title must be at most 150 characters"),
        body("description")
            .optional()
            .trim()
            .isLength({ max: 1000 })
            .withMessage("Description must be at most 1000 characters"),
        body("assignedTo")
            .optional({ checkFalsy: true })
            .isMongoId()
            .withMessage("Invalid assignedTo user id"),
        body("status")
            .optional()
            .isIn(AvailableTaskStatus)
            .withMessage(`Status must be one of: ${AvailableTaskStatus.join(", ")}`),
    ]
};

const taskParamValidator = () => {
    return [
        param("projectId").isMongoId().withMessage("Invalid project id"),
        param("taskId").isMongoId().withMessage("Invalid task id"),
    ]
};

const createSubTaskValidator = () => {
    return [
        body("title")
            .trim()
            .notEmpty()
            .withMessage("Subtask title is required")
            .isLength({ max: 150 })
            .withMessage("Title must be at most 150 characters"),
    ]
};

const updateSubTaskValidator = () => {
    return [
        body("title")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("Title cannot be empty")
            .isLength({ max: 150 })
            .withMessage("Title must be at most 150 characters"),
        // toBoolean changes "true" / "false" text into real true / false
        body("isCompleted")
            .optional()
            .isBoolean()
            .withMessage("isCompleted must be true or false")
            .toBoolean(),
    ]
};

const subTaskParamValidator = () => {
    return [
        param("projectId").isMongoId().withMessage("Invalid project id"),
        param("subTaskId").isMongoId().withMessage("Invalid subtask id"),
    ]
};

export const createNoteValidator = () => [
    body("content")
        .trim()
        .notEmpty()
        .withMessage("Note content is required")
        .isLength({ max: 2000 })
        .withMessage("Note must be at most 2000 characters"),
];

export const updateNoteValidator = () => [
    body("content")
        .trim()
        .notEmpty()
        .withMessage("Note content is required")
        .isLength({ max: 2000 })
        .withMessage("Note must be at most 2000 characters"),
];

export const noteParamValidator = () => [
    param("projectId").isMongoId().withMessage("Invalid project id"),
    param("noteId").isMongoId().withMessage("Invalid note id"),
];


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
    createTaskValidator,
    updateTaskValidator,
    taskParamValidator,
    createSubTaskValidator,
    updateSubTaskValidator,
    subTaskParamValidator,
};