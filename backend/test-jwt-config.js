/**
 * JWT Configuration Test Script
 * 
 * This script tests JWT configuration validation in various scenarios.
 * Run with: node test-jwt-config.js
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const envPath = path.join(__dirname, '.env');
const envBackupPath = path.join(__dirname, '.env.backup');

// Test results
const results = [];

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function testHeader(testName) {
  log(`\n${'='.repeat(60)}`, colors.blue);
  log(`TEST: ${testName}`, colors.bright);
  log('='.repeat(60), colors.blue);
}

function backupEnv() {
  if (fs.existsSync(envPath)) {
    fs.copyFileSync(envPath, envBackupPath);
    log('✓ Backed up .env file', colors.green);
  }
}

function restoreEnv() {
  if (fs.existsSync(envBackupPath)) {
    fs.copyFileSync(envBackupPath, envPath);
    fs.unlinkSync(envBackupPath);
    log('✓ Restored original .env file', colors.green);
  }
}

function createTestEnv(config) {
  const baseConfig = `PORT=5000
NODE_ENV=${config.NODE_ENV || 'development'}
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/garagemate-test
${config.JWT_ACCESS_SECRET !== undefined ? `JWT_ACCESS_SECRET=${config.JWT_ACCESS_SECRET}` : ''}
${config.JWT_REFRESH_SECRET !== undefined ? `JWT_REFRESH_SECRET=${config.JWT_REFRESH_SECRET}` : ''}
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
`;
  fs.writeFileSync(envPath, baseConfig);
}

function runServerTest(testName, envConfig, shouldSucceed) {
  return new Promise((resolve) => {
    testHeader(testName);
    
    createTestEnv(envConfig);
    
    log(`Starting server with configuration:`, colors.yellow);
    Object.keys(envConfig).forEach(key => {
      const value = envConfig[key] === '' ? '<empty>' : 
                    envConfig[key] === undefined ? '<missing>' : 
                    envConfig[key];
      log(`  ${key}: ${value}`);
    });
    
    const server = spawn('npm', ['run', 'dev'], {
      cwd: __dirname,
      shell: true,
      env: { ...process.env, FORCE_COLOR: '0' }
    });

    let output = '';
    let errorOutput = '';
    let serverStarted = false;
    let validationFailed = false;

    const timeout = setTimeout(() => {
      server.kill();
      
      if (shouldSucceed && serverStarted) {
        log(`✅ PASS: Server started successfully (expected)`, colors.green);
        results.push({ test: testName, status: 'PASS' });
      } else if (!shouldSucceed && !serverStarted && validationFailed) {
        log(`✅ PASS: Server failed to start (expected)`, colors.green);
        results.push({ test: testName, status: 'PASS' });
      } else if (shouldSucceed && !serverStarted) {
        log(`❌ FAIL: Server should have started but didn't`, colors.red);
        results.push({ test: testName, status: 'FAIL' });
      } else if (!shouldSucceed && serverStarted) {
        log(`❌ FAIL: Server started but should have failed`, colors.red);
        results.push({ test: testName, status: 'FAIL' });
      }
      
      resolve();
    }, 10000); // 10 second timeout

    server.stdout.on('data', (data) => {
      output += data.toString();
      const text = data.toString();
      
      if (text.includes('Server running on port')) {
        serverStarted = true;
        clearTimeout(timeout);
        server.kill();
        
        if (shouldSucceed) {
          log(`✅ PASS: Server started successfully`, colors.green);
          results.push({ test: testName, status: 'PASS' });
        } else {
          log(`❌ FAIL: Server started but should have failed validation`, colors.red);
          results.push({ test: testName, status: 'FAIL' });
        }
        
        setTimeout(resolve, 500);
      }
      
      if (text.includes('JWT configuration validated successfully')) {
        log(`  ✓ JWT validation passed`, colors.green);
      }
    });

    server.stderr.on('data', (data) => {
      errorOutput += data.toString();
      const text = data.toString();
      
      if (text.includes('JWT configuration is invalid')) {
        validationFailed = true;
        log(`  ✓ Validation correctly rejected configuration`, colors.green);
      }
      
      if (text.includes('Failed to start server')) {
        clearTimeout(timeout);
        server.kill();
        
        if (!shouldSucceed && validationFailed) {
          log(`✅ PASS: Server failed validation (expected)`, colors.green);
          results.push({ test: testName, status: 'PASS' });
        } else if (shouldSucceed) {
          log(`❌ FAIL: Server failed but should have started`, colors.red);
          results.push({ test: testName, status: 'FAIL' });
        }
        
        setTimeout(resolve, 500);
      }
    });

    server.on('error', (error) => {
      clearTimeout(timeout);
      log(`Error running test: ${error.message}`, colors.red);
      results.push({ test: testName, status: 'ERROR' });
      resolve();
    });
  });
}

async function runAllTests() {
  log('\n' + '='.repeat(60), colors.bright);
  log('JWT CONFIGURATION VALIDATION TEST SUITE', colors.bright);
  log('='.repeat(60) + '\n', colors.bright);

  backupEnv();

  try {
    // TEST 1: Missing JWT_ACCESS_SECRET
    await runServerTest(
      'TEST 1: Missing JWT_ACCESS_SECRET',
      {
        JWT_ACCESS_SECRET: undefined,
        JWT_REFRESH_SECRET: 'valid-refresh-secret-for-testing-purposes-minimum-32-chars',
        NODE_ENV: 'development'
      },
      false // Should fail
    );

    // TEST 2: Empty JWT_ACCESS_SECRET
    await runServerTest(
      'TEST 2: Empty JWT_ACCESS_SECRET',
      {
        JWT_ACCESS_SECRET: '',
        JWT_REFRESH_SECRET: 'valid-refresh-secret-for-testing-purposes-minimum-32-chars',
        NODE_ENV: 'development'
      },
      false // Should fail
    );

    // TEST 3: Whitespace-only secret
    await runServerTest(
      'TEST 3: Whitespace-only JWT_ACCESS_SECRET',
      {
        JWT_ACCESS_SECRET: '   ',
        JWT_REFRESH_SECRET: 'valid-refresh-secret-for-testing-purposes-minimum-32-chars',
        NODE_ENV: 'development'
      },
      false // Should fail
    );

    // TEST 4: Production with placeholder secret
    await runServerTest(
      'TEST 4: Production with insecure placeholder',
      {
        JWT_ACCESS_SECRET: 'dev-access-secret-change-me',
        JWT_REFRESH_SECRET: 'dev-refresh-secret-change-me',
        NODE_ENV: 'production'
      },
      false // Should fail in production
    );

    // TEST 5: Production with short secret
    await runServerTest(
      'TEST 5: Production with short secret (<32 chars)',
      {
        JWT_ACCESS_SECRET: 'short-secret',
        JWT_REFRESH_SECRET: 'another-short',
        NODE_ENV: 'production'
      },
      false // Should fail in production
    );

    // TEST 6: Same secret for access and refresh
    await runServerTest(
      'TEST 6: Same secret for access and refresh tokens',
      {
        JWT_ACCESS_SECRET: 'same-secret-used-for-both-tokens-minimum-32-characters',
        JWT_REFRESH_SECRET: 'same-secret-used-for-both-tokens-minimum-32-characters',
        NODE_ENV: 'development'
      },
      false // Should fail
    );

    // TEST 7: Valid development configuration
    await runServerTest(
      'TEST 7: Valid development configuration',
      {
        JWT_ACCESS_SECRET: 'valid-access-secret-for-development-testing-minimum-32-chars',
        JWT_REFRESH_SECRET: 'valid-refresh-secret-for-development-testing-minimum-32-chars',
        NODE_ENV: 'development'
      },
      true // Should succeed
    );

    // TEST 8: Valid production configuration
    await runServerTest(
      'TEST 8: Valid production configuration',
      {
        JWT_ACCESS_SECRET: 'a8f3k2m9x4b7c1n5e6q8w2r4t7y9u1i3o5p8s2d4f6g8h1j3k5m7n9b2v4',
        JWT_REFRESH_SECRET: 'x9m2k8f3a7c1b4n6e5q2w8r7t4y1u9i3o8p5s1d2f4g6h8j1k3m5n7b9v2',
        NODE_ENV: 'production'
      },
      true // Should succeed
    );

    // Print summary
    log('\n' + '='.repeat(60), colors.bright);
    log('TEST SUMMARY', colors.bright);
    log('='.repeat(60), colors.bright);
    
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const errors = results.filter(r => r.status === 'ERROR').length;
    
    results.forEach(result => {
      const symbol = result.status === 'PASS' ? '✅' : 
                    result.status === 'FAIL' ? '❌' : '⚠️';
      const color = result.status === 'PASS' ? colors.green :
                   result.status === 'FAIL' ? colors.red : colors.yellow;
      log(`${symbol} ${result.test}: ${result.status}`, color);
    });
    
    log(`\nTotal: ${results.length} tests`, colors.bright);
    log(`Passed: ${passed}`, colors.green);
    if (failed > 0) log(`Failed: ${failed}`, colors.red);
    if (errors > 0) log(`Errors: ${errors}`, colors.yellow);
    
    if (failed === 0 && errors === 0) {
      log(`\n🎉 All tests passed!`, colors.green);
    } else {
      log(`\n⚠️  Some tests failed or had errors`, colors.yellow);
    }

  } finally {
    restoreEnv();
    log('\n✓ Test environment cleaned up', colors.green);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Test suite failed:', error);
  restoreEnv();
  process.exit(1);
});
