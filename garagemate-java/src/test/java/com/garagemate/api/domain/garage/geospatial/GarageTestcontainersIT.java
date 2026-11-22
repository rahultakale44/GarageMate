package com.garagemate.api.domain.garage.geospatial;

import com.garagemate.api.domain.garage.*;
import com.garagemate.api.domain.user.User;
import com.garagemate.api.domain.user.UserRepository;
import com.garagemate.api.domain.user.UserRole;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.DisabledIfEnvironmentVariable;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Real MySQL integration test for GarageRepository Haversine nearby search.
 *
 * Uses Testcontainers to spin up an actual MySQL 8 container.
 *
 * STATUS (2026-11-23): BLOCKED.
 * Docker Desktop is running but the Java Testcontainers library cannot connect
 * to the named pipe (\\.\pipe\docker_engine returns HTTP 400 empty response).
 * This is a known Windows/WSL2 Docker Desktop compatibility issue with Testcontainers.
 *
 * HOW TO UNBLOCK:
 * Option A — Enable Docker TCP socket in Docker Desktop:
 *   Settings → General → "Expose daemon on tcp://localhost:2375 without TLS" → Apply
 *   Then: set DOCKER_HOST=tcp://localhost:2375 before running tests.
 *
 * Option B — Run from WSL2:
 *   cd /mnt/d/GarageMate/garagemate-java && mvn test -Dtest=GarageTestcontainersIT
 *   (Testcontainers works natively in WSL2)
 *
 * Option C — Use TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE:
 *   Set TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=//var/run/docker.sock in WSL2 environment.
 *
 * To run manually when Docker is accessible:
 *   mvn test -Dtest=GarageTestcontainersIT -DTESTCONTAINERS_ENABLED=true
 *
 * Reference coordinates:
 *   Bangalore MG Road:   12.9757°N, 77.6011°E
 *   Near (2 km north):   12.9937°N, 77.6011°E  — ~2.0 km
 *   Whitefield:          12.9698°N, 77.7499°E  — ~16.1 km
 *   Outside (60+ km):    13.5330°N, 77.5970°E  — ~63 km
 */
@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@EnabledIfSystemProperty(named = "TESTCONTAINERS_ENABLED", matches = "true")
@DisplayName("Garage Haversine — MySQL integration (Testcontainers)")
class GarageTestcontainersIT {

    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0.36")
            .withDatabaseName("garagemate_test")
            .withUsername("garagemate")
            .withPassword("garagemate_test_pass");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url",      mysql::getJdbcUrl);
        registry.add("spring.datasource.username", mysql::getUsername);
        registry.add("spring.datasource.password", mysql::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        registry.add("spring.jpa.properties.hibernate.dialect",
                () -> "org.hibernate.dialect.MySQL8Dialect");
    }

    @Autowired GarageRepository garageRepository;
    @Autowired UserRepository   userRepository;

    // Reference point
    static final double REF_LAT  = 12.9757;
    static final double REF_LNG  = 77.6011;

    // Garage coordinates and expected approximate distances from REF
    static final double NEAR_LAT  = 12.9937;  // ~2.0 km north
    static final double NEAR_LNG  = 77.6011;
    static final double WF_LAT    = 12.9698;  // ~16.1 km east (Whitefield)
    static final double WF_LNG    = 77.7499;
    static final double FAR_LAT   = 13.5330;  // ~63 km north
    static final double FAR_LNG   = 77.5970;

    private User owner;

    @BeforeEach
    void seed() {
        garageRepository.deleteAll();
        userRepository.deleteAll();

        owner = userRepository.save(User.builder()
                .name("Owner").email("owner@test.com")
                .role(UserRole.GARAGE_OWNER).build());
    }

    // ── 10 km search ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("10 km search: returns NEAR only, excludes Whitefield and outside")
    void tenKmSearch() {
        save("Near Garage",    NEAR_LAT, NEAR_LNG, VerificationStatus.APPROVED, true);
        save("Whitefield",     WF_LAT,   WF_LNG,   VerificationStatus.APPROVED, true);
        save("Outside",        FAR_LAT,  FAR_LNG,  VerificationStatus.APPROVED, true);

        List<Object[]> rows = garageRepository.findNearbyIdsWithDistance(
                REF_LAT, REF_LNG, 10.0, 50);

        assertThat(rows).hasSize(1);
        double distKm = ((Number) rows.get(0)[1]).doubleValue();
        assertThat(distKm).as("Near garage should be ~2 km").isBetween(1.5, 2.5);
    }

