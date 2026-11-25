package com.garagemate.api.domain.request.dto;

import jakarta.validation.constraints.*;

/**
 * PATCH /api/requests/:id/eta
 * Body: { estimatedArrivalMinutes }
 * Mirrors original: 1–180 minutes.
 */
public record UpdateEtaRequest(
        @NotNull(message = "estimatedArrivalMinutes is required")
        @Min(value = 1, message = "ETA must be at least 1 minute")
        @Max(value = 180, message = "ETA cannot exceed 180 minutes")
        Integer estimatedArrivalMinutes
) {}
