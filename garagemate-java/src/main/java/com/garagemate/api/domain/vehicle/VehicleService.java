package com.garagemate.api.domain.vehicle;

import com.garagemate.api.domain.user.User;
import com.garagemate.api.domain.user.UserRepository;
import com.garagemate.api.domain.vehicle.dto.CreateVehicleRequest;
import com.garagemate.api.domain.vehicle.dto.UpdateVehicleRequest;
import com.garagemate.api.domain.vehicle.dto.VehicleDto;
import com.garagemate.api.exception.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * VehicleService — mirrors Node.js vehicleController.ts.
 *
 * Ownership rule: every operation is scoped to `userId = authenticated user`.
 * Any attempt to access another user's vehicle returns 404 (not 403) to avoid
 * leaking existence information — matches the Node.js findOne({ _id, userId }) pattern.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    // ── GET /api/vehicles ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<VehicleDto> listVehicles(Long userId) {
        return vehicleRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(VehicleDto::from)
                .toList();
    }

    // ── GET /api/vehicles/:id ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public VehicleDto getVehicle(Long vehicleId, Long userId) {
        Vehicle vehicle = findOwnedOrThrow(vehicleId, userId);
        return VehicleDto.from(vehicle);
    }

    // ── POST /api/vehicles ────────────────────────────────────────────────────

    @Transactional
    public VehicleDto createVehicle(Long userId, CreateVehicleRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found"));

        Vehicle vehicle = Vehicle.builder()
                .user(user)
                .vehicleType(req.vehicleType())
                .brand(req.brand().trim())
                .vehicleModel(req.vehicleModel().trim())
                .registrationNumber(req.registrationNumber().toUpperCase().trim())
                .fuelType(req.fuelType().trim())
                .manufacturingYear(req.manufacturingYear())
                .image(req.image())
                .notes(req.notes())
                .build();

        Vehicle saved = vehicleRepository.save(vehicle);
        log.info("Vehicle created id={} for userId={}", saved.getId(), userId);
        return VehicleDto.from(saved);
    }

    // ── PATCH /api/vehicles/:id ───────────────────────────────────────────────

    /**
     * Partial update: only non-null fields in the request are written.
     * Mirrors Node.js: updateVehicleSchema = createVehicleSchema.partial()
     */
    @Transactional
    public VehicleDto updateVehicle(Long vehicleId, Long userId, UpdateVehicleRequest req) {
        Vehicle vehicle = findOwnedOrThrow(vehicleId, userId);

        if (req.vehicleType() != null) {
            vehicle.setVehicleType(req.vehicleType());
        }
        if (req.brand() != null && !req.brand().isBlank()) {
            vehicle.setBrand(req.brand().trim());
        }
        if (req.vehicleModel() != null && !req.vehicleModel().isBlank()) {
            vehicle.setVehicleModel(req.vehicleModel().trim());
        }
        if (req.registrationNumber() != null && !req.registrationNumber().isBlank()) {
            vehicle.setRegistrationNumber(req.registrationNumber().toUpperCase().trim());
        }
        if (req.fuelType() != null && !req.fuelType().isBlank()) {
            vehicle.setFuelType(req.fuelType().trim());
        }
        if (req.manufacturingYear() != null) {
            vehicle.setManufacturingYear(req.manufacturingYear());
        }
        if (req.image() != null) {
            vehicle.setImage(req.image());
        }
        if (req.notes() != null) {
            vehicle.setNotes(req.notes());
        }

        Vehicle saved = vehicleRepository.save(vehicle);
        log.info("Vehicle updated id={} for userId={}", saved.getId(), userId);
        return VehicleDto.from(saved);
    }

    // ── DELETE /api/vehicles/:id ──────────────────────────────────────────────

    @Transactional
    public void deleteVehicle(Long vehicleId, Long userId) {
        Vehicle vehicle = findOwnedOrThrow(vehicleId, userId);
        vehicleRepository.delete(vehicle);
        log.info("Vehicle deleted id={} for userId={}", vehicleId, userId);
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    /**
     * Finds a vehicle by id AND userId. Returns 404 regardless of whether the vehicle
     * exists but belongs to another user — prevents existence leakage.
     */
    private Vehicle findOwnedOrThrow(Long vehicleId, Long userId) {
        return vehicleRepository.findByIdAndUserId(vehicleId, userId)
                .orElseThrow(() -> ApiException.notFound("Vehicle not found"));
    }
}
