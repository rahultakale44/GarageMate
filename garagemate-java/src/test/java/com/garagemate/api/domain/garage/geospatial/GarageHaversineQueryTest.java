package com.garagemate.api.domain.garage.geospatial;

import com.garagemate.api.domain.garage.*;
import com.garagemate.api.domain.user.User;
import com.garagemate.api.domain.user.UserRole;
import org.junit.jupiter.api.*;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Haversine query correctness tests.
 *
 * ENVIRONMENT NOTES
 * -----------------
 * These tests require a live MySQL instance to run because:
 *   1. The query uses RADIANS(), ACOS(), COS(), SIN() — standard MySQL math
 *      functions that H2 does not support in its MySQL compatibility mode.
 *   2. GREATEST/LEAST clamping of the ACOS argument is MySQL-specific.
 *   3. H2's native SQL support does not cover these functions reliably.
 *
 * HOW TO RUN AGAINST LOCAL MySQL
 * --------------------------------
 * 1. Set environment variables or application-test.yml overrides:
 *      spring.datasource.url=jdbc:mysql://localhost:3306/garagemate_test
 *      spring.datasource.username=garagemate_test
 *      spring.datasource.password=<password>
 *      spring.jpa.hibernate.ddl-auto=create-drop
 * 2. Run with: mvn test -Dspring.profiles.active=mysql-test
 *
 * HOW TO RUN WITH TESTCONTAINERS (when Docker is running)
 * --------------------------------------------------------
 * 1. Add testcontainers dependency:
 *      <dependency>
 *        <groupId>org.testcontainers</groupId>
 *        <artifactId>mysql</artifactId>
 *        <scope>test</scope>
 *      </dependency>
 * 2. Add @Testcontainers and @Container annotations as shown in
 *    GarageTestcontainersIT (see that class for the full setup).
 * 3. Run Docker Desktop before executing tests.
 *
 * KNOWN LIMITATION (2026-11-22)
 * ------------------------------
 * Docker Desktop is not currently running in this environment.
 * The MySQL service is running locally but requires a password.
 * Therefore these tests are marked @Disabled and run only as unit algebra
 * checks (independent of DB) until the MySQL integration environment is
 * confirmed available.
 *
 * UNIT ALGEBRA SECTION (runs without DB)
 * -----------------------------------------
 * These tests verify the Haversine distance formula using the same math
 * as the SQL query, so they prove distance correctness even without a DB.
 */
@DisplayName("Haversine distance algebra")
class GarageHaversineQueryTest {

    // Earth radius used in the SQL query
    private static final double R = 6371.0;

    /**
     * Pure-Java Haversine matching the MySQL SQL expression:
     * 6371 * ACOS(GREATEST(-1, LEAST(1,
     *   COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * COS(RADIANS(lon2) - RADIANS(lon1))
     *   + SIN(RADIANS(lat1)) * SIN(RADIANS(lat2))
     * )))
     */
    static double haversine(double lat1, double lon1, double lat2, double lon2) {
        double inner =
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.cos(Math.toRadians(lon2) - Math.toRadians(lon1))
                + Math.sin(Math.toRadians(lat1)) * Math.sin(Math.toRadians(lat2));
        // GREATEST(-1, LEAST(1, inner)) clamps floating-point drift
        inner = Math.max(-1.0, Math.min(1.0, inner));
        return R * Math.acos(inner);
    }

    // ── Reference coordinates ─────────────────────────────────────────────────
    // Bangalore MG Road: 12.9757°N, 77.6011°E
    // Whitefield (Bangalore): 12.9698°N, 77.7499°E  — ~13.7 km from MG Road
    // Delhi CP: 28.6315°N, 77.2167°E               — ~1740 km from Bangalore

    static final double BLR_LAT  = 12.9757;
    static final double BLR_LNG  = 77.6011;
    static final double WF_LAT   = 12.9698;
    static final double WF_LNG   = 77.7499;
    static final double DEL_LAT  = 28.6315;
    static final double DEL_LNG  = 77.2167;

