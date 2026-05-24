"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Clock, Gem } from "lucide-react";
import { api } from "@/lib/api";
import type { SpecimenDrop } from "@/lib/types";

function useCountdown(target: string) {
  const [diff, setDiff] = useState(() => Math.max(0, new Date(target).getTime() - Date.now()));
  useEffect(() => {
    const id = setInterval(() => {
      setDiff(Math.max(0, new Date(target).getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [target]);
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  return { diff, d, h, m, s };
}

function CountdownDisplay({ target, label }: { target: string; label: string }) {
  const { diff, d, h, m, s } = useCountdown(target);
  if (diff === 0) return null;
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <Clock className="h-3.5 w-3.5 text-stone-400" />
      <span className="text-stone-500">{label}</span>
      <span className="font-mono font-semibold text-stone-800">
        {d > 0 && `${d}d `}{String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
      </span>
    </div>
  );
}

function DropCard({ drop }: { drop: SpecimenDrop }) {
  const photos = drop.pieces.map((p) => p.photo_url).filter(Boolean).slice(0, 4) as string[];
  const soldCount = drop.pieces.filter((p) => p.status === "sold").length;

  return (
    <Link
      href={`/drops/${drop.slug}`}
      className="group block rounded-2xl border border-stone-200 bg-white overflow-hidden hover:shadow-md transition"
    >
      {/* Photo strip */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-4 h-36 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-stone-100 overflow-hidden">
              {photos[i] ? (
                <img src={photos[i]} alt="" className="h-full w-full object-cover group-hover:scale-105 transition duration-300" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Gem className="h-5 w-5 text-stone-300" />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="h-36 bg-stone-50 flex items-center justify-center">
          <Gem className="h-8 w-8 text-stone-200" />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h2 className="font-display text-lg text-stone-900 leading-tight">{drop.title}</h2>
          <DropBadge status={drop.status} />
        </div>

        {drop.subtitle && (
          <p className="text-sm text-stone-500 mb-2">{drop.subtitle}</p>
        )}

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-stone-400">
            {drop.total_pieces} pieces
            {soldCount > 0 && ` · ${soldCount} found a home`}
            {drop.available_count > 0 && drop.status === "active" && (
              <span className="text-brand-600 font-medium"> · {drop.available_count} available</span>
            )}
          </span>
          {drop.status === "upcoming" && (
            <CountdownDisplay target={drop.opens_at} label="Opens in" />
          )}
          {drop.status === "active" && (
            <CountdownDisplay target={drop.closes_at} label="Closes in" />
          )}
        </div>
      </div>
    </Link>
  );
}

function DropBadge({ status }: { status: SpecimenDrop["status"] }) {
  if (status === "active") return (
    <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">Live</span>
  );
  if (status === "upcoming") return (
    <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">Coming soon</span>
  );
  return (
    <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-500">Ended</span>
  );
}

export default function DropsPage() {
  const { data: drops = [], isLoading } = useQuery<SpecimenDrop[]>({
    queryKey: ["drops"],
    queryFn: () => api.get("/api/drops/"),
  });

  const active = drops.filter((d) => d.status === "active");
  const upcoming = drops.filter((d) => d.status === "upcoming");
  const closed = drops.filter((d) => d.status === "closed");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400 mb-2">Specimen Drops</p>
        <h1 className="font-display text-4xl text-stone-900">Limited Releases</h1>
        <p className="mt-2 text-stone-500 max-w-xl">
          Hand-selected Ontario specimens, available for 72 hours. Each piece individually documented
          with full geological provenance.
        </p>
      </div>

      {isLoading && (
        <div className="flex h-48 items-center justify-center text-stone-400">Loading…</div>
      )}

      {!isLoading && drops.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
          <Gem className="h-10 w-10 text-stone-200" />
          <p className="text-stone-500 font-medium">No drops yet.</p>
          <p className="text-sm text-stone-400 max-w-sm">
            Check back soon — we source exceptional Ontario specimens and release them in small,
            time-limited drops.
          </p>
        </div>
      )}

      {active.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-green-600 mb-3">Now Live</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {active.map((d) => <DropCard key={d.id} drop={d} />)}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-600 mb-3">Coming Soon</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {upcoming.map((d) => <DropCard key={d.id} drop={d} />)}
          </div>
        </section>
      )}

      {closed.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">Previous Drops</h2>
          <div className="grid gap-4 sm:grid-cols-2 opacity-60">
            {closed.map((d) => <DropCard key={d.id} drop={d} />)}
          </div>
        </section>
      )}
    </div>
  );
}
