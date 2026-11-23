package com.garagemate.api.domain.mechanic.dto;

import com.garagemate.api.domain.vehicle.VehicleType;
import jakarta.validation.constraints.*;

import java.util.List;

/**
 * POST /api/mechanics
 *
 * Frontend sends: { name, phone, skills: string[], experience: number }
 * Controller also accepts: avatar, vehicleExpertise (optional — not sent by current frontend form)
 *
 * Mirrors the original Node.js createMechanic field extraction:
 *   const { name, phone, avatar, skills, vehicleExpertise, experience } = req.body;
 */
public record CreateMechanicRequest(

        @NotBlank(message = "name is required")
        @Size(min = 2, max = 100, message = "name must be 2–100 characters")
        String name,

        @NotBlank(message = "phone is required")
        @Pattern(regexp = "^\\d{10}$", message = "phone must be exactly 10 digits")
        String phone,

        @Size(max = 500, message = "avatar URL too long")
        String avatar,

        // skills defaults to [] when absent — mirrors: skills || []
        List<String> skills,

        // vehicleExpertise defaults to [] when absent — mirrors: vehicleExpertise || []
        List<VehicleType> vehicleExpertise,

        // experience defaults to 0 when absent — mirrors: experience || 0
        @Min(value = 0, message = "experience must be 0 or more")
        @Max(value = 50, message = "experience must be 50 or less")
        Integer experience
) {
    /** Canonical defaults matching Node.js: skills || [], vehicleExpertise || [], experience || 0 */
    public List<String> effectiveSkills() {
        return skills != null ? skills : List.of();
    }

    public List<VehicleType> effectiveVehicleExpertise() {
        return vehicleExpertise != null ? vehicleExpertise : List.of();
    }

    public int effectiveExperience() {
        return experience != null ? experience : 0;
    }
}
