package com.garagemate.api.domain.vehicle.dto;

import com.garagemate.api.domain.vehicle.VehicleType;
import jakarta.validation.constraints.*;

/**
 * POST /api/vehicles
 * Mirrors Node.js createVehicleSchema (Zod):
 *   vehicleType, brand, vehicleModel, registrationNumber, fuelType, manufacturingYear, image?, notes?
 */
public record CreateVehicleRequest(

        @NotNull(message = "vehicleType is required")
        VehicleType vehicleType,

        @NotBlank(message = "brand is required")
        @Size(min = 2, max = 100, message = "brand must be 2–100 characters")
        String brand,

        @NotBlank(message = "vehicleModel is required")
        @Size(min = 1, max = 100, message = "vehicleModel must be 1–100 characters")
        String vehicleModel,

        @NotBlank(message = "registrationNumber is required")
        @Size(min = 4, max = 20, message = "registrationNumber must be 4–20 characters")
        String registrationNumber,

        @NotBlank(message = "fuelType is required")
        @Size(min = 1, max = 50, message = "fuelType must be 1–50 characters")
        String fuelType,

        @NotNull(message = "manufacturingYear is required")
        @Min(value = 1900, message = "manufacturingYear must be ≥ 1900")
        @Max(value = 2100, message = "manufacturingYear must be ≤ 2100")
        Integer manufacturingYear,

        @Size(max = 500, message = "image URL too long")
        String image,

        @Size(max = 1000, message = "notes too long")
        String notes
) {}
