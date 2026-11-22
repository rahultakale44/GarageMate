package com.garagemate.api.domain.garage.dto;

import com.garagemate.api.domain.vehicle.VehicleType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * PATCH /api/garages/my/profile — owner partial update.
 * All fields optional. Owner cannot change verificationStatus or admin-controlled fields.
 * Mirrors Node.js updateGarageSchema.
 */
public record UpdateGarageRequest(

        @Size(min = 2, max = 150)
        String name,

        @Pattern(regexp = "^\\d{10}$", message = "phone must be exactly 10 digits")
        String phone,

        @Size(min = 10, max = 500)
        String address,

        @Size(min = 2, max = 100)
        String city,

        @Size(min = 2, max = 100)
        String state,

        @Pattern(regexp = "^\\d{6}$", message = "pincode must be exactly 6 digits")
        String pincode,

        @DecimalMin("-90") @DecimalMax("90")
        BigDecimal latitude,

        @DecimalMin("-180") @DecimalMax("180")
        BigDecimal longitude,

        @Min(1) @Max(100)
        Integer serviceRadius,

        List<String> services,

        List<VehicleType> supportedVehicleTypes,

        String openingTime,

        String closingTime,

        String weeklyOff,

        Boolean is24x7,

        @Min(1)
        Integer numberOfMechanics,

        @DecimalMin("0")
        BigDecimal visitingCharge,

        /**
         * servicePricing: { "Car Repair": 500, "Tyre Puncture": 200 }
         * Mirrors MongoDB schema: servicePricing?: Record<string, number>
         * When present, replaces all existing pricing entries atomically.
         * When null, existing pricing is left unchanged.
         * Values must be >= 0.
         */
        java.util.Map<String, @jakarta.validation.constraints.DecimalMin("0") BigDecimal> servicePricing
) {}
