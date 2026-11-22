package com.garagemate.api.domain.vehicle.dto;

import com.garagemate.api.domain.vehicle.Vehicle;
import com.garagemate.api.domain.vehicle.VehicleType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Safe vehicle representation for API responses.
 * id serialized as String (BIGINT → String).
 * userId serialized as String (consistent with frontend).
 */
@Getter
@Builder
public class VehicleDto {

    private final String id;
    private final String userId;
    private final VehicleType vehicleType;
    private final String brand;
    private final String vehicleModel;
    private final String registrationNumber;
    private final String fuelType;
    private final Integer manufacturingYear;
    private final String image;
    private final String notes;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public static VehicleDto from(Vehicle vehicle) {
        return VehicleDto.builder()
                .id(vehicle.getId().toString())
                .userId(vehicle.getUser().getId().toString())
                .vehicleType(vehicle.getVehicleType())
                .brand(vehicle.getBrand())
                .vehicleModel(vehicle.getVehicleModel())
                .registrationNumber(vehicle.getRegistrationNumber())
                .fuelType(vehicle.getFuelType())
                .manufacturingYear(vehicle.getManufacturingYear())
                .image(vehicle.getImage())
                .notes(vehicle.getNotes())
                .createdAt(vehicle.getCreatedAt())
                .updatedAt(vehicle.getUpdatedAt())
                .build();
    }
}
