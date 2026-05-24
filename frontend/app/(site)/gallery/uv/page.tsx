"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import type { Find, FindFeedResponse } from "@/lib/types";

const UV_COLOURS = [
  { value: "", label: "All", dot: "bg-white" },
  { value: "green", label: "Green", dot: "bg-green-400" },
  { value: "blue", label: "Blue", dot: "bg-blue-400" },
  { value: "red", label: "Red", dot: "bg-red-400" },
  { value: "orange", label: "Orange", dot: "bg-orange-400" },
  { value: "white", label: "White", dot: "bg-stone-100" },
  { value: "multi", label: "Multi", dot: "bg-gradient-to-r from-green-400 via-blue-400 to-red-400" },
];

const UV_GLOW: Record<string, string> = {
  green: "shadow-[0_0_16px_rgba(74,222,128,0.5)]",
  blue: "shadow-[0_0_16px_rgba(96,165,250,0.5)]",
  red: "shadow-[0_0_16px_rgba(248,113,113,0.5)]",
  orange: "shadow-[0_0_16px_rgba(251,146,60,0.5)]",
  white: "shadow-[0_0_16px_rgba(255,255,255,0.4)]",
  multi: "shadow-[0_0_16px_rgba(167,139,250,0.5)]",
};

export default function UVGalleryPage() {
  const { user } = useAuthStore();
  const [colour, setColour] = useState("");
  const [skip, setSkip] = useState(0);
  const PAGE = 24;

  const { data, isLoading } = useQuery<FindFeedResponse>({
    queryKey: ["uv-gallery", colour, skip],
    queryFn: () => {
      const p = new URLSearchParams({ uv_only: "true", limit: String(PAGE), skip: String(skip) });
      if (colour) p.set("uv_colour", colour);
      return api.get(`/api/finds/feed?${p}`);
    },
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="min-h-screen bg-stone-950 text-white">
      {/* Header */}
      <div className="mx-auto max-w-6xl px-4 pt-12 pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500 mb-2">UV Gallery</p>
            <h1 className="font-display text-4xl text-white">Fluorescent Minerals</h1>
            <p className="mt-2 text-stone-400">Ontario minerals under ultraviolet light</p>
          </div>
          {user && (
            <Link href="/finds/new" className="flex items-center gap-2 rounded-lg bg-stone-800 px-4 py-2.5 text-sm font-medium text-stone-200 hover:bg-stone-700 transition self-start sm:self-auto">
              <PlusCircle className="h-4 w-4" />
              Submit a UV photo
            </Link>
          )}
        </div>

        {/* Colour filters */}
        <div className="mt-6 flex flex-wrap gap-2">
          {UV_COLOURS.map((c) => (
            <button
              key={c.value}
              onClick={() => { setColour(c.value); setSkip(0); }}
              className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                colour === c.value
                  ? "border-white bg-white text-stone-900"
                  : "border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-200"
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-6xl px-4 pb-16">
        {isLoading && (
          <div className="flex h-48 items-center justify-center text-stone-500">Loading…</div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <p className="text-stone-500">No UV photos yet for this filter.</p>
            <p className="text-xs text-stone-600 max-w-sm">
              Find a mineral that glows under UV? Log it in your find journal and select the fluorescence colour.
            </p>
            {user && (
              <Link href="/finds/new" className="mt-2 rounded-lg bg-stone-800 px-4 py-2 text-sm text-stone-200 hover:bg-stone-700 transition">
                Log a UV find →
              </Link>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((find) => (
            <UVCard key={find.id} find={find} />
          ))}
        </div>

        {total > PAGE && (
          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              disabled={skip === 0}
              onClick={() => setSkip(Math.max(0, skip - PAGE))}
              className="rounded-lg border border-stone-700 px-4 py-2 text-sm text-stone-400 hover:border-stone-500 disabled:opacity-30"
            >
              ← Previous
            </button>
            <span className="text-sm text-stone-500">
              {skip + 1}–{Math.min(skip + PAGE, total)} of {total}
            </span>
            <button
              disabled={skip + PAGE >= total}
              onClick={() => setSkip(skip + PAGE)}
              className="rounded-lg border border-stone-700 px-4 py-2 text-sm text-stone-400 hover:border-stone-500 disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function UVCard({ find }: { find: Find }) {
  const glow = UV_GLOW[find.uv_fluorescence ?? ""] ?? "";

  return (
    <Link
      href={`/finds/${find.id}`}
      className={`group relative block aspect-square overflow-hidden rounded-xl bg-stone-900 ${glow} hover:scale-[1.02] transition-transform duration-200`}
    >
      {find.photo_urls.length > 0 ? (
        <img
          src={find.photo_urls[0]}
          alt={find.mineral_name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-stone-700">
          <span className="text-4xl">💎</span>
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
        <p className="text-sm font-semibold text-white capitalize leading-tight">{find.mineral_name}</p>
        {find.uv_fluorescence && (
          <p className="text-[10px] text-stone-300 capitalize mt-0.5">{find.uv_fluorescence} fluorescence</p>
        )}
      </div>

      {/* UV badge */}
      {find.uv_fluorescence && (
        <div className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-white">UV</span>
        </div>
      )}
    </Link>
  );
}
