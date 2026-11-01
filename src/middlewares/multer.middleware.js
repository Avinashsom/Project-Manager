import multer from "multer";
import path from "path";
import fs from "fs";
import { ApiError } from "../utils/api-error.js";

// Folder where files will be saved
const uploadFolder = "./public/images";

// If the folder does not exist, make it
if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, { recursive: true });
}

// Only these file types are allowed
const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "application/pdf",
];

// Where to save the file and what name to give it
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadFolder);
    },
    filename: function (req, file, cb) {
        // Take the extension from the original name, like .png or .pdf
        const extension = path.extname(file.originalname).toLowerCase();

        // Make a new unique name so two files never get the same name
        // and nobody can send a dangerous file name
        const uniqueName =
            Date.now() + "-" + Math.round(Math.random() * 1e9) + extension;

        cb(null, uniqueName);
    },
});

// Check the file type before saving
const fileFilter = function (req, file, cb) {
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true); // accept the file
    } else {
        cb(new ApiError(400, "Only png, jpeg, webp and pdf files are allowed"));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // each file can be 5 MB at most
        files: 5, // at most 5 files in one request
    },
});

// The field name in Postman must be "attachments"
const uploadAttachments = upload.array("attachments", 5);

// Multer has its own error types (like "file too big").
// This wrapper changes them into our normal ApiError so
// the error handler can send a proper message.
export const handleAttachmentUpload = (req, res, next) => {
    uploadAttachments(req, res, function (error) {
        if (error instanceof multer.MulterError) {
            if (error.code === "LIMIT_FILE_SIZE") {
                return next(new ApiError(400, "Each file must be 5 MB or less"));
            }
            if (
                error.code === "LIMIT_FILE_COUNT" ||
                error.code === "LIMIT_UNEXPECTED_FILE"
            ) {
                return next(new ApiError(400, "You can upload at most 5 files"));
            }
            return next(new ApiError(400, error.message));
        }

        if (error) {
            return next(error);
        }

        next();
    });
};