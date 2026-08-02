import { MapContainer, Marker, Popup, TileLayer, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';

interface GarageItem {
  _id: string;
  name: string;
  address: string;
  location?: { coordinates?: [number, number] };
  rating?: number;
  reviewCount?: number;
  isAvailable?: boolean;
  distance?: number;
  visitingCharge?: number;
}

interface NearbyGaragesMapProps {
  latitude: number;
  longitude: number;
  garages: GarageItem[];
  onSelectGarage?: (garage: GarageItem) => void;
  selectedGarageId?: string | null;
  searchRadius?: number; // in km
  searchState?: 'idle' | 'locating' | 'searching' | 'matching' | 'complete';
}

// Fix Leaflet icon paths for Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createIcon = (color: string) =>
  L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

const userIcon = createIcon('blue');
const garageIcon = createIcon('green');
const selectedGarageIcon = createIcon('red');

interface MapControllerProps {
  center: [number, number];
  garages: GarageItem[];
  selectedGarageId?: string | null;
}

function MapController({ center, garages, selectedGarageId }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (selectedGarageId) {
      // Find and zoom to selected garage
      const garage = garages.find((g) => g._id === selectedGarageId);
      if (garage?.location?.coordinates) {
        const coords = garage.location.coordinates;
        map.setView([coords[1], coords[0]], 15, { animate: true });
      }
    } else if (garages.length > 0) {
      // Fit bounds to show all markers
      const bounds = L.latLngBounds([center]);
      garages.forEach((garage) => {
        const coords = garage.location?.coordinates;
        if (coords && coords.length >= 2) {
          bounds.extend([coords[1], coords[0]]);
        }
      });
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    } else {
      // Just center on user
      map.setView(center, 13);
    }
  }, [center, garages, selectedGarageId, map]);

  return null;
}

// Radar animation rings
function RadarAnimation({ center, isActive }: { center: [number, number]; isActive: boolean }) {
  const [rings, setRings] = useState<number[]>([]);

  useEffect(() => {
    if (!isActive) {
      setRings([]);
      return;
    }

    let ringId = 0;
    const interval = setInterval(() => {
      setRings((prev) => [...prev, ringId++].slice(-3)); // Keep last 3 rings
    }, 600);

    return () => {
      clearInterval(interval);
      setRings([]);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <>
      {rings.map((ringId) => (
        <Circle
          key={ringId}
          center={center}
          radius={0}
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.1,
            weight: 2,
            opacity: 0.6,
          }}
          ref={(circle) => {
            if (circle) {
              // Animate ring expansion
              let radius = 0;
              const maxRadius = 2000; // 2km
              const duration = 1500;
              const startTime = Date.now();

              const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = elapsed / duration;

                if (progress < 1) {
                  radius = maxRadius * progress;
                  circle.setRadius(radius);
                  circle.setStyle({
                    opacity: 0.6 * (1 - progress),
                    fillOpacity: 0.1 * (1 - progress),
                  });
                  requestAnimationFrame(animate);
                } else {
                  circle.setRadius(0);
                }
              };
              animate();
            }
          }}
        />
      ))}
    </>
  );
}

const NearbyGaragesMap: React.FC<NearbyGaragesMapProps> = ({
  latitude,
  longitude,
  garages,
  onSelectGarage,
  selectedGarageId,
  searchRadius = 10,
  searchState = 'idle',
}) => {
  const center: [number, number] = [latitude, longitude];
  const isSearching = searchState === 'searching' || searchState === 'matching' || searchState === 'locating';

  return (
    <div className="relative h-[500px] w-full">
      <MapContainer
        center={center}
        zoom={13}
        className="h-full w-full rounded-2xl"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController center={center} garages={garages} selectedGarageId={selectedGarageId} />
        
        {/* User location marker */}
        <Marker position={center} icon={userIcon}>
          <Popup>
            <div className="text-sm font-medium">Your location</div>
          </Popup>
        </Marker>

        {/* Search radius circle */}
        <Circle
          center={center}
          radius={searchRadius * 1000} // Convert km to meters
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.05,
            weight: 2,
            dashArray: '5, 10',
          }}
        />

        {/* Radar animation */}
        <RadarAnimation center={center} isActive={isSearching} />

        {/* Garage markers */}
        {garages.map((garage) => {
          const coords = garage.location?.coordinates;
          if (!coords || coords.length < 2) {
            return null;
          }

          const garagePosition: [number, number] = [coords[1], coords[0]];
          const isSelected = selectedGarageId === garage._id;

          return (
            <Marker
              key={garage._id}
              position={garagePosition}
              icon={isSelected ? selectedGarageIcon : garageIcon}
              eventHandlers={{
                click: () => onSelectGarage?.(garage),
              }}
            >
              <Popup>
                <div className="text-sm min-w-[200px]">
                  <p className="font-semibold text-dark-900 mb-1">{garage.name}</p>
                  <p className="text-xs text-dark-600 mb-2">{garage.address}</p>
                  <div className="flex items-center justify-between text-xs text-dark-500">
                    <span>{garage.distance?.toFixed(1)} km away</span>
                    <span>₹{garage.visitingCharge || 200}</span>
                  </div>
                  {garage.rating && (
                    <div className="mt-2 text-xs text-dark-600">
                      ⭐ {garage.rating.toFixed(1)} ({garage.reviewCount || 0} reviews)
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Overlay loading indicator */}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none flex items-center justify-center z-[1000]"
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-lg px-6 py-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                <div className="text-sm font-medium text-dark-900">
                  {searchState === 'locating' && 'Detecting location…'}
                  {searchState === 'searching' && 'Searching for garages…'}
                  {searchState === 'matching' && 'Matching results…'}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NearbyGaragesMap;