    // ── 20 km search ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("20 km search: returns NEAR + Whitefield, ordered by distance")
    void twentyKmSearch() {
        save("Near Garage", NEAR_LAT, NEAR_LNG, VerificationStatus.APPROVED, true);
        save("Whitefield",  WF_LAT,   WF_LNG,   VerificationStatus.APPROVED, true);
        save("Outside",     FAR_LAT,  FAR_LNG,  VerificationStatus.APPROVED, true);

        List<Object[]> rows = garageRepository.findNearbyIdsWithDistance(
                REF_LAT, REF_LNG, 20.0, 50);

        assertThat(rows).hasSize(2);
        double d0 = ((Number) rows.get(0)[1]).doubleValue();
        double d1 = ((Number) rows.get(1)[1]).doubleValue();
        assertThat(d0).as("First result must be closer than second").isLessThan(d1);
        assertThat(d0).isBetween(1.5, 2.5);    // ~2 km
        assertThat(d1).isBetween(14.0, 18.0);  // ~16 km
    }

    // ── Same location ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("Same location garage has distance < 0.1 km")
    void sameLocation() {
        save("Same Location", REF_LAT, REF_LNG, VerificationStatus.APPROVED, true);

        List<Object[]> rows = garageRepository.findNearbyIdsWithDistance(
                REF_LAT, REF_LNG, 1.0, 50);

        assertThat(rows).hasSize(1);
        double dist = ((Number) rows.get(0)[1]).doubleValue();
        assertThat(dist).as("Same-location distance must be near zero").isLessThan(0.1);
    }

    // ── Coordinate convention ─────────────────────────────────────────────────

    @Test
    @DisplayName("Coordinate convention: longitude/latitude stored and queried correctly")
    void coordinateConvention() {
        // Whitefield is EAST of MG Road (larger longitude, almost same latitude)
        // If lon/lat were swapped it would appear ~1750 km away (south of equator)
        save("Whitefield", WF_LAT, WF_LNG, VerificationStatus.APPROVED, true);

        List<Object[]> rows = garageRepository.findNearbyIdsWithDistance(
                REF_LAT, REF_LNG, 20.0, 50);

        assertThat(rows).hasSize(1);
        double dist = ((Number) rows.get(0)[1]).doubleValue();
        assertThat(dist).as("Whitefield should be ~16 km, not 1750 km (swapped coords)")
                .isBetween(14.0, 18.0);
    }

    // ── PENDING excluded ──────────────────────────────────────────────────────

    @Test
    @DisplayName("PENDING garage is never returned by nearby query")
    void pendingExcluded() {
        save("Pending",  NEAR_LAT, NEAR_LNG, VerificationStatus.PENDING,  true);
        save("Approved", NEAR_LAT, NEAR_LNG, VerificationStatus.APPROVED, true);

        List<Object[]> rows = garageRepository.findNearbyIdsWithDistance(
                REF_LAT, REF_LNG, 50.0, 50);

        assertThat(rows).hasSize(1);
        // Confirm the returned row belongs to the APPROVED garage
        Long returnedId = ((Number) rows.get(0)[0]).longValue();
        Garage returned = garageRepository.findById(returnedId).orElseThrow();
        assertThat(returned.getVerificationStatus()).isEqualTo(VerificationStatus.APPROVED);
    }

    // ── Unavailable excluded ──────────────────────────────────────────────────

    @Test
    @DisplayName("Unavailable (isAvailable=false) garage is excluded")
    void unavailableExcluded() {
        save("Available",   NEAR_LAT, NEAR_LNG, VerificationStatus.APPROVED, true);
        save("Unavailable", NEAR_LAT, NEAR_LNG, VerificationStatus.APPROVED, false);

        List<Object[]> rows = garageRepository.findNearbyIdsWithDistance(
                REF_LAT, REF_LNG, 10.0, 50);

        assertThat(rows).hasSize(1);
    }

