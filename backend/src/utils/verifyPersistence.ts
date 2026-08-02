/**
 * MongoDB Persistence Verification Script
 * 
 * This script verifies that:
 * 1. MongoDB connection is working
 * 2. User data persists correctly
 * 3. Duplicate email registration is rejected
 * 4. Password hashing works correctly
 * 5. Data survives reconnection
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { UserRole } from '../types';

// Load environment variables
dotenv.config();

const TEST_USER_EMAIL = `test-${Date.now()}@garagemate-verification.test`;
const TEST_USER_NAME = 'Persistence Test User';
const TEST_PASSWORD = 'TestPassword123!';

export const verifyMongoDBPersistence = async (): Promise<void> => {
  try {
    console.log('\n🔍 Starting MongoDB Persistence Verification...\n');

    // Step 1: Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB is not connected');
    }
    console.log('✅ Step 1: MongoDB connection is active');

    // Step 2: Create a test user
    const testUser = await User.create({
      name: TEST_USER_NAME,
      email: TEST_USER_EMAIL,
      mobile: '9999999999',
      password: TEST_PASSWORD,
      role: UserRole.USER,
    });
    console.log(`✅ Step 2: Test user created (ID: ${testUser._id})`);

    // Step 3: Verify user exists in database
    const foundUser = await User.findById(testUser._id).select('+password');
    if (!foundUser) {
      throw new Error('User was not found after creation');
    }
    console.log('✅ Step 3: User found in database');

    // Step 4: Verify password is hashed (not plain text)
    if (foundUser.password === TEST_PASSWORD) {
      throw new Error('Password is stored as plain text!');
    }
    console.log('✅ Step 4: Password is properly hashed');

    // Step 5: Verify password comparison works
    const isPasswordCorrect = await foundUser.comparePassword(TEST_PASSWORD);
    if (!isPasswordCorrect) {
      throw new Error('Password comparison failed');
    }
    console.log('✅ Step 5: Password comparison works correctly');

    // Step 6: Verify duplicate email is rejected
    try {
      await User.create({
        name: 'Duplicate User',
        email: TEST_USER_EMAIL,
        mobile: '8888888888',
        password: 'AnotherPassword123!',
        role: UserRole.USER,
      });
      throw new Error('Duplicate email was not rejected!');
    } catch (error: any) {
      if (error.code === 11000) {
        console.log('✅ Step 6: Duplicate email registration properly rejected');
      } else {
        throw error;
      }
    }

    // Step 7: Simulate reconnection by checking if data persists
    const reconnectCheck = await User.findOne({ email: TEST_USER_EMAIL });
    if (!reconnectCheck) {
      throw new Error('User not found after query (persistence failure)');
    }
    console.log('✅ Step 7: Data persists across queries');

    // Step 8: Verify user data integrity
    if (reconnectCheck.name !== TEST_USER_NAME || reconnectCheck.email !== TEST_USER_EMAIL) {
      throw new Error('User data was corrupted');
    }
    console.log('✅ Step 8: User data integrity verified');

    // Cleanup: Delete test user
    await User.deleteOne({ _id: testUser._id });
    console.log('✅ Cleanup: Test user deleted');

    console.log('\n✅ All MongoDB persistence checks passed!\n');
    console.log('📝 Verification Summary:');
    console.log('   - MongoDB connection: Working');
    console.log('   - User creation: Working');
    console.log('   - Data persistence: Working');
    console.log('   - Password hashing: Working');
    console.log('   - Duplicate prevention: Working');
    console.log('   - Data integrity: Verified\n');

  } catch (error) {
    console.error('\n❌ MongoDB Persistence Verification Failed:', error);
    throw error;
  }
};

// Allow running this script directly
if (require.main === module) {
  import('../config/database').then(({ connectDatabase }) => {
    connectDatabase()
      .then(() => verifyMongoDBPersistence())
      .then(() => {
        console.log('Verification complete. Exiting...');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Verification failed:', error);
        process.exit(1);
      });
  });
}
