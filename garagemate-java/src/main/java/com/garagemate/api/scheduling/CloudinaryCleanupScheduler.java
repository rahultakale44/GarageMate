package com.garagemate.api.scheduling;

import com.garagemate.api.domain.garage.cleanup.CloudinaryCleanupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled jobs for Cloudinary outbox maintenance.
 *
 * retryPendingDeletions  — every 15 minutes, retry PENDING rows
 * purgeDoneRecords       — daily, delete DONE rows older than 30 days
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CloudinaryCleanupScheduler {

    private final CloudinaryCleanupService cleanupService;

    /** Retry pending Cloudinary deletions every 15 minutes. */
    @Scheduled(fixedDelayString = "${app.cloudinary.cleanup-interval-ms:900000}")
    public void retryPendingDeletions() {
        log.debug("CloudinaryCleanupScheduler: checking for pending deletions");
        cleanupService.retryPending();
    }

    /**
     * Purge DONE records older than 30 days — daily at 03:00.
     * Prevents unbounded growth of the pending_cloudinary_deletions table.
     */
    @Scheduled(cron = "0 0 3 * * *")
    public void purgeDoneRecords() {
        int purged = cleanupService.purgeDoneRecords(30);
        if (purged > 0) {
            log.info("CloudinaryCleanupScheduler: purged {} DONE records", purged);
        }
    }
}
