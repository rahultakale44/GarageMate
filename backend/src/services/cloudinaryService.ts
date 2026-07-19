import { cloudinary } from '../config/cloudinary';
import { ApiError } from '../utils/ApiError';

export const uploadImage = async (
  fileBuffer: Buffer,
  folder: string = 'garagemate'
): Promise<{ url: string; publicId: string }> => {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error || !result) {
            reject(new ApiError(500, 'Image upload failed'));
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          }
        }
      );

      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    throw new ApiError(500, 'Image upload failed');
  }
};

export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Failed to delete image:', error);
  }
};

export const uploadMultipleImages = async (
  files: Express.Multer.File[],
  folder: string = 'garagemate'
): Promise<Array<{ url: string; publicId: string }>> => {
  const uploadPromises = files.map((file) => uploadImage(file.buffer, folder));
  return await Promise.all(uploadPromises);
};
