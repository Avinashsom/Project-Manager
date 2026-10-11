import mongoose, { Schema } from "mongoose";

const projectSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Project name is required"],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
    },
    { timestamps: true },
);

export const Project = mongoose.model("Project", projectSchema);