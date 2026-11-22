package com.garagemate.api.domain.auth;

import com.garagemate.api.domain.auth.dto.*;
import com.garagemate.api.domain.user.User;
import com.garagemate.api.domain.user.UserRepository;
import com.garagemate.api.domain.user.UserRole;
import com.garagemate.api.exception.ApiException;
import com.garagemate.api.security.JwtClaims;
import com.garagemate.api.security.JwtTokenProvider;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;

/**
 * AuthService — mirrors Node.js authController.js behavior exactly.
 *
 * Critical flows preserved:
 * 1. Refresh token rotation: old token deleted, new pair issued every refresh
 * 2. Reuse detection: found-but-expired OR not-found token → deleteAllByUserId → 401
 * 3. Password reset token: SHA-256 hashed in DB, plain text sent in email
 * 4. BCrypt strength 10 (matches existing Node.js bcrypt(10))
 * 5. Google sign-in: upsert by googleId or email
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;  // BCrypt strength=10 (configured in SecurityConfig)

    // ─── Register ─────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse register(RegisterUserRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw ApiException.conflict("Email already registered");
        }

        User user = User.builder()
                .name(req.getName())
                .email(req.getEmail().toLowerCase().trim())
                .password(passwordEncoder.encode(req.getPassword()))
                .mobile(req.getMobile())
                .role(UserRole.USER)
                .isBlocked(false)
                .build();

        userRepository.save(user);
        log.info("New USER registered: {}", user.getEmail());
        return issueTokenPair(user);
    }

    @Transactional
    public AuthResponse registerGarage(RegisterGarageRequest req) {
        if (userRepository.existsByEmail(req.getOwnerEmail())) {
            throw ApiException.conflict("Email already registered");
        }

        User user = User.builder()
                .name(req.getOwnerName())
                .email(req.getOwnerEmail().toLowerCase().trim())
                .password(passwordEncoder.encode(req.getPassword()))
                .mobile(req.getOwnerPhone())
                .role(UserRole.GARAGE_OWNER)
                .isBlocked(false)
                .build();

        userRepository.save(user);
        log.info("New GARAGE_OWNER registered: {}", user.getEmail());
        return issueTokenPair(user);
    }

    // ─── Login ────────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail().toLowerCase().trim())
                .orElseThrow(() -> ApiException.unauthorized("Invalid credentials"));

        if (user.isBlocked()) {
            throw ApiException.forbidden("Account has been blocked");
        }

        if (user.getPassword() == null) {
            throw ApiException.badRequest("This account uses Google sign-in. Please sign in with Google.");
        }

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw ApiException.unauthorized("Invalid credentials");
        }

        log.info("User logged in: {}", user.getEmail());
        return issueTokenPair(user);
    }

    // ─── Refresh Token (rotation + reuse detection) ───────────────────────────

    /**
     * Refresh token rotation — mirrors Node.js auth.ts refreshToken() exactly:
     *
     * 1. Verify the JWT signature — if invalid, 401 (no DB hit for forged tokens)
     * 2. Look up the token in DB:
     *    a. Not found → token was already rotated or revoked → REUSE DETECTED → delete all sessions → 401
     *    b. Found but expired → stale token → REUSE DETECTED → delete all sessions → 401
     *    c. Found and valid → proceed with rotation
     * 3. Delete the old token from DB (atomic rotation)
     * 4. Issue new access + refresh token pair
     * 5. Store new refresh token in DB
     */
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest req) {
        // Step 1: Validate JWT signature + expiry via jjwt
        JwtClaims claims;
        try {
            claims = jwtTokenProvider.parseRefreshToken(req.refreshToken());
        } catch (ApiException e) {
            // Invalid signature or malformed — no DB lookup needed
            throw ApiException.unauthorized("Invalid refresh token");
        }

        Long userId = claims.getUserId();

        // Step 2: DB lookup
        RefreshToken stored = refreshTokenRepository.findByToken(req.refreshToken())
                .orElseGet(() -> {
                    // Not in DB — reuse of a previously rotated token detected
                    log.warn("REFRESH TOKEN REUSE DETECTED for userId={} — terminating all sessions", userId);
                    refreshTokenRepository.deleteAllByUserId(userId);
                    throw ApiException.unauthorized("All sessions terminated");
                });

        // Step 2b: check expiry (belt-and-suspenders; JWT expiry already checked above)
        if (stored.isExpired()) {
            log.warn("Expired refresh token used for userId={} — terminating all sessions", userId);
            refreshTokenRepository.deleteAllByUserId(userId);
            throw ApiException.unauthorized("All sessions terminated");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.unauthorized("User not found"));

        if (user.isBlocked()) {
            refreshTokenRepository.deleteAllByUserId(userId);
            throw ApiException.forbidden("Account has been blocked");
        }

        // Step 3: Delete old token (rotation — old token is now dead)
        refreshTokenRepository.delete(stored);

        // Steps 4+5: Issue new pair and persist new refresh token
        return issueTokenPair(user);
    }

    // ─── Logout ───────────────────────────────────────────────────────────────

    @Transactional
    public void logout(RefreshTokenRequest req) {
        // Validate JWT first so we know the userId
        JwtClaims claims;
        try {
            claims = jwtTokenProvider.parseRefreshToken(req.refreshToken());
        } catch (ApiException e) {
            // Even if token is invalid/expired, still try to delete by token value
            refreshTokenRepository.findByToken(req.refreshToken())
                    .ifPresent(refreshTokenRepository::delete);
            return;
        }

        // Delete the specific token (not all sessions — logout is not a security event)
        refreshTokenRepository.findByToken(req.refreshToken())
                .ifPresent(refreshTokenRepository::delete);

        log.info("User logged out: userId={}", claims.getUserId());
    }

    // ─── Forgot Password ──────────────────────────────────────────────────────

    /**
     * Generates a password reset token.
     * - Plain-text token returned here (to be sent in email)
     * - SHA-256 hash stored in DB
     * - Expires in 1 hour
     *
     * Always returns success (don't reveal whether email exists — security best practice)
     */
    @Transactional
    public String forgotPassword(ForgotPasswordRequest req) {
        userRepository.findByEmail(req.email().toLowerCase().trim()).ifPresent(user -> {
            String plainToken = UUID.randomUUID().toString().replace("-", "");
            String hashedToken = sha256(plainToken);

            user.setResetPasswordToken(hashedToken);
            user.setResetPasswordExpires(LocalDateTime.now().plusHours(1));
            userRepository.save(user);

            // Return plain token — caller (controller) passes this to EmailService
            // Store on thread-local or use a wrapper; for now we use the two-phase approach
            // by storing the plain token in a @Transient field via the approach below
            // (see plainResetToken in the response from the caller)
        });
        // Always return a plain token (even if user not found, return a dummy — prevents email enumeration)
        // But we need the actual token to send email. We handle this via a checked approach:
        // see forgotPasswordInternal for the real implementation.
        return "";
    }

    /**
     * Full forgot-password flow — returns plain token only when user exists, null otherwise.
     * Caller should send email only if return value is non-null.
     */
    @Transactional
    public String forgotPasswordInternal(String email) {
        return userRepository.findByEmail(email.toLowerCase().trim())
                .map(user -> {
                    String plainToken = UUID.randomUUID().toString().replace("-", "");
                    String hashedToken = sha256(plainToken);

                    user.setResetPasswordToken(hashedToken);
                    user.setResetPasswordExpires(LocalDateTime.now().plusHours(1));
                    userRepository.save(user);

                    return plainToken; // send this in email
                })
                .orElse(null); // don't reveal user existence to caller
    }

    // ─── Reset Password ───────────────────────────────────────────────────────

    /**
     * Resets password using plain-text token from email.
     * - SHA-256 hashes the incoming token and looks it up in DB
     * - Validates expiry
     * - Clears the token after use (one-time use)
     * - Triggers deleteAll refresh tokens (forces re-login on all devices)
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest req) {
        String hashedToken = sha256(req.token());

        User user = userRepository.findByResetPasswordToken(hashedToken)
                .orElseThrow(() -> ApiException.badRequest("Invalid or expired reset token"));

        if (user.getResetPasswordExpires() == null ||
                LocalDateTime.now().isAfter(user.getResetPasswordExpires())) {
            // Clear expired token
            user.setResetPasswordToken(null);
            user.setResetPasswordExpires(null);
            userRepository.save(user);
            throw ApiException.badRequest("Reset token has expired");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(req.newPassword()));

        // Invalidate token (one-time use)
        user.setResetPasswordToken(null);
        user.setResetPasswordExpires(null);
        userRepository.save(user);

        // Revoke all refresh tokens — user must re-login on all devices
        refreshTokenRepository.deleteAllByUserId(user.getId());
        log.info("Password reset for userId={} — all sessions terminated", user.getId());
    }

    // ─── Google Sign-In ───────────────────────────────────────────────────────

    /**
     * Google OAuth sign-in — upsert by googleId or email.
     * If user already exists with the same email but no googleId, links the Google account.
     */
    @Transactional
    public AuthResponse googleSignIn(GoogleAuthRequest req) {
        FirebaseToken firebaseToken;
        try {
            firebaseToken = FirebaseAuth.getInstance().verifyIdToken(req.idToken());
        } catch (Exception e) {
            log.warn("Firebase token verification failed: {}", e.getMessage());
            throw ApiException.unauthorized("Invalid Google token");
        }

        String googleId = firebaseToken.getUid();
        String email = firebaseToken.getEmail();
        String name = firebaseToken.getName();
        String picture = firebaseToken.getPicture();

        // Try find by googleId first, then by email
        User user = userRepository.findByGoogleId(googleId)
                .or(() -> userRepository.findByEmail(email))
                .map(existing -> {
                    // Link Google account if not already linked
                    if (existing.getGoogleId() == null) {
                        existing.setGoogleId(googleId);
                        if (existing.getAvatar() == null && picture != null) {
                            existing.setAvatar(picture);
                        }
                        userRepository.save(existing);
                    }
                    return existing;
                })
                .orElseGet(() -> {
                    // New user via Google
                    User newUser = User.builder()
                            .name(name)
                            .email(email)
                            .googleId(googleId)
                            .avatar(picture)
                            .role(UserRole.USER)
                            .isBlocked(false)
                            .build();
                    return userRepository.save(newUser);
                });

        if (user.isBlocked()) {
            throw ApiException.forbidden("Account has been blocked");
        }

        log.info("Google sign-in: userId={}", user.getId());
        return issueTokenPair(user);
    }

    // ─── Internal helpers ─────────────────────────────────────────────────────

    /**
     * Issues a new access + refresh token pair, persists the refresh token in DB,
     * and returns the full AuthResponse.
     */
    private AuthResponse issueTokenPair(User user) {
        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getRole(), user.getEmail());
        String refreshTokenStr = jwtTokenProvider.generateRefreshToken(
                user.getId(), user.getRole(), user.getEmail());

        // Persist refresh token
        LocalDateTime expiresAt = LocalDateTime.now()
                .plusSeconds(jwtTokenProvider.getRefreshExpirationMs() / 1000);

        RefreshToken refreshToken = RefreshToken.builder()
                .token(refreshTokenStr)
                .user(user)
                .expiresAt(expiresAt)
                .build();

        refreshTokenRepository.save(refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenStr)
                .user(toUserDto(user))
                .build();
    }

    private AuthResponse.UserDto toUserDto(User user) {
        return AuthResponse.UserDto.builder()
                .id(user.getId().toString())    // BIGINT → String
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .phone(user.getMobile())
                .avatarUrl(user.getAvatar())
                .isEmailVerified(user.getGoogleId() != null) // Google = verified email
                .isPhoneVerified(false)
                .build();
    }

    /**
     * SHA-256 hash — used for password reset token storage.
     * Mirrors Node.js: crypto.createHash('sha256').update(token).digest('hex')
     */
    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
