import { Router } from "express";
import {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject,
    getProjectMembers,
    addMemberToProject,
    updateMemberRole,
    removeMember,
} from "../controllers/project.controllers.js";

import {
    verifyJWT,
    validateProjectPermission,
} from "../middlewares/auth.middleware.js";

import { validateRequest } from "../middlewares/validator.middleware.js";

import {
    createProjectValidator,
    updateProjectValidator,
    projectIdParamValidator,
    addMemberValidator,
    updateMemberRoleValidator,
    memberParamValidator,

} from "../validators/index.js";

import { UserRolesEnum } from "../utils/constants.js";

const router = Router();

router.use(verifyJWT);

router
    .route("/")
    .get(getProjects)
    .post(createProjectValidator(), validateRequest, createProject);

router
    .route("/:projectId")
    .get(
        projectIdParamValidator(),
        validateRequest,
        validateProjectPermission(),
        getProjectById,
    )
    .put(
        projectIdParamValidator(),
        updateProjectValidator(),
        validateRequest,
        validateProjectPermission([UserRolesEnum.ADMIN]),
        updateProject,
    )
    .delete(
        projectIdParamValidator(),
        validateRequest,
        validateProjectPermission([UserRolesEnum.ADMIN]),
        deleteProject,
    );

router
    .route("/:projectId/members")
    .get(
        projectIdParamValidator(),
        validateRequest,
        validateProjectPermission(),
        getProjectMembers,
    )
    .post(
        projectIdParamValidator(),
        addMemberValidator(),
        validateRequest,
        validateProjectPermission([UserRolesEnum.ADMIN]),
        addMemberToProject,
    );

router
    .route("/:projectId/members/:userId")
    .put(
        memberParamValidator(),
        updateMemberRoleValidator(),
        validateRequest,
        validateProjectPermission([UserRolesEnum.ADMIN]),
        updateMemberRole,
    )
    .delete(
        memberParamValidator(),
        validateRequest,
        validateProjectPermission([UserRolesEnum.ADMIN]),
        removeMember,
    );

export default router;