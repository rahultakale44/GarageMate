import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface GarageMarkerProps {
  garage: {
    _id: string;
    name: string;
    address: string;
    location?: { coordinates?: [number, number] };
    rating?: number;
    reviewCount?: number;
    isAvailable?: boolean;
    services?: string[];
    visitingCharge?: number;
    distance?: number;
  };
  onClick?: () => void;
}

const garageIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const GarageMarker: React.FC<GarageMarkerProps> = ({ garage, onClick }) => {
  const coords = garage.location?.coordinates;
  if (!coords || coords.length < 2) {
    return null;
  }

  return (
    <Marker position={[coords[1], coords[0]]} icon={garageIcon} eventHandlers={{ click: onClick }}>
      <Popup>
        <div className="text-sm">
          <p className="font-semibold text-dark-900">{garage.name}</p>
          <p className="text-dark-600">{garage.address}</p>
          <p className="mt-1 text-xs text-dark-500">{garage.distance?.toFixed(1)} km away</p>
        </div>
      </Popup>
    </Marker>
  );
};

export default GarageMarker;
