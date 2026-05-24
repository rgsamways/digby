"use client";

import { useCallback, useRef, useState } from "react";
import Map, { Layer, Popup, Source, type MapRef, type MapLayerMouseEvent } from "react-map-gl";
import type { FilterSpecification } from "mapbox-gl";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ChevronRight, Layers, X } from "lucide-react";
import { api } from "@/lib/api";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
// OGS layers served as local GeoJSON (converted from MRD126 + OMI shapefiles)
const BEDROCK_GEOJSON = "/geodata/bedrock.geojson";
const OMI_GEOJSON = "/geodata/omi.geojson";

// STATUS values in OMI that represent past mines
const MINE_STATUSES = ["Past Producing Mine", "Past Producing Mine (Low Tonnage)", "Past Producing Quarry"];

// Ontario centred view
const ONTARIO = { longitude: -84.5, latitude: 48.0, zoom: 6.2 };

// Province colours for bedrock layer — field is PROVINCE_P, values are uppercase
// Dataset: MRD126 Revision 1 (OGS 1:250,000 Bedrock Geology of Ontario)
const PROVINCE_COLOURS = [
  "match", ["get", "PROVINCE_P"],
  "GRENVILLE",              "#c084fc",
  "SUPERIOR",               "#60a5fa",
  "SOUTHERN and SUPERIOR",  "#86efac",
  /* fallback */            "#d1d5db",
];

const PROVINCE_BLURBS: Record<string, { title: string; body: string }> = {
  GRENVILLE: {
    title: "Grenville Province",
    body: "Ontario's mineral heartland. Ancient continental collision ~1 billion years ago created ideal conditions for pegmatite minerals. Bancroft sits here — expect sodalite, amazonite, corundum, calcite, apatite, feldspar, and mica.",
  },
  SUPERIOR: {
    title: "Superior Province",
    body: "2.5–3 billion years old. Greenstone belts associated with gold, silver, and base metals. Thunder Bay is one of the world's best amethyst sources. Also native copper, prehnite, and epidote along the Lake Superior shore.",
  },
  "SOUTHERN and SUPERIOR": {
    title: "Southern / Superior Transition",
    body: "Younger sedimentary rock overlying the Shield margin. Better for fossils than minerals — brachiopods, corals, and trilobites from the Ordovician sea. Also celestite, gypsum, and halite in evaporite sequences.",
  },
};

const MINERALS_FILTER = [
  "quartz", "calcite", "feldspar", "mica", "pyrite", "amethyst",
  "sodalite", "amazonite", "corundum", "tourmaline", "garnet",
  "native silver", "native copper", "fluorite",
];

interface DigbySite {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    id: string;
    name: string;
    slug: string;
    minerals: string[];
    site_type: string;
    price_per_person: number;
    thumbnail: string | null;
  };
}

interface SitePopup {
  lng: number;
  lat: number;
  site: DigbySite["properties"];
}

interface OmiPopup {
  lng: number;
  lat: number;
  name: string;
  status: string;
  commodity: string;
  mdiIdent: string;
}

