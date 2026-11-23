package com.garagemate.api.domain.mechanic;

import com.garagemate.api.domain.garage.Garage;
import com.garagemate.api.domain.garage.GarageRepository;
import com.garagemate.api.domain.mechanic.dto.*;
import com.garagemate.api.exception.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * MechanicService — mirrors Node.js mechanicController.ts exactly.
 *
 * Ownership model (preserved from original):
 *   Every operation resolves the garage by ownerId first.
 *   If no garage exists for the authenticated owner → 404 "Garage not found".
 *   Mechanic queries are then scoped to garageId — a mechanic in another
 *   garage is not found (404), not forbidden (403). This matches the original
 *   Mongoose findOne({ _id, garageId: garage._id }) pattern.
 *
 * All 6 endpoints:
 *   GET    /api/mechanics           → listMechanics
 *   POST   /api/mechanics           → createMechanic
 *   GET    /api/mechanics/:id       → getMechanic
 *   PATCH  /api/mechanics/:id       → updateMechanic
 *   DELETE /api/mechanics/:id       → deleteMechanic
 *   PATCH  /api/mechanics/:id/location → updateLocation
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MechanicService {

    private final MechanicRepository mechanicRepository;
    private final GarageRepository   garageRepository;

    // ── GET /api/mechanics ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<MechanicDto> listMechanics(Long ownerId) {
        Garage garage = resolveGarageOrThrow(ownerId);
        return mechanicRepository.findByGarageIdOrderByCreatedAtDesc(garage.getId())
                .stream()
                .map(MechanicDto::from)
                .toList();
    }

    // ── GET /api/mechanics/:id ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public MechanicDto getMechanic(Long mechanicId, Long ownerId) {
        Garage garage = resolveGarageOrThrow(ownerId);
        Mechanic mechanic = findOwnedMechanicOrThrow(mechanicId, garage.getId());
        return MechanicDto.from(mechanic);
    }

    // ── POST /api/mechanics ───────────────────────────────────────────────────

    /**
     * Creates a mechanic under the authenticated owner's garage.
     * Default status: AVAILABLE (mirrors: status: MechanicStatus.AVAILABLE)
     */
    @Transactional
    public MechanicDto createMechanic(Long ownerId, CreateMechanicRequest req) {
        Garage garage = resolveGarageOrThrow(ownerId);

        Mechanic mechanic = Mechanic.builder()
                .garage(garage)
                .name(req.name().trim())
                .phone(req.phone().trim())
                .avatar(req.avatar())
                .experience(req.effectiveExperience())
                .status(MechanicStatus.AVAILABLE)
                .build();

        // Populate element collections
        mechanic.getSkills().addAll(req.effectiveSkills());
        mechanic.getVehicleExpertise().addAll(req.effectiveVehicleExpertise());

        Mechanic saved = mechanicRepository.save(mechanic);
        log.info("Mechanic created id={} garageId={}", saved.getId(), garage.getId());
        return MechanicDto.from(saved);
    }

    // ── PATCH /api/mechanics/:id ──────────────────────────────────────────────

    /**
     * Partial update — only fields present (non-null) in the request are written.
     *
     * Mirrors the original Node.js conditional spread:
     *   ...(name && { name }), ...(phone && { phone }), etc.
     *
     * Note: the original also accepts `status` from the body. We preserve that
     * behavior — the owner can set status (e.g. OFFLINE) via update.
     */
    @Transactional
    public MechanicDto updateMechanic(Long mechanicId, Long ownerId, UpdateMechanicRequest req) {
        Garage garage = resolveGarageOrThrow(ownerId);
        Mechanic mechanic = findOwnedMechanicOrThrow(mechanicId, garage.getId());

        if (req.name()     != null && !req.name().isBlank())
            mechanic.setName(req.name().trim());
        if (req.phone()    != null && !req.phone().isBlank())
            mechanic.setPhone(req.phone().trim());
        if (req.avatar()   != null)
            mechanic.setAvatar(req.avatar());
        if (req.skills()   != null) {
            mechanic.getSkills().clear();
            mechanic.getSkills().addAll(req.skills());
        }
        if (req.vehicleExpertise() != null) {
            mechanic.getVehicleExpertise().clear();
            mechanic.getVehicleExpertise().addAll(req.vehicleExpertise());
        }
        if (req.experience() != null)
            mechanic.setExperience(req.experience());
        if (req.status()   != null)
            mechanic.setStatus(req.status());

        Mechanic saved = mechanicRepository.save(mechanic);
        log.info("Mechanic updated id={} garageId={}", saved.getId(), garage.getId());
        return MechanicDto.from(saved);
    }

    // ── DELETE /api/mechanics/:id ─────────────────────────────────────────────

    @Transactional
    public void deleteMechanic(Long mechanicId, Long ownerId) {
        Garage garage = resolveGarageOrThrow(ownerId);
        Mechanic mechanic = findOwnedMechanicOrThrow(mechanicId, garage.getId());
        mechanicRepository.delete(mechanic);
        log.info("Mechanic deleted id={} garageId={}", mechanicId, garage.getId());
    }

    // ── PATCH /api/mechanics/:id/location ────────────────────────────────────

    /**
     * Updates the mechanic's GPS coordinates.
     *
     * Returns { location: { latitude, longitude } } to match the original response:
     *   data: { location: mechanic.currentLocation }
     * We return a flat { latitude, longitude } object (the DTO's LocationDto
     * uses GeoJSON format with coordinates[], but the REST response here mirrors
     * the original which returns the MongoDB document's currentLocation sub-doc).
     *
     * The original controller had a comment "Emit socket event for real-time
     * tracking — This will be handled by Socket.IO service." The Socket.IO relay
     * is deferred to the STOMP migration phase; the REST persistence is complete.
     */
    @Transactional
    public MechanicDto.LocationDto updateLocation(Long mechanicId, Long ownerId,
                                                   UpdateLocationRequest req) {
        Garage garage = resolveGarageOrThrow(ownerId);
        Mechanic mechanic = findOwnedMechanicOrThrow(mechanicId, garage.getId());

        mechanic.setCurrentLatitude(req.latitude());
        mechanic.setCurrentLongitude(req.longitude());
        mechanicRepository.save(mechanic);

        log.info("Mechanic location updated id={} lat={} lng={}",
                mechanicId, req.latitude(), req.longitude());

        // Return [longitude, latitude] matching original MongoDB GeoJSON shape
        return MechanicDto.LocationDto.builder()
                .coordinates(new double[]{
                        req.longitude().doubleValue(),
                        req.latitude().doubleValue()
                })
                .build();
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    /**
     * Resolves the garage belonging to the authenticated owner.
     * Returns 404 "Garage not found" if none exists — matches Node.js:
     *   const garage = await Garage.findOne({ owner: req.user.userId });
     *   if (!garage) throw new ApiError(404, 'Garage not found');
     */
    private Garage resolveGarageOrThrow(Long ownerId) {
        return garageRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> ApiException.notFound("Garage not found"));
    }

    /**
     * Finds a mechanic by id AND garageId.
     * Returns 404 "Mechanic not found" regardless of whether the mechanic exists
     * in a different garage — prevents existence disclosure.
     * Matches Node.js: Mechanic.findOne({ _id, garageId: garage._id })
     */
    private Mechanic findOwnedMechanicOrThrow(Long mechanicId, Long garageId) {
        return mechanicRepository.findByIdAndGarageId(mechanicId, garageId)
                .orElseThrow(() -> ApiException.notFound("Mechanic not found"));
    }
}
