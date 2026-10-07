# PHASE 0: Authentication/Authorization Implementation Map
## GarageMate MERN Stack - Complete Current State Analysis

**Generated:** October 7, 2026  
**Purpose:** Understand existing implementation before hardening  
**Status:** READ-ONLY ANALYSIS - NO MODIFICATIONS MADE

---

## 1. AUTHENTICATION FLOWS - CURRENT IMPLEMENTATION

### 1.1 User Signup (USER Role)
```
FRONTEND: /auth/user/register
↓
VALIDATES:
- name (min 2 chars)
- email (format check)
- phone (10 digits)
- password (min 8 chars)
- confirmPassword (match check)
↓
POST /api/auth/user/register
↓
BACKEND:
- Zod validation (registerUserSchema)
- Check email uniqueness
- Create User with role=USER (hardcoded)
- Hash password (bcrypt, salt=10) via pre-save hook
- Send welcome email (async, fire-and-forget)
↓
RESPONSE: 201 { user: { id, name, email, role } }
↓
FRONTEND: Redirect to login with success message
```

**Security Features:**
✅ Role hardcoded (prevents privilege escalation)
✅ Password hashing automatic
✅ Email uniqueness enforced
✅ Input validation with Zod

**Missing:**
❌ No email verification
❌ No password strength enforcement
❌ Email sending failures silently ignored
❌ No account state (UNVERIFIED/VERIFIED)

---

### 1.2 User Login (Email/Password)
```
FRONTEND: /auth/user/login
↓
VALIDATES: email, password
↓
POST /api/auth/login
↓
BACKEND:
- Find user by email
- Select password field (normally excluded)
- Check if user exists
- Check isBlocked
- Check password exists (vs Google-only account)
- Compare password (bcrypt)
- Generate access token (JWT, 15m expiry)
- Generate refresh token (JWT, 7d expiry)
- Store refresh token in RefreshToken collection
↓
RESPONSE: 200 { user, accessToken, refreshToken }
↓
FRONTEND:
- Store tokens in localStorage
- Store user in localStorage
- Set isAuthenticated = true
- Navigate to /redirect
↓
RedirectHandler checks role and redirects to dashboard
```

**Security Features:**
✅ Blocked user check
✅ Refresh token stored in database
✅ Separate secrets for access/refresh tokens
✅ Short access token expiry (15m)

**Vulnerabilities:**
❌ User enumeration: Different errors for "user not found" vs "wrong password"
❌ Timing attack: bcrypt only called if user exists
❌ No failed login tracking
❌ No account lockout
❌ No CAPTCHA
❌ Refresh token NOT rotated
❌ Multiple concurrent sessions allowed (unlimited)

---

### 1.3 Garage Owner Signup
```
FRONTEND: /auth/garage/register
↓
VALIDATES:
- Owner details (name, email, phone, password)
- Garage details (name, phone, address, city, state, pincode)
- Location (lat, lng)
- Services, openingTime, closingTime, vehicle types
↓
POST /api/auth/garage/register
↓
BACKEND:
- Zod validation (registerGarageSchema)
- Check email uniqueness
- Create User with role=GARAGE_OWNER (hardcoded)
- Create Garage with verificationStatus=PENDING
- Link garage.owner to user._id
↓
RESPONSE: 201 { user, garage }
↓
FRONTEND: Redirect to login
```

**Security Features:**
✅ Role hardcoded
✅ Email uniqueness enforced
✅ Garage verification required

**Vulnerabilities:**
❌ NOT ATOMIC: User created first, if Garage creation fails → orphan user
❌ No transaction wrapping
❌ Orphan GARAGE_OWNER has no garage but can login
❌ No lat/lng validation
❌ No duplicate garage name check

**Failure Scenario:**
```typescript
const owner = await User.create({ ... }); // SUCCESS
const garage = await Garage.create({ ... }); // FAILS (validation error)
// Result: Orphan owner account with no garage
// Owner can login but /api/garages/my/profile returns 404
```

