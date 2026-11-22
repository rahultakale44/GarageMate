package com.garagemate.api.domain.garage.dto;

import com.garagemate.api.domain.vehicle.VehicleType;
import lombok.Builder;
import lombok.Getter;

/**
 * Parsed parameters for GET /api/garages/nearby.
 * Assembled in GarageService from raw query-param strings.
 */
@Getter
@Builder
public class NearbySearchParams {
    private final double latitude;
    private final double longitude;
    private final double radiusKm;        // validated 1–50 km
    private final String serviceType;     // single service filter
    private final String services;        // comma-separated list
    private final VehicleType vehicleType;
    private final Double minRating;
    private final boolean openNow;
    private final boolean availableNow;
    private final boolean is24x7;
}
