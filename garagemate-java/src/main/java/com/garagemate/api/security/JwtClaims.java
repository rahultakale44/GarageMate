package com.garagemate.api.security;

import com.garagemate.api.domain.user.UserRole;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class JwtClaims {
    private final Long userId;
    private final UserRole role;
    private final String email;
}
