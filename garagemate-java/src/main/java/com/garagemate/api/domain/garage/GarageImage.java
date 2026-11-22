package com.garagemate.api.domain.garage;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "garage_images")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GarageImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "garage_id", nullable = false)
    private Garage garage;

    @Column(nullable = false, length = 500)
    private String url;

    @Column(name = "public_id", length = 255)
    private String publicId;

    @Column(name = "image_type", length = 50)
    private String imageType;
}
