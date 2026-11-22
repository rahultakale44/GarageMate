package com.garagemate.api.domain.garage;

/**
 * Lightweight projection returned by the Haversine native query.
 * Carries garage ID and computed distance in kilometres.
 * Distance is the last column in the SELECT because MySQL native queries
 * return columns in declaration order and computed expressions come last.
 */
public record GarageDistanceRow(Long garageId, double distanceKm) {}
