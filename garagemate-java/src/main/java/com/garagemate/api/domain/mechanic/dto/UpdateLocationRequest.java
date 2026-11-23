package com.garagemate.api.domain.mechanic.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

/**
 * PATCH /api/mechanics/:id/location
 * Body: { latitude, longitude }
 *
 * Mirrors the original Node.js updateMechanicLocation:
 *   const { latitude, longitude } = req.body;
 *   if (!latitude || !longitude) → 400
 */
public record UpdateLocationRequest(

        @NotNull(message = "latitude is required")
        @DecimalMin(value = "-90", message = "latitude must be between -90 and 90")
        @DecimalMax(value = "90",  message = "latitude must be between -90 and 90")
        BigDecimal latitude,

        @NotNull(message = "longitude is required")
        @DecimalMin(value = "-180", message = "longitude must be between -180 and 180")
        @DecimalMax(value = "180",  message = "longitude must be between -180 and 180")
        BigDecimal longitude
) {}
