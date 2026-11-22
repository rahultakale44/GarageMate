package com.garagemate.api.integration.nominatim;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Nominatim reverse-geocoding service.
 * Converts (lat, lng) → human-readable address.
 * Results are cached with Caffeine to avoid hammering the Nominatim API.
 *
 * Mirrors Node.js nominatim.ts behavior.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NominatimService {

    private static final String NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    /**
     * Returns a human-readable address string for the given coordinates.
     * Returns null on failure (non-blocking — geolocation is best-effort).
     */
    @Cacheable(value = "geocoding", key = "#lat + ',' + #lng")
    public String reverseGeocode(double lat, double lng) {
        try {
            String url = UriComponentsBuilder.fromHttpUrl(NOMINATIM_URL)
                    .queryParam("lat", lat)
                    .queryParam("lon", lng)
                    .queryParam("format", "json")
                    .queryParam("addressdetails", 1)
                    .build()
                    .toUriString();

            String response = restTemplate.getForObject(url, String.class);
            JsonNode json = objectMapper.readTree(response);
            String displayName = json.path("display_name").asText(null);
            log.debug("Reverse geocode ({}, {}) → {}", lat, lng, displayName);
            return displayName;
        } catch (Exception e) {
            log.warn("Nominatim reverse geocode failed for ({}, {}): {}", lat, lng, e.getMessage());
            return null;
        }
    }
}
