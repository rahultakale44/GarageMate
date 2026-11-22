package com.garagemate.api.common;

/**
 * Application-wide constants.
 * Business-critical values are set here (not in application.yml) to prevent
 * accidental overrides and ensure consistency across all environments.
 */
public final class AppConstants {

    private AppConstants() {}

    // ── Payment ───────────────────────────────────────────────────────────────

    /** Booking fee charged at request creation (INR) */
    public static final int DEFAULT_BOOKING_FEE = 99;

    /** PaymentType string for demo payments */
    public static final String DEMO_BOOKING_FEE = "DEMO_BOOKING_FEE";

    /** PaymentStatus string for demo-paid state */
    public static final String DEMO_PAID = "DEMO_PAID";

    // ── Subscription plan prices (INR) ────────────────────────────────────────
    // These are authoritative; never accept prices from the client.

    public static final int DRIVER_FREE_MONTHLY     = 0;
    public static final int DRIVER_FREE_YEARLY      = 0;

    public static final int DRIVER_PRO_MONTHLY      = 199;
    public static final int DRIVER_PRO_YEARLY       = 1999;

    public static final int PARTNER_FREE_MONTHLY    = 0;
    public static final int PARTNER_FREE_YEARLY     = 0;

    public static final int PARTNER_PRO_MONTHLY     = 499;
    public static final int PARTNER_PRO_YEARLY      = 4999;

    public static final int PARTNER_BUSINESS_MONTHLY = 1499;
    public static final int PARTNER_BUSINESS_YEARLY  = 14999;

    // ── Pagination defaults ───────────────────────────────────────────────────

    public static final int DEFAULT_PAGE      = 0;
    public static final int DEFAULT_PAGE_SIZE = 10;
    public static final int MAX_PAGE_SIZE     = 100;

    // ── Nearby garages search ─────────────────────────────────────────────────

    /** Default search radius in kilometres */
    public static final double DEFAULT_SEARCH_RADIUS_KM = 10.0;
    public static final double MAX_SEARCH_RADIUS_KM     = 50.0;

    // ── Offer expiry ──────────────────────────────────────────────────────────

    /** Garage offers expire after this many minutes of inactivity */
    public static final int OFFER_EXPIRY_MINUTES = 10;

    // ── Rate limiting ─────────────────────────────────────────────────────────

    public static final int AUTH_RATE_LIMIT_CAPACITY        = 10;
    public static final int AUTH_RATE_LIMIT_REFILL_PER_MIN  = 10;

    // ── Password reset ────────────────────────────────────────────────────────

    public static final int PASSWORD_RESET_EXPIRY_HOURS = 1;
}
