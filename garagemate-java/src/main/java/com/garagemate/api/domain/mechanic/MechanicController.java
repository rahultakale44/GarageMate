package com.garagemate.api.domain.mechanic;

import com.garagemate.api.common.ApiResponse;
import com.garagemate.api.domain.mechanic.dto.*;
import com.garagemate.api.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Mechanic endpoints — mirrors Node.js mechanicRoutes.ts exactly.
 *
 * All endpoints require GARAGE_OWNER role.
 * All operations are scoped to the authenticated owner's garage.
 *
 * GET    /api/mechanics           → list own garage's mechanics
 * POST   /api/mechanics           → create mechanic
 * GET    /api/mechanics/:id       → get mechanic
 * PATCH  /api/mechanics/:id       → update mechanic (partial)
 * DELETE /api/mechanics/:id       → delete mechanic
 * PATCH  /api/mechanics/:id/location → update GPS location
 *
 * NOTE: Spring MVC evaluates paths in registration order.
 * /:id/location must be declared BEFORE /:id to prevent /location
 * being interpreted as an ID value.
 */
@RestController
@RequestMapping("/api/mechanics")
@PreAuthorize("hasRole('GARAGE_OWNER')")
@RequiredArgsConstructor
public class MechanicController {

    private final MechanicService mechanicService;

    // ── GET /api/mechanics ────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<ApiResponse<List<MechanicDto>>> getMechanics(
            @AuthenticationPrincipal UserPrincipal principal) {

        List<MechanicDto> mechanics = mechanicService.listMechanics(principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success(mechanics));
    }

    // ── POST /api/mechanics ───────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<ApiResponse<MechanicDto>> createMechanic(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateMechanicRequest req) {

        MechanicDto dto = mechanicService.createMechanic(principal.getUserId(), req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Mechanic added successfully", dto));
    }

    // ── GET /api/mechanics/:id ────────────────────────────────────────────────

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MechanicDto>> getMechanic(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {

        MechanicDto dto = mechanicService.getMechanic(id, principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    // ── PATCH /api/mechanics/:id/location (BEFORE /:id) ──────────────────────

    /**
     * PATCH /api/mechanics/:id/location
     * Body: { latitude, longitude }
     * Returns: { location: { type: "Point", coordinates: [lng, lat] } }
     *
     * The Socket.IO relay (mechanic:location-update) is deferred to STOMP migration.
     */
    @PatchMapping("/{id}/location")
    public ResponseEntity<ApiResponse<MechanicDto.LocationDto>> updateLocation(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody UpdateLocationRequest req) {

        MechanicDto.LocationDto location =
                mechanicService.updateLocation(id, principal.getUserId(), req);
        return ResponseEntity.ok(ApiResponse.success("Location updated successfully", location));
    }

    // ── PATCH /api/mechanics/:id ──────────────────────────────────────────────

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<MechanicDto>> updateMechanic(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody UpdateMechanicRequest req) {

        MechanicDto dto = mechanicService.updateMechanic(id, principal.getUserId(), req);
        return ResponseEntity.ok(ApiResponse.success("Mechanic updated successfully", dto));
    }

    // ── DELETE /api/mechanics/:id ─────────────────────────────────────────────

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMechanic(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {

        mechanicService.deleteMechanic(id, principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Mechanic deleted successfully", null));
    }
}
