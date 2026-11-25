package com.garagemate.api.domain.request.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * POST /api/requests/:id/verify-otp
 * Body: { otp }
 * Mirrors verifyCompletionOTPSchema: otp must be exactly 6 characters.
 */
public record VerifyOtpRequest(
        @NotBlank(message = "otp is required")
        @Size(min = 6, max = 6, message = "OTP must be 6 digits")
        String otp
) {}
