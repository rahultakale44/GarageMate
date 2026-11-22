package com.garagemate.api.domain.garage.pricing;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GarageServicePricingRepository extends JpaRepository<GarageServicePricing, Long> {

    List<GarageServicePricing> findByGarageId(Long garageId);

    /**
     * Replace all pricing entries for a garage atomically.
     * clearAutomatically = true flushes the first-level cache after the bulk DELETE
     * so subsequent reads in the same transaction see the correct state.
     */
    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM GarageServicePricing p WHERE p.garage.id = :garageId")
    void deleteByGarageId(Long garageId);
}
