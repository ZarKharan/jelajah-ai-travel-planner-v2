"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Popup, Polyline, TileLayer, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { ExternalLink, Layers, MapPin } from "lucide-react";

type MapPlace = {
  id: number;
  name: string;
  area?: string;
  day?: number;
};

type MapMode = "street" | "satellite" | "terrain";
type LocatedPlace = MapPlace & { lat: number; lon: number };

const tileModes: Record<MapMode, { label: string; url: string; attribution: string; maxZoom?: number }> = {
  street: {
    label: "Jalan",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  satellite: {
    label: "Satelit",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: 'Tiles &copy; <a href="https://www.esri.com/" target="_blank" rel="noreferrer">Esri</a> and its data providers',
    maxZoom: 19,
  },
  terrain: {
    label: "Medan",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org/" target="_blank" rel="noreferrer">OpenTopoMap</a>',
    maxZoom: 17,
  },
};

async function geocode(query: string): Promise<{ lat: number; lon: number } | null> {
  try {
    // Photon provides public geocoding. Use gently; for production, choose a provider with an SLA.
    const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1&lang=en`);
    if (!response.ok) return null;
    const data = await response.json();
    const coordinates = data?.features?.[0]?.geometry?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
    return { lon: Number(coordinates[0]), lat: Number(coordinates[1]) };
  } catch {
    return null;
  }
}

function Recenter({ center, zoom }: { center: LatLngExpression; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

export default function LeafletMapView({
  city,
  places,
  selectedPlaceId,
  onSelectPlace,
  avatarName = "Traveler",
  avatarGender = "Laki-laki",
}: {
  city: string;
  places: MapPlace[];
  selectedPlaceId: number | null;
  onSelectPlace: (id: number) => void;
  avatarName?: string;
  avatarGender?: string;
}) {
  const [mode, setMode] = useState<MapMode>("street");
  const [cityCenter, setCityCenter] = useState<{ lat: number; lon: number }>({ lat: -2.5, lon: 118 });
  const [locatedPlaces, setLocatedPlaces] = useState<LocatedPlace[]>([]);
  const [mapMessage, setMapMessage] = useState("Mencari lokasi kota...");
  const activeTiles = tileModes[mode];
  const center: LatLngExpression = useMemo(() => [cityCenter.lat, cityCenter.lon], [cityCenter.lat, cityCenter.lon]);

  useEffect(() => {
    let cancelled = false;
    setMapMessage(`Mencari ${city}...`);
    setLocatedPlaces([]);
    (async () => {
      const foundCity = await geocode(`${city}, Indonesia`);
      if (cancelled) return;
      if (foundCity) {
        setCityCenter(foundCity);
        setMapMessage("");
      } else {
        setCityCenter({ lat: -2.5, lon: 118 });
        setMapMessage(`Lokasi “${city}” belum ditemukan. Coba tambahkan kabupaten/provinsi.`);
        return;
      }

      const results: LocatedPlace[] = [];
      // Limit geocoding requests to visible stops; public geocoders are shared services.
      for (const place of places.slice(0, 8)) {
        if (cancelled) return;
        const result = await geocode(`${place.name}${place.area ? `, ${place.area}` : ""}, ${city}, Indonesia`);
        if (result) results.push({ ...place, ...result });
        // Small pause to avoid hammering the public geocoder.
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      if (!cancelled) {
        setLocatedPlaces(results);
        setMapMessage(results.length ? "" : "Peta kota tampil, tetapi koordinat tempat wisata belum ditemukan.");
      }
    })();
    return () => { cancelled = true; };
  }, [city, places]);

  return (
    <div className="map-canvas" style={{ position: "relative", overflow: "hidden", background: "#e9efe8" }}>
      <div style={{ position: "absolute", zIndex: 500, top: 12, right: 12, display: "flex", gap: 4, padding: 4, borderRadius: 12, background: "rgba(255,254,250,.96)", border: "1px solid #e0e5d9", boxShadow: "0 4px 18px #26372e18" }} aria-label="Mode peta">
        {(["street", "satellite", "terrain"] as MapMode[]).map((item) => (
          <button key={item} type="button" onClick={() => setMode(item)} aria-pressed={mode === item} style={{ border: 0, borderRadius: 8, padding: "7px 9px", fontSize: 11, fontWeight: 700, cursor: "pointer", background: mode === item ? "#08664f" : "transparent", color: mode === item ? "white" : "#35473d", display: "inline-flex", alignItems: "center", gap: 5 }}>
            {item === "satellite" ? <Layers size={13} /> : item === "street" ? <MapPin size={13} /> : null}{tileModes[item].label}
          </button>
        ))}
      </div>
      <MapContainer center={center} zoom={5} scrollWheelZoom className="leaflet-map" style={{ width: "100%", height: "100%", minHeight: 360 }}>
        <Recenter center={center} zoom={cityCenter.lat === -2.5 && cityCenter.lon === 118 ? 5 : 12} />
        <TileLayer key={mode} url={activeTiles.url} attribution={activeTiles.attribution} maxZoom={activeTiles.maxZoom ?? 18} />
        {locatedPlaces.length > 1 && <Polyline positions={locatedPlaces.map((place) => [place.lat, place.lon] as [number, number])} pathOptions={{ color: "#08765a", weight: 3, opacity: 0.72, dashArray: "7 7" }} />}
        {locatedPlaces.map((place, index) => (
          <CircleMarker
            key={`${place.id}-${place.lat}-${place.lon}`}
            center={[place.lat, place.lon]}
            radius={place.id === selectedPlaceId ? 11 : 8}
            pathOptions={{ color: "#fffefa", weight: 3, fillColor: place.id === selectedPlaceId ? "#b76b3b" : "#08664f", fillOpacity: 1 }}
            eventHandlers={{ click: () => onSelectPlace(place.id) }}
          >
            <Popup>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}><span style={{ display: "inline-grid", placeItems: "center", width: 28, height: 28, borderRadius: "50%", background: "#d9eee4", fontSize: 17 }}>{avatarGender === "Perempuan" ? "👧🏻" : "👦🏻"}</span><span><strong>{avatarName}</strong><br/><small>Traveler · {index + 1}/{locatedPlaces.length}</small></span></div><strong>{place.name}</strong>
              <br />{place.area || city}
              <br /><a href={`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lon}#map=16/${place.lat}/${place.lon}`} target="_blank" rel="noreferrer">Lihat detail peta <ExternalLink size={11} style={{ display: "inline" }} /></a>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      {mapMessage && (
        <div style={{ position: "absolute", zIndex: 450, left: 12, right: 12, bottom: 12, background: "#fffefa", border: "1px solid #e0e5d9", borderRadius: 10, padding: 10, fontSize: 11, lineHeight: 1.5, boxShadow: "0 4px 18px #26372e18" }}>
          {mapMessage}
        </div>
      )}
    </div>
  );
}
