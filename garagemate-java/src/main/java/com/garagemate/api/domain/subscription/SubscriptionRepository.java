package com.garagemate.api.domain.subscription;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    /** Active subscription for a user */
    Optional<Subscription> findFirstByUserIdAndStatusOrderByCreatedAtDesc(Long userId, SubscriptionStatus status);

    /** All subscriptions for a user (history) */
    List<Subscription> findByUserIdOrderByCreatedAtDesc(Long userId);

    /** Count active subscriptions by plan — for admin analytics */
    long countByPlanAndStatus(SubscriptionPlan plan, SubscriptionStatus status);

    /** Find expired subscriptions that haven't been updated yet */
    @Query("SELECT s FROM Subscription s WHERE s.status = 'ACTIVE' AND s.expiresAt < :now")
    List<Subscription> findExpiredActive(LocalDateTime now);
}
