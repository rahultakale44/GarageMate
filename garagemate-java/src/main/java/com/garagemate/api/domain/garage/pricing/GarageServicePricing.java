package com.garagemate.api.domain.garage.pricing;

import com.garagemate.api.domain.garage.Garage;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Garage service pricing — represents one entry in
 * servicePricing: Record<string, number> from the original MongoDB schema.
 *
 * Table: garage_service_pricing(garage_id, service_name, price)
 * Unique constraint on (garage_id, service_name) — one price per service per garage.
 */
@Entity
@Table(
    name = "garage_service_pricing",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_garage_service", columnNames = {"garage_id", "service_name"}
    ),
    indexes = @Index(name = "idx_gsp_garage_id", columnList = "garage_id")
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GarageServicePricing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "garage_id", nullable = false)
    private Garage garage;

    @Column(name = "service_name", nullable = false, length = 150)
    private String serviceName;

    /** Price in INR. Must be >= 0. */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
}
