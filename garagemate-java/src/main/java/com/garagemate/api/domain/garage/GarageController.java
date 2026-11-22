package com.garagemate.api.domain.garage;

import com.garagemate.api.common.AppConstants;
import com.garagemate.api.common.ApiResponse;
import com.garagemate.api.domain.garage.dto.*;
import com.garagemate.api.domain.vehicle.VehicleType;
import com.garagemate.api.exception.ApiException;
import com.garagemate.api.integration.nominatim.GeocodeResult;
import com.garagemate.api.integration.nominatim.NominatimService;
import com.garagemate.api.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Garage endpoints — mirrors Node.js garageRoutes.ts exactly.
 *
 * PUBLIC (no auth):
 *   GET /api/garages/nearby
 *   GET /api/garages/reverse-geocode
 *   GET /api/garages/geocode
 *   GET /api/garages
 *   GET /api/garages/:id
 *
 * OWNER (GARAGE_OWNER role):
 *   GET   /api/garages/my/profile
 *   PATCH /api/garages/my/profile
 *   PATCH /api/garages/my/availability
 *   POST  /api/garages/my/images
 *
 * NOTE: Spring MVC evaluates path specificity top-down.
 * /my/profile and /nearby must be declared BEFORE /:id to avoid being consumed as IDs.
 */
@RestController
@RequestMapping("/api/garages")
@RequiredArgsConstructor
public class GarageController {

    private final GarageService garageService;
    private final NominatimService nominatimService;

    // ── Public: nearby search ─────────────────────────────────────────────────

    /**
     * GET /api/garages/nearby
     * Params: latitude, longitude, radius (km), serviceType, vehicleType,
     *         openNow, availableNow, minimumRating
     */
    @GetMapping("/nearby")
    public ResponseEntity<ApiResponse<List<GarageDto>>> searchNearby(
            @RequestParam double latitude,
            @RequestParam double longitude,
            @RequestParam(defaultValue = "10") double radius,
            @RequestParam(required = false) String serviceType,
            @RequestParam(required = false) String services,
            @RequestParam(required = false) VehicleType vehicleType,
            @RequestParam(required = false) Double minimumRating,
            @RequestParam(required = false) Double minRating,
            @RequestParam(defaultValue = "false") boolean openNow,
            @RequestParam(defaultValue = "false") boolean availableNow,
            @RequestParam(defaultValue = "false") boolean is24x7) {

        if (Double.isNaN(latitude) || Double.isNaN(longitude)) {
            throw ApiException.badRequest("latitude and longitude are required");
        }
        if (latitude < -90 || latitude > 90) {
            throw ApiException.badRequest("latitude must be between -90 and 90");
        }
        if (longitude < -180 || longitude > 180) {
            throw ApiException.badRequest("longitude must be between -180 and 180");
        }

        double effectiveRadius = Math.min(
                Math.max(radius, 1),
                AppConstants.MAX_SEARCH_RADIUS_KM);

        double effectiveMinRating = minimumRating != null ? minimumRating
                : (minRating != null ? minRating : 0.0);

        NearbySearchParams params = NearbySearchParams.builder()
                .latitude(latitude)
                .longitude(longitude)
                .radiusKm(effectiveRadius)
                .serviceType(serviceType)
                .services(services)
                .vehicleType(vehicleType)
                .minRating(effectiveMinRating > 0 ? effectiveMinRating : null)
                .openNow(openNow)
                .availableNow(availableNow)
                .is24x7(is24x7)
                .build();

        List<GarageDto> result = garageService.searchNearby(params);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ── Public: reverse geocode ───────────────────────────────────────────────

    /**
     * GET /api/garages/reverse-geocode?latitude=&longitude=
     */
    @GetMapping("/reverse-geocode")
    public ResponseEntity<ApiResponse<GeocodeResult>> reverseGeocode(
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude) {

        if (latitude == null || longitude == null) {
            throw ApiException.badRequest("latitude and longitude are required");
        }

        GeocodeResult result = nominatimService.reverseGeocode(latitude, longitude);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ── Public: forward geocode ───────────────────────────────────────────────

    /**
     * GET /api/garages/geocode?query=
     */
    @GetMapping("/geocode")
    public ResponseEntity<ApiResponse<List<GeocodeResult>>> geocode(
            @RequestParam(required = false) String query) {

        if (query == null || query.isBlank()) {
            throw ApiException.badRequest("query is required");
        }

        List<GeocodeResult> results = nominatimService.searchGeocode(query);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    // ── Owner: get own garage (BEFORE /:id) ───────────────────────────────────

    /**
     * GET /api/garages/my/profile
     */
    @GetMapping("/my/profile")
    @PreAuthorize("hasRole('GARAGE_OWNER')")
    public ResponseEntity<ApiResponse<GarageDto>> getMyGarage(
            @AuthenticationPrincipal UserPrincipal principal) {

        GarageDto dto = garageService.getMyGarage(principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    // ── Owner: update garage ──────────────────────────────────────────────────

    /**
     * PATCH /api/garages/my/profile
     */
    @PatchMapping("/my/profile")
    @PreAuthorize("hasRole('GARAGE_OWNER')")
    public ResponseEntity<ApiResponse<GarageDto>> updateGarage(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateGarageRequest req) {

        GarageDto dto = garageService.updateGarage(principal.getUserId(), req);
        return ResponseEntity.ok(ApiResponse.success("Garage updated successfully", dto));
    }

    // ── Owner: toggle availability ────────────────────────────────────────────

    /**
     * PATCH /api/garages/my/availability
     * Body: { isAvailable: boolean }
     */
    @PatchMapping("/my/availability")
    @PreAuthorize("hasRole('GARAGE_OWNER')")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> toggleAvailability(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ToggleAvailabilityRequest req) {

        Map<String, Boolean> result = garageService.toggleAvailability(
                principal.getUserId(), req.isAvailable());

        String msg = req.isAvailable()
                ? "Garage is now available"
                : "Garage is now unavailable";
        return ResponseEntity.ok(ApiResponse.success(msg, result));
    }

    // ── Owner: add images ─────────────────────────────────────────────────────

    /**
     * POST /api/garages/my/images
     * Body: { images: [{ url, publicId, type }] }
     * Accepts pre-uploaded Cloudinary URLs — matches Node.js behavior where
     * the frontend uploads to Cloudinary and posts resulting URLs here.
     */
    @PostMapping("/my/images")
    @PreAuthorize("hasRole('GARAGE_OWNER')")
    public ResponseEntity<ApiResponse<List<GarageImageDto>>> addImages(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AddImagesRequest req) {

        List<GarageImageDto> images = garageService.addImages(
                principal.getUserId(), req);
        return ResponseEntity.ok(ApiResponse.success("Images added successfully", images));
    }

    // ── Public: list garages ──────────────────────────────────────────────────

    /**
     * GET /api/garages?city=&search=&minRating=&page=&limit=
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> listGarages(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Double minRating,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {

        Map<String, Object> result = garageService.listGarages(
                city, search, minRating, page, Math.min(limit, 100));
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ── Public: single garage (AFTER /my/** and /nearby etc.) ────────────────

    /**
     * GET /api/garages/:id
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<GarageDto>> getGarage(@PathVariable Long id) {
        GarageDto dto = garageService.getGarage(id);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }
}
