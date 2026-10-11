import mongoose from "mongoose";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { UserRolesEnum } from "../utils/constants.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { User } from "../models/user.models.js";

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

const updateProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { name, description } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;

    if (Object.keys(updates).length === 0) {
        throw new ApiError(400, "Provide at least one field to update");
    }

    const project = await Project.findByIdAndUpdate(
        projectId,
        { $set: updates },
        { new: true, runValidators: true },
    );

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, project, "Project updated successfully"));
});

const deleteProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const project = await Project.findByIdAndDelete(projectId);

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    // Cascade. Tasks, subtasks and notes will be added here as we build them.
    await ProjectMember.deleteMany({ project: projectId });

    return res
        .status(200)
        .json(new ApiResponse(200, { _id: project._id }, "Project deleted successfully"));
});

const getProjectMembers = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const members = await ProjectMember.find({ project: projectId })
        .populate("user", "username email fullName avatar")
        .sort({ createdAt: 1 })
        .lean();

    const data = members.map((m) => ({
        _id: m._id,
        user: m.user,
        role: m.role,
        joinedAt: m.createdAt,
    }));

    return res
        .status(200)
        .json(new ApiResponse(200, data, "Members fetched successfully"));
});

const addMemberToProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { email, role = UserRolesEnum.MEMBER } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        throw new ApiError(404, "No registered user found with this email");
    }

    const existing = await ProjectMember.findOne({
        user: user._id,
        project: projectId,
    });
    if (existing) {
        throw new ApiError(409, "User is already a member of this project");
    }

    let membership;
    try {
        membership = await ProjectMember.create({
            user: user._id,
            project: projectId,
            role,
        });
    } catch (error) {
        // Unique index caught a concurrent duplicate
        if (error.code === 11000) {
            throw new ApiError(409, "User is already a member of this project");
        }
        throw error;
    }

    return res.status(201).json(
        new ApiResponse(
            201,
            {
                _id: membership._id,
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                },
                role: membership.role,
            },
            "Member added successfully",
        ),
    );
});

// Blocks any change that would leave a project with zero admins
const assertNotLastAdmin = async (projectId) => {
    const adminCount = await ProjectMember.countDocuments({
        project: projectId,
        role: UserRolesEnum.ADMIN,
    });
    if (adminCount <= 1) {
        throw new ApiError(400, "A project must have at least one admin");
    }
};

const updateMemberRole = asyncHandler(async (req, res) => {
    const { projectId, userId } = req.params;
    const { role } = req.body;

    const membership = await ProjectMember.findOne({
        project: projectId,
        user: userId,
    });
    if (!membership) {
        throw new ApiError(404, "Member not found in this project");
    }

    if (membership.role === role) {
        throw new ApiError(400, `Member already has the role '${role}'`);
    }

    // Demoting an admin
    if (membership.role === UserRolesEnum.ADMIN) {
        await assertNotLastAdmin(projectId);
    }

    membership.role = role;
    await membership.save();

    return res
        .status(200)
        .json(new ApiResponse(200, membership, "Member role updated successfully"));
});

const removeMember = asyncHandler(async (req, res) => {
    const { projectId, userId } = req.params;

    const membership = await ProjectMember.findOne({
        project: projectId,
        user: userId,
    });
    if (!membership) {
        throw new ApiError(404, "Member not found in this project");
    }

    if (membership.role === UserRolesEnum.ADMIN) {
        await assertNotLastAdmin(projectId);
    }

    await membership.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, { userId }, "Member removed successfully"));
});

export { 
    createProject, 
    getProjects, 
    getProjectById, 
    updateProject, 
    deleteProject,
    getProjectMembers,
    addMemberToProject,
    updateMemberRole,
    removeMember,
    assertNotLastAdmin
};