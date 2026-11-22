package com.garagemate.api;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Smoke test — verifies Spring context loads successfully with the test profile.
 */
@SpringBootTest
@ActiveProfiles("test")
class GarageMateApplicationTests {

    @Test
    void contextLoads() {
        // If this passes, the application context starts without errors.
    }
}
