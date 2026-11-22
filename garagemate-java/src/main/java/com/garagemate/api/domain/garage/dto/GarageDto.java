package com.garagemate.api.domain.garage.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.garagemate.api.domain.garage.Garage;
import com.garagemate.api.domain.garage.VerificationStatus;
import com.garagemate.api.domain.vehicle.VehicleType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Garage response DTO — used for all public and owner endpoints.
 *
 * Uses _id (not id) to match the MongoDB ObjectId field name the React frontend expects.
 * Also exposes a location object with coordinates[longitude, latitude] matching the
 * original MongoDB GeoJSON shape the frontend uses for map rendering.
 *
 * Fields distance and isOpen are populated only on nearby-search responses.
 */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GarageDto {

    // Frontend expects _id (MongoDB ObjectId compat)
    private final String _id;

    private final GarageOwnerDto owner;
    private final String name;
    private final String phone;
    private final String address;
    private final String city;
    private final String state;
    private final String pincode;
    private final String landmark;

    /** GeoJSON-style location — matches frontend's garage.location.coordinates[0/1] usage */
    private final LocationDto location;

    private final Integer serviceRadius;
    private final List<String> services;
    private final List<VehicleType> supportedVehicleTypes;
    private final String openingTime;
    private final String closingTime;
    private final String weeklyOff;
    private final Boolean is24x7;
    private final Integer numberOfMechanics;
    private final VerificationStatus verificationStatus;
    private final String verificationNotes;
    private final BigDecimal rating;
    private final Integer reviewCount;
    private final Boolean isAvailable;
    private final BigDecimal visitingCharge;
    private final Boolean isDemo;

    private final List<GarageImageDto> images;

    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    // Populated only by nearby search
    private final Double distance;         // km, 2dp — matches Node.js distance field
    private final Integer distanceInMeters;
    private final Boolean isOpen;

    /** GeoJSON Point wrapper matching MongoDB shape: { type, coordinates: [lng, lat] } */
    @Getter
    @Builder
    public static class LocationDto {
        private final String type = "Point";
        private final double[] coordinates;  // [longitude, latitude]
    }

    public static GarageDto from(Garage garage) {
        return from(garage, null, null);
    }

    public static GarageDto from(Garage garage, Double distanceKm, Boolean isOpen) {
        double lat = garage.getLatitude().doubleValue();
        double lng = garage.getLongitude().doubleValue();

        return GarageDto.builder()
                ._id(garage.getId().toString())
                .owner(garage.getOwner() != null ? GarageOwnerDto.from(garage.getOwner()) : null)
                .name(garage.getName())
                .phone(garage.getPhone())
                .address(garage.getAddress())
                .city(garage.getCity())
                .state(garage.getState())
                .pincode(garage.getPincode())
                .landmark(garage.getLandmark())
                .location(LocationDto.builder()
                        .coordinates(new double[]{lng, lat})
                        .build())
                .serviceRadius(garage.getServiceRadius())
                .services(garage.getServices())
                .supportedVehicleTypes(garage.getSupportedVehicleTypes())
                .openingTime(garage.getOpeningTime())
                .closingTime(garage.getClosingTime())
                .weeklyOff(garage.getWeeklyOff())
                .is24x7(garage.is24x7())
                .numberOfMechanics(garage.getNumberOfMechanics())
                .verificationStatus(garage.getVerificationStatus())
                .verificationNotes(garage.getVerificationNotes())
                .rating(garage.getRating())
                .reviewCount(garage.getReviewCount())
                .isAvailable(garage.isAvailable())
                .visitingCharge(garage.getVisitingCharge())
                .isDemo(garage.isDemo())
                .images(garage.getImages().stream().map(GarageImageDto::from).toList())
                .createdAt(garage.getCreatedAt())
                .updatedAt(garage.getUpdatedAt())
                .distance(distanceKm != null
                        ? Math.round(distanceKm * 100.0) / 100.0  // 2dp
                        : null)
                .distanceInMeters(distanceKm != null
                        ? (int) Math.round(distanceKm * 1000)
                        : null)
                .isOpen(isOpen)
                .build();
    }
}
