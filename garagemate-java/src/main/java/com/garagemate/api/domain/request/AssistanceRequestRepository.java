package com.garagemate.api.domain.request;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssistanceRequestRepository extends JpaRepository<AssistanceRequest, Long> {

    // User's own requests
    List<AssistanceRequest> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<AssistanceRequest> findByIdAndUserId(Long id, Long userId);

    // Garage's directly-assigned requests (GARAGE_SELECTED and beyond)
    @Query("""
            SELECT r FROM AssistanceRequest r
            WHERE r.garage.id = :garageId
              AND r.status IN :statuses
            ORDER BY r.createdAt DESC
            """)
    List<AssistanceRequest> findByGarageIdAndStatusIn(
            @Param("garageId") Long garageId,
            @Param("statuses") List<RequestStatus> statuses
    );

    // Broadcast requests within garage's service radius (using nearby garage IDs)
    @Query("""
            SELECT r FROM AssistanceRequest r
            WHERE r.garage IS NULL
              AND r.status IN :statuses
            ORDER BY r.createdAt DESC
            """)
    List<AssistanceRequest> findBroadcastRequests(@Param("statuses") List<RequestStatus> statuses);

    // Admin
    Page<AssistanceRequest> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<AssistanceRequest> findByStatusOrderByCreatedAtDesc(RequestStatus status, Pageable pageable);

    // Counts
    long countByStatus(RequestStatus status);
    long countByStatusIn(List<RequestStatus> statuses);

    // Payment check
    boolean existsByIdAndUserId(Long id, Long userId);
}
