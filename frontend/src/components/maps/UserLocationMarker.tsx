import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const userIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface UserLocationMarkerProps {
  latitude: number | null;
  longitude: number | null;
}

const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({ latitude, longitude }) => {
  if (latitude == null || longitude == null) {
    return null;
  }

  return (
    <Marker position={[latitude, longitude]} icon={userIcon}>
      <Popup>Your location</Popup>
    </Marker>
  );
};

export default UserLocationMarker;
