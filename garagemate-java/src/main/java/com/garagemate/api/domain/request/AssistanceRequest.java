package com.garagemate.api.domain.request;

import com.garagemate.api.domain.garage.Garage;
import com.garagemate.api.domain.mechanic.Mechanic;
import com.garagemate.api.domain.user.User;
import com.garagemate.api.domain.vehicle.Vehicle;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "assistance_requests", indexes = {
        @Index(name = "idx_ar_user_id", columnList = "user_id"),
        @Index(name = "idx_ar_garage_id", columnList = "garage_id"),
        @Index(name = "idx_ar_status", columnList = "status"),
        @Index(name = "idx_ar_created_at", columnList = "created_at")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AssistanceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "garage_id")
    private Garage garage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mechanic_id")
    private Mechanic mechanic;

    @Enumerated(EnumType.STRING)
    @Column(name = "issue_category", nullable = false, length = 30)
    private IssueCategory issueCategory;

    @Column(name = "issue_description", nullable = false, columnDefinition = "TEXT")
    private String issueDescription;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "request_images",
            joinColumns = @JoinColumn(name = "request_id"))
    @Column(name = "image_url", length = 500)
    @Builder.Default
    private List<String> issueImages = new ArrayList<>();

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String address;

    @Column(length = 255)
    private String landmark;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(length = 10)
    private String pincode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RequestStatus status = RequestStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Urgency urgency = Urgency.MEDIUM;

    @Column(name = "booking_fee", nullable = false, precision = 10, scale = 2)
    private BigDecimal bookingFee;

    @Column(name = "estimated_cost", precision = 10, scale = 2)
    private BigDecimal estimatedCost;

    @Column(name = "final_cost", precision = 10, scale = 2)
    private BigDecimal finalCost;

    @Column(name = "estimated_arrival_minutes")
    private Integer estimatedArrivalMinutes;

    @Column(name = "eta_set_at")
    private LocalDateTime etaSetAt;

    @Column(name = "completion_otp", length = 10)
    private String completionOtp;

    @Column(name = "otp_expires_at")
    private LocalDateTime otpExpiresAt;

    @OneToMany(mappedBy = "request", cascade = CascadeType.ALL, orphanRemoval = true,
               fetch = FetchType.LAZY)
    @OrderBy("updatedAt ASC")
    @Builder.Default
    private List<RequestStatusHistory> statusHistory = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public void addStatusHistory(RequestStatus newStatus, Long updatedById, String notes) {
        RequestStatusHistory entry = RequestStatusHistory.builder()
                .request(this)
                .status(newStatus)
                .updatedById(updatedById)
                .notes(notes)
                .build();
        this.statusHistory.add(entry);
        this.status = newStatus;
    }
}
