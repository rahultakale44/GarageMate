package com.garagemate.api.domain.user.dto;

import com.garagemate.api.domain.user.User;
import com.garagemate.api.domain.user.UserRole;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Safe user representation for all API responses.
 * Never exposes password, resetPasswordToken, or resetPasswordExpires.
 * id is serialized as String (BIGINT → String, mirrors Node.js ObjectId string behavior).
 */
@Getter
@Builder
public class UserDto {

    private final String id;          // BIGINT serialized as String
    private final String name;
    private final String email;
    private final String mobile;
    private final UserRole role;
    private final String avatar;
    private final String googleId;
    private final boolean isBlocked;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    /** Factory method — the single place that maps User → UserDto. */
    public static UserDto from(User user) {
        return UserDto.builder()
                .id(user.getId().toString())
                .name(user.getName())
                .email(user.getEmail())
                .mobile(user.getMobile())
                .role(user.getRole())
                .avatar(user.getAvatar())
                .googleId(user.getGoogleId())
                .isBlocked(user.isBlocked())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
