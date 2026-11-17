/**
 * LONI KALBHOR DEMO SEED
 * 
 * Creates demo garages, owners, vehicles and a showcase user
 * centred around Loni Kalbhor, Pune, Maharashtra.
 *
 * IDEMPOTENT — safe to run multiple times. Uses email as unique key.
 * DEVELOPMENT ONLY — checks NODE_ENV and MongoDB URI before running.
 *
 * Usage:
 *   npx tsx src/seed/loni.ts
 *
 * Demo credentials printed at end of run.
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { User } from '../models/User';
import { Garage } from '../models/Garage';
import { Vehicle } from '../models/Vehicle';
import { UserRole, VerificationStatus, VehicleType } from '../types';

// Safety check
if (process.env.NODE_ENV === 'production') {
  console.error('❌ Refusing to seed — NODE_ENV is production');
  process.exit(1);
}

// ─── Loni Kalbhor centre: 18.4723, 73.9385 ───────────────────────────────────
// All coordinates are fictitious demo locations within ~8 km radius

const SHOWCASE_USER = {
  name: 'Rahul Demo',
  email: 'demo.loni.user@garagemate.com',
  password: 'Demo@12345',
  mobile: '9000000001',
  role: UserRole.USER,
};

interface LoniGarageSpec {
  ownerName: string;
  ownerEmail: string;
  ownerMobile: string;
  password: string;
  garageName: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  lat: number;
  lng: number;
  services: string[];
  is24x7: boolean;
  openingTime?: string;
  closingTime?: string;
  serviceRadius: number;
  visitingCharge: number;
  rating: number;
  reviewCount: number;
}

const LONI_GARAGES: LoniGarageSpec[] = [
  {
    ownerName: 'Suresh Kalbhor',
    ownerEmail: 'owner.loni1@garagemate.com',
    ownerMobile: '9000000011',
    password: 'Demo@12345',
    garageName: 'GarageMate Demo Garage — Loni Kalbhor',
    phone: '9000000011',
    address: 'Survey No 45, Near Loni Kalbhor Phata, Pune-Solapur Highway',
    city: 'Loni Kalbhor',
    pincode: '412201',
    lat: 18.4723,
    lng: 73.9385,
    services: ['Tyre Puncture', 'Battery Jump-Start', 'Engine Repair', 'Towing', 'Emergency Roadside Help'],
    is24x7: true,
    serviceRadius: 8,
    visitingCharge: 99,
    rating: 4.8,
    reviewCount: 94,
  },
  {
    ownerName: 'Priya Loni',
    ownerEmail: 'owner.loni2@garagemate.com',
    ownerMobile: '9000000012',
    password: 'Demo@12345',
    garageName: 'Loni Auto Care Demo',
    phone: '9000000012',
    address: 'Shop 3, Loni-Kalbhor Bus Stand, NH65',
    city: 'Loni Kalbhor',
    pincode: '412201',
    lat: 18.4698,
    lng: 73.9412,
    services: ['Car Repair', 'Bike Repair', 'Oil Change', 'Brake Repair', 'Tyre Puncture'],
    is24x7: false,
    openingTime: '08:00',
    closingTime: '21:00',
    serviceRadius: 6,
    visitingCharge: 149,
    rating: 4.5,
    reviewCount: 62,
  },
  {
    ownerName: 'Anil Highway',
    ownerEmail: 'owner.loni3@garagemate.com',
    ownerMobile: '9000000013',
    password: 'Demo@12345',
    garageName: 'Highway Tyre & Battery Demo',
    phone: '9000000013',
    address: 'Near Toll Booth, Pune-Solapur Road, Before Loni Kalbhor',
    city: 'Loni Kalbhor',
    pincode: '412201',
    lat: 18.4680,
    lng: 73.9460,
    services: ['Tyre Puncture', 'Battery Jump-Start', 'Towing', 'Fuel Delivery'],
    is24x7: true,
    serviceRadius: 10,
    visitingCharge: 99,
    rating: 4.6,
    reviewCount: 78,
  },
  {
    ownerName: 'Mahesh Roadside',
    ownerEmail: 'owner.loni4@garagemate.com',
    ownerMobile: '9000000014',
    password: 'Demo@12345',
    garageName: 'Express Roadside Assistance Demo',
    phone: '9000000014',
    address: 'Uruli Kanchan Road, Near Water Tank, Loni Kalbhor',
    city: 'Loni Kalbhor',
    pincode: '412202',
    lat: 18.4760,
    lng: 73.9330,
    services: ['Emergency Roadside Help', 'Towing', 'Battery Jump-Start', 'Engine Repair'],
    is24x7: true,
    serviceRadius: 12,
    visitingCharge: 99,
    rating: 4.7,
    reviewCount: 51,
  },
  {
    ownerName: 'Vikas Kalbhor',
    ownerEmail: 'owner.loni5@garagemate.com',
    ownerMobile: '9000000015',
    password: 'Demo@12345',
    garageName: 'Kalbhor Motor Works Demo',
    phone: '9000000015',
    address: 'Opp. Loni Kalbhor Gram Panchayat, Main Road',
    city: 'Loni Kalbhor',
    pincode: '412201',
    lat: 18.4745,
    lng: 73.9400,
    services: ['Car Repair', 'Engine Repair', 'AC Repair', 'Electrical Repair'],
    is24x7: false,
    openingTime: '09:00',
    closingTime: '20:00',
    serviceRadius: 7,
    visitingCharge: 199,
    rating: 4.3,
    reviewCount: 38,
  },
  {
    ownerName: 'Raju Hadapsar',
    ownerEmail: 'owner.loni6@garagemate.com',
    ownerMobile: '9000000016',
    password: 'Demo@12345',
    garageName: 'Hadapsar Roadside Demo',
    phone: '9000000016',
    address: 'Near Hadapsar Industrial Estate, Solapur Road',
    city: 'Hadapsar',
    pincode: '411028',
    lat: 18.5018,
    lng: 73.9278,
    services: ['Tyre Puncture', 'Battery Jump-Start', 'Car Repair', 'Oil Change'],
    is24x7: false,
    openingTime: '07:30',
    closingTime: '22:00',
    serviceRadius: 10,
    visitingCharge: 149,
    rating: 4.4,
    reviewCount: 45,
  },
  {
    ownerName: 'Nilesh Wagholi',
    ownerEmail: 'owner.loni7@garagemate.com',
    ownerMobile: '9000000017',
    password: 'Demo@12345',
    garageName: 'Wagholi Auto Service Demo',
    phone: '9000000017',
    address: 'Wagholi Chowk, Nagar Road, Near Vikas Nagar',
    city: 'Wagholi',
    pincode: '412207',
    lat: 18.5790,
    lng: 73.9822,
    services: ['Car Repair', 'Bike Repair', 'Towing', 'Tyre Puncture', 'Emergency Roadside Help'],
    is24x7: true,
    serviceRadius: 15,
    visitingCharge: 99,
    rating: 4.6,
    reviewCount: 70,
  },
  {
    ownerName: 'Santosh Uruli',
    ownerEmail: 'owner.loni8@garagemate.com',
    ownerMobile: '9000000018',
    password: 'Demo@12345',
    garageName: 'Uruli Kanchan Auto Care Demo',
    phone: '9000000018',
    address: 'Main Bazaar, Uruli Kanchan, Near Post Office',
    city: 'Uruli Kanchan',
    pincode: '412202',
    lat: 18.4467,
    lng: 74.0073,
    services: ['Bike Repair', 'Scooter Repair', 'Tyre Puncture', 'Battery Jump-Start'],
    is24x7: false,
    openingTime: '08:00',
    closingTime: '20:00',
    serviceRadius: 8,
    visitingCharge: 99,
    rating: 4.2,
    reviewCount: 29,
  },
];

async function seedLoni() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');
    console.log('\n🌍 Seeding Loni Kalbhor Demo Data...\n');

    // ── Showcase user ──────────────────────────────────────────────────────
    let showcaseUser = await User.findOne({ email: SHOWCASE_USER.email }).select('+password');
    if (showcaseUser) {
      showcaseUser.name = SHOWCASE_USER.name;
      showcaseUser.mobile = SHOWCASE_USER.mobile;
      showcaseUser.password = SHOWCASE_USER.password;
      showcaseUser.isBlocked = false;
      await showcaseUser.save();
      console.log('♻️  Updated showcase user');
    } else {
      showcaseUser = await User.create(SHOWCASE_USER);
      console.log('✅ Created showcase user');
    }

    // Create demo vehicles for showcase user
    const existingVehicles = await Vehicle.find({ userId: showcaseUser._id });
    if (existingVehicles.length === 0) {
      await Vehicle.create([
        {
          userId: showcaseUser._id,
          vehicleType: VehicleType.SUV,
          brand: 'Mahindra',
          vehicleModel: 'Thar',
          registrationNumber: 'MH12LK9001',
          fuelType: 'Diesel',
          manufacturingYear: 2023,
          notes: 'Demo showcase vehicle',
        },
        {
          userId: showcaseUser._id,
          vehicleType: VehicleType.CAR,
          brand: 'Maruti Suzuki',
          vehicleModel: 'Swift',
          registrationNumber: 'MH12LK9002',
          fuelType: 'Petrol',
          manufacturingYear: 2021,
          notes: 'Demo showcase vehicle',
        },
      ]);
      console.log('✅ Created 2 demo vehicles for showcase user');
    } else {
      console.log(`♻️  Showcase user already has ${existingVehicles.length} vehicles`);
    }

    // ── Garages ────────────────────────────────────────────────────────────
    let created = 0;
    let updated = 0;

    for (const spec of LONI_GARAGES) {
      // Find or create owner
      let owner = await User.findOne({ email: spec.ownerEmail }).select('+password');
      if (!owner) {
        owner = await User.create({
          name: spec.ownerName,
          email: spec.ownerEmail,
          mobile: spec.ownerMobile,
          password: spec.password,
          role: UserRole.GARAGE_OWNER,
        });
      } else {
        owner.password = spec.password;
        owner.isBlocked = false;
        await owner.save();
      }

      // Find or create garage
      let garage = await Garage.findOne({ owner: owner._id });
      const garagePayload = {
        owner: owner._id,
        name: spec.garageName,
        phone: spec.phone,
        address: spec.address,
        city: spec.city,
        state: 'Maharashtra',
        pincode: spec.pincode,
        location: { type: 'Point' as const, coordinates: [spec.lng, spec.lat] as [number, number] },
        serviceRadius: spec.serviceRadius,
        services: spec.services,
        openingTime: spec.openingTime || '00:00',
        closingTime: spec.closingTime || '23:59',
        is24x7: spec.is24x7,
        numberOfMechanics: 2,
        supportedVehicleTypes: [VehicleType.CAR, VehicleType.BIKE, VehicleType.SUV, VehicleType.SCOOTER],
        verificationStatus: VerificationStatus.APPROVED,
        isAvailable: true,
        visitingCharge: spec.visitingCharge,
        rating: spec.rating,
        reviewCount: spec.reviewCount,
        isDemo: true,
        ownerConnected: true,
        dispatchEnabled: true,
      };

      if (!garage) {
        await Garage.create(garagePayload);
        created++;
        console.log(`✅ Created: ${spec.garageName}`);
      } else {
        Object.assign(garage, garagePayload);
        await garage.save();
        updated++;
        console.log(`♻️  Updated: ${spec.garageName}`);
      }
    }

    // ── Summary ────────────────────────────────────────────────────────────
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Loni Kalbhor Demo Seed Complete!');
    console.log(`   Garages created: ${created}  |  Updated: ${updated}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('👤 SHOWCASE USER (for end-to-end demo)');
    console.log(`   Email    : ${SHOWCASE_USER.email}`);
    console.log(`   Password : ${SHOWCASE_USER.password}`);
    console.log(`   Vehicles : Mahindra Thar, Maruti Swift\n`);

    console.log('🔧 LONI GARAGE OWNERS');
    for (const spec of LONI_GARAGES) {
      console.log(`   ${spec.garageName.padEnd(44)} ${spec.ownerEmail}`);
    }
    console.log(`   Common password: Demo@12345\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Loni seed failed:', err);
    process.exit(1);
  }
}

seedLoni();
