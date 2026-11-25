package com.garagemate.api.domain.request;

import com.garagemate.api.common.ApiResponse;
import com.garagemate.api.domain.request.dto.*;
import com.garagemate.api.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Request endpoints — mirrors Node.js requestRoutes.ts exactly.
 *
 * NOTE on path ordering: Spring MVC evaluates by specificity, but
 * /my and /garage (literal segments) must come before /:id (variable).
 * This is handled naturally by @GetMapping("/my") vs @GetMapping("/{id}").
 *
 * USER routes:
 *   POST  /api/requests
 *   GET   /api/requests/my
 *   POST  /api/requests/{id}/cancel
 *   POST  /api/requests/{id}/verify-otp
 *
 * GARAGE_OWNER routes:
 *   GET   /api/requests/garage
 *   POST  /api/requests/{id}/accept
 *   POST  /api/requests/{id}/reject
 *   POST  /api/requests/{id}/assign-mechanic
 *   PATCH /api/requests/{id}/eta
 *   POST  /api/requests/{id}/generate-otp
 *   PATCH /api/requests/{id}/status    (also ADMIN)
 *
 * ANY (ownership-checked in service):
 *   GET   /api/requests/{id}
 */
@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
public class RequestController {

    private final RequestService requestService;

    // ── USER: create ──────────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<RequestDto>> createRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateRequestRequest req) {

        RequestDto dto = requestService.createRequest(principal.getUserId(), req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Request created successfully.", dto));
    }

    // ── USER: get own requests ────────────────────────────────────────────────

    @GetMapping("/my")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<List<RequestDto>>> getMyRequests(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String status) {

        List<RequestDto> dtos = requestService.getMyRequests(principal.getUserId(), status);
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    // ── USER: cancel ──────────────────────────────────────────────────────────

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<Void>> cancelRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestBody(required = false) CancelRequestBody body) {

        requestService.cancelRequest(id, principal.getUserId(), body);
        return ResponseEntity.ok(ApiResponse.success("Request cancelled successfully", null));
    }

    // ── USER: verify OTP ──────────────────────────────────────────────────────

    @PostMapping("/{id}/verify-otp")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<RequestDto>> verifyOtp(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody VerifyOtpRequest req) {

        RequestDto dto = requestService.verifyOtp(id, principal.getUserId(), req);
        return ResponseEntity.ok(ApiResponse.success("Service completion verified", dto));
    }

    // ── GARAGE_OWNER: get garage requests ─────────────────────────────────────

    @GetMapping("/garage")
    @PreAuthorize("hasRole('GARAGE_OWNER')")
    public ResponseEntity<ApiResponse<List<RequestDto>>> getGarageRequests(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String status) {

        List<RequestDto> dtos = requestService.getGarageRequests(
                principal.getUserId(), status);
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    // ── GARAGE_OWNER: accept ──────────────────────────────────────────────────

    @PostMapping("/{id}/accept")
    @PreAuthorize("hasRole('GARAGE_OWNER')")
    public ResponseEntity<ApiResponse<RequestDto>> acceptRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {

        RequestDto dto = requestService.acceptRequest(id, principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Request accepted successfully", dto));
    }

    // ── GARAGE_OWNER: reject ──────────────────────────────────────────────────

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('GARAGE_OWNER')")
    public ResponseEntity<ApiResponse<Void>> rejectRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {

        requestService.rejectRequest(id, principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Request rejected", null));
    }

    // ── GARAGE_OWNER: assign mechanic ─────────────────────────────────────────

    @PostMapping("/{id}/assign-mechanic")
    @PreAuthorize("hasRole('GARAGE_OWNER')")
    public ResponseEntity<ApiResponse<RequestDto>> assignMechanic(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody AssignMechanicRequest req) {

        RequestDto dto = requestService.assignMechanic(id, principal.getUserId(), req);
        return ResponseEntity.ok(ApiResponse.success("Mechanic assigned successfully", dto));
    }

    // ── GARAGE_OWNER: set ETA ─────────────────────────────────────────────────

    @PatchMapping("/{id}/eta")
    @PreAuthorize("hasRole('GARAGE_OWNER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateEta(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody UpdateEtaRequest req) {

        Map<String, Object> data = requestService.updateEta(id, principal.getUserId(), req);
        return ResponseEntity.ok(ApiResponse.success("ETA updated successfully", data));
    }

    // ── GARAGE_OWNER: generate OTP ────────────────────────────────────────────

    @PostMapping("/{id}/generate-otp")
    @PreAuthorize("hasRole('GARAGE_OWNER')")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateOtp(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {

        Map<String, String> data = requestService.generateOtp(id, principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success("OTP generated and sent to customer", data));
    }

    // ── GARAGE_OWNER + ADMIN: update status ───────────────────────────────────

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('GARAGE_OWNER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RequestDto>> updateStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody UpdateStatusRequest req) {

        RequestDto dto = requestService.updateStatus(
                id, principal.getUserId(), principal.getRole().name(), req);
        return ResponseEntity.ok(ApiResponse.success("Status updated successfully", dto));
    }

    // ── ANY authenticated: get single request (ownership checked in service) ──

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<RequestDto>> getRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {

        RequestDto dto = requestService.getRequest(
                id, principal.getUserId(), principal.getRole().name());
        return ResponseEntity.ok(ApiResponse.success(dto));
    }
}
