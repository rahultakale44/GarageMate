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
import { generateResetToken, sanitizeUser } from '../utils/helpers';
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

  const accessToken = generateAccessToken(user._id.toString(), user.role, user.email);
  const refreshToken = generateRefreshToken(user._id.toString(), user.role, user.email);

  await RefreshToken.create({
    token: refreshToken,
    userId: user._id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
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

  const accessToken = generateAccessToken(owner._id.toString(), owner.role, owner.email);
  const refreshToken = generateRefreshToken(owner._id.toString(), owner.role, owner.email);

  await RefreshToken.create({
    token: refreshToken,
    userId: owner._id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  res.status(201).json({
    success: true,
    message: 'Garage owner registered successfully. Awaiting verification.',
    data: {
      user: sanitizeUser(owner),
      garage: {
        _id: garage._id,
        name: garage.name,
        verificationStatus: garage.verificationStatus,
      },
      accessToken,
      refreshToken,
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
  if (!storedToken) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  if (storedToken.expiresAt < new Date()) {
    await RefreshToken.deleteOne({ _id: storedToken._id });
    throw new ApiError(401, 'Refresh token expired');
  }

  const decoded = verifyRefreshToken(validatedData.refreshToken);

  const user = await User.findById(decoded.userId);
  if (!user || user.isBlocked) {
    throw new ApiError(401, 'User not found or blocked');
  }

  const accessToken = generateAccessToken(user._id.toString(), user.role, user.email);

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      accessToken,
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
    // Don't reveal if email exists
    res.json({
      success: true,
      message: 'If an account exists, a password reset email has been sent',
    });
    return;
  }

  const resetToken = generateResetToken();
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  await sendPasswordResetEmail(user.email, resetToken);

  res.json({
    success: true,
    message: 'If an account exists, a password reset email has been sent',
  });
});

// Reset Password
export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedData = resetPasswordSchema.parse(req.body);

  const user = await User.findOne({
    resetPasswordToken: validatedData.token,
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  user.password = validatedData.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({
    success: true,
    message: 'Password reset successful',
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
