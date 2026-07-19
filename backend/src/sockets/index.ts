import { Server as SocketServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyAccessToken } from '../utils/jwt';

export const initializeSocketIO = (server: HTTPServer) => {
  const io = new SocketServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = verifyAccessToken(token);
      socket.data.user = decoded;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.user.userId;
    const userRole = socket.data.user.role;

    console.log(`✅ User connected: ${userId} (${userRole})`);

    // Join user-specific room
    socket.join(`user:${userId}`);
    socket.join(`role:${userRole}`);

    // Join request-specific room
    socket.on('join:request', (requestId: string) => {
      socket.join(`request:${requestId}`);
      console.log(`User ${userId} joined request room: ${requestId}`);
    });

    // Leave request room
    socket.on('leave:request', (requestId: string) => {
      socket.leave(`request:${requestId}`);
      console.log(`User ${userId} left request room: ${requestId}`);
    });

    // Send message
    socket.on('message:send', (data: { requestId: string; message: string }) => {
      io.to(`request:${data.requestId}`).emit('message:new', {
        requestId: data.requestId,
        senderId: userId,
        senderRole: userRole,
        message: data.message,
        timestamp: new Date(),
      });
    });

    // Mechanic location update
    socket.on('mechanic:location', (data: { requestId: string; latitude: number; longitude: number }) => {
      io.to(`request:${data.requestId}`).emit('mechanic:location-update', {
        requestId: data.requestId,
        location: {
          latitude: data.latitude,
          longitude: data.longitude,
        },
        timestamp: new Date(),
      });
    });

    // Request status update
    socket.on('request:status-update', (data: { requestId: string; status: string }) => {
      io.to(`request:${data.requestId}`).emit('request:status-changed', {
        requestId: data.requestId,
        status: data.status,
        timestamp: new Date(),
      });
    });

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${userId}`);
    });
  });

  // Export io for use in controllers
  global.io = io;

  console.log('✅ Socket.IO initialized');

  return io;
};

// Helper functions to emit events from controllers
export const emitToUser = (userId: string, event: string, data: any) => {
  if (global.io) {
    global.io.to(`user:${userId}`).emit(event, data);
  }
};

export const emitToRequest = (requestId: string, event: string, data: any) => {
  if (global.io) {
    global.io.to(`request:${requestId}`).emit(event, data);
  }
};

export const emitToRole = (role: string, event: string, data: any) => {
  if (global.io) {
    global.io.to(`role:${role}`).emit(event, data);
  }
};

// Declare global io
declare global {
  var io: SocketServer | undefined;
}
