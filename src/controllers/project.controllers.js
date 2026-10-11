import mongoose from "mongoose";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { UserRolesEnum } from "../utils/constants.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

const createProject = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    const project = await Project.create({
        name,
        description,
        createdBy: req.user._id,
    });

    // Creator becomes the project's Admin.
    // No transaction (needs a replica set), so compensate on failure.
    try {
        await ProjectMember.create({
            user: req.user._id,
            project: project._id,
            role: UserRolesEnum.ADMIN,
        });
    } catch (error) {
        await Project.findByIdAndDelete(project._id);
        throw error;
    }

    return res
        .status(201)
        .json(new ApiResponse(201, project, "Project created successfully"));
});

const getProjects = asyncHandler(async (req, res) => {
    const projects = await ProjectMember.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(req.user._id) } },
        {
            $lookup: {
                from: Project.collection.name,
                localField: "project",
                foreignField: "_id",
                as: "project",
            },
        },
        { $unwind: "$project" },
        {
            $lookup: {
                from: ProjectMember.collection.name,
                let: { projectId: "$project._id" },
                pipeline: [
                    { $match: { $expr: { $eq: ["$project", "$$projectId"] } } },
                    { $count: "count" },
                ],
                as: "memberStats",
            },
        },
        {
            $addFields: {
                memberCount: {
                    $ifNull: [{ $arrayElemAt: ["$memberStats.count", 0] }, 0],
                },
            },
        },
        { $sort: { "project.createdAt": -1 } },
        {
            $project: {
                _id: "$project._id",
                name: "$project.name",
                description: "$project.description",
                createdBy: "$project.createdBy",
                createdAt: "$project.createdAt",
                role: 1,
                memberCount: 1,
            },
        },
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, projects, "Projects fetched successfully"));
});

const getProjectById = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const membership = await ProjectMember.findOne({
        user: req.user._id,
        project: projectId,
    }).populate("project");

    // 404 (not 403) so we don't reveal whether a project exists
    if (!membership || !membership.project) {
        throw new ApiError(404, "Project not found");
    }

    const data = { ...membership.project.toObject(), role: membership.role };

    return res
        .status(200)
        .json(new ApiResponse(200, data, "Project fetched successfully"));
});

export { createProject, getProjects, getProjectById };