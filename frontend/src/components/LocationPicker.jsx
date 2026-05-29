import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function CenterUpdater({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom(), { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

function ClickHandler({ onPlace }) {
  useMapEvents({
    click(e) {
      onPlace(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const defaultCenter = [-24.1872, -66.4742];

export default function LocationPicker({ lat, lng, onChange, height = 300 }) {
  const hasCoords = lat && lng;
  const center = hasCoords ? [lat, lng] : defaultCenter;
  const tileUrl = import.meta.env.VITE_MAP_TILE_URL || "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  function handlePlace(newLat, newLng) {
    onChange({ latitud: newLat.toFixed(6), longitud: newLng.toFixed(6) });
  }

  function handleDrag(e) {
    const pos = e.target.getLatLng();
    onChange({ latitud: pos.lat.toFixed(6), longitud: pos.lng.toFixed(6) });
  }

  return (
    <div style={{ borderRadius: 8, overflow: "hidden", height, border: "1px solid var(--borde)" }}>
      <MapContainer
        center={center}
        zoom={14}
        style={{ width: "100%", height: "100%" }}
        zoomControl={true}
        attributionControl={false}
      >
        <CenterUpdater lat={lat} lng={lng} />
        <ClickHandler onPlace={handlePlace} />
        <TileLayer url={tileUrl} />
        {hasCoords && (
          <Marker
            position={[lat, lng]}
            draggable={true}
            eventHandlers={{ dragend: handleDrag }}
          />
        )}
      </MapContainer>
    </div>
  );
}
