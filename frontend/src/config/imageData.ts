// Central image configuration for GarageMate
// Replace URLs with real local garage images from Cloudinary

export const IMAGE_URLS = {
  // Hero section
  landingHero: '',
  heroBackground: '',
  
  // Services
  tyrePuncture: '',
  batteryJumpStart: '',
  vehicleNotStarting: '',
  fuelDelivery: '',
  electricalRepair: '',
  towing: '',
  engineHelp: '',
  brakeRepair: '',
  
  // Featured garages (will be populated from backend)
  defaultGarage: '',
  garageExterior: '',
  garageInterior: '',
  garageSignboard: '',
  
  // People
  defaultOwner: '',
  defaultMechanic: '',
  defaultUser: '',
  
  // Auth backgrounds
  userAuthBg: '',
  garageAuthBg: '',
  adminAuthBg: '',
  
  // Partner section
  partnerCTA: '',
  
  // Testimonials
  testimonial1: '',
  testimonial2: '',
  testimonial3: '',
  
  // Map placeholder
  mapPlaceholder: '',
};

// Fallback for missing images
export const getImageUrl = (key: keyof typeof IMAGE_URLS): string => {
  const url = IMAGE_URLS[key];
  if (!url || url.trim() === '') {
    // Return a neutral placeholder or gradient
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect fill='%23e2e8f0' width='800' height='600'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%2394a3b8'%3EImage%3C/text%3E%3C/svg%3E`;
  }
  return url;
};

export const GARAGE_IMAGES: Record<string, string[]> = {
  // Real garage images will be added here
  // Example structure:
  // 'garage-id-123': ['url1', 'url2', 'url3']
};
