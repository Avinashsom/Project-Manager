import { Router } from "express";
import {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask,
    createSubTask,
    updateSubTask,
    deleteSubTask,
} from "../controllers/task.controllers.js";
import {
    verifyJWT,
    validateProjectPermission,
} from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validator.middleware.js";
import { handleAttachmentUpload } from "../middlewares/multer.middleware.js";
import {
    projectIdParamValidator,
    taskParamValidator,
    createTaskValidator,
    updateTaskValidator,
    createSubTaskValidator,
    updateSubTaskValidator,
    subTaskParamValidator,
} from "../validators/index.js";
import { UserRolesEnum } from "../utils/constants.js";

const router = Router();

router.use(verifyJWT);

// Only these two roles can create, update and delete tasks
const canManageTasks = [UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN];

router
    .route("/:projectId")
    .get(
        projectIdParamValidator(),
        validateRequest,
        validateProjectPermission(),
        getTasks,
    )
    .post(
        projectIdParamValidator(),
        validateRequest,
        validateProjectPermission(canManageTasks),
        handleAttachmentUpload,
        createTaskValidator(),
        validateRequest,
        createTask,
    );

router
    .route("/:projectId/t/:taskId")
    .get(taskParamValidator(), validateRequest, validateProjectPermission(), getTaskById)
    .put(
        taskParamValidator(),
        validateRequest,
        validateProjectPermission(canManageTasks),
        handleAttachmentUpload,
        updateTaskValidator(),
        validateRequest,
        updateTask,
    )
    .delete(
        taskParamValidator(),
        validateRequest,
        validateProjectPermission(canManageTasks),
        deleteTask,
    );

router
    .route("/:projectId/t/:taskId/subtasks")
    .post(
        taskParamValidator(),
        createSubTaskValidator(),
        validateRequest,
        validateProjectPermission(canManageTasks),
        createSubTask,
    );

router
    .route("/:projectId/st/:subTaskId")
    .put(
        subTaskParamValidator(),
        updateSubTaskValidator(),
        validateRequest,
        validateProjectPermission(), // any member can get in, the controller checks the details
        updateSubTask,
    )
    .delete(
        subTaskParamValidator(),
        validateRequest,
        validateProjectPermission(canManageTasks),
        deleteSubTask,
    );

    
export default router;