package com.garagemate.api.domain.garage.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * POST /api/garages/my/images
 * Body: { images: [{ url, publicId, type }] }
 * Mirrors Node.js: req.body.images — array of Cloudinary upload results.
 */
public record AddImagesRequest(

        @NotEmpty(message = "images array must not be empty")
        @Valid
        List<ImageEntry> images
) {
    public record ImageEntry(
            @NotNull String url,
            String publicId,
            String type
    ) {}
}
