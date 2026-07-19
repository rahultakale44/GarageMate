import NodeCache from 'node-cache';

interface GeocodeResult {
  displayName: string;
  latitude: number;
  longitude: number;
  address: string;
}

interface NominatimReverseResponse {
  display_name?: string;
}

interface NominatimSearchResult {
  display_name: string;
  lat: string;
  lon: string;
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

export const reverseGeocode = async ({ latitude, longitude }: { latitude: number; longitude: number }): Promise<GeocodeResult> => {
  const key = `reverse:${latitude.toFixed(4)}:${longitude.toFixed(4)}`;
  const cached = cache.get<GeocodeResult>(key);
  if (cached) {
    return cached;
  }

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
  if (!response.ok) {
    return {
      displayName: 'Address unavailable',
      latitude,
      longitude,
      address: 'Address unavailable',
    };
  }

  const payload: unknown = await response.json();
  const displayName = isNominatimReverseResponse(payload) && payload.display_name
    ? payload.display_name
    : 'Address unavailable';
  const result = {
    displayName,
    latitude,
    longitude,
    address: displayName,
  };

  cache.set(key, result);
  return result;
};

export const searchGeocode = async (query: string): Promise<GeocodeResult[]> => {
  const cacheKey = `search:${query.toLowerCase()}`;
  const cached = cache.get<GeocodeResult[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    return [];
  }

  const payload: unknown = await response.json();
  const result = parseNominatimSearchResults(payload).map((item) => ({
    displayName: item.display_name,
    latitude: Number(item.lat),
    longitude: Number(item.lon),
    address: item.display_name,
  }));

  cache.set(cacheKey, result);
  return result;
};

export const withRateLimit = (req: any, handler: () => Promise<any>) => {
  const key = getClientKey(req.ip || req.headers['x-forwarded-for'] as string | undefined);
  if (isRateLimited(key)) {
    throw new Error('Rate limit exceeded');
  }
  return handler();
};
