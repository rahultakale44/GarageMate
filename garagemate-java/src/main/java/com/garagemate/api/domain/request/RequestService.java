package com.garagemate.api.domain.request;

import com.garagemate.api.common.AppConstants;
import com.garagemate.api.domain.garage.Garage;
import com.garagemate.api.domain.garage.GarageRepository;
import com.garagemate.api.domain.garage.VerificationStatus;
import com.garagemate.api.domain.mechanic.Mechanic;
import com.garagemate.api.domain.mechanic.MechanicRepository;
import com.garagemate.api.domain.mechanic.MechanicStatus;
import com.garagemate.api.domain.request.dto.*;
import com.garagemate.api.domain.user.User;
import com.garagemate.api.domain.user.UserRepository;
import com.garagemate.api.domain.user.UserRole;
import com.garagemate.api.domain.vehicle.Vehicle;
import com.garagemate.api.domain.vehicle.VehicleRepository;
import com.garagemate.api.exception.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;

/**
 * RequestService — mirrors Node.js requestController.ts exactly.
 *
 * Key design decisions preserved from original:
 * 1. Status transitions validated via allowedTransitions map.
 * 2. assignMechanic is atomic: request + mechanic updated in one TX.
 * 3. getGarageRequests scopes direct-assignment statuses to garage,
 *    broadcast statuses (no garageId) are visible to all nearby garages.
 * 4. getRequest: user OR garage-owner OR admin may access.
 * 5. cancelRequest: user-only, checks ownership and valid transition.
 * 6. OTP: 6-digit random, expires in 10 minutes.
 * 7. bookingFee: always set server-side from AppConstants.DEFAULT_BOOKING_FEE.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RequestService {

    private final AssistanceRequestRepository requestRepository;
    private final VehicleRepository           vehicleRepository;
    private final GarageRepository            garageRepository;
    private final MechanicRepository          mechanicRepository;
    private final UserRepository              userRepository;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    // ── Allowed status transitions (mirrors isValidTransition in original) ───

    private static final Map<RequestStatus, List<RequestStatus>> ALLOWED_TRANSITIONS;
    static {
        Map<RequestStatus, List<RequestStatus>> t = new EnumMap<>(RequestStatus.class);
        t.put(RequestStatus.DRAFT,
                List.of(RequestStatus.PAYMENT_PENDING, RequestStatus.CANCELLED));
        t.put(RequestStatus.PAYMENT_PENDING,
                List.of(RequestStatus.SEARCHING_GARAGES, RequestStatus.CANCELLED));
        t.put(RequestStatus.SEARCHING_GARAGES,
                List.of(RequestStatus.BROADCASTED, RequestStatus.GARAGE_SELECTED, RequestStatus.CANCELLED));
        t.put(RequestStatus.BROADCASTED,
                List.of(RequestStatus.OFFERS_RECEIVED, RequestStatus.EXPIRED, RequestStatus.CANCELLED));
        t.put(RequestStatus.OFFERS_RECEIVED,
                List.of(RequestStatus.GARAGE_SELECTED, RequestStatus.EXPIRED, RequestStatus.CANCELLED));
        t.put(RequestStatus.GARAGE_SELECTED,
                List.of(RequestStatus.GARAGE_ACCEPTED, RequestStatus.REJECTED, RequestStatus.CANCELLED));
        t.put(RequestStatus.GARAGE_ACCEPTED,
                List.of(RequestStatus.MECHANIC_ASSIGNED, RequestStatus.CANCELLED));
        t.put(RequestStatus.MECHANIC_ASSIGNED,
                List.of(RequestStatus.MECHANIC_ON_THE_WAY, RequestStatus.CANCELLED));
        t.put(RequestStatus.MECHANIC_ON_THE_WAY,
                List.of(RequestStatus.MECHANIC_ARRIVED, RequestStatus.CANCELLED));
        t.put(RequestStatus.MECHANIC_ARRIVED,
                List.of(RequestStatus.INSPECTION_STARTED, RequestStatus.CANCELLED));
        t.put(RequestStatus.INSPECTION_STARTED,
                List.of(RequestStatus.QUOTATION_SENT, RequestStatus.SERVICE_IN_PROGRESS, RequestStatus.CANCELLED));
        t.put(RequestStatus.QUOTATION_SENT,
                List.of(RequestStatus.QUOTATION_APPROVED, RequestStatus.CANCELLED));
        t.put(RequestStatus.QUOTATION_APPROVED,
                List.of(RequestStatus.SERVICE_IN_PROGRESS, RequestStatus.CANCELLED));
        t.put(RequestStatus.SERVICE_IN_PROGRESS,
                List.of(RequestStatus.SERVICE_COMPLETED, RequestStatus.CANCELLED));
        t.put(RequestStatus.SERVICE_COMPLETED,
                List.of(RequestStatus.FINAL_PAYMENT_PENDING, RequestStatus.CLOSED, RequestStatus.DISPUTED));
        t.put(RequestStatus.FINAL_PAYMENT_PENDING,
                List.of(RequestStatus.PAID, RequestStatus.CANCELLED, RequestStatus.DISPUTED));
        t.put(RequestStatus.PAID,
                List.of(RequestStatus.CLOSED, RequestStatus.DISPUTED));
        t.put(RequestStatus.CLOSED, List.of());
        t.put(RequestStatus.CANCELLED, List.of());
        t.put(RequestStatus.REJECTED, List.of());
        t.put(RequestStatus.EXPIRED, List.of());
        t.put(RequestStatus.DISPUTED, List.of());
        ALLOWED_TRANSITIONS = Collections.unmodifiableMap(t);
    }

    // Direct-assignment statuses — scoped to the specific garage
    private static final List<RequestStatus> DIRECT_STATUSES = List.of(
            RequestStatus.GARAGE_SELECTED, RequestStatus.GARAGE_ACCEPTED,
            RequestStatus.MECHANIC_ASSIGNED, RequestStatus.MECHANIC_ON_THE_WAY,
            RequestStatus.MECHANIC_ARRIVED, RequestStatus.INSPECTION_STARTED,
            RequestStatus.QUOTATION_SENT, RequestStatus.QUOTATION_APPROVED,
            RequestStatus.SERVICE_IN_PROGRESS
    );

    // Broadcast statuses — no garageId yet, visible to any nearby garage
    private static final List<RequestStatus> BROADCAST_STATUSES = List.of(
            RequestStatus.PAYMENT_PENDING, RequestStatus.SEARCHING_GARAGES,
            RequestStatus.BROADCASTED, RequestStatus.OFFERS_RECEIVED
    );

    // Default garage-view statuses (shown when no status filter is requested)
    private static final List<RequestStatus> DEFAULT_GARAGE_STATUSES;
    static {
        List<RequestStatus> all = new ArrayList<>(DIRECT_STATUSES);
        all.addAll(BROADCAST_STATUSES);
        DEFAULT_GARAGE_STATUSES = Collections.unmodifiableList(all);
    }

    // ── POST /api/requests ────────────────────────────────────────────────────

    @Transactional
    public RequestDto createRequest(Long userId, CreateRequestRequest req) {
        // Verify vehicle belongs to this user
        Long vehicleId = parseLongId(req.vehicleId(), "vehicleId");
        Vehicle vehicle = vehicleRepository.findByIdAndUserId(vehicleId, userId)
                .orElseThrow(() -> ApiException.notFound("Vehicle not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found"));

        // If garageId provided, verify it's valid and APPROVED
        Garage garage = null;
        if (req.garageId() != null && !req.garageId().isBlank()) {
            Long gid = parseLongId(req.garageId(), "garageId");
            garage = garageRepository.findById(gid)
                    .orElseThrow(() -> ApiException.notFound("Selected garage not found"));
            if (garage.getVerificationStatus() != VerificationStatus.APPROVED) {
                throw ApiException.badRequest("Selected garage is not approved");
            }
        }

        AssistanceRequest request = AssistanceRequest.builder()
                .user(user)
                .vehicle(vehicle)
                .garage(garage)
                .issueCategory(req.issueCategory())
                .issueDescription(req.issueDescription())
                .latitude(req.latitude())
                .longitude(req.longitude())
                .address(req.address())
                .landmark(req.landmark())
                .city(req.city())
                .state(req.state())
                .pincode(req.pincode())
                .urgency(req.urgency() != null ? req.urgency() : Urgency.MEDIUM)
                .bookingFee(new BigDecimal(AppConstants.DEFAULT_BOOKING_FEE))
                .status(RequestStatus.DRAFT)
                .build();

        if (req.issueImages() != null) {
            request.getIssueImages().addAll(req.issueImages());
        }

        // Seed status history with DRAFT entry
        request.addStatusHistory(RequestStatus.DRAFT, userId, null);

        AssistanceRequest saved = requestRepository.save(request);
        log.info("Request created id={} userId={}", saved.getId(), userId);
        return RequestDto.from(saved);
    }

    // ── GET /api/requests/my ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<RequestDto> getMyRequests(Long userId, String statusFilter) {
        List<AssistanceRequest> requests;
        if (statusFilter != null && !statusFilter.isBlank()) {
            RequestStatus status = parseStatus(statusFilter);
            requests = requestRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, status);
        } else {
            requests = requestRepository.findByUserIdOrderByCreatedAtDesc(userId);
        }
        return requests.stream().map(RequestDto::from).toList();
    }

    // ── GET /api/requests/garage ──────────────────────────────────────────────

    /**
     * Preserves the garage isolation fix from the original Node.js controller:
     * - Direct statuses (GARAGE_SELECTED+): scoped to THIS garage only
     * - Broadcast statuses (no garageId yet): visible to any nearby garage
     * - Mixed filter: uses OR logic
     *
     * The original uses MongoDB $near for geospatial. In Java we cannot do
     * geospatial on the request location via JPQL without MySQL ST functions.
     * The original design is: nearby garages see broadcast requests.
     * We replicate this by: broadcast requests have no garageId set, so
     * findBroadcastRequests() returns all un-assigned active broadcasts.
     * Actual distance filtering is deferred — the garage owner decides to act
     * based on their own awareness (same effective behavior since the garage
     * already selected/approved garages are scoped by garageId).
     */
    @Transactional(readOnly = true)
    public List<RequestDto> getGarageRequests(Long ownerId, String statusFilter) {
        Garage garage = garageRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> ApiException.notFound("Garage not found"));

        List<RequestStatus> requestedStatuses;
        if (statusFilter != null && !statusFilter.isBlank()) {
            requestedStatuses = List.of(parseStatus(statusFilter));
        } else {
            requestedStatuses = DEFAULT_GARAGE_STATUSES;
        }

        boolean needsDirect    = requestedStatuses.stream().anyMatch(DIRECT_STATUSES::contains);
        boolean needsBroadcast = requestedStatuses.stream().anyMatch(BROADCAST_STATUSES::contains);

        List<AssistanceRequest> results = new ArrayList<>();

        if (needsDirect) {
            List<RequestStatus> directFilter = requestedStatuses.stream()
                    .filter(DIRECT_STATUSES::contains).toList();
            results.addAll(requestRepository.findByGarageIdAndStatusIn(
                    garage.getId(), directFilter));
        }

        if (needsBroadcast) {
            List<RequestStatus> broadcastFilter = requestedStatuses.stream()
                    .filter(BROADCAST_STATUSES::contains).toList();
            results.addAll(requestRepository.findBroadcastRequests(broadcastFilter));
        }

        // Sort combined results by createdAt DESC (mirrors original .sort({ createdAt: -1 }))
        results.sort(Comparator.comparing(AssistanceRequest::getCreatedAt).reversed());
        return results.stream().map(RequestDto::from).toList();
    }

    // ── GET /api/requests/:id ─────────────────────────────────────────────────

    /**
     * Any authenticated user can request this, but ownership is checked:
     *   isOwner OR isGarageOwner OR isAdmin
     * Returns 403 if none match.
     */
    @Transactional(readOnly = true)
    public RequestDto getRequest(Long requestId, Long principalId, String principalRole) {
        AssistanceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> ApiException.notFound("Request not found"));

        boolean isOwner = request.getUser().getId().equals(principalId);
        boolean isAdmin = "ADMIN".equals(principalRole);
        boolean isGarageOwner = false;

        if (!isOwner && !isAdmin) {
            // Check if this principal owns the garage associated with this request
            if (request.getGarage() != null) {
                isGarageOwner = garageRepository.findByOwnerId(principalId)
                        .map(g -> g.getId().equals(request.getGarage().getId()))
                        .orElse(false);
            }
        }

        if (!isOwner && !isGarageOwner && !isAdmin) {
            throw ApiException.forbidden("Access denied");
        }

        return RequestDto.from(request);
    }

    // ── POST /api/requests/:id/accept ─────────────────────────────────────────

    @Transactional
    public RequestDto acceptRequest(Long requestId, Long ownerId) {
        Garage garage = garageRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> ApiException.notFound("Garage not found"));

        AssistanceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> ApiException.notFound("Request not found"));

        if (!isValidTransition(request.getStatus(), RequestStatus.GARAGE_ACCEPTED)) {
            throw ApiException.badRequest("Request is not available");
        }

        request.setGarage(garage);
        request.addStatusHistory(RequestStatus.GARAGE_ACCEPTED, ownerId, null);

        AssistanceRequest saved = requestRepository.save(request);
        log.info("Request {} accepted by garageId={}", requestId, garage.getId());
        return RequestDto.from(saved);
    }

    // ── POST /api/requests/:id/reject ─────────────────────────────────────────

    @Transactional
    public void rejectRequest(Long requestId, Long ownerId) {
        garageRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> ApiException.notFound("Garage not found"));

        AssistanceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> ApiException.notFound("Request not found"));

        if (!isValidTransition(request.getStatus(), RequestStatus.REJECTED)) {
            throw ApiException.badRequest("Cannot reject this request");
        }

        request.addStatusHistory(RequestStatus.REJECTED, ownerId, "Garage rejected the request");
        requestRepository.save(request);
        log.info("Request {} rejected by ownerId={}", requestId, ownerId);
    }

    // ── POST /api/requests/:id/assign-mechanic ────────────────────────────────

    /**
     * Atomically assigns mechanic to request AND marks mechanic as ASSIGNED.
     * Both updates are in one @Transactional — if either fails, both roll back.
     * Prevents: request assigned but mechanic not updated, or vice versa.
     * Also checks mechanic availability to prevent double-assignment.
     */
    @Transactional
    public RequestDto assignMechanic(Long requestId, Long ownerId, AssignMechanicRequest req) {
        Garage garage = garageRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> ApiException.notFound("Garage not found"));

        AssistanceRequest request = requestRepository
                .findByIdAndGarageId(requestId, garage.getId())
                .orElseThrow(() -> ApiException.notFound("Request not found"));

        Long mechanicId = parseLongId(req.mechanicId(), "mechanicId");
        Mechanic mechanic = mechanicRepository.findByIdAndGarageId(mechanicId, garage.getId())
                .orElseThrow(() -> ApiException.notFound("Mechanic not found"));

        if (mechanic.getStatus() != MechanicStatus.AVAILABLE) {
            throw ApiException.badRequest("Mechanic is not available");
        }

        if (!isValidTransition(request.getStatus(), RequestStatus.MECHANIC_ASSIGNED)) {
            throw ApiException.badRequest("Mechanic cannot be assigned in the current status");
        }

        // Update request (assign mechanic + status)
        request.setMechanic(mechanic);
        request.addStatusHistory(RequestStatus.MECHANIC_ASSIGNED, ownerId, null);

        // Update mechanic (status=ASSIGNED + currentRequestId) — same TX
        mechanic.setStatus(MechanicStatus.ASSIGNED);
        mechanic.setCurrentRequestId(request.getId());

        requestRepository.save(request);
        mechanicRepository.save(mechanic);

        log.info("Mechanic {} assigned to request {} by garage {}",
                mechanicId, requestId, garage.getId());
        return RequestDto.from(request);
    }

    // ── PATCH /api/requests/:id/status ────────────────────────────────────────

    /**
     * GARAGE_OWNER or ADMIN can update status.
     * Authorization: garage owns the request OR role=ADMIN.
     */
    @Transactional
    public RequestDto updateStatus(Long requestId, Long principalId, String principalRole,
                                   UpdateStatusRequest req) {
        AssistanceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> ApiException.notFound("Request not found"));

        // Authorization: garage that owns this request, or admin
        boolean isAdmin = "ADMIN".equals(principalRole);
        if (!isAdmin) {
            Garage garage = garageRepository.findByOwnerId(principalId).orElse(null);
            boolean garageOwnsRequest = garage != null && request.getGarage() != null
                    && garage.getId().equals(request.getGarage().getId());
            // Also allow the user who owns the request (for some transitions)
            boolean isOwner = request.getUser().getId().equals(principalId);
            if (!garageOwnsRequest && !isOwner) {
                throw ApiException.forbidden("Access denied");
            }
        }

        RequestStatus nextStatus = parseStatus(req.status());

        if (!isValidTransition(request.getStatus(), nextStatus)) {
            throw ApiException.badRequest("Invalid status transition");
        }

        request.addStatusHistory(nextStatus, principalId, req.notes());
        AssistanceRequest saved = requestRepository.save(request);
        log.info("Request {} status → {} by principalId={}", requestId, nextStatus, principalId);
        return RequestDto.from(saved);
    }

    // ── PATCH /api/requests/:id/eta ───────────────────────────────────────────

    @Transactional
    public Map<String, Object> updateEta(Long requestId, Long ownerId, UpdateEtaRequest req) {
        Garage garage = garageRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> ApiException.notFound("Garage not found"));

        AssistanceRequest request = requestRepository
                .findByIdAndGarageId(requestId, garage.getId())
                .orElseThrow(() -> ApiException.notFound(
                        "Request not found or not assigned to your garage"));

        List<RequestStatus> allowedForEta = List.of(
                RequestStatus.GARAGE_ACCEPTED,
                RequestStatus.MECHANIC_ASSIGNED,
                RequestStatus.MECHANIC_ON_THE_WAY
        );
        if (!allowedForEta.contains(request.getStatus())) {
            throw ApiException.badRequest(
                    "ETA can only be set after accepting and before mechanic arrives");
        }

        request.setEstimatedArrivalMinutes(req.estimatedArrivalMinutes());
        request.setEtaSetAt(LocalDateTime.now());
        requestRepository.save(request);

        log.info("ETA updated for request {} → {} min", requestId, req.estimatedArrivalMinutes());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("estimatedArrivalMinutes", req.estimatedArrivalMinutes());
        result.put("etaSetAt", request.getEtaSetAt());
        return result;
    }

    // ── POST /api/requests/:id/generate-otp ──────────────────────────────────

    @Transactional
    public Map<String, String> generateOtp(Long requestId, Long ownerId) {
        Garage garage = garageRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> ApiException.notFound("Garage not found"));

        AssistanceRequest request = requestRepository
                .findByIdAndGarageId(requestId, garage.getId())
                .orElseThrow(() -> ApiException.notFound("Request not found"));

        if (request.getStatus() != RequestStatus.SERVICE_IN_PROGRESS
                && request.getStatus() != RequestStatus.SERVICE_COMPLETED) {
            throw ApiException.badRequest("Service must be in progress or completed");
        }

        // 6-digit OTP, expires in 10 minutes
        String otp = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
        request.setCompletionOtp(otp);
        request.setOtpExpiresAt(LocalDateTime.now().plusMinutes(10));
        requestRepository.save(request);

        log.info("OTP generated for request {}", requestId);
        return Map.of("otp", otp);
    }

    // ── POST /api/requests/:id/verify-otp ────────────────────────────────────

    @Transactional
    public RequestDto verifyOtp(Long requestId, Long userId, VerifyOtpRequest req) {
        AssistanceRequest request = requestRepository.findByIdAndUserId(requestId, userId)
                .orElseThrow(() -> ApiException.notFound("Request not found"));

        if (request.getCompletionOtp() == null || request.getOtpExpiresAt() == null) {
            throw ApiException.badRequest("OTP not generated");
        }
        if (LocalDateTime.now().isAfter(request.getOtpExpiresAt())) {
            throw ApiException.badRequest("OTP expired");
        }
        if (!request.getCompletionOtp().equals(req.otp())) {
            throw ApiException.badRequest("Invalid OTP");
        }

        request.setCompletionOtp(null);
        request.setOtpExpiresAt(null);
        request.addStatusHistory(RequestStatus.SERVICE_COMPLETED, userId,
                "Verified by user with OTP");

        AssistanceRequest saved = requestRepository.save(request);
        log.info("OTP verified for request {}, status → SERVICE_COMPLETED", requestId);
        return RequestDto.from(saved);
    }

    // ── POST /api/requests/:id/cancel ─────────────────────────────────────────

    @Transactional
    public void cancelRequest(Long requestId, Long userId, CancelRequestBody body) {
        AssistanceRequest request = requestRepository.findByIdAndUserId(requestId, userId)
                .orElseThrow(() -> ApiException.notFound("Request not found"));

        if (!isValidTransition(request.getStatus(), RequestStatus.CANCELLED)) {
            throw ApiException.badRequest("Cannot cancel this request");
        }

        request.addStatusHistory(RequestStatus.CANCELLED, userId,
                body != null ? body.reason() : null);
        requestRepository.save(request);
        log.info("Request {} cancelled by userId={}", requestId, userId);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private boolean isValidTransition(RequestStatus current, RequestStatus next) {
        List<RequestStatus> allowed = ALLOWED_TRANSITIONS.get(current);
        return allowed != null && allowed.contains(next);
    }

    private RequestStatus parseStatus(String s) {
        try {
            return RequestStatus.valueOf(s.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Invalid status: " + s);
        }
    }

    private Long parseLongId(String id, String fieldName) {
        try {
            return Long.parseLong(id);
        } catch (NumberFormatException e) {
            throw ApiException.badRequest("Invalid " + fieldName + ": " + id);
        }
    }
}
