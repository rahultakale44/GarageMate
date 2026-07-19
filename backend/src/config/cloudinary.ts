import { v2 as cloudinary } from 'cloudinary';

export const initializeCloudinary = (): void => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.warn('⚠️  Cloudinary credentials not configured - Image uploads will not work');
      return;
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    console.log('✅ Cloudinary initialized successfully');
  } catch (error) {
    console.error('❌ Cloudinary initialization failed:', error);
  }
};

export { cloudinary };
