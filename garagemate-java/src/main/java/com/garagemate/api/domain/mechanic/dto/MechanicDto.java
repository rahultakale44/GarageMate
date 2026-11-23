package com.garagemate.api.domain.mechanic.dto;

import com.garagemate.api.domain.mechanic.Mechanic;
import com.garagemate.api.domain.mechanic.MechanicStatus;
import com.garagemate.api.domain.vehicle.VehicleType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Mechanic response DTO.
 *
 * Uses _id (string) to match the MongoDB ObjectId field name the React
 * frontend expects — MechanicRecord._id in GarageDashboard.tsx.
 *
 * garageId is serialized as a String for the same reason.
 *
 * Fields match the original Node.js Mechanic document exactly:
 *   _id, garageId, name, phone, avatar, skills, vehicleExpertise,
 *   experience, status, currentLocation (lat/lng), currentRequestId,
 *   createdAt, updatedAt
 */
@Getter
@Builder
public class MechanicDto {

    private final String _id;
    private final String garageId;
    private final String name;
    private final String phone;
    private final String avatar;
    private final List<String> skills;
    private final List<VehicleType> vehicleExpertise;
    private final Integer experience;
    private final MechanicStatus status;

    /** Current GPS location — null when not set */
    private final LocationDto currentLocation;

    /** ID of the request the mechanic is currently handling — null when not assigned */
    private final String currentRequestId;

    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    /**
     * GeoJSON-compatible location wrapper.
     * Matches the original MongoDB shape:
     *   currentLocation: { type: 'Point', coordinates: [longitude, latitude] }
     */
    @Getter
    @Builder
    public static class LocationDto {
        private final String type = "Point";
        private final double[] coordinates; // [longitude, latitude]
    }

    public static MechanicDto from(Mechanic mechanic) {
        LocationDto location = null;
        if (mechanic.getCurrentLatitude() != null && mechanic.getCurrentLongitude() != null) {
            location = LocationDto.builder()
                    .coordinates(new double[]{
                            mechanic.getCurrentLongitude().doubleValue(),
                            mechanic.getCurrentLatitude().doubleValue()
                    })
                    .build();
        }

        return MechanicDto.builder()
                ._id(mechanic.getId().toString())
                .garageId(mechanic.getGarage().getId().toString())
                .name(mechanic.getName())
                .phone(mechanic.getPhone())
                .avatar(mechanic.getAvatar())
                .skills(mechanic.getSkills())
                .vehicleExpertise(mechanic.getVehicleExpertise())
                .experience(mechanic.getExperience())
                .status(mechanic.getStatus())
                .currentLocation(location)
                .currentRequestId(mechanic.getCurrentRequestId() != null
                        ? mechanic.getCurrentRequestId().toString() : null)
                .createdAt(mechanic.getCreatedAt())
                .updatedAt(mechanic.getUpdatedAt())
                .build();
    }
}
