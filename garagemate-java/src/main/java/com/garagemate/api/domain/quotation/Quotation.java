package com.garagemate.api.domain.quotation;

import com.garagemate.api.domain.garage.Garage;
import com.garagemate.api.domain.request.AssistanceRequest;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quotations", indexes = {
        @Index(name = "idx_quotation_request_id", columnList = "request_id"),
        @Index(name = "idx_quotation_garage_id", columnList = "garage_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Quotation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private AssistanceRequest request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "garage_id", nullable = false)
    private Garage garage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private QuotationStatus status = QuotationStatus.PENDING;

    @Column(precision = 10, scale = 2)
    private BigDecimal laborCost;

    @Column(length = 2000)
    private String notes;

    /** Estimated completion time in hours */
    @Column(name = "estimated_hours")
    private Integer estimatedHours;

    @OneToMany(mappedBy = "quotation", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<QuotationPart> parts = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** Total = laborCost + sum(parts) */
    public BigDecimal getTotal() {
        BigDecimal partsCost = parts.stream()
                .map(p -> p.getUnitPrice().multiply(BigDecimal.valueOf(p.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return (laborCost != null ? laborCost : BigDecimal.ZERO).add(partsCost);
    }
}
