"use client";

import { useRef, useCallback } from "react";
import Map, { Marker, Popup } from "react-map-gl";
import { useState } from "react";
import Link from "next/link";
import type { Site } from "@/lib/types";
import "mapbox-gl/dist/mapbox-gl.css";

const BANCROFT: [number, number] = [-77.8524, 45.0562]; // [lng, lat]
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

export function SiteMap({ sites }: { sites: Site[] }) {
  const [selected, setSelected] = useState<Site | null>(null);

  return (
    <div className="h-[calc(100vh-122px)]">
      <Map
        initialViewState={{
          longitude: BANCROFT[0],
          latitude: BANCROFT[1],
          zoom: 9,
        }}
        mapStyle="mapbox://styles/mapbox/outdoors-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: "100%", height: "100%" }}
      >
        {sites.map((site) => {
          const [lng, lat] = site.location.coordinates;
          return (
            <Marker
              key={site.id}
              longitude={lng}
              latitude={lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setSelected(site);
              }}
            >
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white shadow-md hover:bg-brand-700 transition-colors text-sm font-bold"
                aria-label={site.name}
              >
                🪨
              </button>
            </Marker>
          );
        })}

        {selected && (
          <Popup
            longitude={selected.location.coordinates[0]}
            latitude={selected.location.coordinates[1]}
            anchor="top"
            onClose={() => setSelected(null)}
            closeButton
          >
            <div className="min-w-[180px] p-1">
              <p className="font-semibold text-stone-900">{selected.name}</p>
              <p className="text-xs text-stone-500 mb-2">${selected.price_per_person}/person</p>
              <Link
                href={`/sites/${selected.id}`}
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                View & book →
              </Link>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
