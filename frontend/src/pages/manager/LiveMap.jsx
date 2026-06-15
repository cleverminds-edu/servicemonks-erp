import { useEffect, useRef, useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { getLiveLocations } from "../../api/tracking";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };
const DEFAULT_CENTER = { lat: 19.076, lng: 72.8777 }; // Mumbai

const MAP_OPTIONS = {
  mapTypeControl: true,
  streetViewControl: true,
  fullscreenControl: true,
  zoomControl: true,
  mapId: "1cea636aac708927c0c3a0e6",
};

export default function LiveMap() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
  });

  const [locations, setLocations] = useState([]);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selected, setSelected] = useState(null);
  const mapRef = useRef(null);
  const wsRef = useRef(null);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const fitBounds = (locs) => {
    if (!mapRef.current || locs.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    locs.forEach((l) => bounds.extend({ lat: l.lat, lng: l.lng }));
    mapRef.current.fitBounds(bounds, { top: 60, right: 40, bottom: 40, left: 40 });
    if (locs.length === 1) mapRef.current.setZoom(14);
  };

  const fetchOnce = () => {
    getLiveLocations().then((locs) => {
      setLocations(locs);
      setLastUpdate(new Date());
      fitBounds(locs);
    });
  };

  useEffect(() => {
    if (!isLoaded) return;
    fetchOnce();

    const wsUrl = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/api/tracking/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      setLastUpdate(new Date());
      if (msg.type === "init") {
        setLocations(msg.locations);
        fitBounds(msg.locations);
      } else if (msg.type === "location_update") {
        setLocations((prev) => {
          const idx = prev.findIndex((l) => l.technician_id === msg.data.technician_id);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = msg.data;
            return updated;
          }
          return [...prev, msg.data];
        });
      }
    };

    const ping = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send("ping");
    }, 30000);

    return () => {
      ws.close();
      clearInterval(ping);
    };
  }, [isLoaded]);

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <p className="text-red-500 text-sm">Failed to load Google Maps. Check your API key.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <p className="text-gray-400 text-sm">Loading map…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Header */}
      <div className="p-3 bg-white border-b flex items-center justify-between">
        <div>
          <h1 className="font-bold">Live Field Map</h1>
          <p className="text-xs text-gray-500">
            {locations.length} technician{locations.length !== 1 ? "s" : ""} active
            {lastUpdate && ` · Updated ${lastUpdate.toLocaleTimeString()}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchOnce} className="p-2 rounded-full hover:bg-gray-100">
            <RefreshCw size={16} className="text-gray-500" />
          </button>
          {connected ? (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <Wifi size={14} /> Live
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <WifiOff size={14} /> Polling
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <GoogleMap
          mapContainerStyle={MAP_CONTAINER_STYLE}
          center={DEFAULT_CENTER}
          zoom={11}
          options={MAP_OPTIONS}
          onLoad={onMapLoad}
        >
          {locations.map((loc) => (
            <Marker
              key={loc.technician_id}
              position={{ lat: loc.lat, lng: loc.lng }}
              title={loc.name}
              onClick={() => setSelected(loc)}
            />
          ))}

          {selected && (
            <InfoWindow
              position={{ lat: selected.lat, lng: selected.lng }}
              onCloseClick={() => setSelected(null)}
            >
              <div className="text-sm min-w-[120px]">
                <p className="font-semibold">{selected.name}</p>
                {selected.job_id && (
                  <p className="text-gray-500 text-xs">Job #{selected.job_id}</p>
                )}
                <p className="text-gray-400 text-xs">
                  {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}
                </p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        {locations.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 rounded-xl px-6 py-4 text-center shadow">
              <p className="text-gray-500 text-sm">No technicians are currently active</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