---

### 1.4 Garage Owner Login
```
Same as User Login (POST /api/auth/login)
- Role determined by existing database record
- Garage owner must have garage created during registration
- If no garage exists, most garage endpoints will fail
```

**Issue:** If garage creation failed during registration, owner can login but cannot perform any garage operations.

---

### 1.5 Admin Login
```
FRONTEND: /auth/admin/login
↓
VALIDATES: email, password
↓
POST /api/auth/login (same endpoint!)
↓
BACKEND: (identical to user login)
```

**Security Features:**
✅ Uses same login endpoint (role from database)
✅ Admin cannot use Google auth (blocked in googleAuth controller)

**Critical Issues:**
❌ NO ADMIN REGISTRATION ENDPOINT
❌ Admin can only be created via seed script or manual MongoDB insert
❌ Seed script contains default admin credentials in .env
❌ Seed script DELETES all data on run (unsafe for production)

**Current Admin Provisioning:**
```typescript
// From seed/index.ts
await User.deleteMany({}); // ⚠️ DELETES ALL USERS!
const admin = await User.create({
  name: process.env.ADMIN_NAME || 'Admin',
  email: process.env.ADMIN_EMAIL || 'admin@garagemate.com',
  password: process.env.ADMIN_PASSWORD || 'Admin@123456',
  role: UserRole.ADMIN,
});
```

---

### 1.6 Google Authentication
```
FRONTEND: Any signup/login page
↓
Firebase signInWithPopup(auth, googleProvider)
↓
Get ID token from Firebase
↓
POST /api/auth/google { idToken, role }
↓
BACKEND:
- Verify Firebase token
- Block if role === ADMIN
- Find user by googleId
- If not found, find by email (account linking)
- If still not found, create new user
- Check role matches (if existing user)
- Check isBlocked
- Generate tokens
- Store refresh token
↓
RESPONSE: 200 { user, accessToken, refreshToken, needsOnboarding }
↓
FRONTEND: Navigate to /redirect
```

**Security Features:**
✅ Firebase token verification
✅ Admin role blocked
✅ Account linking by email

**Critical Vulnerabilities:**
❌ Google ID NOT UNIQUE in schema (sparse: true, but not unique: true)
❌ Multiple users can have same googleId
❌ Cross-role vulnerability: USER can't become GARAGE_OWNER with same Google
❌ Role from request body (client can manipulate)
❌ No rate limiting on Google auth
❌ Race condition in account creation

**Cross-Role Issue:**
```typescript
// User registers as USER with Google account
googleAuth({ idToken: "...", role: "USER" });
// User created with googleId = "G123"

// Later, tries to register as GARAGE_OWNER with SAME Google
googleAuth({ idToken: "...", role: "GARAGE_OWNER" });
// Finds existing USER by googleId
// Checks role mismatch
throw new ApiError(400, 'This account is registered as USER');
// User blocked from creating garage owner account forever
```

---

### 1.7 Email Verification
```
STATUS: NOT IMPLEMENTED
```

**Current State:** No email verification system exists.
- Users can access system immediately after registration
- No verified/unverified state in User model
- No verification tokens
- No verification emails
- No resend verification endpoint

---

### 1.8 Forgot Password
```
FRONTEND: /auth/user/login → "Forgot password?" link
↓
POST /api/auth/forgot-password { email }
↓
BACKEND:
- Find user by email
- Generate reset token (32 random bytes)
- Store PLAIN TEXT token in user.resetPasswordToken ❌
- Set expiry (1 hour)
- Send reset email with token
↓
RESPONSE: 200 (always, even if email doesn't exist)
```

**Security Features:**
✅ Doesn't reveal if email exists
✅ Token expires after 1 hour

**Critical Vulnerability:**
❌ Reset token stored in PLAIN TEXT
❌ If database compromised, attacker has all reset tokens
❌ No rate limiting (email bombing possible)
❌ Token not hashed before storage

---

