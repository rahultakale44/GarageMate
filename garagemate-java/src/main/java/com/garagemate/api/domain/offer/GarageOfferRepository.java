package com.garagemate.api.domain.offer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface GarageOfferRepository extends JpaRepository<GarageOffer, Long> {

    List<GarageOffer> findByRequestIdOrderByCreatedAtAsc(Long requestId);

    List<GarageOffer> findByGarageIdOrderByCreatedAtDesc(Long garageId);

    Optional<GarageOffer> findByRequestIdAndGarageId(Long requestId, Long garageId);

    boolean existsByRequestIdAndGarageId(Long requestId, Long garageId);

    Optional<GarageOffer> findByIdAndGarageId(Long id, Long garageId);

    /** Expire all PENDING offers whose expiresAt has passed */
    @Modifying
    @Query("UPDATE GarageOffer o SET o.status = 'EXPIRED' WHERE o.status = 'PENDING' AND o.expiresAt < :now")
    int expireOffers(@Param("now") LocalDateTime now);
}
