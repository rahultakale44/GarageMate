import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoUri) {
      console.warn('⚠️  No MongoDB URI configured. Skipping database connection for now.');
      return;
    }

    await mongoose.connect(mongoUri);

    console.log('✅ MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};
