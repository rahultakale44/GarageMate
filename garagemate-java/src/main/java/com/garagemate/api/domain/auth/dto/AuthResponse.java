package com.garagemate.api.domain.auth.dto;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import com.garagemate.api.domain.user.UserRole;
import lombok.Builder;

/**
 * Returned on login, register, refresh, and Google sign-in.
 * userId is a String in JSON (BIGINT serialized as string — mirrors Node.js ObjectId string behavior).
 */
@Builder
public record AuthResponse(
        String accessToken,
        String refreshToken,
        UserDto user
) {
    @Builder
    public record UserDto(
            String id,          // BIGINT serialized as String
            String name,
            String email,
            UserRole role,
            String phone,
            String avatarUrl,
            Boolean isEmailVerified,
            Boolean isPhoneVerified
    ) {}
}