export default function MapPage() {
  const mapRef = useRef<MapRef>(null);

  const [layers, setLayers] = useState({
    bedrock: true,
    occurrences: true,
    sites: true,
    mines: false,
  });
  const [mineralFilter, setMineralFilter] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeProvince, setActiveProvince] = useState<string | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; text: string } | null>(null);
  const [sitePopup, setSitePopup] = useState<SitePopup | null>(null);
  const [omiPopup, setOmiPopup] = useState<OmiPopup | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const { data: sitesGeoJson } = useQuery({
    queryKey: ["map-sites"],
    queryFn: () => api.get("/api/map/sites") as Promise<{ type: string; features: DigbySite[] }>,
  });

  const toggleLayer = (key: keyof typeof layers) =>
    setLayers((l) => ({ ...l, [key]: !l[key] }));

  const onMouseMove = useCallback((e: MapLayerMouseEvent) => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const omiLayers = ["omi-occurrences", "omi-mines"].filter(
      (id) => map.getLayer(id) !== undefined
    );
    const omiFeatures = omiLayers.length
      ? map.queryRenderedFeatures(e.point, { layers: omiLayers })
      : [];

    if (omiFeatures.length > 0) {
      const props = omiFeatures[0].properties ?? {};
      const label = [props.NAME, props.P_COMMOD].filter(Boolean).join(" · ");
      setHoverInfo({ x: e.point.x, y: e.point.y, text: label || "Mineral deposit" });
      return;
    }

    const bedrockLayerExists = map.getLayer("bedrock-fill") !== undefined;
    const bedrockFeatures = bedrockLayerExists
      ? map.queryRenderedFeatures(e.point, { layers: ["bedrock-fill"] })
      : [];

    if (bedrockFeatures.length > 0) {
      const props = bedrockFeatures[0].properties ?? {};
      const name = props.UNITNAME_P ?? "Unknown formation";
      const prov = props.PROVINCE_P ?? "";
      const age = props.ERA_P ?? "";
      const rock = props.ROCKTYPE_P ?? "";
      const parts = [name, age, rock].filter(Boolean).join(" · ");
      setHoverInfo({ x: e.point.x, y: e.point.y, text: parts });
      if (prov && PROVINCE_BLURBS[prov]) setActiveProvince(prov);
    } else {
      setHoverInfo(null);
    }
  }, []);

  const onClick = useCallback((e: MapLayerMouseEvent) => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const siteLayerExists = map.getLayer("digby-sites-circle") !== undefined;
    const siteFeatures = siteLayerExists
      ? map.queryRenderedFeatures(e.point, { layers: ["digby-sites-circle"] })
      : [];
    if (siteFeatures.length > 0 && siteFeatures[0].properties) {
      const props = siteFeatures[0].properties;
      const coords = (siteFeatures[0].geometry as GeoJSON.Point).coordinates as [number, number];
      setOmiPopup(null);
      setSitePopup({
        lng: coords[0],
        lat: coords[1],
        site: {
          ...props,
          minerals: typeof props.minerals === "string" ? JSON.parse(props.minerals) : props.minerals,
        } as DigbySite["properties"],
      });
      return;
    }

    const omiLayers = ["omi-occurrences", "omi-mines"].filter(
      (id) => map.getLayer(id) !== undefined
    );
    const omiFeatures = omiLayers.length
      ? map.queryRenderedFeatures(e.point, { layers: omiLayers })
      : [];
    if (omiFeatures.length > 0 && omiFeatures[0].properties) {
      const props = omiFeatures[0].properties;
      const coords = (omiFeatures[0].geometry as GeoJSON.Point).coordinates as [number, number];
      setSitePopup(null);
      setOmiPopup({
        lng: coords[0],
        lat: coords[1],
        name: props.NAME ?? "Unknown deposit",
        status: props.STATUS ?? "",
        commodity: props.P_COMMOD ?? "",
        mdiIdent: props.MDI_IDENT ?? "",
      });
      return;
    }

    setSitePopup(null);
    setOmiPopup(null);
  }, []);

  // P_COMMOD is comma-separated (e.g. "Gold, Silver, Actinolite")
  // Use ["in"] for substring match so "Gold" matches "Actinolite, Gold, Talc"
  const commodityFilter: FilterSpecification | null = mineralFilter
    ? ["in", mineralFilter, ["get", "P_COMMOD"]] as FilterSpecification
    : null;
  // Occurrences: exclude mine-category STATUS entries
  const occurrenceFilter: FilterSpecification = [
    "all",
    ["!", ["match", ["get", "STATUS"], MINE_STATUSES, true, false]],
    ...(commodityFilter ? [commodityFilter] : []),
  ] as FilterSpecification;
  // Past mines filter
  const mineFilter: FilterSpecification = [
    "all",
    ["match", ["get", "STATUS"], MINE_STATUSES, true, false],
    ...(commodityFilter ? [commodityFilter] : []),
  ] as FilterSpecification;

  const layerToggles = [
    { key: "bedrock" as const, label: "Bedrock geology", available: true },
    { key: "occurrences" as const, label: "Mineral occurrences", available: true },
    { key: "sites" as const, label: "Digby sites", available: true },
    { key: "mines" as const, label: "Past producing mines", available: true },
  ];

  const Sidebar = (
    <div className="flex flex-col h-full overflow-auto">
      <div className="border-b border-stone-100 px-4 py-3">
        <h2 className="font-bold text-stone-900">Ontario Geology</h2>
        <p className="text-xs text-stone-400 mt-0.5">Explore formations, occurrences, and dig sites</p>
      </div>

      {/* Layer toggles */}
      <div className="px-4 py-3 border-b border-stone-100">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Layers</p>
        {layerToggles.map(({ key, label, available }) => (
          <label key={key} className={`flex items-center gap-2 py-1.5 ${!available ? "opacity-40" : "cursor-pointer"}`}>
            <input
              type="checkbox"
              checked={layers[key] && available}
              disabled={!available}
              onChange={() => available && toggleLayer(key)}
              className="h-3.5 w-3.5 rounded border-stone-300 text-brand-600"
            />
            <span className="text-sm text-stone-700">{label}</span>
            {!available && <span className="text-xs text-stone-400 ml-auto">setup needed</span>}
          </label>
        ))}
      </div>

      {/* Mineral filter */}
      {layers.occurrences && (
        <div className="px-4 py-3 border-b border-stone-100">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Filter occurrences</p>
          <select
            className="input text-sm"
            value={mineralFilter}
            onChange={(e) => setMineralFilter(e.target.value)}
          >
            <option value="">All minerals</option>
            {MINERALS_FILTER.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      )}

      {/* Province blurb */}
      {activeProvince && PROVINCE_BLURBS[activeProvince] && (
        <div className="px-4 py-4 border-b border-stone-100">
          <div className="flex items-start justify-between mb-1">
            <p className="text-sm font-semibold text-stone-900">
              {PROVINCE_BLURBS[activeProvince].title}
            </p>
            <button onClick={() => setActiveProvince(null)} className="text-stone-300 hover:text-stone-500">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-xs text-stone-500 leading-relaxed">
            {PROVINCE_BLURBS[activeProvince].body}
          </p>
        </div>
      )}

    </div>
  );

  return (
    <div className="relative flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Desktop sidebar */}
      <div className={`hidden lg:flex flex-col bg-white border-r border-stone-200 transition-all duration-200 ${sidebarOpen ? "w-72" : "w-0"}`}>
        {sidebarOpen && Sidebar}
      </div>

      {/* Sidebar toggle button (desktop) */}
      <button
        onClick={() => setSidebarOpen((o) => !o)}
        className="hidden lg:flex absolute left-0 top-1/2 z-10 -translate-y-1/2 items-center justify-center rounded-r-lg bg-white border border-l-0 border-stone-200 p-1.5 shadow-sm hover:bg-stone-50 transition-all duration-200"
        style={{ left: sidebarOpen ? 288 : 0 }}
      >
        <ChevronRight className={`h-4 w-4 text-stone-500 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Map */}
      <div className="flex-1 relative">
        <Map
          ref={mapRef}
          initialViewState={ONTARIO}
          mapStyle="mapbox://styles/mapbox/outdoors-v12"
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: "100%", height: "100%" }}
          onMouseMove={onMouseMove}
          onClick={onClick}
          cursor={hoverInfo ? "crosshair" : "grab"}
        >
          {/* Bedrock geology layer — local GeoJSON (MRD126 Revision 1, OGS) */}
          {layers.bedrock && (
            <Source id="bedrock" type="geojson" data={BEDROCK_GEOJSON}>
              <Layer
                id="bedrock-fill"
                type="fill"
                paint={{
                  "fill-color": PROVINCE_COLOURS as unknown as mapboxgl.Expression,
                  "fill-opacity": 0.35,
                }}
              />
              <Layer
                id="bedrock-outline"
                type="line"
                paint={{
                  "line-color": "#78716c",
                  "line-width": 0.5,
                  "line-opacity": 0.4,
                }}
              />
            </Source>
          )}

          {/* OMI layer — local GeoJSON (Ontario Mineral Inventory) */}
          <Source id="omi" type="geojson" data={OMI_GEOJSON}>
            {layers.occurrences && (
              <Layer
                id="omi-occurrences"
                type="circle"
                filter={occurrenceFilter}
                paint={{
                  "circle-radius": 5,
                  "circle-color": "#f59e0b",
                  "circle-stroke-width": 1,
                  "circle-stroke-color": "#ffffff",
                  "circle-opacity": 0.8,
                }}
              />
            )}
            {layers.mines && (
              <Layer
                id="omi-mines"
                type="circle"
                filter={mineFilter}
                paint={{
                  "circle-radius": 4,
                  "circle-color": "#6b7280",
                  "circle-stroke-width": 1,
                  "circle-stroke-color": "#ffffff",
                  "circle-opacity": 0.6,
                }}
              />
            )}
          </Source>

          {/* Digby sites */}
          {sitesGeoJson && layers.sites && (
            <Source id="digby-sites" type="geojson" data={sitesGeoJson}>
              <Layer
                id="digby-sites-halo"
                type="circle"
                paint={{
                  "circle-radius": 14,
                  "circle-color": "#16a34a",
                  "circle-opacity": 0.15,
                }}
              />
              <Layer
                id="digby-sites-circle"
                type="circle"
                paint={{
                  "circle-radius": 8,
                  "circle-color": "#16a34a",
                  "circle-stroke-width": 2,
                  "circle-stroke-color": "#ffffff",
                }}
              />
            </Source>
          )}

          {/* OMI deposit popup */}
          {omiPopup && (
            <Popup
              longitude={omiPopup.lng}
              latitude={omiPopup.lat}
              closeOnClick={false}
              onClose={() => setOmiPopup(null)}
              className="z-50"
            >
              <div className="min-w-[200px] p-1">
                <p className="font-semibold text-stone-900 text-sm leading-tight">{omiPopup.name}</p>
                {omiPopup.status && (
                  <span className="mt-1 inline-block rounded-full bg-stone-100 px-2 py-0.5 text-[10px] text-stone-500">
                    {omiPopup.status}
                  </span>
                )}
                {omiPopup.commodity && (
                  <p className="mt-1.5 text-xs text-stone-600">
                    <span className="font-medium">Commodities:</span> {omiPopup.commodity}
                  </p>
                )}
                {omiPopup.mdiIdent && (
                  <p className="mt-1 text-[10px] text-stone-400 font-mono">{omiPopup.mdiIdent}</p>
                )}
              </div>
            </Popup>
          )}

          {/* Site popup */}
          {sitePopup && (
            <Popup
              longitude={sitePopup.lng}
              latitude={sitePopup.lat}
              closeOnClick={false}
              onClose={() => setSitePopup(null)}
              className="z-50"
            >
              <div className="min-w-[180px] p-1">
                {sitePopup.site.thumbnail && (
                  <img
                    src={sitePopup.site.thumbnail}
                    alt={sitePopup.site.name}
                    className="mb-2 h-24 w-full rounded object-cover"
                  />
                )}
                <p className="font-semibold text-stone-900 text-sm">{sitePopup.site.name}</p>
                {sitePopup.site.minerals?.length > 0 && (
                  <p className="text-xs text-stone-500 mt-0.5">
                    {sitePopup.site.minerals.slice(0, 3).join(", ")}
                    {sitePopup.site.minerals.length > 3 ? "…" : ""}
                  </p>
                )}
                <p className="text-xs text-stone-400 mt-0.5">
                  ${(sitePopup.site.price_per_person / 100).toFixed(0)}/person
                </p>
                <Link
                  href={`/sites/${sitePopup.site.id}`}
                  className="mt-2 block text-center rounded bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
                >
                  Book →
                </Link>
              </div>
            </Popup>
          )}
        </Map>

        {/* Hover tooltip */}
        {hoverInfo && (
          <div
            className="pointer-events-none absolute z-10 rounded-lg bg-stone-900/90 px-3 py-1.5 text-xs text-white shadow-lg"
            style={{ left: hoverInfo.x + 12, top: hoverInfo.y - 8 }}
          >
            {hoverInfo.text}
          </div>
        )}

        {/* Mobile layer toggle button */}
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="lg:hidden absolute bottom-6 right-4 z-10 flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 shadow-lg border border-stone-200"
        >
          <Layers className="h-4 w-4 text-brand-600" />
          <span className="text-sm font-medium text-stone-700">Layers</span>
        </button>
      </div>

      {/* Mobile bottom drawer */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileDrawerOpen(false)} />
          <div className="relative z-10 rounded-t-2xl bg-white max-h-[70vh] overflow-auto">
            <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
              <h3 className="font-semibold text-stone-900">Map Layers</h3>
              <button onClick={() => setMobileDrawerOpen(false)}>
                <X className="h-5 w-5 text-stone-400" />
              </button>
            </div>
            <div className="p-4">
              {layerToggles.map(({ key, label, available }) => (
                <label key={key} className={`flex items-center gap-3 py-2.5 border-b border-stone-50 ${!available ? "opacity-40" : "cursor-pointer"}`}>
                  <input
                    type="checkbox"
                    checked={layers[key] && available}
                    disabled={!available}
                    onChange={() => available && toggleLayer(key)}
                    className="h-4 w-4 rounded border-stone-300 text-brand-600"
                  />
                  <span className="text-sm text-stone-700">{label}</span>
                  {!available && <span className="text-xs text-stone-400 ml-auto">setup needed</span>}
                </label>
              ))}
              {layers.occurrences && (
                <div className="mt-3">
                  <label className="label text-xs">Filter by mineral</label>
                  <select
                    className="input text-sm"
                    value={mineralFilter}
                    onChange={(e) => setMineralFilter(e.target.value)}
                  >
                    <option value="">All minerals</option>
                    {MINERALS_FILTER.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
