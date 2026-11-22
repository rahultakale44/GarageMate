package com.garagemate.api.domain.vehicle;

import com.garagemate.api.common.ApiResponse;
import com.garagemate.api.domain.vehicle.dto.CreateVehicleRequest;
import com.garagemate.api.domain.vehicle.dto.UpdateVehicleRequest;
import com.garagemate.api.domain.vehicle.dto.VehicleDto;
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
 * Vehicle CRUD — mirrors Node.js vehicleRoutes.ts.
 *
 * All endpoints require authentication + USER role.
 * All operations are scoped to the authenticated user's own vehicles.
 *
 * GET    /api/vehicles        → list own vehicles
 * POST   /api/vehicles        → create vehicle
 * GET    /api/vehicles/:id    → get vehicle
 * PATCH  /api/vehicles/:id    → update vehicle
 * DELETE /api/vehicles/:id    → delete vehicle
 */
@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    // ── GET /api/vehicles ─────────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<List<VehicleDto>>> getVehicles(
            @AuthenticationPrincipal UserPrincipal principal) {

        List<VehicleDto> vehicles = vehicleService.listVehicles(principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success(vehicles));
    }

    // ── POST /api/vehicles ────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<VehicleDto>> createVehicle(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateVehicleRequest req) {

        VehicleDto dto = vehicleService.createVehicle(principal.getUserId(), req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Vehicle added successfully", dto));
    }

    // ── GET /api/vehicles/:id ─────────────────────────────────────────────────

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<VehicleDto>> getVehicle(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {

        VehicleDto dto = vehicleService.getVehicle(id, principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    // ── PATCH /api/vehicles/:id ───────────────────────────────────────────────

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<VehicleDto>> updateVehicle(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody UpdateVehicleRequest req) {

        VehicleDto dto = vehicleService.updateVehicle(id, principal.getUserId(), req);
        return ResponseEntity.ok(ApiResponse.success("Vehicle updated successfully", dto));
    }

    // ── DELETE /api/vehicles/:id ──────────────────────────────────────────────

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<Void>> deleteVehicle(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {

        vehicleService.deleteVehicle(id, principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Vehicle deleted successfully", null));
    }
}
