package com.garagemate.api.domain.garage.cleanup;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Transactional outbox record for Cloudinary asset deletions.
 *
 * Problem being solved:
 *   Cloudinary deletion is external and cannot participate in a DB transaction.
 *   If we remove the DB record first and Cloudinary deletion fails, the asset
 *   is orphaned with no reference left for retry. If we delete Cloudinary first
 *   and DB save fails, we have a DB record pointing to a deleted asset.
 *
 * Strategy (safe sequencing + durable retry):
 *   1. Within the DB transaction: remove the GarageImage record AND insert
 *      a PendingCloudinaryDeletion row. If the transaction rolls back, both
 *      changes revert together — the image record is restored, no orphan created.
 *   2. After the transaction commits: attempt Cloudinary deletion.
 *      a. Success → delete the PendingCloudinaryDeletion row.
 *      b. Failure → PendingCloudinaryDeletion row remains for retry.
 *         The public ID is preserved; the asset is not referenced in the DB
 *         anymore, but it can be cleaned up on retry.
 *
 * A @Scheduled cleanup job can periodically retry all PENDING rows.
 * This is the simplest reliable design that avoids both orphaned assets
 * and lost public IDs.
 */
@Entity
@Table(
    name = "pending_cloudinary_deletions",
    indexes = @Index(name = "idx_pcd_status_created", columnList = "status, created_at")
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PendingCloudinaryDeletion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, length = 500)
    private String publicId;

    /** The garage this asset belonged to — for audit/logging only. */
    @Column(name = "garage_id")
    private Long garageId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private DeletionStatus status = DeletionStatus.PENDING;

    @Column(name = "attempts", nullable = false)
    @Builder.Default
    private int attempts = 0;

    @Column(name = "last_error", length = 1000)
    private String lastError;

    @Column(name = "last_attempted_at")
    private LocalDateTime lastAttemptedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum DeletionStatus {
        PENDING,   // Not yet attempted or last attempt failed
        DONE       // Cloudinary deletion confirmed
    }

    public void recordAttempt(String error) {
        this.attempts++;
        this.lastAttemptedAt = LocalDateTime.now();
        this.lastError = error;
    }

    public void markDone() {
        this.status = DeletionStatus.DONE;
        this.lastError = null;
    }
}
