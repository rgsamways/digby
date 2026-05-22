"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bookmark, BookmarkCheck, ChevronLeft, MapPin, Star } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import type { Find } from "@/lib/types";

const VERIFICATION_LABELS: Record<string, { label: string; cls: string }> = {
  unverified: { label: "Unverified", cls: "bg-stone-100 text-stone-500" },
  ai_likely: { label: "AI-identified", cls: "bg-blue-100 text-blue-700" },
  community_verified: { label: "Community verified", cls: "bg-green-100 text-green-700" },
  ogs_reviewed: { label: "OGS reviewed", cls: "bg-violet-100 text-violet-700" },
  disputed: { label: "Disputed", cls: "bg-red-100 text-red-600" },
};

export default function FindDetailClient({ find: initialFind }: { find: Find }) {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [find, setFind] = useState<Find>(initialFind);
  const [activePhoto, setActivePhoto] = useState(0);

  const saveMutation = useMutation({
    mutationFn: () => api.post(`/api/finds/${find.id}/save`, {}, { auth: true }),
    onSuccess: (data: unknown) => {
      const d = data as { saved: boolean; save_count: number };
      setFind((prev) => ({ ...prev, saved: d.saved, save_count: d.save_count }));
      qc.invalidateQueries({ queryKey: ["finds-feed"] });
    },
  });

  const v = VERIFICATION_LABELS[find.verification_status] ?? VERIFICATION_LABELS.unverified;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/finds" className="mb-6 flex items-center gap-1 text-sm text-stone-400 hover:text-stone-700">
        <ChevronLeft className="h-4 w-4" /> Back to feed
      </Link>

      {/* Photo gallery */}
      {find.photo_urls.length > 0 && (
        <div className="mb-6">
          <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-stone-100 mb-2">
            <img
              src={find.photo_urls[activePhoto]}
              alt={find.mineral_name}
              className="h-full w-full object-cover"
            />
          </div>
          {find.photo_urls.length > 1 && (
            <div className="flex gap-2">
              {find.photo_urls.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setActivePhoto(i)}
                  className={`h-12 w-12 overflow-hidden rounded-lg border-2 transition ${
                    i === activePhoto ? "border-brand-500" : "border-transparent"
                  }`}
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-stone-900">{find.mineral_name}</h1>
            {find.is_featured && <Star className="h-5 w-5 text-amber-500 fill-amber-400" />}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${v.cls}`}>{v.label}</span>
            {find.geological_province && (
              <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs text-violet-700">
                {find.geological_province} Province
              </span>
            )}
            {find.citizen_science_eligible && (
              <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs text-green-700">
                Citizen science
              </span>
            )}
          </div>
        </div>

        {user && user.id !== find.user_id && (
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 transition"
          >
            {find.saved
              ? <><BookmarkCheck className="h-4 w-4 text-brand-600" /> Saved</>
              : <><Bookmark className="h-4 w-4" /> Save</>
            }
            {find.save_count > 0 && <span className="ml-1 text-stone-400">{find.save_count}</span>}
          </button>
        )}
      </div>

      {/* Details grid */}
      <div className="card mb-4 p-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-stone-400 text-xs uppercase tracking-wide mb-0.5">Found by</p>
          <p className="font-medium text-stone-800">{find.author_name}</p>
        </div>
        <div>
          <p className="text-stone-400 text-xs uppercase tracking-wide mb-0.5">Date</p>
          <p className="font-medium text-stone-800">
            {new Date(find.date).toLocaleDateString("en-CA", {
              year: "numeric", month: "long", day: "numeric",
            })}
          </p>
        </div>
        {find.site_name && (
          <div className="col-span-2">
            <p className="text-stone-400 text-xs uppercase tracking-wide mb-0.5">Site</p>
            <p className="font-medium text-stone-800 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-stone-400" /> {find.site_name}
            </p>
          </div>
        )}
        {find.host_rock && (
          <div>
            <p className="text-stone-400 text-xs uppercase tracking-wide mb-0.5">Host rock</p>
            <p className="font-medium text-stone-800">{find.host_rock}</p>
          </div>
        )}
        {find.formation && (
          <div>
            <p className="text-stone-400 text-xs uppercase tracking-wide mb-0.5">Formation</p>
            <p className="font-medium text-stone-800">{find.formation}</p>
          </div>
        )}
        {find.specimen_quality && (
          <div>
            <p className="text-stone-400 text-xs uppercase tracking-wide mb-0.5">Quality</p>
            <p className="font-medium text-stone-800">{find.specimen_quality}</p>
          </div>
        )}
        {find.gps_lat && find.gps_lng && (
          <div>
            <p className="text-stone-400 text-xs uppercase tracking-wide mb-0.5">GPS</p>
            <p className="font-medium text-stone-800 font-mono text-xs">
              {find.gps_lat.toFixed(5)}, {find.gps_lng.toFixed(5)}
            </p>
          </div>
        )}
      </div>

      {/* Notes */}
      {find.notes && (
        <div className="card mb-4 p-5">
          <p className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-2">Notes</p>
          <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">{find.notes}</p>
        </div>
      )}

      {/* Citizen science note */}
      {find.citizen_science_eligible && (
        <div className="rounded-xl border border-violet-100 bg-violet-50 p-4 text-sm text-violet-800">
          This find meets the OGS citizen science criteria and is included in data shared with the
          Ontario Geological Survey.
        </div>
      )}

      {/* CTA */}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/finds" className="btn-secondary">← Back to feed</Link>
        <Link href="/sites" className="btn-primary">Find a Digby site →</Link>
      </div>
    </div>
  );
}
