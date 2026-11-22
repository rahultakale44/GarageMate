package com.garagemate.api.domain.garage;

import com.garagemate.api.domain.user.User;
import com.garagemate.api.domain.vehicle.VehicleType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "garages", indexes = {
        @Index(name = "idx_garages_owner", columnList = "owner_id"),
        @Index(name = "idx_garages_verification", columnList = "verification_status"),
        @Index(name = "idx_garages_available", columnList = "is_available"),
        @Index(name = "idx_garages_rating", columnList = "rating")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Garage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String address;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(nullable = false, length = 100)
    private String state;

    @Column(nullable = false, length = 10)
    private String pincode;

    @Column(length = 255)
    private String landmark;

    /** Stored as separate columns — MySQL POINT for spatial queries */
    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(name = "service_radius", nullable = false)
    private Integer serviceRadius = 10;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "garage_services",
            joinColumns = @JoinColumn(name = "garage_id"),
            indexes = @Index(name = "idx_gs_garage_id", columnList = "garage_id"))
    @Column(name = "service", length = 100)
    @Builder.Default
    private List<String> services = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "garage_supported_vehicle_types",
            joinColumns = @JoinColumn(name = "garage_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_type", length = 20)
    @Builder.Default
    private List<VehicleType> supportedVehicleTypes = new ArrayList<>();

    @Column(name = "opening_time", length = 10)
    private String openingTime;

    @Column(name = "closing_time", length = 10)
    private String closingTime;

    @Column(name = "weekly_off", length = 50)
    private String weeklyOff;

    @Column(name = "is_24x7", nullable = false)
    private boolean is24x7 = false;

    @Column(name = "number_of_mechanics", nullable = false)
    private Integer numberOfMechanics = 1;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false, length = 30)
    private VerificationStatus verificationStatus = VerificationStatus.PENDING;

    @Column(name = "verification_notes", columnDefinition = "TEXT")
    private String verificationNotes;

    @Column(nullable = false, precision = 3, scale = 1)
    private BigDecimal rating = BigDecimal.ZERO;

    @Column(name = "review_count", nullable = false)
    private Integer reviewCount = 0;

    @Column(name = "is_available", nullable = false)
    private boolean isAvailable = true;

    @Column(name = "visiting_charge", nullable = false, precision = 10, scale = 2)
    private BigDecimal visitingCharge = new BigDecimal("99.00");

    @Column(name = "is_demo", nullable = false)
    private boolean isDemo = false;

    @Column(name = "owner_connected", nullable = false)
    private boolean ownerConnected = false;

    @Column(name = "dispatch_enabled", nullable = false)
    private boolean dispatchEnabled = false;

    @OneToMany(mappedBy = "garage", cascade = CascadeType.ALL, orphanRemoval = true,
               fetch = FetchType.LAZY)
    @Builder.Default
    private List<GarageImage> images = new ArrayList<>();

    @OneToMany(mappedBy = "garage", cascade = CascadeType.ALL, orphanRemoval = true,
               fetch = FetchType.LAZY)
    @Builder.Default
    private List<com.garagemate.api.domain.garage.pricing.GarageServicePricing> servicePricing
            = new ArrayList<>();

    @OneToMany(mappedBy = "garage", cascade = CascadeType.ALL, orphanRemoval = true,
               fetch = FetchType.LAZY)
    @Builder.Default
    private List<GarageVerificationHistory> verificationHistory = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
