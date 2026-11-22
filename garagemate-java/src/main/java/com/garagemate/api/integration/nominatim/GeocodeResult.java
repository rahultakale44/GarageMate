package com.garagemate.api.integration.nominatim;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

/**
 * Nominatim geocode result — mirrors the Node.js GeocodeResult interface.
 * Returned as-is to the frontend from both /reverse-geocode and /geocode.
 */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GeocodeResult {
    private final String displayName;
    private final String locality;
    private final String city;
    private final String state;
    private final String pincode;
    private final String landmark;
    private final double latitude;
    private final double longitude;
    private final String address;
}
