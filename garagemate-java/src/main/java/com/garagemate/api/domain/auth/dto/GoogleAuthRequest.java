package com.garagemate.api.domain.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record GoogleAuthRequest(
        @NotBlank(message = "idToken is required")
        String idToken
) {}
