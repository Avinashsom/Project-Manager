import { Router } from "express";
import {
    createProject,
    getProjects,
    getProjectById,
} from "../controllers/project.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
    createProjectValidator,
    projectIdParamValidator,
} from "../validators/index.js";

const router = Router();

router.use(verifyJWT);

router
    .route("/")
    .get(getProjects)
    .post(createProjectValidator(), validate, createProject);

router
    .route("/:projectId")
    .get(projectIdParamValidator(), validate, getProjectById);

export default router;