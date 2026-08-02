import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';

export interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
  locality?: string;
  city?: string;
  timestamp?: number;
}

const LOCATION_STORAGE_KEY = 'garagemate_user_location';
const LOCATION_MAX_AGE = 300000; // 5 minutes

export function useLocation() {
  const [location, setLocation] = useState<UserLocation | null>(() => {
    try {
      const saved = sessionStorage.getItem(LOCATION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as UserLocation;
        // Check if location is still fresh
        if (parsed.timestamp && Date.now() - parsed.timestamp < LOCATION_MAX_AGE) {
          return parsed;
        }
      }
    } catch {
      // Ignore parsing errors
    }
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveLocation = useCallback((loc: UserLocation) => {
    const locWithTimestamp = { ...loc, timestamp: Date.now() };
    setLocation(locWithTimestamp);
    try {
      sessionStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(locWithTimestamp));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
    try {
      sessionStorage.removeItem(LOCATION_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const requestLocation = useCallback(async () => {
    if (!navigator?.geolocation) {
      setError('Geolocation is not supported by your browser');
      return false;
    }

    setLoading(true);
    setError(null);

    return new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Validate coordinates
          if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            setError('Invalid coordinates detected');
            setLoading(false);
            resolve(false);
            return;
          }

          try {
            // Try to reverse geocode
            const response = await axiosInstance.get(API_ENDPOINTS.GARAGES.REVERSE_GEOCODE, {
              params: { latitude, longitude },
            });

            const data = response.data?.data;
            saveLocation({
              latitude,
              longitude,
              address: data?.displayName || data?.address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              locality: data?.locality,
              city: data?.city,
            });
          } catch {
            // Still save location even if reverse geocoding fails
            saveLocation({
              latitude,
              longitude,
              address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            });
          }

          setLoading(false);
          resolve(true);
        },
        (err) => {
          setLoading(false);
          if (err.code === 1) {
            setError('Location permission denied. You can enter coordinates manually.');
          } else if (err.code === 2) {
            setError('Location is currently unavailable.');
          } else if (err.code === 3) {
            setError('Location request timed out.');
          } else {
            setError('Unable to detect your location.');
          }
          resolve(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }, [saveLocation]);

  return {
    location,
    loading,
    error,
    requestLocation,
    saveLocation,
    clearLocation,
    setError,
  };
}
