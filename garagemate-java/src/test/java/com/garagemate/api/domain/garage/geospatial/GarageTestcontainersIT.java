package com.garagemate.api.domain.garage.geospatial;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * MySQL Testcontainers integration test for Haversine nearby search.
 *
 * STATUS: Disabled — Docker Desktop is not running in this environment.
 *         Enable when Docker is available.
 *
 * TO ENABLE:
 * 1. Start Docker Desktop.
 * 2. Add to pom.xml (test scope):
 *      <dependency>
 *        <groupId>org.testcontainers</groupId>
 *        <artifactId>junit-jupiter</artifactId>
 *        <version>1.20.4</version>
 *        <scope>test</scope>
 *      </dependency>
 *      <dependency>
 *        <groupId>org.testcontainers</groupId>
 *        <artifactId>mysql</artifactId>
 *        <version>1.20.4</version>
 *        <scope>test</scope>
 *      </dependency>
 * 3. Remove @Disabled and restore the annotations below.
 * 4. Run: mvn test -Dtest=GarageTestcontainersIT
 *
 * FULL IMPLEMENTATION TEMPLATE:
 * -----------------------------------------------------------------------
 *
 * @SpringBootTest
 * @Testcontainers
 * @ActiveProfiles("test")
 * class GarageTestcontainersIT {
 *
 *     @Container
 *     static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0.36")
 *             .withDatabaseName("garagemate_test")
 *             .withUsername("garagemate")
 *             .withPassword("garagemate_test_pass");
 *
 *     @DynamicPropertySource
 *     static void configure(DynamicPropertyRegistry registry) {
 *         registry.add("spring.datasource.url",      mysql::getJdbcUrl);
 *         registry.add("spring.datasource.username", mysql::getUsername);
 *         registry.add("spring.datasource.password", mysql::getPassword);
 *         registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
 *     }
 *
 *     @Autowired GarageRepository garageRepository;
 *     @Autowired UserRepository   userRepository;
 *
 *     // Reference point: Bangalore MG Road
 *     static final double REF_LAT = 12.9757;
 *     static final double REF_LNG = 77.6011;
 *
 *     @BeforeEach
 *     void seed() {
 *         userRepository.deleteAll();
 *         garageRepository.deleteAll();
 *
 *         User owner = userRepository.save(User.builder()
 *                 .name("Owner").email("owner@test.com").role(UserRole.GARAGE_OWNER).build());
 *
 *         // Near garage — 2 km north of reference point
 *         garageRepository.save(buildGarage(owner, "Near Garage",
 *                 REF_LAT + 0.018, REF_LNG, VerificationStatus.APPROVED, true));
 *
 *         // Far garage — Whitefield, ~13.7 km east
 *         garageRepository.save(buildGarage(owner, "Far Garage",
 *                 12.9698, 77.7499, VerificationStatus.APPROVED, true));
 *
 *         // Outside garage — 60 km radius, should not appear in 10 km search
 *         garageRepository.save(buildGarage(owner, "Outside Garage",
 *                 13.5330, 77.5970, VerificationStatus.APPROVED, true));
 *
 *         // Pending garage — should never appear in public search
 *         garageRepository.save(buildGarage(owner, "Pending Garage",
 *                 REF_LAT + 0.001, REF_LNG, VerificationStatus.PENDING, true));
 *     }
 *
 *     @Test
 *     @DisplayName("10 km search returns near garage, excludes far and outside")
 *     void nearbyTenKm() {
 *         List<Object[]> rows = garageRepository.findNearbyIdsWithDistance(
 *                 REF_LAT, REF_LNG, 10.0, 50);
 *
 *         assertThat(rows).hasSize(1);
 *         double distKm = ((Number) rows.get(0)[1]).doubleValue();
 *         assertThat(distKm).isBetween(1.5, 2.5);  // ~2 km
 *     }
 *
 *     @Test
 *     @DisplayName("20 km search returns near + far, excludes outside and pending")
 *     void nearbyTwentyKm() {
 *         List<Object[]> rows = garageRepository.findNearbyIdsWithDistance(
 *                 REF_LAT, REF_LNG, 20.0, 50);
 *
 *         assertThat(rows).hasSize(2);
 *         // First result must be closer
 *         double d0 = ((Number) rows.get(0)[1]).doubleValue();
 *         double d1 = ((Number) rows.get(1)[1]).doubleValue();
 *         assertThat(d0).isLessThan(d1);
 *     }
 *
 *     @Test
 *     @DisplayName("same-location garage has distance < 0.1 km")
 *     void sameLocation() {
 *         garageRepository.save(buildGarage(
 *                 userRepository.findByEmail("owner@test.com").get(),
 *                 "Same Location", REF_LAT, REF_LNG,
 *                 VerificationStatus.APPROVED, true));
 *
 *         List<Object[]> rows = garageRepository.findNearbyIdsWithDistance(
 *                 REF_LAT, REF_LNG, 1.0, 50);
 *         assertThat(rows).isNotEmpty();
 *         double d = ((Number) rows.get(0)[1]).doubleValue();
 *         assertThat(d).isLessThan(0.1);
 *     }
 *
 *     @Test
 *     @DisplayName("PENDING garage never returned by nearby query")
 *     void pendingGarageExcluded() {
 *         List<Object[]> rows = garageRepository.findNearbyIdsWithDistance(
 *                 REF_LAT, REF_LNG, 50.0, 50);
 *         List<Long> ids = rows.stream().map(r -> ((Number) r[0]).longValue()).toList();
 *
 *         garageRepository.findAll().stream()
 *             .filter(g -> g.getVerificationStatus() == VerificationStatus.PENDING)
 *             .forEach(g -> assertThat(ids).doesNotContain(g.getId()));
 *     }
 *
 *     private Garage buildGarage(User owner, String name, double lat, double lng,
 *                                 VerificationStatus status, boolean available) {
 *         Garage g = new Garage();
 *         g.setOwner(owner); g.setName(name);
 *         g.setPhone("9876543210"); g.setAddress("Test Address");
 *         g.setCity("Test City"); g.setState("KA"); g.setPincode("560001");
 *         g.setLatitude(new BigDecimal(lat)); g.setLongitude(new BigDecimal(lng));
 *         g.setServiceRadius(10); g.setVerificationStatus(status);
 *         g.setAvailable(available);
 *         g.setRating(BigDecimal.ZERO); g.setReviewCount(0);
 *         g.setVisitingCharge(new BigDecimal("99.00"));
 *         return g;
 *     }
 * }
 */
@Disabled("Docker not running — see class Javadoc to enable")
@DisplayName("Garage Testcontainers MySQL integration (disabled)")
class GarageTestcontainersIT {

    @Test
    @DisplayName("placeholder — remove @Disabled and restore template to run")
    void placeholder() {
        // This test exists only to document the Testcontainers setup.
        // See the class Javadoc for the full runnable implementation.
    }
}