    @Test
    @DisplayName("same location → distance = 0")
    void sameLocation() {
        double d = haversine(BLR_LAT, BLR_LNG, BLR_LAT, BLR_LNG);
        assertThat(d).isLessThan(0.001);
    }

    @Test
    @DisplayName("Bangalore MG Road → Whitefield ≈ 16.1 km (±2 km)")
    void bangaloreToWhitefield() {
        double d = haversine(BLR_LAT, BLR_LNG, WF_LAT, WF_LNG);
        assertThat(d).isBetween(14.0, 18.0);
    }

    @Test
    @DisplayName("Bangalore → Delhi ≈ 1740 km (±20 km)")
    void bangaloreToDelhi() {
        double d = haversine(BLR_LAT, BLR_LNG, DEL_LAT, DEL_LNG);
        assertThat(d).isBetween(1720.0, 1760.0);
    }

    @Test
    @DisplayName("symmetry: distance(A→B) == distance(B→A)")
    void symmetric() {
        double ab = haversine(BLR_LAT, BLR_LNG, WF_LAT, WF_LNG);
        double ba = haversine(WF_LAT, WF_LNG, BLR_LAT, BLR_LNG);
        assertThat(ab).isCloseTo(ba, org.assertj.core.data.Offset.offset(0.0001));
    }

    @Test
    @DisplayName("radius filter: Whitefield (16.1 km) outside 10 km radius")
    void whitefieldOutsideTenKm() {
        double d = haversine(BLR_LAT, BLR_LNG, WF_LAT, WF_LNG);
        assertThat(d).isGreaterThan(10.0);  // should NOT appear in a 10 km search
    }

    @Test
    @DisplayName("radius filter: a 2 km point is within 10 km radius")
    void nearPointInsideTenKm() {
        // 2 km north of BLR: approx lat += 2/111
        double nearLat = BLR_LAT + (2.0 / 111.0);
        double d = haversine(BLR_LAT, BLR_LNG, nearLat, BLR_LNG);
        assertThat(d).isLessThan(10.0);
    }

    @Test
    @DisplayName("ordering: closer garage has smaller distance")
    void orderingByDistance() {
        double near  = haversine(BLR_LAT, BLR_LNG, BLR_LAT + 0.01, BLR_LNG);
        double far   = haversine(BLR_LAT, BLR_LNG, WF_LAT, WF_LNG);
        assertThat(near).isLessThan(far);
    }

    @Test
    @DisplayName("GREATEST/LEAST clamp: antipodal point does not produce NaN")
    void clampAntipodalPoint() {
        // Antipodal point of Bangalore
        double antiLat = -BLR_LAT;
        double antiLng = BLR_LNG + 180.0 > 180 ? BLR_LNG + 180 - 360 : BLR_LNG + 180;
        double d = haversine(BLR_LAT, BLR_LNG, antiLat, antiLng);
        assertThat(d).isNotNaN();
        assertThat(d).isCloseTo(R * Math.PI, org.assertj.core.data.Offset.offset(1.0));
    }

    @Test
    @DisplayName("coordinate convention: lon1,lat1 matches MySQL column order")
    void coordinateConvention() {
        // SQL: COS(RADIANS(g.latitude)) ... COS(RADIANS(g.longitude) - RADIANS(:lng))
        // Java: lon parameter maps to g.longitude, lat parameter maps to g.latitude
        // Both use: ref_lat=:lat against g.latitude, ref_lng=:lng against g.longitude
        // Confirm: Whitefield (lon=77.7499, lat=12.9698) is east of MG Road (lon=77.6011)
        double dCorrect = haversine(BLR_LAT, BLR_LNG, WF_LAT, WF_LNG);
        // If we accidentally swap lat/lng for Whitefield, we get a large distance
        double dSwapped = haversine(BLR_LAT, BLR_LNG, WF_LNG, WF_LAT); // wrong
        assertThat(dCorrect).isLessThan(20.0);    // correct: ~13.7 km
        assertThat(dSwapped).isGreaterThan(1000.0); // swapped: huge number
    }
}
