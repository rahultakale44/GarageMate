package com.garagemate.api.domain.garage;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GarageRepository extends JpaRepository<Garage, Long> {

    Optional<Garage> findByOwnerId(Long ownerId);

    boolean existsByOwnerId(Long ownerId);

    long countByVerificationStatus(VerificationStatus status);

    long countByIsAvailableTrue();

    Page<Garage> findByVerificationStatus(VerificationStatus status, Pageable pageable);

    /**
     * Nearby garages using Haversine formula.
     * Returns garages within radiusKm, ordered by distance ascending.
     * Only APPROVED + available garages.
     */
    @Query(value = """
            SELECT g.*, (
                6371 * ACOS(
                    COS(RADIANS(:lat)) * COS(RADIANS(g.latitude)) *
                    COS(RADIANS(g.longitude) - RADIANS(:lng)) +
                    SIN(RADIANS(:lat)) * SIN(RADIANS(g.latitude))
                )
            ) AS distance
            FROM garages g
            WHERE g.verification_status = 'APPROVED'
              AND g.is_available = true
              AND (
                6371 * ACOS(
                    COS(RADIANS(:lat)) * COS(RADIANS(g.latitude)) *
                    COS(RADIANS(g.longitude) - RADIANS(:lng)) +
                    SIN(RADIANS(:lat)) * SIN(RADIANS(g.latitude))
                )
              ) <= :radiusKm
            ORDER BY distance ASC
            LIMIT :limitVal
            """, nativeQuery = true)
    List<Object[]> findNearbyRaw(
            @Param("lat") double lat,
            @Param("lng") double lng,
            @Param("radiusKm") double radiusKm,
            @Param("limitVal") int limit
    );

    /**
     * Nearby garages for direct-assignment isolation check.
     * Returns IDs of garages within radiusKm.
     */
    @Query(value = """
            SELECT g.id FROM garages g
            WHERE g.verification_status = 'APPROVED'
              AND g.is_available = true
              AND (
                6371 * ACOS(
                    COS(RADIANS(:lat)) * COS(RADIANS(g.latitude)) *
                    COS(RADIANS(g.longitude) - RADIANS(:lng)) +
                    SIN(RADIANS(:lat)) * SIN(RADIANS(g.latitude))
                )
              ) <= :radiusKm
            """, nativeQuery = true)
    List<Long> findNearbyIds(
            @Param("lat") double lat,
            @Param("lng") double lng,
            @Param("radiusKm") double radiusKm
    );
}
