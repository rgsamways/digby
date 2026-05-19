"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Badge, PassportStamp } from "@/lib/types";

interface PassportData {
  visitor_name: string;
  total_visits: number;
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

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-stone-500">Loading passport…</div>;
  }

  if (!data) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-stone-900">
          {data.visitor_name}&apos;s Rockhound Passport
        </h1>
        <p className="mt-1 text-stone-500">{data.total_visits} site{data.total_visits !== 1 ? "s" : ""} visited</p>
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
      <section>
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
    </div>
  );
}
