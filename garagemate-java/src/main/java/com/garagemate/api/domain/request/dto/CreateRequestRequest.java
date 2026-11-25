package com.garagemate.api.domain.request.dto;

import com.garagemate.api.domain.request.IssueCategory;
import com.garagemate.api.domain.request.Urgency;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * POST /api/requests
 *
 * Frontend sends (StepSummary.tsx):
 *   { vehicleId, issueCategory, issueDescription, issueImages?,
 *     latitude, longitude, address, garageId?, urgency? }
 *
 * Mirrors createRequestSchema (Zod):
 *   vehicleId: required, issueCategory: enum, issueDescription: min 10,
 *   latitude/longitude, address: min 5, garageId: optional, urgency: optional
 */
public record CreateRequestRequest(

        @NotBlank(message = "vehicleId is required")
        String vehicleId,

        @NotNull(message = "issueCategory is required")
        IssueCategory issueCategory,

        @NotBlank(message = "issueDescription is required")
        @Size(min = 10, message = "Please describe the issue in detail (min 10 chars)")
        String issueDescription,

        List<String> issueImages,

        @NotNull(message = "latitude is required")
        @DecimalMin("-90") @DecimalMax("90")
        BigDecimal latitude,

        @NotNull(message = "longitude is required")
        @DecimalMin("-180") @DecimalMax("180")
        BigDecimal longitude,

        @NotBlank(message = "address is required")
        @Size(min = 5, message = "Address is required")
        String address,

        String landmark,
        String city,
        String state,
        String pincode,

        // Optional: direct garage selection
        String garageId,

        // Defaults to MEDIUM
        Urgency urgency
) {}
