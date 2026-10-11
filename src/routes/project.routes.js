import { Router } from "express";
import {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject,
} from "../controllers/project.controllers.js";
import {
    verifyJWT,
    validateProjectPermission,
} from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
    createProjectValidator,
    updateProjectValidator,
    projectIdParamValidator,
} from "../validators/index.js";
import { UserRolesEnum } from "../utils/constants.js";

const router = Router();

router.use(verifyJWT);

router
    .route("/")
    .get(getProjects)
    .post(createProjectValidator(), validate, createProject);

router
    .route("/:projectId")
    .get(
        projectIdParamValidator(),
        validate,
        validateProjectPermission(),
        getProjectById,
    )
    .put(
        projectIdParamValidator(),
        updateProjectValidator(),
        validate,
        validateProjectPermission([UserRolesEnum.ADMIN]),
        updateProject,
    )
    .delete(
        projectIdParamValidator(),
        validate,
        validateProjectPermission([UserRolesEnum.ADMIN]),
        deleteProject,
    );

export default router;