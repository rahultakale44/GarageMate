# GarageMate – Hyperlocal Roadside Assistance and Garage Discovery Platform

##  Project Overview

GarageMate is a comprehensive full-stack web application that connects stranded vehicle owners with nearby verified garages and provides real-time roadside assistance. The platform enables users to discover local garages, request emergency help, track mechanics, receive digital quotations, and complete secure online payments.

##  Core Features

### For Users
-  Discover nearby verified garages based on live location
-  Interactive map view with real-time garage locations
-  Request emergency roadside assistance
-  Track assigned mechanic in real-time
-  Manage multiple vehicles
-  In-app chat with garage owners
-  Receive and approve digital quotations
-  Secure payment integration (Razorpay)
-  Rate and review garages
-  Real-time notifications

### For Garage Owners
-  Receive and manage service requests
-  Assign mechanics to jobs
-  Share live mechanic location
-  Create detailed quotations
-  Track earnings and analytics
-  Manage garage profile and services
-  Real-time request alerts
-  Upload verification documents

### For Administrators
-  Verify and approve garages
-  Manage users and garage owners
-  Platform analytics and insights
-  Monitor payments and transactions
-  Handle complaints and disputes
-  City-wise garage distribution
-  Growth metrics and reports

##  Technology Stack

### Frontend
- **Framework:** React.js with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn UI
- **Routing:** React Router DOM
- **State Management:** TanStack Query
- **Forms:** React Hook Form + Zod validation
- **Maps:** Mappls Maps SDK / Google Maps API
- **Payments:** Razorpay SDK
- **Real-time:** Socket.IO Client
- **Authentication:** Firebase Authentication
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Charts:** Recharts

### Backend
- **Runtime:** Node.js with Express.js
- **Language:** TypeScript
- **Database:** MongoDB Atlas with Mongoose
- **Authentication:** JWT + Refresh Tokens + Firebase Admin SDK
- **Real-time:** Socket.IO
- **Payments:** Razorpay Integration
- **File Upload:** Cloudinary + Multer
- **Email:** Nodemailer
- **Security:** Helmet, CORS, bcrypt, Express Rate Limit
- **Validation:** Zod

### Deployment
- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas
- **Images:** Cloudinary
- **Payments:** Razorpay (Test Mode)

## 📁 Project Structure

```
garagemate/
├── frontend/                 # React TypeScript frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Route pages
│   │   ├── layouts/         # Layout components
│   │   ├── routes/          # Route configuration
│   │   ├── services/        # API services
│   │   ├── hooks/           # Custom React hooks
│   │   ├── context/         # React context
│   │   ├── types/           # TypeScript types
│   │   ├── schemas/         # Zod validation schemas
│   │   ├── utils/           # Utility functions
│   │   ├── constants/       # Constants
│   │   └── config/          # Configuration files
│   └── package.json
│
├── backend/                  # Express TypeScript backend
│   ├── src/
│   │   ├── config/          # Configuration
│   │   ├── controllers/     # Route controllers
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── middlewares/     # Custom middlewares
│   │   ├── validations/     # Zod validators
│   │   ├── sockets/         # Socket.IO handlers
│   │   ├── seed/            # Database seed scripts
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utility functions
│   └── package.json
│
├── docs/                     # Documentation
│   ├── API_DOCUMENTATION.md
│   ├── TESTING_GUIDE.md
│   └── DEPLOYMENT_GUIDE.md
│
└── README.md
```

##  Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account
- Firebase project (for Google authentication)
- Razorpay account (test mode)
- Cloudinary account
- Mappls or Google Maps API key

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

MONGODB_URI=your_mongodb_connection_string

JWT_ACCESS_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

MAPPLS_CLIENT_ID=your_mappls_client_id
MAPPLS_CLIENT_SECRET=your_mappls_client_secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_email_app_password
SMTP_FROM_EMAIL=noreply@garagemate.com

ADMIN_NAME=Admin
ADMIN_EMAIL=admin@garagemate.com
ADMIN_PASSWORD=Admin@123456
```

5. Seed the database (creates admin and sample data):
```bash
npm run seed
```

6. Start the development server:
```bash
npm run dev
```

Backend will run at `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

