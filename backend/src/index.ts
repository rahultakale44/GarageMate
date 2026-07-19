import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app';
import { connectDatabase } from './config/database';
import { initializeFirebase } from './config/firebase';
import { initializeCloudinary } from './config/cloudinary';
import { initializeRazorpay } from './config/razorpay';
import { initializeSocketIO } from './sockets';

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize services
const initializeServices = async () => {
  try {
    await connectDatabase();
    initializeFirebase();
    initializeCloudinary();
    initializeRazorpay();
    initializeSocketIO(server);

    server.listen(PORT, () => {
      console.log(`\n🚀 GarageMate Backend Server`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Server running on port ${PORT}`);
      console.log(`🔗 API URL: http://localhost:${PORT}/api`);
      console.log(`💚 Health: http://localhost:${PORT}/health\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('❌ Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Start the application
initializeServices();
