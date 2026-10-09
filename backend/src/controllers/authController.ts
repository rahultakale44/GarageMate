import { Response } from 'express';
import { AuthRequest, UserRole } from '../types';
import { User } from '../models/User';
import { Garage } from '../models/Garage';
import { RefreshToken } from '../models/RefreshToken';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { verifyFirebaseToken } from '../config/firebase';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../utils/email';
import { generateResetToken, sanitizeUser, hashResetToken } from '../utils/helpers';
import {
  registerUserSchema,
  loginSchema,
  googleAuthSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from '../validations/auth';
import { registerGarageSchema } from '../validations/garage';

// User Registration
export const registerUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedData = registerUserSchema.parse(req.body);

  const existingUser = await User.findOne({ email: validatedData.email });
  if (existingUser) {
    throw new ApiError(400, 'Email already registered');
  }

  const user = await User.create({
    ...validatedData,
    role: UserRole.USER,
  });

  // Send welcome email
  await sendWelcomeEmail(user.email, user.name).catch(console.error);

  res.status(201).json({
    success: true,
    message: 'Account created successfully. Please sign in to continue.',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
});

// Garage Owner Registration
export const registerGarageOwner = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedData = registerGarageSchema.parse(req.body);

  const existingUser = await User.findOne({ email: validatedData.ownerEmail });
  if (existingUser) {
    throw new ApiError(400, 'Email already registered');
  }

  // Create owner account
  const owner = await User.create({
    name: validatedData.ownerName,
    email: validatedData.ownerEmail,
    mobile: validatedData.ownerPhone,
    password: validatedData.password,
    role: UserRole.GARAGE_OWNER,
  });

  // Create garage profile
  const garage = await Garage.create({
    owner: owner._id,
    name: validatedData.garageName,
    phone: validatedData.garagePhone,
    address: validatedData.address,
    city: validatedData.city,
    state: validatedData.state,
    pincode: validatedData.pincode,
    location: {
      type: 'Point',
      coordinates: [validatedData.longitude, validatedData.latitude],
    },
    serviceRadius: validatedData.serviceRadius || 10,
    services: validatedData.services,
    openingTime: validatedData.openingTime,
    closingTime: validatedData.closingTime,
    weeklyOff: validatedData.weeklyOff,
    is24x7: validatedData.is24x7 || false,
    numberOfMechanics: validatedData.numberOfMechanics || 1,
    supportedVehicleTypes: validatedData.supportedVehicleTypes,
  });

  res.status(201).json({
    success: true,
    message: 'Registration submitted successfully. Please sign in to view your verification status.',
    data: {
      user: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        role: owner.role,
      },
      garage: {
        id: garage._id,
        name: garage.name,
        verificationStatus: garage.verificationStatus,
      },
    },
  });
});

// Login
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedData = loginSchema.parse(req.body);

  const user = await User.findOne({ email: validatedData.email }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  if (user.isBlocked) {
    throw new ApiError(403, 'Your account has been blocked. Please contact support.');
  }

  if (!user.password) {
    throw new ApiError(400, 'Please use Google Sign In for this account');
  }

  const isPasswordValid = await user.comparePassword(validatedData.password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  // SECURITY: Clear any pending password reset tokens on successful login
  if (user.resetPasswordToken) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
  }

  const accessToken = generateAccessToken(user._id.toString(), user.role, user.email);
  const refreshToken = generateRefreshToken(user._id.toString(), user.role, user.email);

  await RefreshToken.create({
    token: refreshToken,
    userId: user._id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    },
  });
});

// Google Authentication
export const googleAuth = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedData = googleAuthSchema.parse(req.body);

  // Prevent Google login for admin
  if (validatedData.role === UserRole.ADMIN) {
    throw new ApiError(400, 'Admin accounts cannot use Google Sign In');
  }

  const decodedToken = await verifyFirebaseToken(validatedData.idToken);

  let user = await User.findOne({ googleId: decodedToken.uid });

  if (!user) {
    user = await User.findOne({ email: decodedToken.email });
    
    if (user) {
      // Link Google account
      user.googleId = decodedToken.uid;
      if (!user.avatar && decodedToken.picture) {
        user.avatar = decodedToken.picture;
      }
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        name: decodedToken.name || 'User',
        email: decodedToken.email!,
        googleId: decodedToken.uid,
        avatar: decodedToken.picture,
        role: validatedData.role,
      });

      await sendWelcomeEmail(user.email, user.name).catch(console.error);
    }
  }

  if (user.isBlocked) {
    throw new ApiError(403, 'Your account has been blocked. Please contact support.');
  }

  // Check if role matches (except for new accounts)
  if (user.role !== validatedData.role) {
    throw new ApiError(400, `This account is registered as ${user.role}`);
  }

  // SECURITY: Clear any pending password reset tokens on successful login
  if (user.resetPasswordToken) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
  }

  const accessToken = generateAccessToken(user._id.toString(), user.role, user.email);
  const refreshToken = generateRefreshToken(user._id.toString(), user.role, user.email);

  await RefreshToken.create({
    token: refreshToken,
    userId: user._id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  // Check if garage owner needs onboarding
  let needsOnboarding = false;
  if (user.role === UserRole.GARAGE_OWNER) {
    const garage = await Garage.findOne({ owner: user._id });
    needsOnboarding = !garage;
  }

  res.json({
    success: true,
    message: 'Google authentication successful',
    data: {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
      needsOnboarding,
    },
  });
});

