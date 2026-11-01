import fs from "fs";
import path from "path";

// Folder where uploaded files are saved
const uploadFolder = path.resolve("public/images");

// Delete one file by its name or its url like "/images/abc.png"
// path.basename keeps only the file name, so nobody can send "../../something"
const deleteFileByName = (fileName) => {
    const filePath = path.join(uploadFolder, path.basename(fileName));
    // If the file is already gone we do nothing
    fs.unlink(filePath, () => {});
};

// Delete files that multer just saved (used when a request fails)
export const removeUploadedFiles = (files = []) => {
    files.forEach((file) => deleteFileByName(file.filename));
};

// Delete files saved in a task's attachments (used when a task is deleted)
export const removeFilesByUrls = (attachments = []) => {
    attachments.forEach((item) => deleteFileByName(item.url));
};