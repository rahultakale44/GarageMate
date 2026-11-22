package com.garagemate.api.domain.garage.dto;

import jakarta.validation.constraints.NotNull;

/** PATCH /api/garages/my/availability — { isAvailable: boolean } */
public record ToggleAvailabilityRequest(
        @NotNull(message = "isAvailable is required")
        Boolean isAvailable
) {}
