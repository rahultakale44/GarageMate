package com.garagemate.api.integration.nominatim;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.RequestEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;

/**
 * Nominatim geocoding service — mirrors Node.js geocodingService.ts.
 *
 * Reverse geocode: (lat, lng) → GeocodeResult with parsed address components.
 * Forward geocode: query string → List<GeocodeResult> (up to 5 results).
 * Results cached with Caffeine (5-min TTL).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NominatimService {

    private static final String BASE_URL   = "https://nominatim.openstreetmap.org";
    private static final String USER_AGENT = "GarageMate/1.0 (Roadside Assistance Platform)";

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    // ── Reverse geocode ───────────────────────────────────────────────────────

    @Cacheable(value = "geocoding",
               key = "T(java.lang.String).format('%.4f,%.4f', #lat, #lng)")
    public GeocodeResult reverseGeocode(double lat, double lng) {
        // Validate coordinates
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return fallback(lat, lng);
        }

        try {
            String url = UriComponentsBuilder.fromHttpUrl(BASE_URL + "/reverse")
                    .queryParam("format", "jsonv2")
                    .queryParam("lat", lat)
                    .queryParam("lon", lng)
                    .queryParam("zoom", 18)
                    .queryParam("addressdetails", 1)
                    .build().toUriString();

            JsonNode json = fetchJson(url);
            if (json == null) return fallback(lat, lng);

            JsonNode addr = json.path("address");
            String displayName = json.path("display_name").asText(null);

            String locality = firstNonNull(addr,
                    "suburb", "neighbourhood", "village", "town", "city_district");
            String city     = firstNonNull(addr, "city", "town", "county");
            String state    = addr.path("state").asText(null);
            String pincode  = addr.path("postcode").asText(null);
            String landmark = addr.path("road").asText(null);

            if (displayName == null) {
                displayName = compose(locality, city, state, pincode);
            }

            GeocodeResult result = GeocodeResult.builder()
                    .displayName(displayName)
                    .locality(locality)
                    .city(city)
                    .state(state)
                    .pincode(pincode)
                    .landmark(landmark)
                    .latitude(lat)
                    .longitude(lng)
                    .address(displayName)
                    .build();

            log.debug("Reverse geocode ({}, {}) → {}", lat, lng, displayName);
            return result;

        } catch (Exception e) {
            log.warn("Reverse geocode failed for ({}, {}): {}", lat, lng, e.getMessage());
            return fallback(lat, lng);
        }
    }

    // ── Forward geocode ───────────────────────────────────────────────────────

    @Cacheable(value = "geocoding",
               key = "'search:' + #query.toLowerCase().trim()")
    public List<GeocodeResult> searchGeocode(String query) {
        try {
            String url = UriComponentsBuilder.fromHttpUrl(BASE_URL + "/search")
                    .queryParam("format", "jsonv2")
                    .queryParam("limit", 5)
                    .queryParam("addressdetails", 1)
                    .queryParam("q", query)
                    .build().toUriString();

            JsonNode json = fetchJson(url);
            if (json == null || !json.isArray()) return List.of();

            List<GeocodeResult> results = new ArrayList<>();
            for (JsonNode item : json) {
                JsonNode addr = item.path("address");
                double itemLat = item.path("lat").asDouble();
                double itemLng = item.path("lon").asDouble();
                String displayName = item.path("display_name").asText(null);

                String locality = firstNonNull(addr,
                        "suburb", "neighbourhood", "village", "town", "city_district");
                String city     = firstNonNull(addr, "city", "town", "county");

                results.add(GeocodeResult.builder()
                        .displayName(displayName)
                        .locality(locality)
                        .city(city)
                        .state(addr.path("state").asText(null))
                        .pincode(addr.path("postcode").asText(null))
                        .landmark(addr.path("road").asText(null))
                        .latitude(itemLat)
                        .longitude(itemLng)
                        .address(displayName)
                        .build());
            }
            return results;

        } catch (Exception e) {
            log.warn("Forward geocode failed for '{}': {}", query, e.getMessage());
            return List.of();
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private JsonNode fetchJson(String url) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", USER_AGENT);
            headers.set("Accept-Language", "en");
            headers.set("Accept", "application/json");

            RequestEntity<Void> request = RequestEntity.get(URI.create(url))
                    .headers(headers).build();

            String body = restTemplate.exchange(request, String.class).getBody();
            if (body == null) return null;
            return objectMapper.readTree(body);
        } catch (Exception e) {
            log.warn("Nominatim HTTP request failed: {}", e.getMessage());
            return null;
        }
    }

    private String firstNonNull(JsonNode addr, String... keys) {
        for (String key : keys) {
            String val = addr.path(key).asText(null);
            if (val != null && !val.isBlank()) return val;
        }
        return null;
    }

    private String compose(String locality, String city, String state, String pincode) {
        List<String> parts = new ArrayList<>();
        if (locality != null) parts.add(locality);
        if (city != null && !city.equals(locality)) parts.add(city);
        if (state != null) parts.add(state);
        if (pincode != null) parts.add(pincode);
        return parts.isEmpty() ? "Location detected" : String.join(", ", parts);
    }

    private GeocodeResult fallback(double lat, double lng) {
        String label = String.format("Location: %.5f, %.5f", lat, lng);
        return GeocodeResult.builder()
                .displayName(label)
                .latitude(lat)
                .longitude(lng)
                .address(label)
                .build();
    }
}