### 1.9 Reset Password
```
FRONTEND: Reset link in email → /reset-password?token=...
↓
POST /api/auth/reset-password { token, password }
↓
BACKEND:
- Find user by token + expiry check
- Update password (triggers bcrypt hash)
- Clear token fields
↓
RESPONSE: 200
```

**Security Features:**
✅ Token expiry enforced
✅ Password re-hashed

**Issues:**
❌ Token not invalidated on successful login
❌ No notification to user when password changed
❌ Token can be reused until expiry

---

### 1.10 Logout
```
FRONTEND: User clicks logout
↓
POST /api/auth/logout { refreshToken }
↓
BACKEND:
- Delete refresh token from database
↓
RESPONSE: 200
↓
FRONTEND:
- Clear localStorage (accessToken, refreshToken, user)
- Set isAuthenticated = false
- Navigate to home
```

**Critical Issues:**
❌ Access token still valid for 15 minutes after logout
❌ No access token blacklist
❌ No "logout all devices" option
❌ Logout doesn't require authentication
❌ Can't see or manage active sessions

---

### 1.11 Access Token (JWT)
```
STRUCTURE:
{
  userId: string,
  role: UserRole,
  email: string,
  iat: number,
  exp: number
}

SECRET: JWT_ACCESS_SECRET (from env)
ALGORITHM: HS256 (default)
EXPIRY: 15m (configurable)
STORAGE: Frontend localStorage
```

**Security Features:**
✅ Short expiry (15m)
✅ Includes role and email
✅ Separate secret from refresh token

**Vulnerabilities:**
❌ No validation that JWT_ACCESS_SECRET exists on startup
❌ Algorithm not explicitly set (uses default)
❌ No token ID (jti) for revocation
❌ No issuer (iss) or audience (aud)
❌ localStorage vulnerable to XSS
❌ Token valid even after logout

---

### 1.12 Refresh Token
```
STRUCTURE:
{
  userId: string,
  role: UserRole,
  email: string,
  iat: number,
  exp: number
}

SECRET: JWT_REFRESH_SECRET (from env)
ALGORITHM: HS256 (default)
EXPIRY: 7d (configurable)
STORAGE: 
  - Frontend: localStorage
  - Backend: RefreshToken collection
```

**Current Refresh Flow:**
```
POST /api/auth/refresh { refreshToken }
↓
BACKEND:
- Find token in database
- Check expiry in database record
- Verify JWT signature
- Find user by ID
- Check if blocked
- Generate NEW access token
- Return NEW access token
- KEEP OLD REFRESH TOKEN ❌
↓
RESPONSE: 200 { accessToken }
```

**Critical Vulnerabilities:**
❌ Refresh token NOT rotated (reusable until expiry)
❌ If stolen, attacker can refresh forever for 7 days
❌ No token reuse detection
❌ No session metadata (device, IP, location)
❌ Unlimited concurrent sessions
❌ No rate limiting on /auth/refresh

---

## 2. AUTHORIZATION - CURRENT IMPLEMENTATION

### 2.1 Role-Based Access Control (RBAC)

**Roles:**
```typescript
enum UserRole {
  USER = 'USER',
  GARAGE_OWNER = 'GARAGE_OWNER',
  ADMIN = 'ADMIN'
}
```

**Middleware Chain:**
```
authenticate (verify JWT)
↓
authorize(...roles) (check role)
↓
Controller (business logic)
```

**Implementation:**
```typescript
// authenticate middleware
export const authenticate = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) throw new ApiError(401, 'Authentication required');
  
  const decoded = verifyAccessToken(token);
  req.user = { userId: decoded.userId, role: decoded.role, email: decoded.email };
  next();
});

// authorize middleware
export const authorize = (...roles: UserRole[]) => {
  return (req, res, next) => {
    if (!req.user) throw new ApiError(401, 'Authentication required');
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'You do not have permission to perform this action');
    }
    next();
  };
};
```

