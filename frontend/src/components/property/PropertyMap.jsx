'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function PropertyMap({ lat, lng, title, zoom = 14, markers = [] }) {
  const center = [lat || 20.5937, lng || 78.9629];
  const allMarkers = lat && lng
    ? [{ lat, lng, title: title || 'Property Location' }, ...markers]
    : markers;

  return (
    <div className="w-full h-full rounded-xl overflow-hidden">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {allMarkers.map((marker, i) => (
          <Marker key={i} position={[marker.lat, marker.lng]}>
            <Popup>
              <strong>{marker.title || `Property ${i + 1}`}</strong>
              {marker.surveyNumber && <><br />Survey: {marker.surveyNumber}</>}
              {marker.city && <><br />{marker.city}</>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
