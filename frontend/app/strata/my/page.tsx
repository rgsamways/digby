"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, Pause, Play, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";

interface StrataSubscription {
  id: string;
  tier: string;
  billing_frequency: string;
  status: string;
  shipping_address: Record<string, string>;
  current_period_end: string | null;
  created_at: string;
}

const TIER_NAMES: Record<string, string> = {
  discoverer: "Discoverer",
  collector: "Collector",
  geologist: "Geologist",
};

const TIER_PRICES: Record<string, number> = {
  discoverer: 39,
  collector: 59,
  geologist: 89,
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  paused: "bg-blue-100 text-blue-700",
  past_due: "bg-red-100 text-red-700",
  cancelled: "bg-stone-100 text-stone-500",
};

export default function StrataPortalPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [confirming, setConfirming] = useState<"pause" | "cancel" | null>(null);

  const { data: sub, isLoading, error } = useQuery<StrataSubscription>({
    queryKey: ["strata-my"],
    queryFn: () => api.get("/api/strata/my", { auth: true }),
    enabled: !!user,
    retry: false,
  });

  const pauseMutation = useMutation({
    mutationFn: (paused: boolean) =>
      api.patch("/api/strata/my", { paused }, { auth: true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["strata-my"] }); setConfirming(null); },
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.del("/api/strata/my", { auth: true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["strata-my"] }); setConfirming(null); },
  });

  if (!user) {
    router.push("/login?redirect=/strata/my");
    return null;
  }

  if (isLoading) return <div className="flex h-64 items-center justify-center text-stone-500">Loading…</div>;

  if (error || !sub) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <Package className="mx-auto mb-4 h-12 w-12 text-stone-200" />
        <h1 className="mb-2 text-xl font-bold text-stone-900">No active subscription</h1>
        <p className="mb-6 text-stone-500">Subscribe to Digby Strata to receive monthly Ontario geology boxes.</p>
        <Link href="/strata" className="btn-primary">Subscribe now</Link>
      </div>
    );
  }

  const addr = sub.shipping_address;
  const monthlyPrice = TIER_PRICES[sub.tier] ?? 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold text-stone-900">Your Strata Subscription</h1>

      {/* Status card */}
      <div className="card mb-4 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-stone-900">
              {TIER_NAMES[sub.tier] ?? sub.tier} — ${monthlyPrice}/month
            </h2>
            <p className="text-sm text-stone-500 capitalize">{sub.billing_frequency} billing</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[sub.status] ?? "bg-stone-100 text-stone-500"}`}>
            {sub.status.replace("_", " ")}
          </span>
        </div>
        {sub.current_period_end && (
          <p className="mt-3 text-sm text-stone-500">
            Next renewal: {new Date(sub.current_period_end).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        )}
      </div>

      {/* Shipping address */}
      <div className="card mb-4 p-5">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">Shipping to</h2>
        <div className="text-sm text-stone-700 space-y-0.5">
          <p>{addr.name}</p>
          <p>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
          <p>{addr.city}, {addr.province} {addr.postal_code}</p>
        </div>
      </div>

      {/* Archive link */}
      <div className="card mb-6 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-stone-900">Box Archive</p>
            <p className="text-sm text-stone-500">Browse all past boxes and their contents</p>
          </div>
          <Link href="/strata/archive" className="btn-secondary text-sm">View →</Link>
        </div>
      </div>

      {/* Actions */}
      {sub.status !== "cancelled" && (
        <div className="space-y-3">
          {sub.status === "active" && (
            <button
              onClick={() => setConfirming("pause")}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <Pause className="h-4 w-4" /> Pause subscription
            </button>
          )}
          {sub.status === "paused" && (
            <button
              onClick={() => pauseMutation.mutate(false)}
              disabled={pauseMutation.isPending}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Play className="h-4 w-4" />
              {pauseMutation.isPending ? "Resuming…" : "Resume subscription"}
            </button>
          )}
          <button
            onClick={() => setConfirming("cancel")}
            className="w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 flex items-center justify-center gap-2"
          >
            <XCircle className="h-4 w-4" /> Cancel subscription
          </button>
        </div>
      )}

      {/* Confirmation dialogs */}
      {confirming === "pause" && (
        <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4">
          <p className="text-sm text-stone-700 mb-3">Pause your subscription? No boxes will be shipped until you resume.</p>
          <div className="flex gap-3">
            <button onClick={() => setConfirming(null)} className="btn-secondary flex-1">Never mind</button>
            <button
              onClick={() => pauseMutation.mutate(true)}
              disabled={pauseMutation.isPending}
              className="btn-primary flex-1"
            >
              {pauseMutation.isPending ? "Pausing…" : "Yes, pause"}
            </button>
          </div>
        </div>
      )}

      {confirming === "cancel" && (
        <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4">
          <p className="text-sm text-stone-700 mb-1 font-medium">Cancel subscription?</p>
          <p className="text-sm text-stone-500 mb-3">
            Your subscription will remain active until the end of the current billing period. No refunds.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setConfirming(null)} className="btn-secondary flex-1">Keep subscription</button>
            <button
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              {cancelMutation.isPending ? "Cancelling…" : "Yes, cancel"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
