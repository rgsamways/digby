"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { LayoutGrid, Map } from "lucide-react";
import { api } from "@/lib/api";
import type { Site } from "@/lib/types";
import { SiteCard } from "@/components/SiteCard";
import { SiteMap } from "@/components/Map";
import { EmptyState } from "@/components/EmptyState";

type View = "grid" | "map";
type Category = "all" | "mineral" | "fossil";

const CATEGORY_TABS: { value: Category; label: string }[] = [
  { value: "all", label: "All sites" },
  { value: "mineral", label: "Minerals" },
  { value: "fossil", label: "Fossils" },
];

export default function SitesPage() {
  const [view, setView] = useState<View>("grid");
  const [mineral, setMineral] = useState("");
  const [category, setCategory] = useState<Category>("all");

  const params = new URLSearchParams();
  if (mineral) params.set("mineral", mineral);
  if (category !== "all") params.set("category", category);
  const queryString = params.toString();

  const { data: sites = [], isLoading } = useQuery<Site[]>({
    queryKey: ["sites", mineral, category],
    queryFn: () => api.get(`/api/sites${queryString ? `?${queryString}` : ""}`),
  });

  return (
    <div className={view === "map" ? "overflow-hidden" : ""}>
      {/* Filter bar */}
      <div className="sticky top-[57px] z-30 border-b border-stone-200 bg-white/90 backdrop-blur px-4 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">

          {/* Category tabs */}
          <div className="flex overflow-hidden rounded-lg border border-stone-200 bg-white">
            {CATEGORY_TABS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => { setCategory(value); setMineral(""); }}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  value !== "all" ? "border-l border-stone-200" : ""
                } ${
                  category === value
                    ? value === "fossil"
                      ? "bg-lime-600 text-white"
                      : "bg-brand-600 text-white"
                    : "text-stone-500 hover:bg-stone-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder={category === "fossil" ? "Filter by fossil type…" : "Filter by mineral…"}
            value={mineral}
            onChange={(e) => setMineral(e.target.value)}
            className="input max-w-xs flex-1"
          />

          {!isLoading && view === "grid" && (
            <p className="text-sm text-stone-400">{sites.length} site{sites.length !== 1 ? "s" : ""}</p>
          )}

          <div className="ml-auto flex overflow-hidden rounded-lg border border-stone-200 bg-white">
            <button
              onClick={() => setView("grid")}
              title="Grid view"
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                view === "grid" ? "bg-brand-600 text-white" : "text-stone-500 hover:bg-stone-50"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setView("map")}
              title="Map view"
              className={`flex items-center gap-1.5 border-l border-stone-200 px-3 py-2 text-sm font-medium transition-colors ${
                view === "map" ? "bg-brand-600 text-white" : "text-stone-500 hover:bg-stone-50"
              }`}
            >
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">Map</span>
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-5 px-4 py-8 sm:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-lg bg-stone-100" />
          ))}
        </div>
      ) : view === "map" ? (
        <SiteMap sites={sites} />
      ) : sites.length === 0 ? (
        <EmptyState
          title={category === "fossil" ? "No fossil sites yet" : "No sites found"}
          body={
            category === "fossil"
              ? "Fossil sites are coming soon. Check back or list your site."
              : mineral
              ? `No sites with "${mineral}" — try a different mineral.`
              : "No bookable sites yet."
          }
        />
      ) : (
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sites.map((site) => (
              <SiteCard key={site.id} site={site} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
