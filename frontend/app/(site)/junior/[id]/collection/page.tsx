"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Gift, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth";
import {
  juniorApi,
  hasClaimedToday,
  RARITY_COLORS,
  RARITY_LABELS,
  type CollectionEntry,
  type DailyCardResult,
  type JuniorMineral,
} from "@/lib/junior";

type Filter = "all" | "owned" | "missing";

export default function CollectionPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const [reveal, setReveal] = useState<DailyCardResult | null>(null);

  const { data: profiles } = useQuery({
    queryKey: ["junior-profiles"],
    queryFn: juniorApi.listProfiles,
    enabled: !!user,
  });
  const profile = profiles?.find((p) => p.id === id);

  const { data: collection, isLoading } = useQuery({
    queryKey: ["junior-collection", id],
    queryFn: () => juniorApi.getCollection(id),
    enabled: !!user && !!id,
  });

  const claimMutation = useMutation({
    mutationFn: () => juniorApi.claimDailyCard(id),
    onSuccess: (result) => {
      setReveal(result);
      qc.invalidateQueries({ queryKey: ["junior-collection", id] });
      qc.invalidateQueries({ queryKey: ["junior-profiles"] });
      qc.invalidateQueries({ queryKey: ["junior-summary"] });
    },
  });

  const filtered = (collection ?? []).filter((e) => {
    if (filter === "owned") return e.owned;
    if (filter === "missing") return !e.owned;
    return true;
  });

  const ownedCount = (collection ?? []).filter((e) => e.owned).length;
  const totalCount = (collection ?? []).length;

  const claimedToday = profile ? hasClaimedToday(profile) : true;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/junior/${id}`} className="text-stone-400 hover:text-stone-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-stone-900">💎 Mineral Collection</h1>
          <p className="text-sm text-stone-500">{ownedCount} / {totalCount} minerals found</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-5 rounded-full bg-stone-100 h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-400 to-violet-500 transition-all"
          style={{ width: totalCount ? `${(ownedCount / totalCount) * 100}%` : "0%" }}
        />
      </div>

      {/* Daily pack */}
      {!claimedToday && (
        <button
          onClick={() => claimMutation.mutate()}
          disabled={claimMutation.isPending}
          className="w-full mb-5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 p-4 text-white flex items-center gap-3 hover:opacity-90 transition"
        >
          <Gift className="h-7 w-7 shrink-0" />
          <div className="text-left flex-1">
            <p className="font-extrabold text-base">Daily Pack Ready!</p>
            <p className="text-amber-100 text-sm">Tap to open and get a new mineral card</p>
          </div>
          {claimMutation.isPending && (
            <Sparkles className="h-5 w-5 animate-spin" />
          )}
        </button>
      )}

      {/* Reveal overlay */}
      {reveal && (
        <CardReveal result={reveal} onClose={() => setReveal(null)} />
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(["all", "owned", "missing"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition ${
              filter === f
                ? "bg-brand-600 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {f === "all" ? "All" : f === "owned" ? "Collected" : "Missing"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-xl bg-stone-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {filtered.map((entry) => (
            <MineralCard key={entry.mineral.mineral_id} entry={entry} />
          ))}
        </div>
      )}

      {claimMutation.isError && (
        <p className="text-sm text-red-600 mt-3">
          {claimMutation.error instanceof Error ? claimMutation.error.message : "Failed to claim card"}
        </p>
      )}
    </div>
  );
}

function MineralCard({ entry }: { entry: CollectionEntry }) {
  const { mineral, owned } = entry;
  const [flipped, setFlipped] = useState(false);

  if (!owned) {
    return (
      <div className="aspect-[3/4] rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 flex flex-col items-center justify-center p-2 text-stone-300">
        <div className="text-3xl mb-1 grayscale opacity-30">💎</div>
        <p className="text-xs text-center font-medium">???</p>
      </div>
    );
  }

  return (
    <button
      onClick={() => setFlipped((v) => !v)}
      className="aspect-[3/4] rounded-xl border-2 border-stone-100 text-left overflow-hidden hover:scale-105 active:scale-100 transition relative"
      style={{ backgroundColor: mineral.card_colour }}
    >
      {!flipped ? (
        <div className="h-full flex flex-col items-center justify-between p-2 py-3">
          <span
            className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white"
            style={{ backgroundColor: RARITY_COLORS[mineral.rarity] }}
          >
            {RARITY_LABELS[mineral.rarity]}
          </span>
          <div className="text-4xl">{mineral.card_emoji}</div>
          <div className="text-center">
            <p className="font-extrabold text-stone-800 text-xs leading-tight">{mineral.name}</p>
            <p className="text-xs text-stone-500">{mineral.family}</p>
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col p-2 py-3 gap-1">
          <p className="font-bold text-stone-800 text-xs">{mineral.name}</p>
          <p className="text-xs text-stone-600 flex-1">{mineral.age_easy_description}</p>
          <p className="text-xs text-stone-400 italic">{mineral.ontario_locality}</p>
        </div>
      )}
    </button>
  );
}

function CardReveal({ result, onClose }: { result: DailyCardResult; onClose: () => void }) {
  const { mineral, is_new, streak, new_badges } = result;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div className="text-6xl mb-1">{mineral.card_emoji}</div>
        <p className="text-stone-500 text-sm mb-1">{RARITY_LABELS[mineral.rarity]}</p>
        <h2 className="text-2xl font-extrabold text-stone-900 mb-1">{mineral.name}</h2>
        <p className="text-stone-600 text-sm mb-4">{mineral.fun_fact}</p>

        {is_new ? (
          <div className="rounded-xl bg-brand-50 border border-brand-100 px-4 py-2 mb-4">
            <p className="font-bold text-brand-700">✨ New card!</p>
          </div>
        ) : (
          <div className="rounded-xl bg-stone-50 border border-stone-100 px-4 py-2 mb-4">
            <p className="text-stone-500 text-sm">Already in your collection</p>
          </div>
        )}

        {streak >= 2 && (
          <div className="flex items-center justify-center gap-1.5 text-orange-500 mb-3">
            <Star className="h-4 w-4" />
            <p className="text-sm font-semibold">{streak} day streak! Keep it up!</p>
          </div>
        )}

        {new_badges.length > 0 && (
          <p className="text-sm text-amber-700 font-medium mb-3">
            🏅 New badge{new_badges.length > 1 ? "s" : ""} earned: {new_badges.join(", ")}
          </p>
        )}

        <button onClick={onClose} className="btn-primary w-full">
          Sweet! 🪨
        </button>
      </div>
    </div>
  );
}
