package com.garagemate.api.domain.user.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * PATCH /api/users/profile
 * All fields optional — only present fields are updated (partial update).
 * Mirrors Node.js: { name, mobile, avatar }
 */
public record UpdateProfileRequest(

        @Size(min = 2, max = 100, message = "name must be 2–100 characters")
        String name,

        @Pattern(regexp = "^\\d{10}$", message = "mobile must be exactly 10 digits")
        String mobile,

        // avatar URL — set by Cloudinary upload endpoint, not directly by user
        // Included here so the profile-update flow can persist the returned URL
        @Size(max = 500, message = "avatar URL too long")
        String avatar
) {}
