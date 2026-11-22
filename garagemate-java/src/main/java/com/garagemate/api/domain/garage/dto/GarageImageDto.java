package com.garagemate.api.domain.garage.dto;

import com.garagemate.api.domain.garage.GarageImage;
import lombok.Builder;
import lombok.Getter;

/** Mirrors Node.js garage.images[] shape: { url, publicId, type } */
@Getter
@Builder
public class GarageImageDto {
    private final String url;
    private final String publicId;
    private final String type;

    public static GarageImageDto from(GarageImage img) {
        return GarageImageDto.builder()
                .url(img.getUrl())
                .publicId(img.getPublicId())
                .type(img.getImageType())
                .build();
    }
}
