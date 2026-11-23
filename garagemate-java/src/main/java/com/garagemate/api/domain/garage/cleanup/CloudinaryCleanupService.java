package com.garagemate.api.domain.garage.cleanup;

import com.garagemate.api.integration.cloudinary.CloudinaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Owns all post-commit Cloudinary deletion attempts and retries.
 *
 * Usage flow in GarageService.deleteImage():
 *
 *   Step A (within the caller's @Transactional):
 *     garageImage removed from Garage.images
 *     PendingCloudinaryDeletion row inserted
 *     → If transaction rolls back: both revert; no orphan, no lost publicId
 *
 *   Step B (after DB commit, called by GarageService):
 *     attemptDeletion(publicId) → try Cloudinary, mark DONE or leave PENDING
 *
 *   Step C (@Scheduled retry via GarageCleanupScheduler):
 *     retryPending() → picks up all PENDING rows, retries each
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryCleanupService {

    private final CloudinaryService cloudinaryService;
    private final PendingCloudinaryDeletionRepository cleanupRepository;

    /**
     * Creates the outbox record within the caller's transaction.
     * Must be called BEFORE the caller's transaction commits.
     * Uses MANDATORY propagation to enforce this.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void registerPendingDeletion(String publicId, Long garageId) {
        // Idempotent: skip if already registered (e.g. double-click)
        if (cleanupRepository.existsByPublicId(publicId)) {
            log.debug("PendingCloudinaryDeletion already registered for publicId={}", publicId);
            return;
        }
        PendingCloudinaryDeletion record = PendingCloudinaryDeletion.builder()
                .publicId(publicId)
                .garageId(garageId)
                .build();
        cleanupRepository.save(record);
        log.debug("Registered pending Cloudinary deletion: publicId={} garageId={}",
                publicId, garageId);
    }

    /**
     * Attempts Cloudinary deletion after the caller's DB transaction has committed.
     * Run asynchronously so the HTTP response is not held waiting on Cloudinary.
     *
     * On success: marks the outbox row DONE.
     * On failure: leaves the row PENDING for the retry scheduler.
     * Either way: never throws — this is best-effort post-commit work.
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void attemptDeletion(String publicId) {
        PendingCloudinaryDeletion record = cleanupRepository.findByPublicId(publicId)
                .orElse(null);
        if (record == null) {
            log.warn("No PendingCloudinaryDeletion found for publicId={} — skipping", publicId);
            return;
        }
        if (record.getStatus() == PendingCloudinaryDeletion.DeletionStatus.DONE) {
            log.debug("Cloudinary deletion already done for publicId={}", publicId);
            return;
        }

        doDelete(record);
    }

    /**
     * Retries all PENDING deletions — called by @Scheduled job.
     * Each record is processed in its own REQUIRES_NEW transaction so:
     *   a) A failure on one record does not roll back others.
     *   b) The status update (PENDING→DONE or attempt increment) is committed
     *      immediately, preventing duplicate processing if the scheduler fires
     *      again before the batch completes.
     */
    @Transactional
    public void retryPending() {
        List<PendingCloudinaryDeletion> pending =
                cleanupRepository.findByStatus(PendingCloudinaryDeletion.DeletionStatus.PENDING);
        if (pending.isEmpty()) return;

        log.info("Retrying {} pending Cloudinary deletions", pending.size());
        for (PendingCloudinaryDeletion record : pending) {
            retrySingle(record.getId());
        }
    }

    /**
     * Processes one outbox record in its own transaction.
     * REQUIRES_NEW ensures the status update is committed even if the caller's
     * transaction (retryPending) is later rolled back or is itself in a different state.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void retrySingle(Long recordId) {
        PendingCloudinaryDeletion record = cleanupRepository.findById(recordId).orElse(null);
        if (record == null || record.getStatus() == PendingCloudinaryDeletion.DeletionStatus.DONE) {
            return; // already processed by a concurrent execution
        }
        doDelete(record);
    }

    /**
     * Deletes DONE records older than the given number of days.
     * Called by @Scheduled job to prevent unbounded table growth.
     */
    @Transactional
    public int purgeDoneRecords(int olderThanDays) {
        java.time.LocalDateTime cutoff = java.time.LocalDateTime.now()
                .minusDays(olderThanDays);
        List<PendingCloudinaryDeletion> stale =
                cleanupRepository.findByStatusAndCreatedAtBefore(
                        PendingCloudinaryDeletion.DeletionStatus.DONE, cutoff);
        if (stale.isEmpty()) return 0;
        cleanupRepository.deleteAll(stale);
        log.info("Purged {} DONE Cloudinary deletion records older than {} days",
                stale.size(), olderThanDays);
        return stale.size();
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    private void doDelete(PendingCloudinaryDeletion record) {
        try {
            cloudinaryService.delete(record.getPublicId());
            record.markDone();
            cleanupRepository.save(record);
            log.info("Cloudinary deletion succeeded: publicId={}", record.getPublicId());
        } catch (Exception e) {
            record.recordAttempt(e.getMessage());
            cleanupRepository.save(record);
            log.warn("Cloudinary deletion failed (attempt {}): publicId={} error={}",
                    record.getAttempts(), record.getPublicId(), e.getMessage());
            // Does NOT rethrow — the outbox record is preserved for retry
        }
    }
}
