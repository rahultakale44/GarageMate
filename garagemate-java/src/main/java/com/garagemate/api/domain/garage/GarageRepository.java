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
     * Haversine nearby search — returns ONLY garage ID + distance (km).
     *
     * Returning id + distance (2 columns) rather than SELECT g.* eliminates the
     * N+1 / column-count brittleness of the previous Object[] approach.
     * Callers fetch entities in a single IN query and rejoin distances via a Map.
     *
     * Coordinate convention: MySQL stores longitude as g.longitude, latitude as g.latitude.
     * The Haversine formula is symmetric in lon/lat so order inside ACOS does not matter,
     * but we must pass the reference point in the same axis order as the stored columns.
     * :lat → compared with g.latitude (Y axis)
     * :lng → compared with g.longitude (X axis)
     *
     * This matches the original Node.js:
     *   $near: { $geometry: { type: 'Point', coordinates: [longitude, latitude] } }
     * which also treats the first stored coordinate as longitude and second as latitude.
     *
     * Distance unit: kilometres (Earth radius 6371 km).
     */
    @Query(value = """
            SELECT g.id,
                   (6371 * ACOS(GREATEST(-1.0, LEAST(1.0,
                       COS(RADIANS(:lat)) * COS(RADIANS(g.latitude))
                       * COS(RADIANS(g.longitude) - RADIANS(:lng))
                       + SIN(RADIANS(:lat)) * SIN(RADIANS(g.latitude))
                   )))) AS distance_km
            FROM garages g
            WHERE g.verification_status = 'APPROVED'
              AND g.is_available = TRUE
              AND (6371 * ACOS(GREATEST(-1.0, LEAST(1.0,
                       COS(RADIANS(:lat)) * COS(RADIANS(g.latitude))
                       * COS(RADIANS(g.longitude) - RADIANS(:lng))
                       + SIN(RADIANS(:lat)) * SIN(RADIANS(g.latitude))
                   )))) <= :radiusKm
            ORDER BY distance_km ASC
            LIMIT :limitVal
            """, nativeQuery = true)
    List<Object[]> findNearbyIdsWithDistance(
            @Param("lat")      double lat,
            @Param("lng")      double lng,
            @Param("radiusKm") double radiusKm,
            @Param("limitVal") int    limit
    );

    /**
     * Batch-fetch garages by IDs, preserving the caller-supplied order.
     * Used after findNearbyIdsWithDistance to avoid N+1 queries.
     */
    @Query("SELECT g FROM Garage g WHERE g.id IN :ids")
    List<Garage> findAllByIdIn(@Param("ids") List<Long> ids);

    /**
     * Nearby garage IDs only — used for broadcast-request scoping.
     */
    @Query(value = """
            SELECT g.id FROM garages g
            WHERE g.verification_status = 'APPROVED'
              AND g.is_available = TRUE
              AND (6371 * ACOS(GREATEST(-1.0, LEAST(1.0,
                       COS(RADIANS(:lat)) * COS(RADIANS(g.latitude))
                       * COS(RADIANS(g.longitude) - RADIANS(:lng))
                       + SIN(RADIANS(:lat)) * SIN(RADIANS(g.latitude))
                   )))) <= :radiusKm
            """, nativeQuery = true)
    List<Long> findNearbyIds(
            @Param("lat")      double lat,
            @Param("lng")      double lng,
            @Param("radiusKm") double radiusKm
    );

    // ── Keep old findNearbyRaw for backward compatibility with existing tests ──

    /**
     * @deprecated Use findNearbyIdsWithDistance instead.
     *             Kept so existing GarageServiceTest mocks continue to compile.
     */
    @Deprecated
    @Query(value = """
            SELECT g.id,
                   (6371 * ACOS(GREATEST(-1.0, LEAST(1.0,
                       COS(RADIANS(:lat)) * COS(RADIANS(g.latitude))
                       * COS(RADIANS(g.longitude) - RADIANS(:lng))
                       + SIN(RADIANS(:lat)) * SIN(RADIANS(g.latitude))
                   )))) AS distance_km
            FROM garages g
            WHERE g.verification_status = 'APPROVED'
              AND g.is_available = TRUE
              AND (6371 * ACOS(GREATEST(-1.0, LEAST(1.0,
                       COS(RADIANS(:lat)) * COS(RADIANS(g.latitude))
                       * COS(RADIANS(g.longitude) - RADIANS(:lng))
                       + SIN(RADIANS(:lat)) * SIN(RADIANS(g.latitude))
                   )))) <= :radiusKm
            ORDER BY distance_km ASC
            LIMIT :limitVal
            """, nativeQuery = true)
    List<Object[]> findNearbyRaw(
            @Param("lat")      double lat,
            @Param("lng")      double lng,
            @Param("radiusKm") double radiusKm,
            @Param("limitVal") int    limit
    );
}
