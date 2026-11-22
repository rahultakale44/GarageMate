package com.garagemate.api.domain.review;

import com.garagemate.api.domain.garage.Garage;
import com.garagemate.api.domain.request.AssistanceRequest;
import com.garagemate.api.domain.user.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviews", indexes = {
        @Index(name = "idx_reviews_garage", columnList = "garage_id"),
        @Index(name = "idx_reviews_rating", columnList = "rating")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "garage_id", nullable = false)
    private Garage garage;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false, unique = true)
    private AssistanceRequest request;

    @Min(1) @Max(5)
    @Column(nullable = false)
    private Integer rating;

    @Column(name = "review_message", columnDefinition = "TEXT")
    private String reviewMessage;

    @Min(1) @Max(5)
    @Column(name = "service_quality", nullable = false)
    private Integer serviceQuality;

    @Min(1) @Max(5)
    @Column(name = "response_time", nullable = false)
    private Integer responseTime;

    @Min(1) @Max(5)
    @Column(name = "price_fairness", nullable = false)
    private Integer priceFairness;

    @Column(name = "garage_response", columnDefinition = "TEXT")
    private String garageResponse;

    @Column(name = "garage_response_at")
    private LocalDateTime garageResponseAt;

    @Column(name = "is_hidden", nullable = false)
    private boolean isHidden = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
