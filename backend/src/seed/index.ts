import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { User } from '../models/User';
import { Garage } from '../models/Garage';
import { Mechanic } from '../models/Mechanic';
import { Vehicle } from '../models/Vehicle';
import { UserRole, VerificationStatus, VehicleType, MechanicStatus } from '../types';

const seedDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - comment out in production)
    await User.deleteMany({});
    await Garage.deleteMany({});
    await Mechanic.deleteMany({});
    await Vehicle.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // 1. Create Admin
    const admin = await User.create({
      name: process.env.ADMIN_NAME || 'Admin',
      email: process.env.ADMIN_EMAIL || 'admin@garagemate.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      role: UserRole.ADMIN,
    });
    console.log('✅ Admin created:', admin.email);

    // 2. Create Sample Users
    const users = await User.create([
      {
        name: 'Rajesh Kumar',
        email: 'rajesh@example.com',
        mobile: '9876543210',
        password: 'Password@123',
        role: UserRole.USER,
      },
      {
        name: 'Priya Sharma',
        email: 'priya@example.com',
        mobile: '9876543211',
        password: 'Password@123',
        role: UserRole.USER,
      },
      {
        name: 'Amit Patel',
        email: 'amit@example.com',
        mobile: '9876543212',
        password: 'Password@123',
        role: UserRole.USER,
      },
      {
        name: 'Sneha Reddy',
        email: 'sneha@example.com',
        mobile: '9876543213',
        password: 'Password@123',
        role: UserRole.USER,
      },
      {
        name: 'Vikram Singh',
        email: 'vikram@example.com',
        mobile: '9876543214',
        password: 'Password@123',
        role: UserRole.USER,
      },
    ]);
    console.log(`✅ Created ${users.length} users`);

    // 3. Create Garage Owners
    const garageOwners = await User.create([
      {
        name: 'Suresh Patil',
        email: 'suresh@garagemate.com',
        mobile: '9988776655',
        password: 'Password@123',
        role: UserRole.GARAGE_OWNER,
      },
      {
        name: 'Ramesh Naik',
        email: 'ramesh@garagemate.com',
        mobile: '9988776656',
        password: 'Password@123',
        role: UserRole.GARAGE_OWNER,
      },
      {
        name: 'Ganesh Rao',
        email: 'ganesh@garagemate.com',
        mobile: '9988776657',
        password: 'Password@123',
        role: UserRole.GARAGE_OWNER,
      },
      {
        name: 'Mahesh Kulkarni',
        email: 'mahesh@garagemate.com',
        mobile: '9988776658',
        password: 'Password@123',
        role: UserRole.GARAGE_OWNER,
      },
      {
        name: 'Dinesh Joshi',
        email: 'dinesh@garagemate.com',
        mobile: '9988776659',
        password: 'Password@123',
        role: UserRole.GARAGE_OWNER,
      },
    ]);
    console.log(`✅ Created ${garageOwners.length} garage owners`);

    // 4. Create Garages
    const garages = await Garage.create([
      {
        owner: garageOwners[0]._id,
        name: 'Patil Auto Care',
        phone: '9988776655',
        address: 'Shop No 12, MG Road, Near City Mall',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        location: {
          type: 'Point',
          coordinates: [73.8567, 18.5204],
        },
        serviceRadius: 15,
        services: ['Bike Repair', 'Car Repair', 'Tyre Puncture', 'Oil Change'],
        openingTime: '09:00',
        closingTime: '20:00',
        weeklyOff: 'Sunday',
        is24x7: false,
        numberOfMechanics: 3,
        supportedVehicleTypes: [VehicleType.BIKE, VehicleType.SCOOTER, VehicleType.CAR],
        verificationStatus: VerificationStatus.APPROVED,
        rating: 4.5,
        reviewCount: 42,
        visitingCharge: 99,
      },
      {
        owner: garageOwners[1]._id,
        name: 'Sai Tyre Works',
        phone: '9988776656',
        address: 'Plot 45, Baner Road, Opposite HP Petrol Pump',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411045',
        location: {
          type: 'Point',
          coordinates: [73.7744, 18.5587],
        },
        serviceRadius: 10,
        services: ['Tyre Puncture', 'Battery Jump-Start', 'Fuel Delivery'],
        openingTime: '08:00',
        closingTime: '22:00',
        is24x7: false,
        numberOfMechanics: 2,
        supportedVehicleTypes: [VehicleType.BIKE, VehicleType.SCOOTER, VehicleType.CAR, VehicleType.SUV],
        verificationStatus: VerificationStatus.APPROVED,
        rating: 4.7,
        reviewCount: 68,
        visitingCharge: 99,
      },
      {
        owner: garageOwners[2]._id,
        name: 'Shree Ganesh Motors',
        phone: '9988776657',
        address: 'Kothrud Main Road, Near Ideal Colony',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411038',
        location: {
          type: 'Point',
          coordinates: [73.8077, 18.5074],
        },
        serviceRadius: 20,
        services: ['Car Repair', 'Engine Repair', 'Brake Repair', 'AC Repair', 'Denting & Painting'],
        openingTime: '10:00',
        closingTime: '19:00',
        weeklyOff: 'Sunday',
        is24x7: false,
        numberOfMechanics: 5,
        supportedVehicleTypes: [VehicleType.CAR, VehicleType.SUV],
        verificationStatus: VerificationStatus.APPROVED,
        rating: 4.3,
        reviewCount: 35,
        visitingCharge: 149,
      },
      {
        owner: garageOwners[3]._id,
        name: 'City Auto Garage',
        phone: '9988776658',
        address: 'FC Road, Near Deccan Gymkhana',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411004',
        location: {
          type: 'Point',
          coordinates: [73.8395, 18.5167],
        },
        serviceRadius: 12,
        services: ['Bike Repair', 'Electrical Repair', 'Battery Jump-Start', 'General Maintenance'],
        openingTime: '09:00',
        closingTime: '21:00',
        is24x7: false,
        numberOfMechanics: 4,
        supportedVehicleTypes: [VehicleType.BIKE, VehicleType.SCOOTER],
        verificationStatus: VerificationStatus.APPROVED,
        rating: 4.6,
        reviewCount: 51,
        visitingCharge: 79,
      },
      {
        owner: garageOwners[4]._id,
        name: 'Highway Rescue Garage',
        phone: '9988776659',
        address: 'Mumbai-Pune Highway, Near Talegaon Toll',
        city: 'Talegaon',
        state: 'Maharashtra',
        pincode: '410507',
        location: {
          type: 'Point',
          coordinates: [73.6765, 18.7351],
        },
        serviceRadius: 25,
        services: ['Towing', 'Emergency Roadside Help', 'Tyre Puncture', 'Fuel Delivery', 'Battery Jump-Start'],
        is24x7: true,
        numberOfMechanics: 6,
        supportedVehicleTypes: Object.values(VehicleType),
        verificationStatus: VerificationStatus.APPROVED,
        rating: 4.8,
        reviewCount: 89,
        visitingCharge: 199,
      },
    ]);
    console.log(`✅ Created ${garages.length} garages`);

    // 5. Create Mechanics
    const mechanics = [];
    for (const garage of garages) {
      const garageMechanics = await Mechanic.create([
        {
          garageId: garage._id,
          name: `Mechanic 1 - ${garage.name}`,
          phone: '9876000001',
          skills: ['Engine Repair', 'Electrical Work'],
          vehicleExpertise: [VehicleType.BIKE, VehicleType.CAR],
          experience: 5,
          status: MechanicStatus.AVAILABLE,
        },
        {
          garageId: garage._id,
          name: `Mechanic 2 - ${garage.name}`,
          phone: '9876000002',
          skills: ['Tyre Repair', 'Battery Service'],
          vehicleExpertise: [VehicleType.CAR, VehicleType.SUV],
          experience: 3,
          status: MechanicStatus.AVAILABLE,
        },
      ]);
      mechanics.push(...garageMechanics);
    }
    console.log(`✅ Created ${mechanics.length} mechanics`);

    // 6. Create Sample Vehicles for Users
    const vehicles = [];
    for (let i = 0; i < users.length; i++) {
      const userVehicles = await Vehicle.create([
        {
          userId: users[i]._id,
          vehicleType: i % 2 === 0 ? VehicleType.BIKE : VehicleType.CAR,
          brand: i % 2 === 0 ? 'Honda' : 'Maruti',
          vehicleModel: i % 2 === 0 ? 'Activa' : 'Swift',
          registrationNumber: `MH12AB${1000 + i}`,
          fuelType: 'Petrol',
          manufacturingYear: 2020 + i,
        },
      ]);
      vehicles.push(...userVehicles);
    }
    console.log(`✅ Created ${vehicles.length} vehicles`);

    console.log('\n✅ Database seeded successfully!\n');
    console.log('📧 Admin Credentials:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'Admin@123456'}\n`);
    console.log('📧 Sample User Credentials:');
    console.log('   Email: rajesh@example.com');
    console.log('   Password: Password@123\n');
    console.log('📧 Sample Garage Owner Credentials:');
    console.log('   Email: suresh@garagemate.com');
    console.log('   Password: Password@123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seedDatabase();
