package com.garagemate.api.domain.user;

import com.garagemate.api.common.ApiResponse;
import com.garagemate.api.domain.user.dto.ChangePasswordRequest;
import com.garagemate.api.domain.user.dto.UpdateProfileRequest;
import com.garagemate.api.domain.user.dto.UserDto;
import com.garagemate.api.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * User endpoints — mirrors Node.js userRoutes.ts + the GET /api/auth/me endpoint.
 *
 * GET  /api/auth/me           → getMe       (any authenticated role)
 * GET  /api/users/profile     → getProfile  (any authenticated role)
 * PATCH /api/users/profile    → updateProfile
 * PATCH /api/users/password   → changePassword
 * POST  /api/users/avatar     → uploadAvatar
 *
 * Note: The audit lists GET /me under /api/auth — both /api/auth/me and
 * /api/users/profile return the same data. AuthController delegates here.
 */
@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ── GET /api/auth/me ─────────────────────────────────────────────────────

    /**
     * GET /api/auth/me
     * Any authenticated role. Returns own profile (no password, no reset tokens).
     */
    @GetMapping("/api/auth/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserDto>> getMe(
            @AuthenticationPrincipal UserPrincipal principal) {

        UserDto dto = userService.getProfile(principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    // ── GET /api/users/profile ────────────────────────────────────────────────

    @GetMapping("/api/users/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserDto>> getProfile(
            @AuthenticationPrincipal UserPrincipal principal) {

        UserDto dto = userService.getProfile(principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    // ── PATCH /api/users/profile ──────────────────────────────────────────────

    /**
     * PATCH /api/users/profile
     * Body: { name?, mobile?, avatar? }
     * Partial update — only provided fields are changed.
     */
    @PatchMapping("/api/users/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserDto>> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateProfileRequest req) {

        UserDto dto = userService.updateProfile(principal.getUserId(), req);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", dto));
    }

    // ── PATCH /api/users/password ─────────────────────────────────────────────

    /**
     * PATCH /api/users/password
     * Body: { currentPassword, newPassword }
     * Revokes all refresh tokens on success.
     */
    @PatchMapping("/api/users/password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChangePasswordRequest req) {

        userService.changePassword(principal.getUserId(), req);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }

    // ── POST /api/users/avatar ────────────────────────────────────────────────

    /**
     * POST /api/users/avatar
     * Multipart form field: file
     * Uploads to Cloudinary, updates user.avatar, returns updated profile.
     */
    @PostMapping("/api/users/avatar")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserDto>> uploadAvatar(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("file") MultipartFile file) {

        UserDto dto = userService.uploadAvatar(principal.getUserId(), file);
        return ResponseEntity.ok(ApiResponse.success("Avatar uploaded successfully", dto));
    }
}
