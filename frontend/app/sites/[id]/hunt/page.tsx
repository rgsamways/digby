"use client";

import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { CheckCircle, Circle, Trophy, MapPin } from "lucide-react";
import { api } from "@/lib/api";
import type { ScavengerHunt, HuntProgress } from "@/lib/types";

export default function HuntPage() {
  const { id: siteId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking");
  const qc = useQueryClient();
  const [started, setStarted] = useState(false);

  const { data: hunt, isLoading: huntLoading } = useQuery<ScavengerHunt>({
    queryKey: ["site-hunt", siteId],
    queryFn: () => api.get(`/api/hunts/site/${siteId}`, { auth: true }),
    enabled: !!siteId,
  });

  const { data: progress } = useQuery<HuntProgress>({
    queryKey: ["hunt-progress", hunt?.id, bookingId],
    queryFn: () => api.get(`/api/hunts/${hunt!.id}/progress/${bookingId}`, { auth: true }),
    enabled: !!hunt && !!bookingId && started,
    retry: false,
  });

  const startProgress = useMutation({
    mutationFn: () =>
      api.post(`/api/hunts/${hunt!.id}/progress?booking_id=${bookingId}`, {}, { auth: true }),
    onSuccess: () => {
      setStarted(true);
      qc.invalidateQueries({ queryKey: ["hunt-progress", hunt?.id, bookingId] });
    },
  });

  const updateProgress = useMutation({
    mutationFn: (found_item_ids: string[]) =>
      api.patch(`/api/hunts/${hunt!.id}/progress/${bookingId}`, { found_item_ids }, { auth: true }),
    onSuccess: (data) => {
      qc.setQueryData(["hunt-progress", hunt?.id, bookingId], data);
    },
  });

  function toggleItem(itemId: string) {
    if (!progress) return;
    const current = progress.found_item_ids;
    const updated = current.includes(itemId)
      ? current.filter((id) => id !== itemId)
      : [...current, itemId];
    updateProgress.mutate(updated);
  }

  if (huntLoading) return <div className="flex h-64 items-center justify-center text-stone-500">Loading…</div>;
  if (!hunt) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <MapPin className="h-12 w-12 text-stone-300" />
      <p className="text-stone-500">No active scavenger hunt for this site.</p>
      <Link href={`/sites/${siteId}`} className="btn-secondary text-sm">Back to site</Link>
    </div>
  );

  const foundIds = progress?.found_item_ids ?? [];
  const totalItems = hunt.items.length;
  const foundCount = foundIds.length;
  const isComplete = progress?.completed_at != null;
  const pct = totalItems > 0 ? Math.round((foundCount / totalItems) * 100) : 0;

  if (!bookingId) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-stone-500">No booking specified. Book this site first.</p>
      <Link href={`/sites/${siteId}`} className="btn-primary text-sm">Book now</Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      {isComplete ? (
        <div className="mb-8 rounded-2xl bg-amber-50 border border-amber-200 p-8 text-center">
          <Trophy className="mx-auto mb-3 h-12 w-12 text-amber-500" />
          <h2 className="text-xl font-bold text-stone-900">Hunt complete!</h2>
          <p className="mt-1 text-stone-600">You found everything. A passport stamp has been added to your collection.</p>
          <Link href="/passport" className="mt-4 inline-block btn-primary text-sm">View passport</Link>
        </div>
      ) : (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-900">{hunt.title}</h1>
          {hunt.description && <p className="mt-1 text-stone-600">{hunt.description}</p>}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-stone-500 mb-1">
              <span>{foundCount} of {totalItems} found</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-stone-200">
              <div className="h-2 rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      )}

      {!progress && !started ? (
        <div className="card p-6 text-center">
          <p className="mb-4 text-stone-600">Ready to start the hunt? Check off each item as you find it.</p>
          <button onClick={() => startProgress.mutate()} disabled={startProgress.isPending} className="btn-primary">
            {startProgress.isPending ? "Starting…" : "Start hunt"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {hunt.items.map((item) => {
            const found = foundIds.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggleItem(item.id)}
                disabled={isComplete || updateProgress.isPending}
                className={`w-full rounded-xl border p-4 text-left transition-colors ${
                  found
                    ? "border-green-300 bg-green-50"
                    : "border-stone-200 bg-white hover:border-brand-300 hover:bg-brand-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {found
                    ? <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                    : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-stone-300" />
                  }
                  <div>
                    <p className={`font-medium ${found ? "text-green-800 line-through" : "text-stone-800"}`}>
                      {item.label}
                    </p>
                    {item.hint && !found && (
                      <p className="mt-0.5 text-xs text-stone-500">Hint: {item.hint}</p>
                    )}
                    <p className="mt-0.5 text-xs text-stone-400">{item.points} pts</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-6 text-center">
        <Link href={`/sites/${siteId}`} className="text-sm text-stone-400 hover:text-stone-600">← Back to site</Link>
      </div>
    </div>
  );
}
