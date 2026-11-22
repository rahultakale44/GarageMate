package com.garagemate.api.scheduling;

import com.garagemate.api.domain.garage.cleanup.CloudinaryCleanupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled job that retries pending Cloudinary asset deletions.
 * Runs every 15 minutes. Processes all rows with status=PENDING.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CloudinaryCleanupScheduler {

    private final CloudinaryCleanupService cleanupService;

    @Scheduled(fixedDelayString = "${app.cloudinary.cleanup-interval-ms:900000}")
    public void retryPendingDeletions() {
        log.debug("CloudinaryCleanupScheduler: checking for pending deletions");
        cleanupService.retryPending();
    }
}
