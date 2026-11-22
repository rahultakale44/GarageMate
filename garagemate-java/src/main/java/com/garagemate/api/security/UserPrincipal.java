package com.garagemate.api.security;

import com.garagemate.api.domain.user.UserRole;
import lombok.Builder;
import lombok.Getter;

/**
 * Authenticated principal — attached to SecurityContext after JWT validation.
 * Mirrors Node.js req.user = { userId, role, email }.
 */
@Getter
@Builder
public class UserPrincipal {
    private final Long userId;
    private final String email;
    private final UserRole role;
}
