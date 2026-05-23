"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth";
import { juniorApi, type BadgeInfo } from "@/lib/junior";

type Cat = "all" | "field" | "knowledge" | "engagement";

const CAT_LABELS: Record<Cat, string> = {
  all: "All",
  field: "🌿 Field",
  knowledge: "📚 Knowledge",
  engagement: "⭐ Engagement",
};

export default function BadgesPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [cat, setCat] = useState<Cat>("all");

  const { data: badges, isLoading } = useQuery({
    queryKey: ["junior-badges", id],
    queryFn: () => juniorApi.getBadges(id),
    enabled: !!user && !!id,
  });

  const filtered = (badges ?? []).filter((b) => cat === "all" || b.category === cat);
  const earned = (badges ?? []).filter((b) => b.earned).length;
  const total = (badges ?? []).length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/junior/${id}`} className="text-stone-400 hover:text-stone-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-stone-900">🏅 My Badges</h1>
          <p className="text-sm text-stone-500">{earned} / {total} earned</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-5 rounded-full bg-stone-100 h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
          style={{ width: total ? `${(earned / total) * 100}%` : "0%" }}
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-5">
        {(Object.keys(CAT_LABELS) as Cat[]).map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition ${
              cat === c
                ? "bg-brand-600 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {CAT_LABELS[c]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-stone-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map((badge) => (
            <BadgeCard key={badge.badge_id} badge={badge} />
          ))}
        </div>
      )}
    </div>
  );
}

function BadgeCard({ badge }: { badge: BadgeInfo }) {
  return (
    <div
      className={`rounded-2xl border-2 p-4 text-center transition ${
        badge.earned
          ? "border-amber-200 bg-amber-50"
          : "border-stone-100 bg-stone-50 opacity-50"
      }`}
    >
      <div className={`text-4xl mb-2 ${badge.earned ? "" : "grayscale"}`}>{badge.icon}</div>
      <p className={`text-xs font-extrabold mb-1 ${badge.earned ? "text-stone-800" : "text-stone-400"}`}>
        {badge.name}
      </p>
      <p className="text-xs text-stone-500 leading-tight">{badge.requirement}</p>
      {badge.earned && badge.earned_at && (
        <p className="text-xs text-amber-600 mt-1.5 font-medium">
          Earned {new Date(badge.earned_at).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
        </p>
      )}
    </div>
  );
}
