import mongoose, { Schema } from "mongoose";
import { AvailableTaskStatus, TaskStatusEnum } from "../utils/constants.js";

const taskSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, "Task title is required"],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        project: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        assignedTo: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        assignedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: AvailableTaskStatus,
            default: TaskStatusEnum.TODO,
        },
        attachments: {
            type: [
                {
                    _id: false,
                    url: { type: String, required: true },
                    mimetype: { type: String, required: true },
                    size: { type: Number, required: true },
                },
            ],
            default: [],
        },
    },
    { timestamps: true },
);

// Listing tasks of a project, optionally filtered by status
taskSchema.index({ project: 1, status: 1, createdAt: -1 });

export const Task = mongoose.model("Task", taskSchema);