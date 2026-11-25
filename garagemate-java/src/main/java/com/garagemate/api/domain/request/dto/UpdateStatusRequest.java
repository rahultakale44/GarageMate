package com.garagemate.api.domain.request.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * PATCH /api/requests/:id/status
 * Body: { status, notes? }
 * Mirrors updateStatusSchema: status required, notes optional.
 */
public record UpdateStatusRequest(
        @NotBlank(message = "status is required")
        String status,

        String notes
) {}
