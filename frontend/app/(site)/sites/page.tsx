"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import type { Site } from "@/lib/types";
import { SiteCard } from "@/components/SiteCard";
import { SiteMap } from "@/components/Map";

type View = "grid" | "map";

export default function SitesPage() {
  const [view, setView] = useState<View>("grid");
  const [mineral, setMineral] = useState("");

  const { data: sites = [], isLoading } = useQuery<Site[]>({
    queryKey: ["sites", mineral],
    queryFn: () => api.get(`/api/sites${mineral ? `?mineral=${mineral}` : ""}`),
  });

  return (
    <div className={view === "map" ? "overflow-hidden" : ""}>
      {/* Filter bar */}
      <div className="border-b border-stone-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <input
            type="text"
            placeholder="Filter by mineral…"
            value={mineral}
            onChange={(e) => setMineral(e.target.value)}
            className="input flex-1 max-w-xs"
          />
          <div className="ml-auto flex rounded-lg border border-stone-200 overflow-hidden">
            {(["grid", "map"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                  view === v ? "bg-brand-600 text-white" : "bg-white text-stone-600 hover:bg-stone-50"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-stone-500">Loading sites…</div>
      ) : view === "map" ? (
        <SiteMap sites={sites} />
      ) : (
        <div className="mx-auto max-w-6xl px-4 py-8">
          {sites.length === 0 ? (
            <p className="text-center text-stone-500">No sites found.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {sites.map((site) => (
                <SiteCard key={site.id} site={site} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
