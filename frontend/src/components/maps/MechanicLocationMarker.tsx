import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface MechanicLocationMarkerProps {
  location: { latitude: number; longitude: number } | null;
  name?: string;
}

const mechanicIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const MechanicLocationMarker: React.FC<MechanicLocationMarkerProps> = ({ location, name }) => {
  if (!location) {
    return null;
  }

  return (
    <Marker position={[location.latitude, location.longitude]} icon={mechanicIcon}>
      <Popup>{name || 'Assigned mechanic'}</Popup>
    </Marker>
  );
};

export default MechanicLocationMarker;