**Security Features:**
✅ Clean separation of authentication and authorization
✅ Role verification from JWT
✅ Proper 401 vs 403 distinction

---

### 2.2 Protected Routes - Backend

**Example Route Protection:**
```typescript
// Vehicle routes (USER only)
router.use(authenticate);
router.use(authorize(UserRole.USER));
router.get('/', getVehicles);
router.post('/', createVehicle);

// Admin routes (ADMIN only)
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));
router.get('/dashboard', getDashboardStats);

// Garage routes (GARAGE_OWNER only)
router.use(authenticate);
router.use(authorize(UserRole.GARAGE_OWNER));
router.get('/requests', getGarageRequests);
```

**Assessment:**
✅ Consistent middleware usage
✅ Routes properly protected
✅ No public endpoints that should be protected

---

### 2.3 Resource Ownership Verification

**Pattern 1: User Resources**
```typescript
// Get user's vehicles
export const getVehicles = asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.find({ 
    userId: req.user!.userId  // ✅ Ownership check
  });
  res.json({ success: true, data: vehicles });
});

// Delete user's vehicle
export const deleteVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOneAndDelete({
    _id: req.params.id,
    userId: req.user!.userId  // ✅ Ownership check
  });
  if (!vehicle) throw new ApiError(404, 'Vehicle not found');
  res.json({ success: true });
});
```

**Pattern 2: Garage Owner Resources**
```typescript
// Get garage requests
export const getGarageRequests = asyncHandler(async (req, res) => {
  const garage = await Garage.findOne({ 
    owner: req.user!.userId  // ✅ Garage ownership check
  });
  if (!garage) throw new ApiError(404, 'Garage not found');
  
  const requests = await AssistanceRequest.find({ 
    garageId: garage._id 
  });
  res.json({ success: true, data: requests });
});
```

**Pattern 3: Cross-Role Access (Request Details)**
```typescript
// Get request details
export const getRequest = asyncHandler(async (req, res) => {
  const request = await AssistanceRequest.findById(req.params.id)
    .populate('userId')
    .populate('garageId')
    .populate('mechanicId');
  
  if (!request) throw new ApiError(404, 'Request not found');
  
  // Check authorization
  const isOwner = request.userId._id.toString() === req.user!.userId;
  const isGarageOwner = await Garage.findOne({ 
    _id: request.garageId, 
    owner: req.user!.userId 
  });
  const isAdmin = req.user!.role === UserRole.ADMIN;
  
  if (!isOwner && !isGarageOwner && !isAdmin) {
    throw new ApiError(403, 'Access denied');
  }
  
  res.json({ success: true, data: request });
});
```

**Assessment:**
✅ Consistent ownership checks
✅ Cross-role access properly validated
✅ Admin override consistently implemented

**Performance Issue:**
⚠️ Garage ownership check requires DB query on every request

---

### 2.4 Admin Privileges

**Admin Powers:**
- View all users, garages, requests, payments
- Approve/reject/suspend garages
- Block/unblock users
- Resolve complaints
- Hide reviews
- View dashboard stats

**Admin Route Protection:**
```typescript
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));  // All routes protected
```

**Assessment:**
✅ All admin routes properly protected
✅ No privilege escalation paths
❌ No admin action audit logging
❌ No "impersonate user" for debugging
❌ Cannot manually create users/garages

---

## 3. SESSION MANAGEMENT

### 3.1 Access Token Lifecycle
```
Login/Register
↓
Generate access token (15m expiry)
↓
Store in localStorage
↓
Included in Authorization header for all requests
↓
Expires after 15 minutes
↓
Frontend uses refresh token to get new access token
```

**Expiry Handling:**
```typescript
// Axios interceptor (frontend)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      const response = await axios.post('/auth/refresh', { refreshToken });
      const { accessToken } = response.data.data;
      localStorage.setItem('accessToken', accessToken);
      return axiosInstance(originalRequest);
    }
    return Promise.reject(error);
  }
);
```

