export const SERVICES = [
  'Bike Repair',
  'Car Repair',
  'Tyre Puncture',
  'Battery Jump-Start',
  'Fuel Delivery',
  'Electrical Repair',
  'Engine Repair',
  'Brake Repair',
  'Towing',
  'Emergency Roadside Help',
  'Oil Change',
  'AC Repair',
  'Denting & Painting',
  'General Maintenance'
];

export const ISSUE_CATEGORIES = [
  { value: 'TYRE_PUNCTURE', label: 'Tyre Puncture' },
  { value: 'DEAD_BATTERY', label: 'Dead Battery' },
  { value: 'VEHICLE_NOT_STARTING', label: 'Vehicle Not Starting' },
  { value: 'FUEL_SHORTAGE', label: 'Fuel Shortage' },
  { value: 'ENGINE_OVERHEATING', label: 'Engine Overheating' },
  { value: 'BRAKE_ISSUE', label: 'Brake Issue' },
  { value: 'ELECTRICAL_ISSUE', label: 'Electrical Issue' },
  { value: 'MINOR_MECHANICAL', label: 'Minor Mechanical Failure' },
  { value: 'TOWING_REQUIRED', label: 'Towing Required' },
  { value: 'OTHER', label: 'Other Emergency' }
];

export const VEHICLE_TYPES = [
  { value: 'BIKE', label: 'Bike' },
  { value: 'SCOOTER', label: 'Scooter' },
  { value: 'CAR', label: 'Car' },
  { value: 'SUV', label: 'SUV' },
  { value: 'VAN', label: 'Van' },
  { value: 'OTHER', label: 'Other' }
];

export const COMPLAINT_CATEGORIES = [
  'Payment Issue',
  'Service Quality',
  'Garage No-Show',
  'User No-Show',
  'Incorrect Quotation',
  'Behaviour Issue',
  'Verification Issue',
  'Other'
];

export const DEFAULT_BOOKING_FEE = 99;
export const PLATFORM_FEE_PERCENTAGE = 10;
export const MAX_SEARCH_RADIUS_KM = 50;
export const DEFAULT_SEARCH_RADIUS_KM = 10;
export const ITEMS_PER_PAGE = 20;

export const OTP_EXPIRY_MINUTES = 10;
export const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', ...ALLOWED_IMAGE_TYPES];
