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
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600">
          <Gem className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-stone-900">
          {data.visitor_name}&apos;s Rockhound Passport
        </h1>
        <p className="mt-1 text-stone-500">
          {data.total_visits} site{data.total_visits !== 1 ? "s" : ""} visited
        </p>

        <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-6 py-3">
          <Star className="h-5 w-5 fill-brand-300 text-brand-300" />
          <span className="text-2xl font-extrabold text-white">
            {data.total_points.toLocaleString()}
          </span>
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
      {data.badges.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-stone-800">Badges Earned</h2>
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
        </section>
      )}

      {/* Minerals */}
      {data.unique_minerals.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-stone-800">Minerals Found</h2>
          <div className="flex flex-wrap gap-2">
            {data.unique_minerals.map((m) => (
              <span
                key={m}
                className="rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-700"
              >
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
          <p className="text-stone-500">No stamps yet.</p>
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
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  {stamp.minerals_found.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {stamp.minerals_found.map((m) => (
                        <span
                          key={m}
                          className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600"
                        >
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

      {/* CTA */}
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6 text-center">
        <Trophy className="mx-auto mb-2 h-8 w-8 text-brand-600" />
        <p className="font-semibold text-stone-900">
          Want your own Rockhound Passport?
        </p>
        <p className="mt-1 text-sm text-stone-500">
          Book a dig, earn stamps, and track every mineral you find.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Link href="/sites" className="btn-primary">Browse sites</Link>
          <Link href="/register" className="btn-secondary">Sign up free</Link>
        </div>
      </div>
    </div>
  );
}