**Issues:**
❌ No proactive refresh before expiry
❌ User sees failed request then retry
❌ No handling if refresh also fails

---

### 3.2 Refresh Token Lifecycle
```
Login/Register
↓
Generate refresh token (7d expiry)
↓
Store in database (RefreshToken collection)
↓
Store in localStorage (frontend)
↓
Used when access token expires
↓
Get new access token
↓
SAME refresh token remains valid ❌
↓
Expires after 7 days
```

**RefreshToken Model:**
```typescript
{
  token: String (unique),
  userId: ObjectId (ref: User),
  expiresAt: Date,
  createdAt: Date (TTL index: 7 days)
}
```

**Issues:**
❌ No token rotation
❌ No session metadata
❌ Unlimited concurrent sessions
❌ No "active sessions" management

---

### 3.3 Concurrent Sessions
```
STATUS: UNLIMITED AND UNTRACKED

Current Behavior:
- User can login from unlimited devices
- Each login creates new refresh token
- No way to view active sessions
- No way to revoke specific sessions
- Logout only removes one token (from request body)
```

**Missing Features:**
- Session listing
- Device identification
- IP tracking
- Last activity timestamp
- Revoke all sessions
- Revoke specific session
- Maximum session limit

---

## 4. FRONTEND AUTHENTICATION

### 4.1 AuthContext Implementation

**State:**
```typescript
{
  user: AuthUser | null,
  isAuthenticated: boolean,
  loading: boolean
}
```

**Methods:**
```typescript
- login(email, password)
- registerUser(payload)
- registerGarageOwner(payload)
- adminLogin(email, password)
- logout()
- refreshAuth()
- loginWithGoogle(idToken, role)
```

**Token Storage:**
```typescript
localStorage:
  - accessToken
  - refreshToken
  - user (JSON serialized)
```

**Issues:**
❌ Tokens in localStorage (XSS vulnerable)
❌ No httpOnly cookie option
❌ User data might be stale
❌ No token expiry check before using

---

### 4.2 Protected Routes (Frontend)

**ProtectedRoute Component:**
```typescript
if (loading) return <Loading />;
if (!isAuthenticated || !user) return <Navigate to="/auth/user/login" />;
if (allowedRoles && !allowedRoles.includes(user.role)) {
  // Redirect to appropriate dashboard
  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" />;
  if (user.role === 'GARAGE_OWNER') return <Navigate to="/garage/dashboard" />;
  return <Navigate to="/user/dashboard" />;
}
return <Outlet />;
```

**Assessment:**
✅ Loading state handled
✅ Role-based redirection
✅ Preserves intended destination
⚠️ No token expiry check
⚠️ Flash of loading on every navigation

---

### 4.3 RedirectHandler

**Purpose:** Redirect after login based on role

**Implementation:**
```typescript
// Check localStorage if context not ready
const storedUser = localStorage.getItem('user');
if (storedUser) {
  const parsedUser = JSON.parse(storedUser);
  if (parsedUser.role === 'ADMIN') return '/admin/dashboard';
  if (parsedUser.role === 'GARAGE_OWNER') return '/garage/dashboard';
  return '/user/dashboard';
}
return '/';
```

**Issues:**
❌ Race condition between context and localStorage
❌ Uses window.location.reload() on mismatch
⚠️ No error handling for corrupted localStorage

---

## 5. DATABASE SECURITY

### 5.1 User Model

**Schema Security:**
```typescript
email: {
  type: String,
  required: true,
  unique: true,  // ✅ Enforced at DB level
  lowercase: true,
  trim: true,
}

mobile: {
  type: String,
  sparse: true,  // ⚠️ Allows duplicates
}

password: {
  type: String,
  select: false,  // ✅ Excluded by default
}

googleId: {
  type: String,
  sparse: true,  // ❌ NOT UNIQUE!
}

role: {
  type: String,
  enum: Object.values(UserRole),  // ✅ Enum validation
}
```

**Pre-save Hook:**
```typescript
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```

