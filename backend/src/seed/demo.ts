/**
 * DEMO SEED SCRIPT
 * 
 * Creates demo accounts for USER, GARAGE_OWNER, and ADMIN roles.
 * This script is IDEMPOTENT - safe to run multiple times.
 * 
 * - Does NOT delete existing data
 * - Does NOT create duplicates
 * - Updates existing demo accounts if they exist
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { User } from '../models/User';
import { Garage } from '../models/Garage';
import { Vehicle } from '../models/Vehicle';
import { UserRole, VerificationStatus, VehicleType } from '../types';

// Demo account credentials
const DEMO_ACCOUNTS = {
  USER: {
    email: 'demo.user@garagemate.com',
    password: 'Demo@12345',
    name: 'Demo User',
    mobile: '9999999991',
    role: UserRole.USER,
  },
  GARAGE_OWNER: {
    email: 'demo.garage@garagemate.com',
    password: 'Demo@12345',
    name: 'Demo Garage Owner',
    mobile: '9999999992',
    role: UserRole.GARAGE_OWNER,
  },
  ADMIN: {
    email: 'demo.admin@garagemate.com',
    password: 'Demo@12345',
    name: 'Demo Admin',
    mobile: '9999999993',
    role: UserRole.ADMIN,
  },
};

const seedDemoAccounts = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    console.log('\n🎯 Creating/Updating Demo Accounts...\n');

    // 1. Create/Update Demo USER
    let demoUser = await User.findOne({ email: DEMO_ACCOUNTS.USER.email }).select('+password');
    
    if (demoUser) {
      console.log('📝 Demo USER already exists, updating...');
      demoUser.name = DEMO_ACCOUNTS.USER.name;
      demoUser.mobile = DEMO_ACCOUNTS.USER.mobile;
      demoUser.password = DEMO_ACCOUNTS.USER.password;
      demoUser.role = DEMO_ACCOUNTS.USER.role;
      demoUser.isBlocked = false;
      await demoUser.save();
      console.log('✅ Demo USER updated');
    } else {
      demoUser = await User.create(DEMO_ACCOUNTS.USER);
      console.log('✅ Demo USER created');
    }

    // 2. Create demo vehicles for USER
    const existingVehicles = await Vehicle.find({ userId: demoUser._id });
    
    if (existingVehicles.length === 0) {
      await Vehicle.create([
        {
          userId: demoUser._id,
          vehicleType: VehicleType.SUV,
          brand: 'Mahindra',
          vehicleModel: 'Thar',
          registrationNumber: 'MH12AB1234',
          fuelType: 'Diesel',
          manufacturingYear: 2023,
          notes: 'Demo vehicle for testing',
        },
        {
          userId: demoUser._id,
          vehicleType: VehicleType.SCOOTER,
          brand: 'Honda',
          vehicleModel: 'Activa 6G',
          registrationNumber: 'MH12CD5678',
          fuelType: 'Petrol',
          manufacturingYear: 2022,
          notes: 'Demo vehicle for testing',
        },
      ]);
      console.log('✅ Created 2 demo vehicles for USER');
    } else {
      console.log(`📝 Demo USER already has ${existingVehicles.length} vehicle(s)`);
    }

    // 3. Create/Update Demo GARAGE OWNER
    let demoGarageOwner = await User.findOne({ email: DEMO_ACCOUNTS.GARAGE_OWNER.email }).select('+password');
    
    if (demoGarageOwner) {
      console.log('📝 Demo GARAGE OWNER already exists, updating...');
      demoGarageOwner.name = DEMO_ACCOUNTS.GARAGE_OWNER.name;
      demoGarageOwner.mobile = DEMO_ACCOUNTS.GARAGE_OWNER.mobile;
      demoGarageOwner.password = DEMO_ACCOUNTS.GARAGE_OWNER.password;
      demoGarageOwner.role = DEMO_ACCOUNTS.GARAGE_OWNER.role;
      demoGarageOwner.isBlocked = false;
      await demoGarageOwner.save();
      console.log('✅ Demo GARAGE OWNER updated');
    } else {
      demoGarageOwner = await User.create(DEMO_ACCOUNTS.GARAGE_OWNER);
      console.log('✅ Demo GARAGE OWNER created');
    }

    // 4. Create/Update demo garage
    let demoGarage = await Garage.findOne({ owner: demoGarageOwner._id });
    
    const garageData = {
      owner: demoGarageOwner._id,
      name: 'Demo Auto Care Center',
      phone: '9999999992',
      address: 'Shop No 15, FC Road, Near Deccan Gymkhana',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411004',
      landmark: 'Opposite HDFC Bank',
      location: {
        type: 'Point' as const,
        coordinates: [73.8395, 18.5167], // Pune city center
      },
      serviceRadius: 15,
      services: [
        'Bike Repair',
        'Car Repair',
        'Tyre Puncture',
        'Oil Change',
        'Battery Jump-Start',
        'Engine Repair',
        'Brake Repair',
        'AC Repair',
        'General Maintenance',
      ],
      openingTime: '09:00',
      closingTime: '21:00',
      weeklyOff: 'Sunday',
      is24x7: false,
      numberOfMechanics: 4,
      supportedVehicleTypes: [VehicleType.BIKE, VehicleType.SCOOTER, VehicleType.CAR, VehicleType.SUV],
      verificationStatus: VerificationStatus.APPROVED,
      rating: 4.7,
      reviewCount: 156,
      isAvailable: true,
      visitingCharge: 99,
      isDemo: true,
      ownerConnected: true,
      dispatchEnabled: true,
    };

    if (demoGarage) {
      console.log('📝 Demo GARAGE already exists, updating...');
      Object.assign(demoGarage, garageData);
      await demoGarage.save();
      console.log('✅ Demo GARAGE updated');
    } else {
      demoGarage = await Garage.create(garageData);
      console.log('✅ Demo GARAGE created');
    }

    // 5. Create/Update Demo ADMIN
    let demoAdmin = await User.findOne({ email: DEMO_ACCOUNTS.ADMIN.email }).select('+password');
    
    if (demoAdmin) {
      console.log('📝 Demo ADMIN already exists, updating...');
      demoAdmin.name = DEMO_ACCOUNTS.ADMIN.name;
      demoAdmin.mobile = DEMO_ACCOUNTS.ADMIN.mobile;
      demoAdmin.password = DEMO_ACCOUNTS.ADMIN.password;
      demoAdmin.role = DEMO_ACCOUNTS.ADMIN.role;
      demoAdmin.isBlocked = false;
      await demoAdmin.save();
      console.log('✅ Demo ADMIN updated');
    } else {
      demoAdmin = await User.create(DEMO_ACCOUNTS.ADMIN);
      console.log('✅ Demo ADMIN created');
    }

    console.log('\n🎉 Demo accounts setup complete!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 DEMO CREDENTIALS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('👤 USER');
    console.log(`   Email: ${DEMO_ACCOUNTS.USER.email}`);
    console.log(`   Password: ${DEMO_ACCOUNTS.USER.password}`);
    console.log(`   Vehicles: 2 (Mahindra Thar, Honda Activa 6G)\n`);
    
    console.log('🔧 GARAGE OWNER');
    console.log(`   Email: ${DEMO_ACCOUNTS.GARAGE_OWNER.email}`);
    console.log(`   Password: ${DEMO_ACCOUNTS.GARAGE_OWNER.password}`);
    console.log(`   Garage: ${demoGarage.name}`);
    console.log(`   Location: ${demoGarage.city}, ${demoGarage.state}`);
    console.log(`   Status: ${demoGarage.verificationStatus}\n`);
    
    console.log('🛡️ ADMIN');
    console.log(`   Email: ${DEMO_ACCOUNTS.ADMIN.email}`);
    console.log(`   Password: ${DEMO_ACCOUNTS.ADMIN.password}\n`);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Demo seed failed:', error);
    process.exit(1);
  }
};

seedDemoAccounts();
