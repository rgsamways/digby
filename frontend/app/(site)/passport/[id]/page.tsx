"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Trophy, Star, Gem } from "lucide-react";
import { api } from "@/lib/api";
import type { Badge, PassportStamp } from "@/lib/types";

interface PublicPassportData {
  visitor_name: string;
  total_visits: number;
  total_points: number;
  hunt_completions: number;
  quiz_sessions: number;
  diary_entries: number;
  unique_minerals: string[];
  badges: Badge[];
  stamps: PassportStamp[];
}

const BADGE_ICONS: Record<string, string> = {
  first_dig: "⛏️",
  rock_hound: "🪨",
  gem_hunter: "💎",
  mineral_master: "🏆",
};

export default function PublicPassportPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useQuery<PublicPassportData>({
    queryKey: ["passport", id],
    queryFn: () => api.get(`/api/passport/${id}`),
    enabled: !!id,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-stone-500">
        Loading passport…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center px-4">
        <Gem className="h-12 w-12 text-stone-300" />
        <h1 className="text-2xl font-bold text-stone-900">Passport not found</h1>
        <p className="text-stone-500">This rockhound passport doesn&apos;t exist or has been removed.</p>
        <Link href="/sites" className="btn-primary">Browse sites</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">

      {/* Dark hero — matches /passport */}
      <div className="relative mb-10 overflow-hidden rounded-2xl bg-stone-900 px-8 py-8 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(202,138,4,0.25),_transparent_60%)]" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">Rockhound Passport</p>
            <h1 className="font-display text-3xl text-white">{data.visitor_name}</h1>
            <p className="mt-2 text-sm text-stone-400">
              {data.total_visits} visit{data.total_visits !== 1 ? "s" : ""}
              {" · "}{data.unique_minerals.length} mineral{data.unique_minerals.length !== 1 ? "s" : ""}
              {data.hunt_completions > 0 && ` · ${data.hunt_completions} hunt${data.hunt_completions !== 1 ? "s" : ""}`}
              {data.diary_entries > 0 && ` · ${data.diary_entries} journal entr${data.diary_entries !== 1 ? "ies" : "y"}`}
            </p>
          </div>
          <div className="rounded-full bg-amber-400 px-6 py-3 text-center shadow-[0_4px_16px_rgba(202,138,4,0.4)]">
            <p className="font-mono text-2xl font-bold leading-none text-stone-900">{data.total_points.toLocaleString()}</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-stone-700">points</p>
          </div>
        </div>
      </div>

      {/* Badges */}
      {data.badges.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 font-display text-xl text-stone-900">Badges</h2>
          <div className="flex flex-wrap gap-3">
            {data.badges.map((badge) => (
              <div key={badge.id} className="flex items-center gap-3 rounded-xl border border-amber-200/60 bg-amber-50 px-4 py-3">
                <span className="text-2xl">{BADGE_ICONS[badge.id] ?? "🎖️"}</span>
                <div>
                  <p className="font-semibold text-stone-900">{badge.name}</p>
                  <p className="text-xs text-stone-400">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Minerals */}
      {data.unique_minerals.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 font-display text-xl text-stone-900">Minerals Collected</h2>
          <div className="flex flex-wrap gap-2">
            {data.unique_minerals.map((m) => (
              <span key={m} className="rounded-full bg-stone-100 px-3 py-1 text-sm font-medium capitalize text-stone-600">
                {m}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Stamps */}
      <section className="mb-10">
        <h2 className="mb-4 font-display text-xl text-stone-900">
          Stamps
          {data.stamps.length > 0 && <span className="ml-2 font-sans text-sm font-normal text-stone-400">{data.stamps.length}</span>}
        </h2>
        {data.stamps.length === 0 ? (
          <p className="text-stone-400">No stamps yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {data.stamps.map((stamp) => {
              const date  = new Date(stamp.visited_at);
              const month = date.toLocaleString("en-CA", { month: "short" }).toUpperCase();
              return (
                <div key={stamp.id} className="relative overflow-hidden rounded-lg border-2 border-stone-300/50 bg-[#FAFAF7] p-4 shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)]">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="text-center">
                      <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-stone-400">{month}</p>
                      <p className="font-display text-3xl leading-none text-stone-800">{date.getDate()}</p>
                      <p className="font-mono text-[10px] text-stone-400">{date.getFullYear()}</p>
                    </div>
                    <span className="select-none text-2xl opacity-15">🪨</span>
                  </div>
                  <p className="mb-2 font-semibold leading-snug text-stone-900 line-clamp-2">{stamp.site_name}</p>
                  {stamp.minerals_found.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {stamp.minerals_found.map((m) => (
                        <span key={m} className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold capitalize text-stone-600">{m}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* CTA */}
      <div className="rounded-2xl bg-stone-900 p-8 text-center">
        <p className="font-display text-xl text-white">Want your own Rockhound Passport?</p>
        <p className="mt-2 text-sm text-stone-400">Book a dig, earn stamps, and track every mineral you find.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/sites" className="btn-primary">Browse sites</Link>
          <Link href="/register" className="rounded-lg border border-stone-700 px-4 py-2 text-sm font-medium text-stone-300 transition hover:border-stone-500 hover:text-white">Sign up free</Link>
        </div>
      </div>
    </div>
  );
}