**Issues:**
❌ googleId not unique (critical security issue)
❌ mobile allows duplicates
❌ resetPasswordToken not hashed

---

### 5.2 RefreshToken Model

**Schema:**
```typescript
{
  token: { type: String, required: true, unique: true },
  userId: { type: ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now, expires: 604800 }
}
```

**Indexes:**
- token (unique)
- userId
- expiresAt
- TTL on createdAt (7 days)

**Assessment:**
✅ Proper indexes
✅ TTL for auto-cleanup
❌ No session metadata

---

### 5.3 Cascade Deletion

**Implemented:**
```typescript
// AssistanceRequest deleted → cascades
- GarageOffers
- Quotations
- Payments
- Notifications

// Garage deleted → cascades
- Mechanics
- GarageOffers
- Reviews
- Nullifies garageId in requests
```

**Missing:**
❌ User deletion not implemented
❌ No GDPR data export
❌ No soft delete

---

## 6. ENVIRONMENT CONFIGURATION

### 6.1 Required Variables

**Backend (.env):**
```
MONGODB_URI=mongodb://...
JWT_ACCESS_SECRET=dev-access-secret-change-me ❌ INSECURE DEFAULT
JWT_REFRESH_SECRET=dev-refresh-secret-change-me ❌ INSECURE DEFAULT
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@garagemate.com
ADMIN_PASSWORD=Admin@123456 ❌ INSECURE DEFAULT
```

**Frontend (.env):**
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=...
VITE_RAZORPAY_KEY_ID=...
```

**Critical Issues:**
❌ No validation that secrets exist on startup
❌ Insecure default secrets
❌ Admin password in plaintext
❌ No secret rotation mechanism

---

## 7. DEPENDENCIES

**Authentication Related:**
```json
{
  "bcrypt": "^5.1.1",           // Password hashing
  "jsonwebtoken": "^9.0.2",     // JWT tokens
  "firebase-admin": "^12.0.0",  // Google auth
  "express-rate-limit": "^7.1.5", // Rate limiting
  "zod": "^3.22.4",             // Validation
  "nodemailer": "^6.9.7"        // Email
}
```

**Assessment:**
✅ Modern, maintained dependencies
✅ No deprecated packages
⚠️ express-rate-limit not configured on all auth endpoints

---

## 8. SEED SCRIPTS

### 8.1 Main Seed (seed/index.ts)

**What it does:**
```typescript
1. Connects to MongoDB
2. DELETES ALL DATA ❌
   - Users
   - Garages
   - Mechanics
   - Vehicles
3. Creates:
   - 1 Admin (from env)
   - 5 Sample Users
   - 5 Garage Owners
   - 5 Garages (approved)
   - 10 Mechanics
   - 5 Vehicles
```

**Critical Issues:**
❌ Destructive (deletes all data)
❌ No idempotency
❌ No backup before delete
❌ Admin password from env or default
❌ Cannot run safely in production

---

### 8.2 Garage Seed (seed/garages.ts)

**What it does:**
```typescript
1. Connects to MongoDB
2. Creates 10 demo garages around Pune
3. Creates demo garage owner accounts
4. Marks garages as isDemo=true
5. Idempotent (checks existing before creating)
```

**Assessment:**
✅ Idempotent
✅ Non-destructive
✅ Safe to run multiple times
⚠️ All demo accounts use same password

---

## 9. RATE LIMITING - CURRENT STATE

**Configured:**
```typescript
// authLimiter (in rateLimiter.ts)
windowMs: 15 * 60 * 1000,  // 15 minutes
max: 5  // 5 requests per window
```

**Applied to:**
- POST /auth/user/register ✅
- POST /auth/garage/register ✅
- POST /auth/login ✅
- POST /auth/google ✅
- POST /auth/forgot-password ✅
- POST /auth/reset-password ✅

**Missing:**
❌ POST /auth/refresh (NO RATE LIMIT)
❌ Email verification endpoints
❌ Resend verification
❌ Different limits for different endpoints

---

## 10. ERROR HANDLING

**Pattern:**
```typescript
throw new ApiError(statusCode, message);
↓
errorHandler middleware
↓
Response: { success: false, message, errors }
```

**Error Messages:**
```typescript
// Login
'Invalid credentials'  // ❌ User not found
'Invalid credentials'  // ❌ Wrong password
'Please use Google Sign In for this account'  // ❌ REVEALS EMAIL EXISTS!
'Your account has been blocked'

