import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { HttpError } from '../errors';

export const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const extensions: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export const receiptUpload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (_req, file, done) => done(null, `${randomUUID()}${extensions[file.mimetype]}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, done) => {
    if (file.mimetype in extensions) {
      done(null, true);
    } else {
      done(new HttpError(400, 'Receipt must be a JPG, PNG or WEBP image'));
    }
  },
}).single('receipt');
