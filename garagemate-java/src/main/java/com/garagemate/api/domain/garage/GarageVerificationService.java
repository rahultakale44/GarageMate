package com.garagemate.api.domain.garage;

import com.garagemate.api.exception.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Verification workflow service — mirrors Node.js adminController.ts
 * garage verification operations (approveGarage, rejectGarage,
 * requestGarageChanges, suspendGarage, reactivateGarage).
 *
 * This service is called by the Admin module (not yet implemented).
 * It is placed here so the Garage entities and repositories are confirmed
 * ready for Admin use before that module is started.
 *
 * Valid status transitions (from original source):
 *
 *  PENDING           → UNDER_REVIEW       (admin picks it up)
 *  PENDING           → APPROVED           (direct approval)
 *  PENDING           → REJECTED           (direct rejection)
 *  PENDING           → CHANGES_REQUESTED  (admin requests info)
 *  UNDER_REVIEW      → APPROVED
 *  UNDER_REVIEW      → REJECTED
 *  UNDER_REVIEW      → CHANGES_REQUESTED
 *  CHANGES_REQUESTED → UNDER_REVIEW       (owner re-submits, admin picks up)
 *  CHANGES_REQUESTED → APPROVED
 *  CHANGES_REQUESTED → REJECTED
 *  APPROVED          → SUSPENDED          (admin suspends)
 *  SUSPENDED         → APPROVED           (admin reactivates)
 *
 * Owners CANNOT change verificationStatus through any owner endpoint.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GarageVerificationService {

    private final GarageRepository garageRepository;

    // ── PENDING → UNDER_REVIEW ────────────────────────────────────────────────

    @Transactional
    public Garage markUnderReview(Long garageId, String adminUserId) {
        Garage garage = findOrThrow(garageId);
        validateTransition(garage, VerificationStatus.UNDER_REVIEW,
                List.of(VerificationStatus.PENDING, VerificationStatus.CHANGES_REQUESTED));
        applyTransition(garage, VerificationStatus.UNDER_REVIEW,
                "Under review by admin", adminUserId);
        return garageRepository.save(garage);
    }

    // ── → APPROVED ────────────────────────────────────────────────────────────

    @Transactional
    public Garage approve(Long garageId, String adminUserId) {
        Garage garage = findOrThrow(garageId);
        validateTransition(garage, VerificationStatus.APPROVED,
                List.of(VerificationStatus.PENDING,
                        VerificationStatus.UNDER_REVIEW,
                        VerificationStatus.CHANGES_REQUESTED,
                        VerificationStatus.SUSPENDED));
        applyTransition(garage, VerificationStatus.APPROVED,
                "Verified and approved by admin", adminUserId);
        garage.setAvailable(true);  // reactivate on approval
        return garageRepository.save(garage);
    }

    // ── → REJECTED ────────────────────────────────────────────────────────────

    @Transactional
    public Garage reject(Long garageId, String reason, String adminUserId) {
        if (reason == null || reason.isBlank()) {
            throw ApiException.badRequest("Rejection reason is required");
        }
        Garage garage = findOrThrow(garageId);
        validateTransition(garage, VerificationStatus.REJECTED,
                List.of(VerificationStatus.PENDING,
                        VerificationStatus.UNDER_REVIEW,
                        VerificationStatus.CHANGES_REQUESTED));
        applyTransition(garage, VerificationStatus.REJECTED, reason, adminUserId);
        return garageRepository.save(garage);
    }

    // ── → CHANGES_REQUESTED ───────────────────────────────────────────────────

    @Transactional
    public Garage requestChanges(Long garageId, String notes, String adminUserId) {
        if (notes == null || notes.isBlank()) {
            throw ApiException.badRequest("Change notes are required");
        }
        Garage garage = findOrThrow(garageId);
        validateTransition(garage, VerificationStatus.CHANGES_REQUESTED,
                List.of(VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW));
        applyTransition(garage, VerificationStatus.CHANGES_REQUESTED, notes, adminUserId);
        return garageRepository.save(garage);
    }

    // ── → SUSPENDED ───────────────────────────────────────────────────────────

    @Transactional
    public Garage suspend(Long garageId, String reason, String adminUserId) {
        if (reason == null || reason.isBlank()) {
            throw ApiException.badRequest("Suspension reason is required");
        }
        Garage garage = findOrThrow(garageId);
        validateTransition(garage, VerificationStatus.SUSPENDED,
                List.of(VerificationStatus.APPROVED));
        applyTransition(garage, VerificationStatus.SUSPENDED, reason, adminUserId);
        garage.setAvailable(false);  // suspended garages go offline
        return garageRepository.save(garage);
    }

    // ── SUSPENDED → APPROVED (reactivate) ────────────────────────────────────

    @Transactional
    public Garage reactivate(Long garageId, String notes, String adminUserId) {
        Garage garage = findOrThrow(garageId);
        validateTransition(garage, VerificationStatus.APPROVED,
                List.of(VerificationStatus.SUSPENDED));
        String msg = (notes != null && !notes.isBlank()) ? notes : "Garage reactivated by admin";
        applyTransition(garage, VerificationStatus.APPROVED, msg, adminUserId);
        garage.setAvailable(true);
        return garageRepository.save(garage);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Garage findOrThrow(Long garageId) {
        return garageRepository.findById(garageId)
                .orElseThrow(() -> ApiException.notFound("Garage not found"));
    }

    private void validateTransition(Garage garage,
                                     VerificationStatus target,
                                     List<VerificationStatus> allowedFrom) {
        if (!allowedFrom.contains(garage.getVerificationStatus())) {
            throw ApiException.badRequest(
                    "Cannot transition from " + garage.getVerificationStatus()
                    + " to " + target);
        }
    }

    private void applyTransition(Garage garage, VerificationStatus newStatus,
                                   String notes, String changedBy) {
        garage.setVerificationStatus(newStatus);
        garage.setVerificationNotes(notes);

        GarageVerificationHistory entry = GarageVerificationHistory.builder()
                .garage(garage)
                .status(newStatus)
                .changedAt(LocalDateTime.now())
                .changedBy(changedBy)
                .notes(notes)
                .build();

        garage.getVerificationHistory().add(entry);

        log.info("Garage {} status → {} by {} notes='{}'",
                garage.getId(), newStatus, changedBy, notes);
    }
}
