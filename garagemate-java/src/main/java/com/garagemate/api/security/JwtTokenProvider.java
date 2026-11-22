package com.garagemate.api.security;

import com.garagemate.api.domain.user.UserRole;
import com.garagemate.api.exception.ApiException;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JWT provider — mirrors the Node.js jwt.ts implementation exactly:
 * - HS256 algorithm
 * - Payload: { userId, role, email }
 * - Access token: 15 min default
 * - Refresh token: 7 days default
 */
@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${app.jwt.access-secret}")
    private String accessSecret;

    @Value("${app.jwt.refresh-secret}")
    private String refreshSecret;

    @Value("${app.jwt.access-expiration-ms:900000}")
    private long accessExpirationMs;

    @Value("${app.jwt.refresh-expiration-ms:604800000}")
    private long refreshExpirationMs;

    private SecretKey accessKey;
    private SecretKey refreshKey;

    @PostConstruct
    public void init() {
        validateSecret(accessSecret, "JWT_ACCESS_SECRET");
        validateSecret(refreshSecret, "JWT_REFRESH_SECRET");
        if (accessSecret.equals(refreshSecret)) {
            throw new IllegalStateException("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different");
        }
        accessKey  = Keys.hmacShaKeyFor(accessSecret.getBytes(StandardCharsets.UTF_8));
        refreshKey = Keys.hmacShaKeyFor(refreshSecret.getBytes(StandardCharsets.UTF_8));
        log.info("✅ JWT configured — access={}ms refresh={}ms", accessExpirationMs, refreshExpirationMs);
    }

    private void validateSecret(String secret, String name) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(name + " is missing or empty");
        }
        if (secret.length() < 32) {
            throw new IllegalStateException(name + " must be at least 32 characters");
        }
    }

    // ── Token generation ──────────────────────────────────────────────────────

    public String generateAccessToken(Long userId, UserRole role, String email) {
        return buildToken(userId, role, email, accessKey, accessExpirationMs);
    }

    public String generateRefreshToken(Long userId, UserRole role, String email) {
        return buildToken(userId, role, email, refreshKey, refreshExpirationMs);
    }

    private String buildToken(Long userId, UserRole role, String email,
                               SecretKey key, long expirationMs) {
        Date now = new Date();
        return Jwts.builder()
                .claim("userId", userId.toString())   // string to match Node.js ObjectId strings
                .claim("role", role.name())
                .claim("email", email)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMs))
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    // ── Token parsing ─────────────────────────────────────────────────────────

    public JwtClaims parseAccessToken(String token) {
        return parseClaims(token, accessKey);
    }

    public JwtClaims parseRefreshToken(String token) {
        return parseClaims(token, refreshKey);
    }

    private JwtClaims parseClaims(String token, SecretKey key) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            return JwtClaims.builder()
                    .userId(Long.valueOf(claims.get("userId", String.class)))
                    .role(UserRole.valueOf(claims.get("role", String.class)))
                    .email(claims.get("email", String.class))
                    .build();
        } catch (ExpiredJwtException e) {
            throw ApiException.unauthorized("Token has expired");
        } catch (JwtException e) {
            throw ApiException.unauthorized("Invalid or expired token");
        }
    }

    public long getRefreshExpirationMs() {
        return refreshExpirationMs;
    }
}
