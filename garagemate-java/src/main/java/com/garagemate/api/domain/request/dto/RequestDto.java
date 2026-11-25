package com.garagemate.api.domain.request.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.garagemate.api.domain.request.*;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * AssistanceRequest response DTO.
 *
 * Uses _id (String) throughout to match MongoDB ObjectId strings the
 * React frontend expects:
 *   RequestRecord._id, .vehicleId._id, .garageId._id, .mechanicId._id
 *
 * Nested sub-DTOs mirror the Mongoose populate() shapes:
 *   userId   → populate('userId', 'name phone avatar email')
 *   vehicleId → populate('vehicleId')  — full vehicle fields
 *   garageId  → populate('garageId', 'name phone address rating')
 *   mechanicId → populate('mechanicId', 'name phone avatar')
 */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RequestDto {

    private final String _id;
    private final UserRef userId;
    private final VehicleRef vehicleId;
    private final GarageRef garageId;
    private final MechanicRef mechanicId;

    private final IssueCategory issueCategory;
    private final String issueDescription;
    private final List<String> issueImages;

    private final BigDecimal latitude;
    private final BigDecimal longitude;
    private final String address;
    private final String landmark;
    private final String city;
    private final String state;
    private final String pincode;

    private final RequestStatus status;
    private final Urgency urgency;

    private final BigDecimal bookingFee;
    private final BigDecimal estimatedCost;
    private final BigDecimal finalCost;

    private final Integer estimatedArrivalMinutes;
    private final LocalDateTime etaSetAt;

    private final List<StatusHistoryEntry> statusHistory;

    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    // ── Nested sub-DTOs ───────────────────────────────────────────────────────

    @Getter @Builder @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UserRef {
        private final String _id;
        private final String name;
        private final String phone;
        private final String avatar;
        private final String email;
    }

    @Getter @Builder @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class VehicleRef {
        private final String _id;
        private final String brand;
        private final String vehicleModel;
        private final String registrationNumber;
        private final String vehicleType;
        private final String fuelType;
        private final Integer manufacturingYear;
    }

    @Getter @Builder @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class GarageRef {
        private final String _id;
        private final String name;
        private final String phone;
        private final String address;
        private final java.math.BigDecimal rating;
    }

    @Getter @Builder @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class MechanicRef {
        private final String _id;
        private final String name;
        private final String phone;
        private final String avatar;
        private final String status;
    }

    @Getter @Builder @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class StatusHistoryEntry {
        private final RequestStatus status;
        private final String updatedBy;   // String userId
        private final LocalDateTime updatedAt;
        private final String notes;
    }

    // ── Factory ───────────────────────────────────────────────────────────────

    public static RequestDto from(com.garagemate.api.domain.request.AssistanceRequest r) {
        UserRef userRef = null;
        if (r.getUser() != null) {
            var u = r.getUser();
            userRef = UserRef.builder()
                    ._id(u.getId().toString())
                    .name(u.getName()).phone(u.getMobile())
                    .avatar(u.getAvatar()).email(u.getEmail())
                    .build();
        }

        VehicleRef vehicleRef = null;
        if (r.getVehicle() != null) {
            var v = r.getVehicle();
            vehicleRef = VehicleRef.builder()
                    ._id(v.getId().toString())
                    .brand(v.getBrand()).vehicleModel(v.getVehicleModel())
                    .registrationNumber(v.getRegistrationNumber())
                    .vehicleType(v.getVehicleType() != null ? v.getVehicleType().name() : null)
                    .fuelType(v.getFuelType())
                    .manufacturingYear(v.getManufacturingYear())
                    .build();
        }

        GarageRef garageRef = null;
        if (r.getGarage() != null) {
            var g = r.getGarage();
            garageRef = GarageRef.builder()
                    ._id(g.getId().toString())
                    .name(g.getName()).phone(g.getPhone())
                    .address(g.getAddress()).rating(g.getRating())
                    .build();
        }

        MechanicRef mechanicRef = null;
        if (r.getMechanic() != null) {
            var m = r.getMechanic();
            mechanicRef = MechanicRef.builder()
                    ._id(m.getId().toString())
                    .name(m.getName()).phone(m.getPhone())
                    .avatar(m.getAvatar())
                    .status(m.getStatus() != null ? m.getStatus().name() : null)
                    .build();
        }

        List<StatusHistoryEntry> history = r.getStatusHistory().stream()
                .map(h -> StatusHistoryEntry.builder()
                        .status(h.getStatus())
                        .updatedBy(h.getUpdatedById() != null
                                ? h.getUpdatedById().toString() : null)
                        .updatedAt(h.getUpdatedAt())
                        .notes(h.getNotes())
                        .build())
                .toList();

        return RequestDto.builder()
                ._id(r.getId().toString())
                .userId(userRef)
                .vehicleId(vehicleRef)
                .garageId(garageRef)
                .mechanicId(mechanicRef)
                .issueCategory(r.getIssueCategory())
                .issueDescription(r.getIssueDescription())
                .issueImages(r.getIssueImages())
                .latitude(r.getLatitude())
                .longitude(r.getLongitude())
                .address(r.getAddress())
                .landmark(r.getLandmark())
                .city(r.getCity()).state(r.getState()).pincode(r.getPincode())
                .status(r.getStatus())
                .urgency(r.getUrgency())
                .bookingFee(r.getBookingFee())
                .estimatedCost(r.getEstimatedCost())
                .finalCost(r.getFinalCost())
                .estimatedArrivalMinutes(r.getEstimatedArrivalMinutes())
                .etaSetAt(r.getEtaSetAt())
                .statusHistory(history)
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
