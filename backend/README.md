# GarageMate Backend

RESTful API and WebSocket server for the GarageMate platform.

## Tech Stack

- Node.js + Express.js
- TypeScript
- MongoDB + Mongoose
- Socket.IO
- JWT Authentication
- Firebase Admin SDK
- Razorpay
- Cloudinary
- Nodemailer

## Installation

```bash
npm install
```

## Environment Setup

Copy `.env.example` to `.env` and configure all required variables.

## Database Seeding

Create initial admin and sample data:

```bash
npm run seed
```

## Development

```bash
npm run dev
```

Server runs at http://localhost:5000

## Build

```bash
npm run build
npm start
```

## API Endpoints

See `/docs/API_DOCUMENTATION.md` for complete API documentation.

## Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── models/          # Mongoose models
├── routes/          # Express routes
├── services/        # Business logic
├── middlewares/     # Custom middlewares
├── validations/     # Zod schemas
├── sockets/         # Socket.IO handlers
├── seed/            # Database seed scripts
├── types/           # TypeScript types
├── constants/       # Constants
├── utils/           # Utility functions
└── index.ts         # Application entry point
```
