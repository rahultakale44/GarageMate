package com.garagemate.api.domain.user;

import com.garagemate.api.domain.auth.RefreshTokenRepository;
import com.garagemate.api.domain.user.dto.ChangePasswordRequest;
import com.garagemate.api.domain.user.dto.UpdateProfileRequest;
import com.garagemate.api.domain.user.dto.UserDto;
import com.garagemate.api.exception.ApiException;
import com.garagemate.api.integration.cloudinary.CloudinaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * UserService — mirrors Node.js userController.ts.
 *
 * Endpoints:
 *   GET  /api/auth/me              → getMe
 *   GET  /api/users/profile        → getProfile
 *   PATCH /api/users/profile       → updateProfile
 *   PATCH /api/users/password      → changePassword
 *   POST  /api/users/avatar        → uploadAvatar  (Cloudinary)
 *
 * Security rules:
 *   - All operations are scoped to the authenticated user's own record.
 *   - Password is never returned in any DTO.
 *   - Google-only accounts cannot change password.
 *   - Blocked accounts are rejected at the JWT filter, but we also check here.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final CloudinaryService cloudinaryService;

    // ── GET /api/auth/me  AND  GET /api/users/profile ────────────────────────

    @Transactional(readOnly = true)
    public UserDto getProfile(Long userId) {
        User user = findUserOrThrow(userId);
        return UserDto.from(user);
    }

    // ── PATCH /api/users/profile ─────────────────────────────────────────────

    /**
     * Partial update: only the fields that are non-null in the request are written.
     * Mirrors Node.js: if (name) user.name = name; if (mobile) user.mobile = mobile; ...
     */
    @Transactional
    public UserDto updateProfile(Long userId, UpdateProfileRequest req) {
        User user = findUserOrThrow(userId);

        if (req.name() != null && !req.name().isBlank()) {
            user.setName(req.name().trim());
        }
        if (req.mobile() != null && !req.mobile().isBlank()) {
            user.setMobile(req.mobile().trim());
        }
        if (req.avatar() != null && !req.avatar().isBlank()) {
            user.setAvatar(req.avatar().trim());
        }

        userRepository.save(user);
        log.info("Profile updated for userId={}", userId);
        return UserDto.from(user);
    }

    // ── PATCH /api/users/password ─────────────────────────────────────────────

    /**
     * Changes password for email/password accounts.
     * Rejects Google-only accounts (no password set).
     * Revokes all refresh tokens on success (forces re-login on other devices).
     * Mirrors Node.js: user.comparePassword(currentPassword) → user.password = newPassword
     */
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest req) {
        User user = findUserOrThrow(userId);

        if (user.getPassword() == null) {
            throw ApiException.badRequest("Cannot change password for Google sign-in accounts");
        }

        if (!passwordEncoder.matches(req.currentPassword(), user.getPassword())) {
            throw ApiException.badRequest("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);

        // Revoke all sessions — user must re-login everywhere
        refreshTokenRepository.deleteAllByUserId(userId);
        log.info("Password changed for userId={} — all sessions revoked", userId);
    }

    // ── POST /api/users/avatar (Cloudinary upload) ────────────────────────────

    /**
     * Uploads a new avatar to Cloudinary, persists the URL, and returns the updated profile.
     * If the user already has an avatar on Cloudinary, the old one is deleted.
     */
    @Transactional
    public UserDto uploadAvatar(Long userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("No file provided");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw ApiException.badRequest("File must be an image");
        }

        User user = findUserOrThrow(userId);

        try {
            // Delete old Cloudinary asset if it was hosted on Cloudinary
            if (user.getAvatar() != null && user.getAvatar().contains("cloudinary.com")) {
                String oldPublicId = cloudinaryService.extractPublicId(user.getAvatar());
                if (oldPublicId != null) {
                    cloudinaryService.delete(oldPublicId);
                }
            }

            String newUrl = cloudinaryService.upload(file, "garagemate/avatars");
            user.setAvatar(newUrl);
            userRepository.save(user);

            log.info("Avatar uploaded for userId={}: {}", userId, newUrl);
            return UserDto.from(user);

        } catch (IOException e) {
            log.error("Avatar upload failed for userId={}: {}", userId, e.getMessage());
            throw ApiException.internal("Avatar upload failed");
        }
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    private User findUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found"));
    }
}