// Registration
'Email already registered'  // ❌ REVEALS EMAIL EXISTS

// Refresh
'Invalid refresh token'
'Refresh token expired'

// Reset Password
'Invalid or expired reset token'
```

**User Enumeration Vulnerabilities:**
❌ Different error for Google-only account
❌ Explicit "Email already registered"
❌ Timing differences (bcrypt vs quick return)

---

## 11. TESTING - CURRENT STATE

**Test Files:** NONE FOUND

**Current Testing:**
- Manual testing only
- No automated tests
- No test coverage
- No CI/CD validation

---

## 12. CRITICAL FINDINGS SUMMARY

### CRITICAL (12 issues)

1. ❌ **JWT_ACCESS_SECRET not validated on startup**
   - File: `backend/src/utils/jwt.ts`
   - Impact: Server starts with undefined secret

2. ❌ **Refresh tokens not rotated**
   - File: `backend/src/controllers/authController.ts` (refresh endpoint)
   - Impact: Token reuse attacks possible

3. ❌ **Google ID not unique**
   - File: `backend/src/models/User.ts`
   - Impact: Multiple users can have same googleId

4. ❌ **Password reset tokens in plain text**
   - File: `backend/src/controllers/authController.ts` (forgotPassword)
   - Impact: Database compromise = all reset tokens exposed

5. ❌ **No admin seeding (destructive seed only)**
   - File: `backend/src/seed/index.ts`
   - Impact: Cannot safely create admin in production

6. ❌ **Cross-role Google authentication**
   - File: `backend/src/controllers/authController.ts` (googleAuth)
   - Impact: USER can't use same Google for GARAGE_OWNER

7. ❌ **Garage registration not atomic**
   - File: `backend/src/controllers/authController.ts` (registerGarageOwner)
   - Impact: Orphan users created on failure

8. ❌ **No rate limiting on /auth/refresh**
   - File: `backend/src/routes/authRoutes.ts`
   - Impact: Token brute-force possible

9. ❌ **User enumeration via error messages**
   - File: `backend/src/controllers/authController.ts` (login)
   - Impact: Attackers can discover valid emails

10. ❌ **Access tokens valid after logout**
    - File: `backend/src/controllers/authController.ts` (logout)
    - Impact: 15-minute window of vulnerability

11. ❌ **No email verification**
    - Files: No verification system exists
    - Impact: Spam/fake accounts possible

12. ❌ **Concurrent session limits missing**
    - Files: No session management system
    - Impact: Unlimited device logins, no revocation

---

## 13. IMPLEMENTATION READINESS

**Production Ready:** ❌ NO

**Blocking Issues:**
1. JWT secrets not validated
2. Refresh token security
3. Admin provisioning
4. Database uniqueness constraints
5. Atomic operations

**Estimated Effort to Production:**
- Critical fixes: 3-4 days
- High priority: 5-7 days
- Medium priority: 7-10 days
- Total: 3-4 weeks

---

## NEXT STEPS

This analysis is complete. NO CODE HAS BEEN MODIFIED.

Ready to proceed with systematic hardening starting with:
- **PHASE 1:** JWT Configuration Hardening
- **PHASE 2:** Refresh Token Security
- **PHASE 3:** Password Reset Token Security
- ...continuing through all 22 phases

**Awaiting approval to begin implementation.**

---

**Map Status:** ✅ COMPLETE  
**Modifications Made:** NONE  
**Purpose:** Understanding existing system before hardening
