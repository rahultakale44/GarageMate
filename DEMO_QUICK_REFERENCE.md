# GarageMate Demo - Quick Reference Card

**Demo Date:** October 10, 2026  
**Print this for easy reference during demo! 📋**

---

## 🔐 DEMO CREDENTIALS

### 👤 USER
```
Email: demo.user@garagemate.com
Password: Demo@12345
URL: http://localhost:5173/auth/user/login
```

### 🔧 GARAGE OWNER
```
Email: demo.garage@garagemate.com
Password: Demo@12345
URL: http://localhost:5173/auth/garage/login
```

### 🛡️ ADMIN
```
Email: demo.admin@garagemate.com
Password: Demo@12345
URL: http://localhost:5173/auth/admin/login
```

---

## 🚀 START COMMANDS

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

**Backend:** http://localhost:5000  
**Frontend:** http://localhost:5173

---

## 🎬 10-MINUTE DEMO SCRIPT

### 1. USER JOURNEY (3 min)
1. Open http://localhost:5173/auth/user/login
2. Click **"Use Demo Credentials"** button
3. Click **Sign In**
4. ✅ Dashboard shows → View **2 vehicles**
5. Click **"Find Nearby Garages"**
6. Show **Demo Auto Care Center**
7. Click **"Emergency Assistance"**
8. Create a request

### 2. GARAGE OWNER (3 min)
1. Logout → Go to garage login
2. Click **"Use Demo Credentials"** button
3. Click **Sign In**
4. ✅ Shows **Demo Auto Care Center**
5. Navigate to **"Assistance Requests"**
6. View incoming requests
7. Click **"Submit Offer"**
8. Enter details and submit

### 3. ADMIN (2 min)
1. Logout → Go to admin login
2. Click **"Use Demo Credentials"** button
3. Click **Sign In**
4. ✅ Admin dashboard loads
5. Show platform overview
6. Show garage management

### 4. CLOSING (2 min)
"Enterprise-grade security with JWT validation, token rotation, role-based access control, and production-ready architecture."

---

## ⚡ QUICK DEMO DATA

### User Has:
- **Mahindra Thar** (MH12AB1234)
- **Honda Activa 6G** (MH12CD5678)

### Garage Details:
- **Name:** Demo Auto Care Center
- **Location:** Pune, Maharashtra
- **Rating:** 4.7/5 (156 reviews)
- **Status:** APPROVED
- **Services:** 9 types

---

## 🆘 EMERGENCY FIX

### Demo accounts missing?
```bash
cd backend
npm run seed:demo
```

### Server crashed?
```bash
# Kill and restart
cd backend && npm run dev
cd frontend && npm run dev
```

---

## ✅ PRE-DEMO CHECKLIST

- [ ] Backend running (check port 5000)
- [ ] Frontend running (check port 5173)
- [ ] Test user login once
- [ ] Test garage login once
- [ ] Test admin login once
- [ ] Browser cache cleared (if needed)

---

## 🎯 KEY FEATURES TO HIGHLIGHT

- ✅ **One-Click Demo:** Auto-fill buttons on all logins
- ✅ **Real Architecture:** MongoDB, not mock data
- ✅ **Security First:** JWT validation, token rotation
- ✅ **RBAC:** Proper role-based access control
- ✅ **Production Ready:** Idempotent seeding, hashed passwords

---

## 📊 WHAT TO SHOW

| Feature | Where to Show |
|---------|--------------|
| Vehicles | User Dashboard → My Vehicles |
| Garage Search | User → Find Garages |
| Request Creation | User → Emergency Assistance |
| Garage Profile | Garage Owner Dashboard |
| Request Management | Garage Owner → Requests |
| Offer Submission | Garage Owner → Submit Offer |
| Platform Stats | Admin Dashboard |
| User Management | Admin → Users/Garages |

---

## 💡 TALKING POINTS

### Security
- "3 phases of authentication hardening"
- "JWT validation at startup"
- "Token rotation prevents theft"
- "Hashed passwords with bcrypt"

### Architecture
- "Idempotent seeding - safe to run multiple times"
- "Real database persistence"
- "Geospatial garage discovery"
- "Role-based routing"

### UX
- "One-click demo credentials"
- "Clean, professional design"
- "Real-time updates"
- "Mobile-responsive"

---

## 🎊 GOOD LUCK!

You're 100% ready for this demo.  
Everything works, everything is tested, everything is documented.

**Confidence Level:** HIGH 🚀
