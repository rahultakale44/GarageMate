package com.garagemate.api.domain.mechanic;

import com.garagemate.api.domain.garage.Garage;
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
@Table(name = "mechanics", indexes = {
        @Index(name = "idx_mechanics_garage", columnList = "garage_id"),
        @Index(name = "idx_mechanics_status", columnList = "status")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Mechanic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "garage_id", nullable = false)
    private Garage garage;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(length = 500)
    private String avatar;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "mechanic_skills",
            joinColumns = @JoinColumn(name = "mechanic_id"))
    @Column(name = "skill", length = 100)
    @Builder.Default
    private List<String> skills = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "mechanic_vehicle_expertise",
            joinColumns = @JoinColumn(name = "mechanic_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_type", length = 20)
    @Builder.Default
    private List<VehicleType> vehicleExpertise = new ArrayList<>();

    @Column(nullable = false)
    private Integer experience = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MechanicStatus status = MechanicStatus.AVAILABLE;

    @Column(name = "current_latitude", precision = 10, scale = 7)
    private BigDecimal currentLatitude;

    @Column(name = "current_longitude", precision = 10, scale = 7)
    private BigDecimal currentLongitude;

    @Column(name = "current_request_id")
    private Long currentRequestId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
