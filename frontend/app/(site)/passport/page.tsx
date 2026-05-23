"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Check, Share2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import type { Badge, PassportStamp, LeaderboardEntry } from "@/lib/types";

interface PassportData {
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

const ALL_BADGES: Badge[] = [
  { id: "first_dig",      name: "First Dig",     description: "Complete your first site visit", threshold: 1  },
  { id: "rock_hound",     name: "Rock Hound",     description: "Visit 5 sites",                 threshold: 5  },
  { id: "gem_hunter",     name: "Gem Hunter",     description: "Visit 10 sites",                threshold: 10 },
  { id: "mineral_master", name: "Mineral Master", description: "Visit 25 sites",                threshold: 25 },
];

const BADGE_ICONS: Record<string, string> = {
  first_dig:      "⛏️",
  rock_hound:     "🪨",
  gem_hunter:     "💎",
  mineral_master: "🏆",
};

const MINERAL_COLORS: Record<string, { bg: string; text: string }> = {
  amethyst:       { bg: "bg-violet-100",  text: "text-violet-700" },
  sodalite:       { bg: "bg-blue-100",    text: "text-blue-700" },
  feldspar:       { bg: "bg-sky-100",     text: "text-sky-700" },
  amazonite:      { bg: "bg-teal-100",    text: "text-teal-700" },
  garnet:         { bg: "bg-red-100",     text: "text-red-700" },
  calcite:        { bg: "bg-amber-100",   text: "text-amber-800" },
  pyrite:         { bg: "bg-yellow-100",  text: "text-yellow-700" },
  quartz:         { bg: "bg-stone-100",   text: "text-stone-600" },
  apatite:        { bg: "bg-cyan-100",    text: "text-cyan-700" },
  tourmaline:     { bg: "bg-pink-100",    text: "text-pink-700" },
  mica:           { bg: "bg-stone-100",   text: "text-stone-500" },
  corundum:       { bg: "bg-rose-100",    text: "text-rose-700" },
  fluorite:       { bg: "bg-purple-100",  text: "text-purple-700" },
  "native silver":{ bg: "bg-slate-100",   text: "text-slate-600" },
  "native copper":{ bg: "bg-orange-100",  text: "text-orange-700" },
  granite:        { bg: "bg-stone-200",   text: "text-stone-600" },
  fossil:         { bg: "bg-lime-100",    text: "text-lime-700" },
};

function mineralStyle(m: string) {
  return MINERAL_COLORS[m.toLowerCase()] ?? { bg: "bg-emerald-100", text: "text-emerald-700" };
}

function StampCard({ stamp }: { stamp: PassportStamp }) {
  const date  = new Date(stamp.visited_at);
  const month = date.toLocaleString("en-CA", { month: "short" }).toUpperCase();
  const day   = date.getDate();
  const year  = date.getFullYear();

  return (
    <div className="relative rounded-lg border-2 border-stone-300/50 bg-[#FAFAF7] p-4 shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 rounded-lg border-4 border-stone-300/10" />

      <div className="mb-3 flex items-start justify-between">
        <div className="text-center">
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-stone-400">{month}</p>
          <p className="font-display text-3xl leading-none text-stone-800">{day}</p>
          <p className="font-mono text-[10px] text-stone-400">{year}</p>
        </div>
        <span className="text-2xl opacity-15 select-none">🪨</span>
      </div>

      <p className="mb-2 font-semibold leading-snug text-stone-900 line-clamp-2">{stamp.site_name}</p>

      {stamp.minerals_found.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {stamp.minerals_found.map((m) => {
            const s = mineralStyle(m);
            return (
              <span key={m} className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${s.bg} ${s.text}`}>
                {m}
              </span>
            );
          })}
        </div>
      ) : (
        <p className="text-[11px] italic text-stone-400">No minerals logged</p>
      )}
    </div>
  );
}

function BadgeChip({ badge, earned }: { badge: Badge; earned: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
      earned
        ? "border-amber-200/60 bg-amber-50"
        : "border-stone-200/40 bg-stone-100/50 opacity-40 grayscale"
    }`}>
      <span className="text-3xl">{BADGE_ICONS[badge.id] ?? "🏅"}</span>
      <div>
        <p className={`text-sm font-bold ${earned ? "text-stone-900" : "text-stone-500"}`}>{badge.name}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-stone-400">{badge.description}</p>
      </div>
      {earned && (
        <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-700">Earned</span>
      )}
    </div>
  );
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function PassportPage() {
  const router  = useRouter();
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);

  const { data: passport, isLoading } = useQuery<PassportData>({
    queryKey: ["passport-me"],
    queryFn: () => api.get("/api/passport/me", { auth: true }),
    enabled: !!user,
  });

  const { data: leaderboard = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: ["passport-leaderboard"],
    queryFn: () => api.get("/api/passport/leaderboard"),
  });

  function handleShare() {
    if (!user) return;
    const url = `${window.location.origin}/passport/${user.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <span className="mb-4 text-5xl opacity-25">🪨</span>
        <p className="font-display text-xl text-stone-700">Your passport awaits</p>
        <p className="mt-2 max-w-xs text-sm text-stone-400">Sign in to see your stamps, badges, and points.</p>
        <button onClick={() => router.push("/login?redirect=/passport")} className="btn-primary mt-6 text-sm">
          Sign in
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 space-y-6">
        <div className="h-36 animate-pulse rounded-2xl bg-stone-100" />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-stone-100" />)}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-36 animate-pulse rounded-lg bg-stone-100" />)}
        </div>
      </div>
    );
  }

  if (!passport) return null;

  const earnedIds  = new Set(passport.badges.map((b) => b.id));
  const nextBadge  = ALL_BADGES.find((b) => !earnedIds.has(b.id));

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">

      {/* Hero header */}
      <div className="relative mb-10 overflow-hidden rounded-2xl bg-stone-900 px-8 py-8 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(202,138,4,0.25),_transparent_60%)]" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">

          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">Rockhound Passport</p>
            <h1 className="font-display text-3xl text-white">{passport.visitor_name}</h1>
            <p className="mt-2 text-sm text-stone-400">
              {passport.total_visits} visit{passport.total_visits !== 1 ? "s" : ""}
              {" · "}{passport.unique_minerals.length} mineral{passport.unique_minerals.length !== 1 ? "s" : ""}
              {passport.hunt_completions > 0 && ` · ${passport.hunt_completions} hunt${passport.hunt_completions !== 1 ? "s" : ""}`}
              {passport.diary_entries > 0 && ` · ${passport.diary_entries} journal entr${passport.diary_entries !== 1 ? "ies" : "y"}`}
            </p>
            <button
              onClick={handleShare}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-stone-700 bg-stone-800/60 px-3 py-1.5 text-xs font-medium text-stone-300 transition hover:border-stone-500 hover:text-white"
            >
              {copied ? <><Check className="h-3.5 w-3.5 text-emerald-400" /> Copied!</> : <><Share2 className="h-3.5 w-3.5" /> Share passport</>}
            </button>
          </div>

          <div className="flex flex-col items-end">
            <div className="rounded-full bg-amber-400 px-6 py-3 text-center shadow-[0_4px_16px_rgba(202,138,4,0.4)]">
              <p className="font-mono text-2xl font-bold leading-none text-stone-900">{passport.total_points.toLocaleString()}</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-stone-700">points</p>
            </div>
            {nextBadge && (
              <p className="mt-2 text-[11px] text-stone-500 text-right">
                {nextBadge.threshold - passport.total_visits} more → {nextBadge.name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Badges */}
      <section className="mb-10">
        <h2 className="mb-4 font-display text-xl text-stone-900">Badges</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ALL_BADGES.map((badge) => (
            <BadgeChip key={badge.id} badge={badge} earned={earnedIds.has(badge.id)} />
          ))}
        </div>
      </section>

      {/* Minerals collected */}
      {passport.unique_minerals.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 font-display text-xl text-stone-900">Minerals Collected</h2>
          <div className="flex flex-wrap gap-2">
            {passport.unique_minerals.map((m) => {
              const s = mineralStyle(m);
              return (
                <span key={m} className={`rounded-full px-3 py-1 text-sm font-semibold capitalize ${s.bg} ${s.text}`}>
                  {m}
                </span>
              );
            })}
          </div>
        </section>
      )}

      {/* Stamps */}
      <section className="mb-12">
        <h2 className="mb-4 font-display text-xl text-stone-900">
          Stamps
          {passport.stamps.length > 0 && (
            <span className="ml-2 font-sans text-sm font-normal text-stone-400">{passport.stamps.length}</span>
          )}
        </h2>

        {passport.stamps.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-300 py-16 text-center">
            <span className="mb-4 text-5xl opacity-20">📖</span>
            <p className="font-display text-lg text-stone-600">No stamps yet</p>
            <p className="mt-1 text-sm text-stone-400">Complete a site visit to earn your first stamp.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {passport.stamps.map((stamp) => (
              <StampCard key={stamp.id} stamp={stamp} />
            ))}
          </div>
        )}
      </section>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-xl text-stone-900">Top Rockhounds</h2>
          <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
            {leaderboard.map((entry, i) => {
              const isMe = entry.name === passport.visitor_name;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-4 border-b border-stone-50 px-5 py-3 last:border-0 ${
                    isMe ? "bg-amber-50/60" : i % 2 === 1 ? "bg-stone-50/40" : ""
                  }`}
                >
                  <span className="w-8 shrink-0 text-center text-lg">
                    {i < 3 ? MEDALS[i] : <span className="font-mono text-sm text-stone-400">#{i + 1}</span>}
                  </span>
                  <p className={`flex-1 text-sm font-semibold ${isMe ? "text-amber-700" : "text-stone-900"}`}>
                    {entry.name}
                    {isMe && <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-amber-500">You</span>}
                  </p>
                  <span className="text-[11px] text-stone-400">{entry.visits} visit{entry.visits !== 1 ? "s" : ""}</span>
                  <span className="font-mono text-sm font-bold text-stone-700">{entry.points.toLocaleString()} pts</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
