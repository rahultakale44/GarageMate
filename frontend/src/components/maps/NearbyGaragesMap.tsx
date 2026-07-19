import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import MapFallback from './MapFallback';

interface GarageItem {
  _id: string;
  name: string;
  address: string;
  location?: { coordinates?: [number, number] };
  rating?: number;
  reviewCount?: number;
  isAvailable?: boolean;
  serviceRadius?: number;
  services?: string[];
  visitingCharge?: number;
  isOpen?: boolean;
  distance?: number;
}

interface NearbyGaragesMapProps {
  latitude: number | null;
  longitude: number | null;
  garages: GarageItem[];
  onSelectGarage?: (garage: GarageItem) => void;
}

const createIcon = (color: string) =>
  L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

const userIcon = createIcon('blue');
const garageIcon = createIcon('green');

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

const NearbyGaragesMap: React.FC<NearbyGaragesMapProps> = ({ latitude, longitude, garages, onSelectGarage }) => {
  const center = [latitude ?? 18.5204, longitude ?? 73.8567] as [number, number];

  if (latitude == null || longitude == null) {
    return <MapFallback message="Enable current location to view nearby garages on the map." />;
  }

  return (
    <MapContainer center={center} zoom={13} className="h-[420px] w-full overflow-hidden rounded-2xl">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterMap center={center} />
      <Marker position={center} icon={userIcon}>
        <Popup>Your location</Popup>
      </Marker>
      {garages.map((garage) => {
        const coords = garage.location?.coordinates;
        if (!coords || coords.length < 2) {
          return null;
        }

        const garagePosition = [coords[1], coords[0]] as [number, number];
        return (
          <Marker key={garage._id} position={garagePosition} icon={garageIcon} eventHandlers={{ click: () => onSelectGarage?.(garage) }}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-dark-900">{garage.name}</p>
                <p className="text-dark-600">{garage.address}</p>
                <p className="mt-1 text-xs text-dark-500">{garage.distance?.toFixed(1)} km away</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default NearbyGaragesMap;
