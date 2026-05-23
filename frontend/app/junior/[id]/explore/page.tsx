"use client";

import { useCallback, useRef, useState } from "react";
import Map, { Layer, Popup, Source, type MapRef, type MapLayerMouseEvent } from "react-map-gl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
const TILESET_MDI = process.env.NEXT_PUBLIC_MAPBOX_TILESET_MINERAL_OCCURRENCES ?? "";

const ONTARIO = { longitude: -83.5, latitude: 48.0, zoom: 5.5 };

// Child-friendly province descriptions
const PROVINCE_INFO: Record<string, { emoji: string; description: string }> = {
  GRENVILLE: {
    emoji: "💎",
    description:
      "The Gem Province! Really old rocks from about 1 billion years ago. This is where you'll find beautiful minerals like sodalite, amazonite, and green apatite.",
  },
  SUPERIOR: {
    emoji: "🔮",
    description:
      "Super ancient rocks — over 2.5 billion years old! Home to amethyst around Thunder Bay, and gold and silver deposits in the north.",
  },
  "SOUTHERN and SUPERIOR": {
    emoji: "🐚",
    description:
      "Younger rocks that were once under a warm sea! You might find fossils of ancient sea creatures, plus salt and gypsum crystals.",
  },
};

interface OmiSpot {
  lng: number;
  lat: number;
  name: string;
  commodity: string;
  status: string;
}

export default function FormationExplorerPage() {
  const { id } = useParams();
  const mapRef = useRef<MapRef>(null);
  const [popup, setPopup] = useState<OmiSpot | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleClick = useCallback((e: MapLayerMouseEvent) => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    if (map.getLayer("omi-dots")) {
      const features = map.queryRenderedFeatures(e.point, { layers: ["omi-dots"] });
      if (features.length > 0) {
        const f = features[0];
        const props = f.properties ?? {};
        setPopup({
          lng: e.lngLat.lng,
          lat: e.lngLat.lat,
          name: props.NAME ?? props.MDI_IDENT ?? "Unknown site",
          commodity: props.COMMODITY ?? "",
          status: props.STATUS ?? "",
        });
        return;
      }
    }
    setPopup(null);
  }, []);

  const handleMouseMove = useCallback((e: MapLayerMouseEvent) => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    if (map.getLayer("omi-dots")) {
      const features = map.queryRenderedFeatures(e.point, { layers: ["omi-dots"] });
      map.getCanvas().style.cursor = features.length > 0 ? "pointer" : "";
    }
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-100 bg-white shrink-0">
        <Link href={`/junior/${id}`} className="text-stone-400 hover:text-stone-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-base font-extrabold text-stone-900">🗺️ Formation Explorer</h1>
          <p className="text-xs text-stone-400">Tap dots to explore Ontario mineral sites</p>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={ONTARIO}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/outdoors-v12"
          onClick={handleClick}
          onMouseMove={handleMouseMove}
        >
          {TILESET_MDI && (
            <Source id="omi" type="vector" url={`mapbox://${TILESET_MDI}`}>
              <Layer
                id="omi-dots"
                type="circle"
                source-layer="OMI-67byij"
                paint={{
                  "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 4, 9, 8],
                  "circle-color": "#f59e0b",
                  "circle-opacity": 0.7,
                  "circle-stroke-width": 1.5,
                  "circle-stroke-color": "#fff",
                }}
              />
            </Source>
          )}

          {popup && (
            <Popup
              longitude={popup.lng}
              latitude={popup.lat}
              closeOnClick={false}
              onClose={() => setPopup(null)}
              className="junior-popup"
              maxWidth="240px"
            >
              <div className="p-1">
                <button
                  onClick={() => setPopup(null)}
                  className="absolute right-2 top-2 text-stone-400 hover:text-stone-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <p className="font-bold text-stone-900 text-sm pr-5">{popup.name}</p>
                {popup.commodity && (
                  <p className="text-xs text-amber-700 mt-1">
                    🪨 {popup.commodity}
                  </p>
                )}
                {popup.status && (
                  <p className="text-xs text-stone-400 mt-0.5">{popup.status}</p>
                )}
              </div>
            </Popup>
          )}
        </Map>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 rounded-xl bg-white/90 backdrop-blur-sm p-3 shadow text-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-3 w-3 rounded-full bg-amber-400 border-2 border-white shadow-sm" />
            <span className="font-medium text-stone-700">Mineral site</span>
          </div>
          <p className="text-stone-400">Tap any dot to learn more!</p>
        </div>

        {/* Province legend */}
        <div className="absolute top-4 right-4 rounded-xl bg-white/90 backdrop-blur-sm p-3 shadow text-xs max-w-[160px]">
          <p className="font-bold text-stone-700 mb-2">Ontario Provinces</p>
          {Object.entries(PROVINCE_INFO).map(([name, info]) => (
            <div key={name} className="flex items-start gap-1.5 mb-1">
              <span>{info.emoji}</span>
              <span className="text-stone-500">{name.replace(" and ", " / ")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

