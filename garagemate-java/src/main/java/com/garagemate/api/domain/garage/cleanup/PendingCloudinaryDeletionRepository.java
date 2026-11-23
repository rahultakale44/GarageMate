package com.garagemate.api.domain.garage.cleanup;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PendingCloudinaryDeletionRepository
        extends JpaRepository<PendingCloudinaryDeletion, Long> {

    Optional<PendingCloudinaryDeletion> findByPublicId(String publicId);

    List<PendingCloudinaryDeletion> findByStatus(
            PendingCloudinaryDeletion.DeletionStatus status);

    List<PendingCloudinaryDeletion> findByStatusAndCreatedAtBefore(
            PendingCloudinaryDeletion.DeletionStatus status, LocalDateTime cutoff);

    boolean existsByPublicId(String publicId);
}
