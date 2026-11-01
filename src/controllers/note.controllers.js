import { Note } from "../models/note.models.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

// Which user fields we show when we fill in createdBy
const userFields = "username email fullName avatar";

const createNote = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { content } = req.body;

    const note = await Note.create({
        project: projectId,
        createdBy: req.user._id,
        content,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, note, "Note created successfully"));
});

const getNotes = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const notes = await Note.find({ project: projectId })
        .populate("createdBy", userFields)
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, notes, "Notes fetched successfully"));
});

const getNoteById = asyncHandler(async (req, res) => {
    const { projectId, noteId } = req.params;

    // We match the project too, so a note from another project is never returned
    const note = await Note.findOne({ _id: noteId, project: projectId }).populate(
        "createdBy",
        userFields,
    );

    if (!note) {
        throw new ApiError(404, "Note not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, note, "Note fetched successfully"));
});

const updateNote = asyncHandler(async (req, res) => {
    const { projectId, noteId } = req.params;
    const { content } = req.body;

    const note = await Note.findOne({ _id: noteId, project: projectId });
    if (!note) {
        throw new ApiError(404, "Note not found");
    }

    note.content = content;
    await note.save();

    return res
        .status(200)
        .json(new ApiResponse(200, note, "Note updated successfully"));
});

const deleteNote = asyncHandler(async (req, res) => {
    const { projectId, noteId } = req.params;

    const note = await Note.findOne({ _id: noteId, project: projectId });
    if (!note) {
        throw new ApiError(404, "Note not found");
    }

    await note.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, { _id: noteId }, "Note deleted successfully"));
});

export { createNote, getNotes, getNoteById, updateNote, deleteNote };