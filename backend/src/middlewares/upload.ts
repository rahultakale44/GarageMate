import multer from 'multer';
import { Request } from 'express';
import { MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES, ALLOWED_DOCUMENT_TYPES } from '../constants';
import { ApiError } from '../utils/ApiError';

const storage = multer.memoryStorage();

const imageFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Validate MIME type
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    return cb(new ApiError(400, `Invalid file type "${file.mimetype}". Only JPEG, PNG, and WebP images are allowed.`));
  }
  
  // Validate file extension
  const ext = file.originalname.toLowerCase().split('.').pop();
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
  if (!ext || !allowedExtensions.includes(ext)) {
    return cb(new ApiError(400, `Invalid file extension ".${ext}". Only .jpg, .jpeg, .png, .webp are allowed.`));
  }
  
  cb(null, true);
};

const documentFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
    return cb(new ApiError(400, 'Only PDF and image files are allowed'));
  }
  cb(null, true);
};

// Custom error handler for file size
const handleMulterError = (err: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return new ApiError(400, `File size exceeds limit. Maximum allowed size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return new ApiError(400, 'Too many files uploaded');
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return new ApiError(400, 'Unexpected file field');
    }
    return new ApiError(400, `Upload error: ${err.message}`);
  }
  return err;
};

export const uploadImages = multer({
  storage,
  limits: { 
    fileSize: MAX_FILE_SIZE,
    files: 10
  },
  fileFilter: imageFilter,
}).array('images', 10);

export const uploadSingleImage = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: imageFilter,
}).single('image');

export const uploadDocuments = multer({
  storage,
  limits: { 
    fileSize: MAX_FILE_SIZE,
    files: 5
  },
  fileFilter: documentFilter,
}).array('documents', 5);

export { handleMulterError };
