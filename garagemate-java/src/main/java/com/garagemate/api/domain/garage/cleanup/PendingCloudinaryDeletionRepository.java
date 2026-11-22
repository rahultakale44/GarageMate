package com.garagemate.api.domain.garage.cleanup;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PendingCloudinaryDeletionRepository
        extends JpaRepository<PendingCloudinaryDeletion, Long> {

    Optional<PendingCloudinaryDeletion> findByPublicId(String publicId);

    List<PendingCloudinaryDeletion> findByStatus(
            PendingCloudinaryDeletion.DeletionStatus status);

    boolean existsByPublicId(String publicId);
}
