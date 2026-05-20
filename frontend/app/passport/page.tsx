"use client";

import { useQuery } from "@tanstack/react-query";
import { Trophy, Star } from "lucide-react";
import { api } from "@/lib/api";
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

const BADGE_ICONS: Record<string, string> = {
  first_dig: "⛏️",
  rock_hound: "🪨",
  gem_hunter: "💎",
  mineral_master: "🏆",
};

export default function PassportPage() {
  const { data, isLoading } = useQuery<PassportData>({
    queryKey: ["passport"],
    queryFn: () => api.get("/api/passport/me", { auth: true }),
  });

  const { data: leaderboard = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard"],
    queryFn: () => api.get("/api/passport/leaderboard"),
  });

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-stone-500">Loading passport…</div>;
  }

  if (!data) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-stone-900">
          {data.visitor_name}&apos;s Rockhound Passport
        </h1>
        <p className="mt-1 text-stone-500">{data.total_visits} site{data.total_visits !== 1 ? "s" : ""} visited</p>

        {/* Points total */}
        <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-6 py-3">
          <Star className="h-5 w-5 fill-brand-300 text-brand-300" />
          <span className="text-2xl font-extrabold text-white">{data.total_points.toLocaleString()}</span>
          <span className="text-sm font-medium text-brand-200">pts</span>
        </div>

        {data.total_points > 0 && (
          <p className="mt-2 text-xs text-stone-400">
            {data.total_visits} visit{data.total_visits !== 1 ? "s" : ""}
            {" · "}{data.unique_minerals.length} mineral{data.unique_minerals.length !== 1 ? "s" : ""}
            {data.hunt_completions > 0 && ` · ${data.hunt_completions} hunt${data.hunt_completions !== 1 ? "s" : ""}`}
            {data.diary_entries > 0 && ` · ${data.diary_entries} journal entr${data.diary_entries !== 1 ? "ies" : "y"}`}
            {data.quiz_sessions > 0 && ` · ${data.quiz_sessions} quiz${data.quiz_sessions !== 1 ? "zes" : ""}`}
          </p>
        )}
      </div>

      {/* Badges */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-stone-800">Badges Earned</h2>
        {data.badges.length === 0 ? (
          <p className="text-stone-500">Complete your first booking to earn your first badge.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {data.badges.map((badge) => (
              <div key={badge.id} className="card flex items-center gap-3 px-4 py-3">
                <span className="text-2xl">{BADGE_ICONS[badge.id] ?? "🎖️"}</span>
                <div>
                  <p className="font-semibold text-stone-900">{badge.name}</p>
                  <p className="text-xs text-stone-500">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Minerals */}
      {data.unique_minerals.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-stone-800">Minerals Found</h2>
          <div className="flex flex-wrap gap-2">
            {data.unique_minerals.map((m) => (
              <span key={m} className="rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-700">
                {m}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Stamps */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-stone-800">Site Stamps</h2>
        {data.stamps.length === 0 ? (
          <p className="text-stone-500">No stamps yet — book a site to get started!</p>
        ) : (
          <div className="space-y-3">
            {data.stamps.map((stamp) => (
              <div key={stamp.id} className="card flex items-start gap-4 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xl text-white">
                  🪨
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-stone-900">{stamp.site_name}</p>
                  <p className="text-sm text-stone-500">
                    {new Date(stamp.visited_at).toLocaleDateString("en-CA", {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </p>
                  {stamp.minerals_found.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {stamp.minerals_found.map((m) => (
                        <span key={m} className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-stone-800">Top Rockhounds</h2>
          </div>
          <div className="card divide-y divide-stone-100">
            {leaderboard.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-4 px-4 py-3">
                <span className={`w-6 text-center text-sm font-bold ${
                  i === 0 ? "text-amber-500" : i === 1 ? "text-stone-400" : i === 2 ? "text-amber-700" : "text-stone-400"
                }`}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                </span>
                <span className="flex-1 font-medium text-stone-800">{entry.name}</span>
                <span className="text-sm text-stone-500">{entry.visits} site{entry.visits !== 1 ? "s" : ""}</span>
                <span className="font-bold text-brand-600">{entry.points.toLocaleString()} pts</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
