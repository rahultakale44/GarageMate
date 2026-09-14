# GarageMate - Quick Start Guide

## 🚀 Get Started in 3 Minutes

### Prerequisites
- Node.js 18+ installed
- MongoDB running on localhost:27017
- Git installed

---

## Step 1: Start MongoDB

```bash
# Windows (if MongoDB installed)
mongod

# macOS/Linux
sudo systemctl start mongodb
# OR
brew services start mongodb-community
```

---

## Step 2: Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies (if not already done)
npm install

# Create .env file
cat > .env << EOF
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/garagemate
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-change-this
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
EOF

# Seed demo garages (10 garages around Pune)
npm run seed:garages

# Start backend server
npm run dev
```

Backend should now be running on **http://localhost:5000**

---

## Step 3: Frontend Setup

Open a NEW terminal:

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies (if not already done)
npm install

# Create .env file (optional - Firebase for Google login)
cat > .env << EOF
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
EOF

# Start frontend dev server
npm run dev
```

Frontend should now be running on **http://localhost:5173**

---

## Step 4: Test the Application

### Register a New User
1. Open browser: http://localhost:5173
2. Click "Get Started"
3. Select "I need help" (User role)
4. Fill registration form
5. Click "Sign Up"
6. You'll be redirected to login page
7. Login with your credentials

### Enable Location
1. After login, you're on the dashboard
2. Click "Use My Current Location"
3. Browser will ask for permission - **Allow it**
4. Your location will be detected and displayed
5. Dashboard will show nearby garages count

### Find Nearby Garages
1. Click "Find Garages" in the sidebar
   - OR click "View All" in the nearby garages section
2. You'll see the map with:
   - Blue marker (your location)
   - Green markers (garages)
   - Radar animation during search
3. Try the filters:
   - Change radius: 2, 5, 10, 20 km
   - Select service type
   - Select vehicle type
   - Toggle "Open now" or "Available now"
4. Click on a garage card to see details

### View Garage Details
1. From nearby garages, click "View Garage"
2. You'll see:
   - Garage name, rating, distance
   - Services offered
   - Working hours
   - Map with location
3. Click "Request Help" to create an emergency request

### Create Emergency Request
1. Click "Request Help" from garage detail page
   - OR click "Get Help Now" from dashboard
2. You'll see a banner: "Requesting help from {Garage Name}"
3. Add a vehicle first if you don't have one
4. Fill the form:
   - Select vehicle
   - Choose issue category
   - Describe the problem
   - Verify location is filled
5. Click "Submit Assistance Request"
6. Success! You'll be redirected to requests page

---

## 🎯 Demo Credentials

### Demo Garage Owner
If you want to test the garage owner side:

```
Email: demo.loni@garagemate.com
Password: DemoGarage@123
```

Login at: http://localhost:5173/auth/garage/login

### Demo Admin
For admin access (you'll need to create this manually in MongoDB):

```
Email: admin@garagemate.com
Password: Admin@123
Role: ADMIN
```

---

## 🛠️ Troubleshooting

### Backend won't start
```bash
# Check if MongoDB is running
mongo --eval "db.version()"

# Check if port 5000 is already in use
# Windows
netstat -ano | findstr :5000
# macOS/Linux
lsof -i :5000

# If port is in use, kill the process or change PORT in .env
```

### Frontend won't start
```bash
# Check if port 5173 is already in use
# Windows
netstat -ano | findstr :5173
# macOS/Linux
lsof -i :5173

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

### Location not detected
- Make sure you clicked "Allow" when browser asks for permission
- Try in Chrome or Edge (better geolocation support)
- Check browser console for errors
- If it still fails, you can enter coordinates manually:
  - Pune center: Latitude: 18.5204, Longitude: 73.8567

### No nearby garages found
- Make sure you ran `npm run seed:garages` in the backend
- Check MongoDB:
  ```bash
  mongo garagemate
  db.garages.find({ verificationStatus: 'APPROVED' }).count()
  # Should return: 10
  ```
- Try increasing the radius to 20 km
- Make sure your location is near Pune, India (where demo garages are located)

### Build errors
```bash
# Backend
cd backend
rm -rf dist node_modules package-lock.json
npm install
npm run build

# Frontend
cd frontend
rm -rf dist node_modules package-lock.json
npm install
npm run build
```

---

## 📚 Next Steps

### Read Full Documentation
- **PROJECT_STATUS_REPORT.md** - Complete feature list and technical details
- **TESTING_GUIDE.md** - Comprehensive testing instructions
- **backend/README.md** - Backend API documentation
- **frontend/README.md** - Frontend component guide

### Explore Features
- ✅ User registration and login
- ✅ Location-aware garage discovery
- ✅ Interactive map with filters
- ✅ Garage detail pages
- ✅ Emergency request creation
- ✅ Vehicle management
- ✅ Request tracking

### Development Tips
- Backend runs with hot reload: `npm run dev`
- Frontend runs with hot reload: `npm run dev`
- Check browser console for frontend errors
- Check terminal for backend errors
- Use MongoDB Compass to view database

---

## 🎉 You're All Set!

The application is now running and ready to use.

**Key URLs:**
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- API Health: http://localhost:5000/health
- MongoDB: mongodb://localhost:27017/garagemate

**Happy Testing! 🚀**
