package com.garagemate.api.domain.mechanic.dto;

import com.garagemate.api.domain.mechanic.MechanicStatus;
import com.garagemate.api.domain.vehicle.VehicleType;
import jakarta.validation.constraints.*;

import java.util.List;

/**
 * PATCH /api/mechanics/:id — partial update.
 *
 * All fields optional. Mirrors the original Node.js conditional spread:
 *   { ...(name && { name }), ...(phone && { phone }), ... }
 *
 * Owner cannot directly set status to values used only by the system
 * (ASSIGNED, ON_THE_WAY, WORKING) — but the original controller does
 * accept status in the update body, so we preserve that behavior.
 */
public record UpdateMechanicRequest(

        @Size(min = 2, max = 100, message = "name must be 2–100 characters")
        String name,

        @Pattern(regexp = "^\\d{10}$", message = "phone must be exactly 10 digits")
        String phone,

        @Size(max = 500)
        String avatar,

        List<String> skills,

        List<VehicleType> vehicleExpertise,

        @Min(0) @Max(50)
        Integer experience,

        MechanicStatus status
) {}