// Refresh Token
export const refresh = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedData = refreshTokenSchema.parse(req.body);

  const storedToken = await RefreshToken.findOne({ token: validatedData.refreshToken });
  
  // SECURITY: Detect stolen token reuse
  if (!storedToken) {
    // Token was deleted or never existed
    // Try to decode to see if it was a valid token that was already used
    try {
      const decoded = verifyRefreshToken(validatedData.refreshToken);
      
      // Token is valid JWT but not in database = already used/rotated
      // This indicates potential token theft - revoke ALL tokens for this user
      console.warn(`🚨 SECURITY ALERT: Refresh token reuse detected for user ${decoded.userId}`);
      console.warn(`   IP: ${req.ip}, User-Agent: ${req.get('user-agent')}`);
      console.warn(`   Action: Revoking all refresh tokens for user security`);
      
      await RefreshToken.deleteMany({ userId: decoded.userId });
      
      throw new ApiError(
        401,
        'Invalid refresh token. All sessions have been terminated for security. Please login again.'
      );
    } catch (error) {
      // Token is invalid or expired JWT
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(401, 'Invalid refresh token');
    }
  }

  // Check if token is expired
  if (storedToken.expiresAt < new Date()) {
    await RefreshToken.deleteOne({ _id: storedToken._id });
    throw new ApiError(401, 'Refresh token expired');
  }

  // Verify JWT signature and decode
  const decoded = verifyRefreshToken(validatedData.refreshToken);

  // Get user and verify status
  const user = await User.findById(decoded.userId);
  if (!user || user.isBlocked) {
    await RefreshToken.deleteOne({ _id: storedToken._id });
    throw new ApiError(401, 'User not found or blocked');
  }

  // SECURITY: Token rotation - delete old token immediately
  await RefreshToken.deleteOne({ _id: storedToken._id });

  // Generate NEW access token and NEW refresh token
  const newAccessToken = generateAccessToken(user._id.toString(), user.role, user.email);
  const newRefreshToken = generateRefreshToken(user._id.toString(), user.role, user.email);

  // Store new refresh token
  await RefreshToken.create({
    token: newRefreshToken,
    userId: user._id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  // Log successful token refresh
  console.log(`✅ Token refreshed for user ${user._id} (${user.email})`);

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    },
  });
});

// Logout
export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  const token = req.body.refreshToken;

  if (token) {
    await RefreshToken.deleteOne({ token });
  }

  res.json({
    success: true,
    message: 'Logout successful',
  });
});

// Forgot Password
export const forgotPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedData = forgotPasswordSchema.parse(req.body);

  const user = await User.findOne({ email: validatedData.email });
  if (!user) {
    // Don't reveal if email exists (timing-safe response)
    res.json({
      success: true,
      message: 'If an account exists, a password reset email has been sent',
    });
    return;
  }

  // Generate plain text token to send via email
  const plainTextToken = generateResetToken();
  
  // Hash token before storing in database (security: prevent DB dump attacks)
  const hashedToken = hashResetToken(plainTextToken);
  
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  // Send plain text token to user's email
  await sendPasswordResetEmail(user.email, plainTextToken);

  // Log password reset request for security monitoring
  console.log(`🔐 Password reset requested for user ${user._id} (${user.email})`);
  console.log(`   IP: ${req.ip}, User-Agent: ${req.get('user-agent')}`);

  res.json({
    success: true,
    message: 'If an account exists, a password reset email has been sent',
  });
});

// Reset Password
export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedData = resetPasswordSchema.parse(req.body);

  // Hash the provided token to compare with database
  const hashedToken = hashResetToken(validatedData.token);

  // Find user with hashed token and valid expiry
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  // Update password (will be hashed by pre-save hook)
  user.password = validatedData.password;
  
  // SECURITY: Invalidate reset token immediately after use (prevent reuse)
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  // SECURITY: Revoke all refresh tokens to force re-login on all devices
  await RefreshToken.deleteMany({ userId: user._id });

  // Log successful password reset for security monitoring
  console.log(`✅ Password reset successful for user ${user._id} (${user.email})`);
  console.log(`   IP: ${req.ip}, User-Agent: ${req.get('user-agent')}`);
  console.log(`   Action: All refresh tokens revoked, user must re-login`);

  res.json({
    success: true,
    message: 'Password reset successful. Please login with your new password.',
  });
});

// Get Current User
export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.userId);
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  let garage = null;
  if (user.role === UserRole.GARAGE_OWNER) {
    garage = await Garage.findOne({ owner: user._id });
  }

  res.json({
    success: true,
    data: {
      user: sanitizeUser(user),
      garage,
    },
  });
});