    // ── Empty result ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("Empty result when no garages exist within radius")
    void emptyResult() {
        save("Far Away", FAR_LAT, FAR_LNG, VerificationStatus.APPROVED, true);

        List<Object[]> rows = garageRepository.findNearbyIdsWithDistance(
                REF_LAT, REF_LNG, 10.0, 50);

        assertThat(rows).isEmpty();
    }

    // ── ID-to-distance association ────────────────────────────────────────────

    @Test
    @DisplayName("Each row ID correctly identifies its garage (no cross-association)")
    void correctIdDistanceAssociation() {
        Garage near = save("Near",       NEAR_LAT, NEAR_LNG, VerificationStatus.APPROVED, true);
        Garage far  = save("Whitefield", WF_LAT,   WF_LNG,   VerificationStatus.APPROVED, true);

        List<Object[]> rows = garageRepository.findNearbyIdsWithDistance(
                REF_LAT, REF_LNG, 20.0, 50);

        assertThat(rows).hasSize(2);

        Long firstId  = ((Number) rows.get(0)[0]).longValue();
        Long secondId = ((Number) rows.get(1)[0]).longValue();
        double firstDist  = ((Number) rows.get(0)[1]).doubleValue();
        double secondDist = ((Number) rows.get(1)[1]).doubleValue();

        // Near garage should be first (closer)
        assertThat(firstId).isEqualTo(near.getId());
        assertThat(secondId).isEqualTo(far.getId());
        assertThat(firstDist).isLessThan(secondDist);
    }

    // ── Radius boundary ───────────────────────────────────────────────────────

    @Test
    @DisplayName("Radius boundary: garage just inside and just outside 10 km")
    void radiusBoundary() {
        // 2 km north — inside 10 km
        save("Inside",  NEAR_LAT, NEAR_LNG, VerificationStatus.APPROVED, true);
        // 16 km east — outside 10 km
        save("Outside", WF_LAT,   WF_LNG,   VerificationStatus.APPROVED, true);

        List<Object[]> rows = garageRepository.findNearbyIdsWithDistance(
                REF_LAT, REF_LNG, 10.0, 50);

        List<Long> ids = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .collect(Collectors.toList());

        // Only the 2 km garage is within 10 km
        assertThat(rows).hasSize(1);
        Garage found = garageRepository.findById(ids.get(0)).orElseThrow();
        assertThat(found.getName()).isEqualTo("Inside");
    }

    // ── GREATEST/LEAST clamp — no NaN ─────────────────────────────────────────

    @Test
    @DisplayName("Same-location query does not produce NaN (GREATEST/LEAST clamp works)")
    void noNanOnSameLocation() {
        save("Exact Match", REF_LAT, REF_LNG, VerificationStatus.APPROVED, true);

        List<Object[]> rows = garageRepository.findNearbyIdsWithDistance(
                REF_LAT, REF_LNG, 50.0, 50);

        assertThat(rows).hasSize(1);
        double dist = ((Number) rows.get(0)[1]).doubleValue();
        assertThat(dist).isNotNaN();
        assertThat(dist).isGreaterThanOrEqualTo(0.0);
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private Garage save(String name, double lat, double lng,
                         VerificationStatus status, boolean available) {
        Garage g = new Garage();
        g.setOwner(owner);
        g.setName(name);
        g.setPhone("9876543210");
        g.setAddress("Test Address, Bangalore");
        g.setCity("Bangalore");
        g.setState("Karnataka");
        g.setPincode("560001");
        g.setLatitude(new BigDecimal(String.valueOf(lat)));
        g.setLongitude(new BigDecimal(String.valueOf(lng)));
        g.setServiceRadius(10);
        g.setVerificationStatus(status);
        g.setAvailable(available);
        g.setRating(BigDecimal.ZERO);
        g.setReviewCount(0);
        g.setVisitingCharge(new BigDecimal("99.00"));
        g.setServices(new ArrayList<>());
        g.setSupportedVehicleTypes(new ArrayList<>());
        g.setImages(new ArrayList<>());
        g.setServicePricing(new ArrayList<>());
        g.setVerificationHistory(new ArrayList<>());
        return garageRepository.save(g);
    }
}
