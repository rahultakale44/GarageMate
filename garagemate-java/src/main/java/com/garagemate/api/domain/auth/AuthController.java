package com.garagemate.api.domain.auth;

import com.garagemate.api.common.ApiResponse;
import com.garagemate.api.domain.auth.dto.*;
import com.garagemate.api.integration.email.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Auth endpoints — mirrors Node.js routes/auth.routes.js exactly.
 *
 * POST /api/auth/register
 * POST /api/auth/register-garage
 * POST /api/auth/login
 * POST /api/auth/refresh-token
 * POST /api/auth/logout
 * POST /api/auth/forgot-password
 * POST /api/auth/reset-password
 * POST /api/auth/google
 * GET  /api/auth/me  (requires auth — in UserController for clean separation)
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final EmailService emailService;

    /**
     * POST /api/auth/user/register  (frontend: AUTH.USER_REGISTER)
     * Also accepts /api/auth/register for backward compatibility.
     */
    @PostMapping({"/user/register", "/register"})
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterUserRequest req) {

        AuthResponse response = authService.register(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful", response));
    }

    /**
     * POST /api/auth/garage/register  (frontend: AUTH.GARAGE_REGISTER)
     * Also accepts /api/auth/register-garage for backward compatibility.
     */
    @PostMapping({"/garage/register", "/register-garage"})
    public ResponseEntity<ApiResponse<AuthResponse>> registerGarage(
            @Valid @RequestBody RegisterGarageRequest req) {

        AuthResponse response = authService.registerGarage(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Garage owner registration successful", response));
    }

    /**
     * POST /api/auth/login
     * Body: { email, password }
     * Returns: { accessToken, refreshToken, user }
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest req) {

        AuthResponse response = authService.login(req);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    /**
     * POST /api/auth/refresh  (frontend: AUTH.REFRESH = '/auth/refresh')
     * Also accepts /api/auth/refresh-token for backward compatibility.
     */
    @PostMapping({"/refresh", "/refresh-token"})
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest req) {

        AuthResponse response = authService.refreshToken(req);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed", response));
    }

    /**
     * POST /api/auth/logout
     * Body: { refreshToken }
     * Returns: 200 OK
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @Valid @RequestBody RefreshTokenRequest req) {

        authService.logout(req);
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
    }

    /**
     * POST /api/auth/forgot-password
     * Body: { email }
     * Returns: 200 (always — prevents email enumeration)
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest req) {

        String plainToken = authService.forgotPasswordInternal(req.email());

        // Only send email if user actually exists (plain token is non-null)
        if (plainToken != null) {
            emailService.sendPasswordReset(req.email(), plainToken);
        }

        // Always return 200 — prevents email enumeration
        return ResponseEntity.ok(ApiResponse.success(
                "If that email exists, a reset link has been sent", null));
    }

    /**
     * POST /api/auth/reset-password
     * Body: { token, newPassword }
     * Returns: 200 OK
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest req) {

        authService.resetPassword(req);
        return ResponseEntity.ok(ApiResponse.success("Password reset successful", null));
    }

    /**
     * POST /api/auth/google
     * Body: { idToken }  (Firebase ID token from client)
     * Returns: { accessToken, refreshToken, user }
     */
    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponse>> googleSignIn(
            @Valid @RequestBody GoogleAuthRequest req) {

        AuthResponse response = authService.googleSignIn(req);
        return ResponseEntity.ok(ApiResponse.success("Google sign-in successful", response));
    }
}
