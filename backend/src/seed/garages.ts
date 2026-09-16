/**
 * Demo Garage Seed Script
 * 
 * Creates demo garages around Pune for development and testing.
 * Idempotent: Running multiple times won't create duplicates.
 */

import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase } from '../config/database';
import { User } from '../models/User';
import { Garage } from '../models/Garage';
import { UserRole, VerificationStatus } from '../types';

interface DemoGarageData {
  name: string;
  ownerName: string;
  ownerEmail: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  locality: string;
  latitude: number;
  longitude: number;
  services: string[];
  openingTime: string;
  closingTime: string;
  is24x7?: boolean;
  weeklyOff?: string;
  supportedVehicleTypes: string[];
  serviceRadius: number;
  visitingCharge?: number;
}

const DEMO_GARAGES: DemoGarageData[] = [
  {
    name: 'Loni Auto Care',
    ownerName: 'Demo Owner - Loni',
    ownerEmail: 'demo.loni@garagemate.com',
    phone: '9876543210',
    address: 'Shop No 5, Loni Kalbhor Road',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '412201',
    locality: 'Loni Kalbhor',
    latitude: 18.4723,
    longitude: 73.9385,
    services: ['Tyre Puncture', 'Battery Jump-Start', 'Engine Repair', 'Towing'],
    openingTime: '08:00',
    closingTime: '20:00',
    weeklyOff: 'Sunday',
    supportedVehicleTypes: ['CAR', 'BIKE', 'SUV'],
    serviceRadius: 8,
    visitingCharge: 200,
  },
  {
    name: 'Highway Tyre Assistance',
    ownerName: 'Demo Owner - Highway',
    ownerEmail: 'demo.highway@garagemate.com',
    phone: '9876543211',
    address: 'Near Tulaja Bhavani Mandir, Pune-Solapur Road',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '412105',
    locality: 'Hadapsar',
    latitude: 18.5018,
    longitude: 73.9278,
    services: ['Tyre Puncture', 'Tyre Replacement', 'Towing', 'Emergency Roadside Help'],
    openingTime: '00:00',
    closingTime: '23:59',
    is24x7: true,
    supportedVehicleTypes: ['CAR', 'BIKE', 'SUV', 'VAN'],
    serviceRadius: 15,
    visitingCharge: 150,
  },
  {
    name: 'Sai Battery and Electricals',
    ownerName: 'Demo Owner - Sai',
    ownerEmail: 'demo.sai@garagemate.com',
    phone: '9876543212',
    address: 'Shop 12, Manjari Road',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '412307',
    locality: 'Manjari',
    latitude: 18.5248,
    longitude: 73.9917,
    services: ['Battery Jump-Start', 'Battery Replacement', 'Electrical Repair', 'AC Repair'],
    openingTime: '07:00',
    closingTime: '21:00',
    supportedVehicleTypes: ['CAR', 'SUV'],
    serviceRadius: 10,
    visitingCharge: 250,
  },
  {
    name: 'Kadam Motors',
    ownerName: 'Demo Owner - Kadam',
    ownerEmail: 'demo.kadam@garagemate.com',
    phone: '9876543213',
    address: 'Near EON IT Park, Kharadi',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411014',
    locality: 'Kharadi',
    latitude: 18.5515,
    longitude: 73.9475,
    services: ['Engine Repair', 'Brake Repair', 'Oil Change', 'Car Repair'],
    openingTime: '09:00',
    closingTime: '19:00',
    weeklyOff: 'Sunday',
    supportedVehicleTypes: ['CAR', 'SUV'],
    serviceRadius: 12,
    visitingCharge: 300,
  },
  {
    name: 'Pune Road Rescue',
    ownerName: 'Demo Owner - Rescue',
    ownerEmail: 'demo.rescue@garagemate.com',
    phone: '9876543214',
    address: 'Wagholi Chowk, Nagar Road',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '412207',
    locality: 'Wagholi',
    latitude: 18.5790,
    longitude: 73.9822,
    services: ['Towing', 'Emergency Roadside Help', 'Fuel Delivery', 'Battery Jump-Start'],
    openingTime: '00:00',
    closingTime: '23:59',
    is24x7: true,
    supportedVehicleTypes: ['CAR', 'BIKE', 'SUV', 'VAN'],
    serviceRadius: 20,
    visitingCharge: 180,
  },
  {
    name: 'Shree Ganesh Auto Garage',
    ownerName: 'Demo Owner - Ganesh',
    ownerEmail: 'demo.ganesh@garagemate.com',
    phone: '9876543215',
    address: 'Near NIBM Road, Kondhwa',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411048',
    locality: 'Kondhwa',
    latitude: 18.4625,
    longitude: 73.8956,
    services: ['Bike Repair', 'Scooter Repair', 'Tyre Puncture', 'Oil Change'],
    openingTime: '08:00',
    closingTime: '20:00',
    supportedVehicleTypes: ['BIKE', 'SCOOTER'],
    serviceRadius: 7,
    visitingCharge: 150,
  },
  {
    name: 'City Wheels Garage',
    ownerName: 'Demo Owner - City',
    ownerEmail: 'demo.city@garagemate.com',
    phone: '9876543216',
    address: 'Near Phoenix Mall, Viman Nagar',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411014',
    locality: 'Viman Nagar',
    latitude: 18.5679,
    longitude: 73.9143,
    services: ['Car Repair', 'Engine Repair', 'Brake Repair', 'AC Repair', 'Oil Change'],
    openingTime: '09:00',
    closingTime: '21:00',
    supportedVehicleTypes: ['CAR', 'SUV'],
    serviceRadius: 10,
    visitingCharge: 250,
  },
  {
    name: 'Express Car Care',
    ownerName: 'Demo Owner - Express',
    ownerEmail: 'demo.express@garagemate.com',
    phone: '9876543217',
    address: 'Magarpatta Road, Hadapsar',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411028',
    locality: 'Hadapsar',
    latitude: 18.5195,
    longitude: 73.9240,
    services: ['Car Repair', 'Engine Repair', 'Electrical Repair', 'Oil Change'],
    openingTime: '08:30',
    closingTime: '20:30',
    weeklyOff: 'Sunday',
    supportedVehicleTypes: ['CAR', 'SUV'],
    serviceRadius: 9,
    visitingCharge: 200,
  },
  {
    name: 'Reliable Bike Assistance',
    ownerName: 'Demo Owner - Reliable',
    ownerEmail: 'demo.reliable@garagemate.com',
    phone: '9876543218',
    address: 'Fatimanagar, Wanowrie',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411040',
    locality: 'Wanowrie',
    latitude: 18.4802,
    longitude: 73.9165,
    services: ['Bike Repair', 'Tyre Puncture', 'Battery Jump-Start', 'Emergency Roadside Help'],
    openingTime: '07:00',
    closingTime: '22:00',
    supportedVehicleTypes: ['BIKE', 'SCOOTER'],
    serviceRadius: 8,
    visitingCharge: 100,
  },
  {
    name: 'East Pune Auto Service',
    ownerName: 'Demo Owner - East',
    ownerEmail: 'demo.east@garagemate.com',
    phone: '9876543219',
    address: 'Pune-Solapur Road, Near Kedari Nagar',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '412308',
    locality: 'Kedari Nagar',
    latitude: 18.5100,
    longitude: 74.0200,
    services: ['Car Repair', 'Bike Repair', 'Tyre Puncture', 'Engine Repair', 'Towing'],
    openingTime: '08:00',
    closingTime: '20:00',
    supportedVehicleTypes: ['CAR', 'BIKE', 'SUV', 'SCOOTER'],
    serviceRadius: 15,
    visitingCharge: 220,
  },
];

