import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

const storage = multer.diskStorage({
  filename: (req, file, callback) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    callback(null, uniqueSuffix + ext);
  },
  destination: (req, file, callback) => {
    callback(null, UPLOAD_DIR);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_FILE_SIZE_MB) * 1024 * 1024 }, // Convert MB to bytes
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => {
    const ext = path.extname(file.originalname);
    if (ext !== '.mp4') {
      return cb(new Error('Only .mp4 files are allowed!'));
    }
    cb(null, true);
  }
});
