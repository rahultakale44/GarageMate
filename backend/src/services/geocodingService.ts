import NodeCache from 'node-cache';

interface GeocodeResult {
  displayName: string;
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  latitude: number;
  longitude: number;
  address: string;
}

interface NominatimAddress {
  road?: string;
  suburb?: string;
  neighbourhood?: string;
  village?: string;
  town?: string;
  city?: string;
  city_district?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

interface NominatimReverseResponse {
  display_name?: string;
  address?: NominatimAddress;
  lat?: string;
  lon?: string;
}

interface NominatimSearchResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: NominatimAddress;
}

const isNominatimReverseResponse = (value: unknown): value is NominatimReverseResponse => {
  return typeof value === 'object' && value !== null;
};

const isNominatimSearchResult = (value: unknown): value is NominatimSearchResult => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'display_name' in value &&
    'lat' in value &&
    'lon' in value &&
    typeof (value as NominatimSearchResult).display_name === 'string' &&
    typeof (value as NominatimSearchResult).lat === 'string' &&
    typeof (value as NominatimSearchResult).lon === 'string'
  );
};

const parseNominatimSearchResults = (payload: unknown): NominatimSearchResult[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.filter(isNominatimSearchResult);
};

const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
const rateLimitCache = new Map<string, number>();

const getClientKey = (ip?: string) => ip || 'default';

const isRateLimited = (key: string) => {
  const now = Date.now();
  const lastCall = rateLimitCache.get(key) || 0;
  if (now - lastCall < 1000) {
    return true;
  }
  rateLimitCache.set(key, now);
  return false;
};

/**
 * Parse Nominatim address to extract locality, city, state, pincode
 */
const parseAddress = (address?: NominatimAddress): {
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
} => {
  if (!address) {
    return {};
  }

  // Locality: suburb, neighbourhood, village, town, city_district (in priority order)
  const locality =
    address.suburb ||
    address.neighbourhood ||
    address.village ||
    address.town ||
    address.city_district ||
    undefined;

  // City: city, town, county (in priority order)
  const city = address.city || address.town || address.county || undefined;

  // State
  const state = address.state || undefined;

  // Pincode
  const pincode = address.postcode || undefined;

  // Landmark: road name
  const landmark = address.road || undefined;

  return { locality, city, state, pincode, landmark };
};

/**
 * Compose a readable display name from parsed address components
 */
const composeDisplayName = (
  locality?: string,
  city?: string,
  state?: string,
  pincode?: string
): string => {
  const parts: string[] = [];
  if (locality) parts.push(locality);
  if (city && city !== locality) parts.push(city);
  if (state) parts.push(state);
  if (pincode) parts.push(pincode);
  return parts.join(', ') || 'Location detected';
};

/**
 * Reverse geocode coordinates to address using Nominatim
 */
export const reverseGeocode = async ({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}): Promise<GeocodeResult> => {
  // Validate coordinates
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new Error('Invalid coordinates');
  }

  // Check cache
  const key = `reverse:${latitude.toFixed(4)}:${longitude.toFixed(4)}`;
  const cached = cache.get<GeocodeResult>(key);
  if (cached) {
    return cached;
  }

  try {
    // Call Nominatim with proper headers and parameters
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('lat', latitude.toString());
    url.searchParams.set('lon', longitude.toString());
    url.searchParams.set('zoom', '18');
    url.searchParams.set('addressdetails', '1');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'GarageMate/1.0 (Roadside Assistance Platform)',
        'Accept-Language': 'en',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.error(`Nominatim reverse geocode failed: ${response.status} ${response.statusText}`);
      // Return fallback with coordinates
      return {
        displayName: `Location: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        latitude,
        longitude,
        address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
      };
    }

    const payload: unknown = await response.json();

    if (!isNominatimReverseResponse(payload)) {
      console.error('Invalid Nominatim response format');
      return {
        displayName: `Location: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        latitude,
        longitude,
        address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
      };
    }

    // Parse address components
    const { locality, city, state, pincode, landmark } = parseAddress(payload.address);

    // Use Nominatim display_name or compose from components
    const displayName =
      payload.display_name || composeDisplayName(locality, city, state, pincode);

    const result: GeocodeResult = {
      displayName,
      locality,
      city,
      state,
      pincode,
      landmark,
      latitude,
      longitude,
      address: displayName,
    };

    // Cache the result
    cache.set(key, result);
    return result;
  } catch (error) {
    console.error('Reverse geocode error:', error);
    // Return fallback with coordinates instead of failing
    return {
      displayName: `Location: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
      latitude,
      longitude,
      address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    };
  }
};

/**
 * Forward geocode (search) address to coordinates using Nominatim
 */
export const searchGeocode = async (query: string): Promise<GeocodeResult[]> => {
  const cacheKey = `search:${query.toLowerCase().trim()}`;
  const cached = cache.get<GeocodeResult[]>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', '5');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('q', query);

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'GarageMate/1.0 (Roadside Assistance Platform)',
        'Accept-Language': 'en',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.error(`Nominatim search failed: ${response.status} ${response.statusText}`);
      return [];
    }

    const payload: unknown = await response.json();
    const results = parseNominatimSearchResults(payload).map((item) => {
      const { locality, city, state, pincode, landmark } = parseAddress(item.address);

      return {
        displayName: item.display_name,
        locality,
        city,
        state,
        pincode,
        landmark,
        latitude: Number(item.lat),
        longitude: Number(item.lon),
        address: item.display_name,
      };
    });

    cache.set(cacheKey, results);
    return results;
  } catch (error) {
    console.error('Forward geocode error:', error);
    return [];
  }
};

export const withRateLimit = (req: any, handler: () => Promise<any>) => {
  const key = getClientKey(req.ip || (req.headers['x-forwarded-for'] as string | undefined));
  if (isRateLimited(key)) {
    throw new Error('Rate limit exceeded. Please wait a moment.');
  }
  return handler();
};
