"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Specimen } from "@/lib/types";
import { ShoppingBag, Gem, MapPin } from "lucide-react";

const PROVINCES = [
  "All provinces", "Ontario", "British Columbia", "Quebec", "Alberta",
  "Nova Scotia", "New Brunswick", "Manitoba", "Saskatchewan",
];

export default function SpecimensPage() {
  const [province, setProvince] = useState("All provinces");
  const [mineralFilter, setMineralFilter] = useState("");

  const { data: specimens = [], isLoading } = useQuery<Specimen[]>({
    queryKey: ["specimens", province, mineralFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (province !== "All provinces") params.set("province", province);
      if (mineralFilter) params.set("mineral", mineralFilter);
      return api.get(`/api/specimens/?${params}`);
    },
  });

  const allMinerals = Array.from(new Set(specimens.flatMap((s) => s.minerals))).sort();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">Specimen Marketplace</h1>
          <p className="mt-1 text-stone-500">
            Real specimens from Canadian rockhounding sites, shipped to your door.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-stone-400" />
          <span className="text-sm text-stone-500">{specimens.length} listings</span>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <select value={province} onChange={(e) => setProvince(e.target.value)} className="input w-auto">
          {PROVINCES.map((p) => <option key={p}>{p}</option>)}
        </select>

        {allMinerals.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setMineralFilter("")}
              className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                !mineralFilter ? "border-brand-500 bg-brand-100 text-brand-700" : "border-stone-200 text-stone-600 hover:border-brand-300"
              }`}
            >
              All minerals
            </button>
            {allMinerals.slice(0, 8).map((m) => (
              <button
                key={m}
                onClick={() => setMineralFilter(mineralFilter === m ? "" : m)}
                className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                  mineralFilter === m ? "border-brand-500 bg-brand-100 text-brand-700" : "border-stone-200 text-stone-600 hover:border-brand-300"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center text-stone-400">Loading…</div>
      ) : specimens.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-200 py-20 text-center">
          <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-stone-200" />
          <p className="font-medium text-stone-500">No specimens listed yet.</p>
          <p className="mt-1 text-sm text-stone-400">Operators can list specimens from their sites in the dashboard.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {specimens.map((s) => (
            <Link key={s.id} href={`/specimens/${s.id}`} className="card group overflow-hidden hover:shadow-md transition-shadow">
              {s.images[0] ? (
                <img src={s.images[0]} alt={s.title} className="h-44 w-full object-cover group-hover:scale-105 transition-transform duration-200" />
              ) : (
                <div className="flex h-44 items-center justify-center bg-stone-100">
                  <Gem className="h-10 w-10 text-stone-300" />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-stone-900 line-clamp-1">{s.title}</h3>
                <div className="mt-1 flex items-center gap-1 text-xs text-stone-400">
                  <MapPin className="h-3 w-3" /> {s.province}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {s.minerals.slice(0, 3).map((m) => (
                    <span key={m} className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">{m}</span>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-lg font-bold text-stone-900">${s.price.toFixed(2)}</p>
                  <span className={`text-xs font-medium ${s.available > 0 ? "text-green-600" : "text-red-500"}`}>
                    {s.available > 0 ? `${s.available} available` : "Sold out"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
