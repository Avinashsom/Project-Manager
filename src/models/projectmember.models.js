import mongoose, { Schema } from "mongoose";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js";

const projectMemberSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        project: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        role: {
            type: String,
            enum: AvailableUserRole,
            default: UserRolesEnum.MEMBER,
        },
    },
    { timestamps: true },
);

// A user can be a member of a given project only once
projectMemberSchema.index({ user: 1, project: 1 }, { unique: true });

// Speeds up "list members of project" queries
projectMemberSchema.index({ project: 1 });

export const ProjectMember = mongoose.model(
    "ProjectMember",
    projectMemberSchema,
);