const DEFAULT_PASSWORD = 'DemoGarage@123';

async function seedGarages() {
  try {
    console.log('\n🌱 Starting Garage Seed Script...\n');

    await connectDatabase();

    let createdCount = 0;
    let updatedCount = 0;

    for (const garageData of DEMO_GARAGES) {
      // Check if owner exists
      let owner = await User.findOne({ email: garageData.ownerEmail });

      if (!owner) {
        // Create demo owner account
        owner = await User.create({
          name: garageData.ownerName,
          email: garageData.ownerEmail,
          mobile: garageData.phone,
          password: DEFAULT_PASSWORD,
          role: UserRole.GARAGE_OWNER,
        });
        console.log(`✅ Created demo owner: ${garageData.ownerName}`);
      }

      // Check if garage exists
      let garage = await Garage.findOne({ owner: owner._id });

      if (!garage) {
        // Create new garage
        garage = await Garage.create({
          owner: owner._id,
          name: garageData.name,
          phone: garageData.phone,
          address: garageData.address,
          city: garageData.city,
          state: garageData.state,
          pincode: garageData.pincode,
          location: {
            type: 'Point',
            coordinates: [garageData.longitude, garageData.latitude], // [lng, lat]
          },
          services: garageData.services,
          openingTime: garageData.openingTime,
          closingTime: garageData.closingTime,
          is24x7: garageData.is24x7 || false,
          weeklyOff: garageData.weeklyOff,
          supportedVehicleTypes: garageData.supportedVehicleTypes,
          serviceRadius: garageData.serviceRadius,
          visitingCharge: garageData.visitingCharge || 200,
          numberOfMechanics: 2,
          verificationStatus: VerificationStatus.APPROVED,
          isAvailable: true,
          rating: 4.0 + Math.random(), // Random rating 4.0-5.0
          reviewCount: Math.floor(Math.random() * 50) + 10, // Random 10-60 reviews
          isDemo: true,
          ownerConnected: false,
          dispatchEnabled: false,
        });
        createdCount++;
        console.log(`✅ Created garage: ${garageData.name} at ${garageData.locality}`);
      } else {
        // Update existing garage to ensure it's approved and available
        garage.verificationStatus = VerificationStatus.APPROVED;
        garage.isAvailable = true;
        garage.isDemo = true;
        garage.ownerConnected = false;
        garage.dispatchEnabled = false;
        await garage.save();
        updatedCount++;
        console.log(`♻️  Updated garage: ${garageData.name}`);
      }
    }

    console.log('\n✅ Garage Seed Complete!');
    console.log(`📊 Summary:`);
    console.log(`   - Created: ${createdCount} garages`);
    console.log(`   - Updated: ${updatedCount} garages`);
    console.log(`   - Total demo garages: ${DEMO_GARAGES.length}`);
    console.log(`\n💡 Demo owner login: ${DEMO_GARAGES[0].ownerEmail}`);
    console.log(`   Password: ${DEFAULT_PASSWORD}\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Garage Seed Failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedGarages();
}

export { seedGarages };
