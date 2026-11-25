package com.garagemate.api.domain.request.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * POST /api/requests/:id/assign-mechanic
 * Body: { mechanicId }
 * Frontend: GarageRequestsPage sends mechanicId as a string.
 */
public record AssignMechanicRequest(
        @NotBlank(message = "mechanicId is required")
        String mechanicId
) {}
