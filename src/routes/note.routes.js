import { Router } from "express";
import {
    createNote,
    getNotes,
    getNoteById,
    updateNote,
    deleteNote,
} from "../controllers/note.controllers.js";
import {
    verifyJWT,
    validateProjectPermission,
} from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validator.middleware.js";
import {
    projectIdParamValidator,
    noteParamValidator,
    createNoteValidator,
    updateNoteValidator,
} from "../validators/index.js";
import { UserRolesEnum } from "../utils/constants.js";

const router = Router();

router.use(verifyJWT);

// Only the admin can create, update and delete notes
const adminOnly = [UserRolesEnum.ADMIN];

router
    .route("/:projectId")
    .get(
        projectIdParamValidator(),
        validateRequest,
        validateProjectPermission(), // any member can read
        getNotes,
    )
    .post(
        projectIdParamValidator(),
        createNoteValidator(),
        validateRequest,
        validateProjectPermission(adminOnly),
        createNote,
    );

router
    .route("/:projectId/n/:noteId")
    .get(noteParamValidator(), validateRequest, validateProjectPermission(), getNoteById)
    .put(
        noteParamValidator(),
        updateNoteValidator(),
        validateRequest,
        validateProjectPermission(adminOnly),
        updateNote,
    )
    .delete(
        noteParamValidator(),
        validateRequest,
        validateProjectPermission(adminOnly),
        deleteNote,
    );

export default router;