package com.garagemate.api.domain.review;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByGarageIdAndIsHiddenFalseOrderByCreatedAtDesc(Long garageId);

    List<Review> findByUserIdOrderByCreatedAtDesc(Long userId);

    boolean existsByRequestId(Long requestId);

    Optional<Review> findByIdAndUserId(Long id, Long userId);

    List<Review> findByGarageIdAndIsHiddenFalse(Long garageId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.garage.id = :garageId AND r.isHidden = false")
    Double avgRatingByGarageId(@Param("garageId") Long garageId);

    long countByGarageIdAndIsHiddenFalse(Long garageId);
}
