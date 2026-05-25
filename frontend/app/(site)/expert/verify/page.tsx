"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";
import type { Expert } from "@/lib/types";

interface QueueFind {
  id: string;
  mineral_name: string;
  photo_urls: string[];
  host_rock: string | null;
  geological_province: string | null;
  formation: string | null;
  specimen_quality: string | null;
  uv_fluorescence: string | null;
  notes: string;
  verification_status: string;
  citizen_science_opted_in: boolean;
  created_at: string;
  review_count: number;
}

const STATUS_LABELS: Record<string, string> = {
  ai_likely: "AI identified",
  disputed: "Disputed",
  community_verified: "Community verified",
  ogs_reviewed: "OGS reviewed",
};

const STATUS_COLOURS: Record<string, string> = {
  ai_likely: "bg-amber-100 text-amber-700",
  disputed: "bg-red-100 text-red-700",
  community_verified: "bg-green-100 text-green-700",
  ogs_reviewed: "bg-blue-100 text-blue-700",
};

export default function ExpertVerifyPage() {
  const { user } = useAuthStore();
  const [finds, setFinds] = useState<QueueFind[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<"ai_likely" | "disputed" | "all">("ai_likely");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ review_count: number; agreement_rate: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [queue, myStats] = await Promise.all([
        api.get(`/api/experts/verification/queue?status_filter=${filter}&limit=40`) as Promise<{ total: number; items: QueueFind[] }>,
        api.get("/api/experts/verification/my-stats") as Promise<{ review_count: number; agreement_rate: number }>,
      ]);
      setFinds(queue.items);
      setTotal(queue.total);
      setStats(myStats);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const reviewerTiers = ["community_reviewer", "verified_expert", "ogs_endorsed"];
  const isReviewer = user && reviewerTiers.includes((user as unknown as Expert).expert_tier ?? "");

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-stone-500">Sign in to access the expert verification queue.</p>
        <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-amber-700 hover:underline">
          Sign in →
        </Link>
      </div>
    );
  }

  if (!isReviewer) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-stone-500 mb-4">Expert reviewer access required.</p>
        <Link href="/expert/apply" className="inline-block rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700">
          Apply as an expert →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Verification Queue</h1>
          <p className="mt-1 text-sm text-stone-500">
            Review community finds and confirm mineral identifications.
          </p>
        </div>
        {stats && (
          <div className="flex gap-4 text-center">
            <div className="rounded-xl border border-stone-200 bg-white px-5 py-3 shadow-sm">
              <p className="text-2xl font-bold text-stone-900">{stats.review_count}</p>
              <p className="text-xs text-stone-500 mt-0.5">Reviews done</p>
            </div>
            {stats.review_count > 0 && (
              <div className="rounded-xl border border-stone-200 bg-white px-5 py-3 shadow-sm">
                <p className="text-2xl font-bold text-stone-900">
                  {Math.round(stats.agreement_rate * 100)}%
                </p>
                <p className="text-xs text-stone-500 mt-0.5">Agreement rate</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(["ai_likely", "disputed", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {f === "ai_likely" ? "AI Identified" : f === "disputed" ? "Disputed" : "All"}
          </button>
        ))}
        <span className="ml-auto text-sm text-stone-400 self-center">{total} in queue</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-stone-100 animate-pulse" />
          ))}
        </div>
      ) : finds.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <p className="text-lg font-medium">Queue is clear!</p>
          <p className="text-sm mt-1">No finds waiting for review in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {finds.map((find) => (
            <Link
              key={find.id}
              href={`/expert/verify/${find.id}`}
              className="group relative rounded-2xl overflow-hidden border border-stone-200 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              {find.photo_urls[0] ? (
                <img
                  src={find.photo_urls[0]}
                  alt={find.mineral_name}
                  className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full aspect-square bg-stone-100 flex items-center justify-center text-stone-300 text-4xl">
                  🪨
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white font-semibold text-sm leading-tight">{find.mineral_name}</p>
                {find.geological_province && (
                  <p className="text-white/70 text-xs mt-0.5 truncate">{find.geological_province}</p>
                )}
              </div>
              <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLOURS[find.verification_status] ?? "bg-stone-100 text-stone-600"}`}>
                  {STATUS_LABELS[find.verification_status] ?? find.verification_status}
                </span>
                {find.review_count > 0 && (
                  <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white">
                    {find.review_count} review{find.review_count !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
