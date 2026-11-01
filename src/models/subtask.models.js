import mongoose, { Schema } from "mongoose";

const subTaskSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, "Subtask title is required"],
            trim: true,
        },
        task: {
            type: Schema.Types.ObjectId,
            ref: "Task",
            required: true,
            index: true,
        },
        // Denormalized so a subtask can be checked against the URL's
        // projectId in a single query
        project: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
            index: true,
        },
        isCompleted: {
            type: Boolean,
            default: false,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true },
);

export const SubTask = mongoose.model("SubTask", subTaskSchema);