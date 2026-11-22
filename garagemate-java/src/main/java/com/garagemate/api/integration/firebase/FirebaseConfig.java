package com.garagemate.api.integration.firebase;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import java.io.IOException;

/**
 * Initializes Firebase Admin SDK.
 * Requires GOOGLE_APPLICATION_CREDENTIALS env var OR app.firebase.service-account-path config.
 * Falls back gracefully if not configured (Google sign-in will be disabled).
 */
@Slf4j
@Configuration
public class FirebaseConfig {

    @Value("${app.firebase.service-account-path:#{null}}")
    private Resource serviceAccountResource;

    @PostConstruct
    public void initializeFirebase() {
        if (FirebaseApp.getApps().isEmpty()) {
            try {
                FirebaseOptions options;

                if (serviceAccountResource != null && serviceAccountResource.exists()) {
                    options = FirebaseOptions.builder()
                            .setCredentials(GoogleCredentials.fromStream(
                                    serviceAccountResource.getInputStream()))
                            .build();
                    log.info("✅ Firebase initialized from service account file");
                } else {
                    // Try application-default credentials (env var GOOGLE_APPLICATION_CREDENTIALS)
                    options = FirebaseOptions.builder()
                            .setCredentials(GoogleCredentials.getApplicationDefault())
                            .build();
                    log.info("✅ Firebase initialized from application default credentials");
                }

                FirebaseApp.initializeApp(options);
            } catch (IOException e) {
                log.warn("⚠️  Firebase not configured — Google sign-in will be unavailable: {}", e.getMessage());
            }
        }
    }
}
