"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Bell, BellOff, Gem } from "lucide-react";
import { api } from "@/lib/api";
import type { AlertSubscription } from "@/lib/types";
import { useAuthStore } from "@/lib/auth";

const PROVINCES = [
  "Ontario", "British Columbia", "Quebec", "Alberta",
  "Nova Scotia", "New Brunswick", "Manitoba", "Saskatchewan",
];

const POPULAR_MINERALS = [
  "Amethyst", "Fluorite", "Calcite", "Pyrite", "Quartz",
  "Garnet", "Agate", "Mica", "Feldspar", "Hematite",
  "Sodalite", "Magnetite", "Sphalerite", "Galena",
];

export default function AlertsPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const qc = useQueryClient();

  const { data: sub, isLoading } = useQuery<AlertSubscription | null>({
    queryKey: ["my-alert-sub"],
    queryFn: () => api.get("/api/alerts/my", { auth: true }),
    enabled: !!user,
  });

  const [minerals, setMinerals] = useState<string[]>([]);
  const [provinces, setProvinces] = useState<string[]>([]);

  const subscribe = useMutation({
    mutationFn: () => api.post("/api/alerts/subscribe", { minerals, provinces }, { auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-alert-sub"] }),
  });

  const unsubscribe = useMutation({
    mutationFn: () => api.del("/api/alerts/my", { auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-alert-sub"] }),
  });

  function toggle<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }

  if (!user) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
        <Bell className="h-10 w-10 text-stone-300" />
        <p className="text-stone-500">Sign in to manage seasonal dig alerts.</p>
        <button onClick={() => router.push("/login")} className="btn-primary">Sign in</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
          <Bell className="h-6 w-6 text-brand-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-stone-900">Seasonal Dig Alerts</h1>
        <p className="mt-1 text-stone-500">
          Get notified when your minerals are in peak season at Ontario sites.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center text-stone-400">Loading…</div>
      ) : sub?.is_active ? (
        <div className="card p-6 text-center">
          <Bell className="mx-auto mb-3 h-8 w-8 text-brand-600" />
          <p className="mb-1 font-semibold text-stone-900">You&apos;re subscribed!</p>
          <p className="mb-4 text-sm text-stone-500">
            {sub.minerals.length > 0 ? sub.minerals.join(", ") : "All minerals"} ·{" "}
            {sub.provinces.length > 0 ? sub.provinces.join(", ") : "All provinces"}
          </p>
          <button
            onClick={() => unsubscribe.mutate()}
            disabled={unsubscribe.isPending}
            className="btn-secondary gap-2 text-sm"
          >
            <BellOff className="h-4 w-4" />
            {unsubscribe.isPending ? "Unsubscribing…" : "Unsubscribe"}
          </button>
        </div>
      ) : (
        <div className="card p-6 space-y-5">
          <div>
            <p className="mb-2 text-sm font-semibold text-stone-700">
              Minerals <span className="font-normal text-stone-400">(leave empty for all)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_MINERALS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMinerals(toggle(minerals, m))}
                  className={`flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-medium transition ${
                    minerals.includes(m)
                      ? "border-brand-500 bg-brand-100 text-brand-700"
                      : "border-stone-200 text-stone-600 hover:border-brand-300"
                  }`}
                >
                  <Gem className="h-3 w-3" /> {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-stone-700">
              Provinces <span className="font-normal text-stone-400">(leave empty for all)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {PROVINCES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvinces(toggle(provinces, p))}
                  className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                    provinces.includes(p)
                      ? "border-brand-500 bg-brand-100 text-brand-700"
                      : "border-stone-200 text-stone-600 hover:border-brand-300"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => subscribe.mutate()}
            disabled={subscribe.isPending}
            className="btn-primary w-full gap-2"
          >
            <Bell className="h-4 w-4" />
            {subscribe.isPending ? "Subscribing…" : "Subscribe to alerts"}
          </button>
          <p className="text-center text-xs text-stone-400">
            We email you when your selected minerals hit peak season at active sites.
          </p>
        </div>
      )}
    </div>
  );
}
