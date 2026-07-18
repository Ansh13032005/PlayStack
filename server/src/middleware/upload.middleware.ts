import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';
import { AppError } from '../utils/AppError';
import { Request } from 'express';

// Cloudinary storage — images go directly to your Cloudinary account
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ems/profile-images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'fill', gravity: 'face' }],
  } as object,
});

// File filter — only allow images
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files (jpg, jpeg, png, webp) are allowed.', 400));
  }
};

// Export upload middleware
export const uploadProfileImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
}).single('profileImage');

// Local storage for CSV bulk upload
const csvStorage = multer.memoryStorage();

const csvFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = ['text/csv', 'application/csv', 'application/vnd.ms-excel'];
  if (allowedMimeTypes.includes(file.mimetype) || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new AppError('Only CSV files are allowed.', 400));
  }
};

export const uploadCSV = multer({
  storage: csvStorage,
  fileFilter: csvFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
}).single('file');

// Cloudinary storage for message attachments
const attachmentStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ems/message-attachments',
    resource_type: 'auto', // handles images and PDFs
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'docx', 'xlsx', 'txt'],
  } as object,
});

const attachmentFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = [
    'image/jpeg', 'image/png', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('File type not allowed. Supported: jpg, png, pdf, docx, xlsx, txt.', 400));
  }
};

export const uploadMessageAttachments = multer({
  storage: attachmentStorage,
  fileFilter: attachmentFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 5, // max 5 attachments
  },
}).array('attachments', 5);
