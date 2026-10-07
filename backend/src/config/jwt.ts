/**
 * JWT Configuration and Validation
 * 
 * This module validates JWT secrets at startup and provides
 * centralized access to JWT configuration.
 */

interface JWTConfig {
  accessSecret: string;
  refreshSecret: string;
  accessExpiresIn: string;
  refreshExpiresIn: string;
}

// Known insecure placeholder values that must be rejected in production
const INSECURE_PLACEHOLDERS = [
  'secret',
  'your-secret',
  'your-jwt-secret',
  'change-me',
  'changeme',
  'jwt-secret',
  'jwt_secret',
  'development-secret',
  'dev-secret',
  'test-secret',
  'example',
  'placeholder',
  'todo',
  'fixme',
  'dev-access-secret-change-me',
  'dev-refresh-secret-change-me',
];

/**
 * Validates a JWT secret
 * @param secret - The secret to validate
 * @param secretName - Name for error messages
 * @param isProduction - Whether running in production
 * @throws Error if secret is invalid
 */
function validateSecret(secret: string | undefined, secretName: string, isProduction: boolean): asserts secret is string {
  // Check if secret exists
  if (!secret) {
    throw new Error(`JWT configuration is invalid: ${secretName} is missing`);
  }

  // Check if secret is empty or whitespace only
  if (secret.trim().length === 0) {
    throw new Error(`JWT configuration is invalid: ${secretName} is empty`);
  }

  // In production, enforce stricter validation
  if (isProduction) {
    // Check minimum length for production
    if (secret.length < 32) {
      throw new Error(
        `JWT configuration is invalid: ${secretName} must be at least 32 characters in production`
      );
    }

    // Check against known insecure placeholders
    const normalizedSecret = secret.toLowerCase().replace(/[_-]/g, '');
    const isInsecure = INSECURE_PLACEHOLDERS.some(
      (placeholder) => normalizedSecret.includes(placeholder.toLowerCase().replace(/[_-]/g, ''))
    );

    if (isInsecure) {
      throw new Error(
        `JWT configuration is invalid: ${secretName} appears to be a placeholder or insecure default. ` +
        `Generate a strong random secret for production.`
      );
    }
  }
}

/**
 * Validates expiration value
 * @param expiresIn - The expiration value
 * @param defaultValue - Default if not provided
 * @returns Valid expiration string
 */
function validateExpiration(expiresIn: string | undefined, defaultValue: string): string {
  if (!expiresIn) {
    return defaultValue;
  }

  // Basic validation - should be a valid duration string
  const validPattern = /^\d+[smhdw]$/;
  if (!validPattern.test(expiresIn)) {
    throw new Error(
      `JWT configuration is invalid: expiration value "${expiresIn}" is not valid. ` +
      `Use format like "15m", "7d", "1h", etc.`
    );
  }

  return expiresIn;
}

/**
 * Validates and loads JWT configuration
 * Must be called during application startup before any JWT operations
 * @throws Error if configuration is invalid
 */
export function validateJWTConfig(): JWTConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  const environment = isProduction ? 'production' : 'development';

  console.log(`🔐 Validating JWT configuration for ${environment} environment...`);

  try {
    // Validate access token secret
    validateSecret(process.env.JWT_ACCESS_SECRET, 'JWT_ACCESS_SECRET', isProduction);
    
    // Validate refresh token secret
    validateSecret(process.env.JWT_REFRESH_SECRET, 'JWT_REFRESH_SECRET', isProduction);

    // Ensure access and refresh secrets are different
    if (process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET) {
      throw new Error(
        'JWT configuration is invalid: JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different'
      );
    }

    // Validate expiration values
    const accessExpiresIn = validateExpiration(process.env.JWT_ACCESS_EXPIRES_IN, '15m');
    const refreshExpiresIn = validateExpiration(process.env.JWT_REFRESH_EXPIRES_IN, '7d');

    const config: JWTConfig = {
      accessSecret: process.env.JWT_ACCESS_SECRET!,
      refreshSecret: process.env.JWT_REFRESH_SECRET!,
      accessExpiresIn,
      refreshExpiresIn,
    };

    console.log(`✅ JWT configuration validated successfully`);
    console.log(`   - Access token expiry: ${config.accessExpiresIn}`);
    console.log(`   - Refresh token expiry: ${config.refreshExpiresIn}`);

    return config;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ ${error.message}`);
      console.error(`\n💡 To fix this:`);
      console.error(`   1. Set JWT_ACCESS_SECRET in your .env file`);
      console.error(`   2. Set JWT_REFRESH_SECRET in your .env file`);
      console.error(`   3. Use strong, unique, random secrets (minimum 32 characters)`);
      console.error(`   4. Never commit secrets to version control\n`);
      
      if (isProduction) {
        console.error(`⚠️  PRODUCTION MODE: Insecure configurations are not allowed\n`);
      }
    }
    throw error;
  }
}

// Validated configuration (loaded at startup)
let jwtConfig: JWTConfig | null = null;

/**
 * Gets the validated JWT configuration
 * @throws Error if configuration has not been validated yet
 */
export function getJWTConfig(): JWTConfig {
  if (!jwtConfig) {
    throw new Error('JWT configuration not initialized. Call validateJWTConfig() during startup.');
  }
  return jwtConfig;
}

/**
 * Initializes JWT configuration
 * Must be called during application startup
 */
export function initializeJWTConfig(): void {
  jwtConfig = validateJWTConfig();
}