VITE_MAPPLS_API_KEY=your_mappls_api_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

5. Start the development server:
```bash
npm run dev
```

Frontend will run at `http://localhost:5173`

##  Default Admin Credentials

After running the seed script:
- **Email:** admin@garagemate.com
- **Password:** Admin@123456

##  User Roles

The application has three distinct roles with separate authentication and dashboards:

1. **USER** - Vehicle owners seeking garage services
2. **GARAGE_OWNER** - Garage owners providing services
3. **ADMIN** - Platform administrators

##  Application Flow

### Emergency Assistance Request Flow
1. User selects vehicle and issue category
2. User uploads issue images and describes problem
3. User confirms location on map
4. User pays booking fee (Razorpay)
5. Nearby garages receive request notification
6. Garage owner accepts request
7. Garage assigns mechanic
8. User tracks mechanic in real-time
9. Mechanic arrives and inspects vehicle
10. Garage creates and sends quotation
11. User approves quotation
12. Mechanic performs service
13. User verifies completion with OTP
14. User pays final service amount
15. Request closes
16. User submits review

##  Maps Integration

The application uses **Mappls Maps SDK** as the primary mapping solution with Google Maps as fallback.

Features:
- Live location detection
- Nearby garage search with geospatial queries
- Real-time mechanic tracking
- Route calculation
- Distance estimation
- Manual pin adjustment

##  Payment Integration

Razorpay integration handles two payment types:

1. **Booking Fee** - Paid upfront when creating assistance request
2. **Final Service Payment** - Paid after service completion

All payments are verified server-side with signature validation.

##  Real-Time Features

Socket.IO powers real-time functionality:
- Instant request notifications
- Live mechanic location tracking
- In-app messaging
- Status updates
- Payment confirmations

##  Testing

Run backend tests:
```bash
cd backend
npm test
```

For detailed testing instructions, see [docs/TESTING_GUIDE.md](docs/TESTING_GUIDE.md)

##  Production Build

Build frontend for production:
```bash
cd frontend
npm run build
```

Build backend for production:
```bash
cd backend
npm run build
npm start
```

##  Deployment

### Frontend (Vercel)
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy from main branch

### Backend (Render)
1. Create new Web Service on Render
2. Connect GitHub repository
3. Set environment variables
4. Deploy

For detailed deployment instructions, see [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)

##  API Documentation

Comprehensive API documentation is available at [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)

Base URL: `http://localhost:5000/api`

Main endpoints:
- `/auth/*` - Authentication
- `/users/*` - User management
- `/vehicles/*` - Vehicle management
- `/garages/*` - Garage discovery
- `/requests/*` - Assistance requests
- `/quotations/*` - Quotation management
- `/payments/*` - Payment processing
- `/reviews/*` - Reviews and ratings
- `/admin/*` - Admin operations

##  Image Configuration

All image URLs are centralized in `frontend/src/config/imageData.ts` for easy replacement:

```typescript
export const IMAGE_URLS = {
  landingHero: "",
  defaultGarage: "",
  defaultOwner: "",
  // ... more image URLs
};
```

Real local garage images can be added later by:
1. Uploading images to Cloudinary
2. Updating `imageData.ts` configuration
3. Or uploading through garage owner interface

##  Security Features

- Password hashing with bcrypt
- JWT access and refresh tokens
- Role-based authorization
- Firebase Google authentication
- Razorpay signature verification
- Rate limiting
- Input validation (Zod)
- MongoDB injection protection
- CORS configuration
- Helmet security headers
- File upload validation

## 🐛 Known Limitations

None - Complete implementation ready for production use.

##  Future Enhancements

- SMS notifications via Twilio
- WhatsApp notifications
- Mobile app (React Native)
- Advanced analytics dashboard
- Multi-language support
- Voice call integration
- Video consultation
- Insurance claim integration
- Loyalty programs
- Referral system

##  License

Private - All rights reserved


**Built with ❤️ for safer roadside assistance**
