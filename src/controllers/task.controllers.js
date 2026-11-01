import { Task } from "../models/task.models.js";
import { SubTask } from "../models/subtask.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { AvailableTaskStatus, UserRolesEnum } from "../utils/constants.js";
import { removeFilesByUrls } from "../utils/file.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

// Which user fields we show when we fill in assignedTo / assignedBy
const userFields = "username email fullName avatar";

// Check that the user is a member of the project
const checkUserIsMember = async (projectId, userId) => {
    const member = await ProjectMember.findOne({
        project: projectId,
        user: userId,
    });
    if (!member) {
        throw new ApiError(400, "Assigned user is not a member of this project");
    }
};

// Change multer files into the shape we save in the database
const makeAttachments = (files = []) => {
    return files.map((file) => ({
        url: `/images/${file.filename}`,
        mimetype: file.mimetype,
        size: file.size,
    }));
};

const createTask = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { title, description, assignedTo, status } = req.body;

    if (assignedTo) {
        await checkUserIsMember(projectId, assignedTo);
    }

    const task = await Task.create({
        title,
        description,
        project: projectId,
        assignedTo: assignedTo || null,
        assignedBy: req.user._id,
        status,
        attachments: makeAttachments(req.files),
    });

    return res
        .status(201)
        .json(new ApiResponse(201, task, "Task created successfully"));
});

const getTasks = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { status } = req.query;

    const filter = { project: projectId };

    // Optional filter like /tasks/<projectId>?status=done
    if (status) {
        if (!AvailableTaskStatus.includes(status)) {
            throw new ApiError(400, "Invalid status filter");
        }
        filter.status = status;
    }

    const tasks = await Task.find(filter)
        .populate("assignedTo", userFields)
        .populate("assignedBy", userFields)
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, tasks, "Tasks fetched successfully"));
});

const getTaskById = asyncHandler(async (req, res) => {
    const { projectId, taskId } = req.params;

    // We also match the project, so a task from another project is never returned
    const task = await Task.findOne({ _id: taskId, project: projectId })
        .populate("assignedTo", userFields)
        .populate("assignedBy", userFields);

    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    const subtasks = await SubTask.find({ task: taskId }).sort({
        createdAt: 1,
    });

    const data = { ...task.toObject(), subtasks };

    return res
        .status(200)
        .json(new ApiResponse(200, data, "Task fetched successfully"));
});

const updateTask = asyncHandler(async (req, res) => {
    const { projectId, taskId } = req.params;
    const { title, description, assignedTo, status } = req.body;

    const task = await Task.findOne({ _id: taskId, project: projectId });
    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    const hasNewFiles = req.files && req.files.length > 0;
    const nothingToUpdate =
        title === undefined &&
        description === undefined &&
        assignedTo === undefined &&
        status === undefined &&
        !hasNewFiles;

    if (nothingToUpdate) {
        throw new ApiError(400, "Provide at least one field to update");
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;

    if (assignedTo !== undefined) {
        if (assignedTo === "") {
            // Empty value means "remove the assignee"
            task.assignedTo = null;
        } else {
            await checkUserIsMember(projectId, assignedTo);
            task.assignedTo = assignedTo;
        }
    }

    // New files are added after the old ones
    if (hasNewFiles) {
        task.attachments.push(...makeAttachments(req.files));
    }

    await task.save();

    return res
        .status(200)
        .json(new ApiResponse(200, task, "Task updated successfully"));
});

const deleteTask = asyncHandler(async (req, res) => {
    const { projectId, taskId } = req.params;

    const task = await Task.findOne({ _id: taskId, project: projectId });
    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    // Delete the files from disk, then the subtasks, then the task
    removeFilesByUrls(task.attachments);
    await SubTask.deleteMany({ task: taskId });
    await task.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, { _id: taskId }, "Task deleted successfully"));
});

const createSubTask = asyncHandler(async (req, res) => {
    const { projectId, taskId } = req.params;
    const { title } = req.body;

    // The task must exist inside this project
    const task = await Task.findOne({ _id: taskId, project: projectId });
    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    const subTask = await SubTask.create({
        title,
        task: taskId,
        project: projectId,
        createdBy: req.user._id,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, subTask, "Subtask created successfully"));
});

const updateSubTask = asyncHandler(async (req, res) => {
    const { projectId, subTaskId } = req.params;
    const { title, isCompleted } = req.body;

    // We match the project too, so a subtask from another project is never found
    const subTask = await SubTask.findOne({ _id: subTaskId, project: projectId });
    if (!subTask) {
        throw new ApiError(404, "Subtask not found");
    }

    if (title === undefined && isCompleted === undefined) {
        throw new ApiError(400, "Provide at least one field to update");
    }

    // req.projectMember was set by validateProjectPermission
    const role = req.projectMember.role;

    // A normal member can only mark complete or not complete, not change the title
    if (role === UserRolesEnum.MEMBER && title !== undefined) {
        throw new ApiError(403, "Members can only change the completion status");
    }

    if (title !== undefined) subTask.title = title;
    if (isCompleted !== undefined) subTask.isCompleted = isCompleted;

    await subTask.save();

    return res
        .status(200)
        .json(new ApiResponse(200, subTask, "Subtask updated successfully"));
});

const deleteSubTask = asyncHandler(async (req, res) => {
    const { projectId, subTaskId } = req.params;

    const subTask = await SubTask.findOne({ _id: subTaskId, project: projectId });
    if (!subTask) {
        throw new ApiError(404, "Subtask not found");
    }

    await subTask.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, { _id: subTaskId }, "Subtask deleted successfully"));
});

export { createTask, getTasks, getTaskById, updateTask, deleteTask, createSubTask, updateSubTask, deleteSubTask };