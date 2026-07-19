import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useMemo, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import MapFallback from './MapFallback';

interface LocationPickerMapProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  onAddressChange?: (address: string) => void;
}

const createIcon = (color: string) =>
  L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

const pinIcon = createIcon('red');

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

function MapClickHandler({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (event) => {
      onLocationChange(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

const LocationPickerMap: React.FC<LocationPickerMapProps> = ({ latitude, longitude, onLocationChange }) => {
  const [ready, setReady] = useState(false);
  const center = useMemo(() => [latitude ?? 18.5204, longitude ?? 73.8567] as [number, number], [latitude, longitude]);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return <MapFallback message="Preparing the map…" />;
  }

  return (
    <MapContainer center={center} zoom={13} className="h-[320px] w-full rounded-2xl overflow-hidden">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterMap center={center} />
      <MapClickHandler onLocationChange={onLocationChange} />
      {latitude != null && longitude != null && <Marker position={center} icon={pinIcon} />}
    </MapContainer>
  );
};

export default LocationPickerMap;
