import multer from 'multer';
import { Request } from 'express';
import { MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES, ALLOWED_DOCUMENT_TYPES } from '../constants';
import { ApiError } from '../utils/ApiError';

const storage = multer.memoryStorage();

const imageFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only image files are allowed (JPEG, PNG, WebP)'));
  }
};

const documentFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only PDF and image files are allowed'));
  }
};

export const uploadImages = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: imageFilter,
}).array('images', 10);

export const uploadSingleImage = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: imageFilter,
}).single('image');

export const uploadDocuments = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: documentFilter,
}).array('documents', 5);
