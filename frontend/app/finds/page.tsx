"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Bookmark, BookmarkCheck, MapPin, PlusCircle, Star } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import type { Find, FindFeedResponse } from "@/lib/types";

const PROVINCES = ["", "Grenville", "Superior", "Southern", "Churchill", "Widespread"];

const VERIFICATION_LABELS: Record<string, { label: string; cls: string }> = {
  unverified: { label: "Unverified", cls: "bg-stone-100 text-stone-500" },
  ai_likely: { label: "AI-likely", cls: "bg-blue-100 text-blue-700" },
  community_verified: { label: "Community verified", cls: "bg-green-100 text-green-700" },
  ogs_reviewed: { label: "OGS reviewed", cls: "bg-violet-100 text-violet-700" },
  disputed: { label: "Disputed", cls: "bg-red-100 text-red-600" },
};

export default function FindsFeedPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [mineral, setMineral] = useState("");
  const [province, setProvince] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [skip, setSkip] = useState(0);

  const { data, isLoading } = useQuery<FindFeedResponse>({
    queryKey: ["finds-feed", mineral, province, featuredOnly, skip],
    queryFn: () => {
      const p = new URLSearchParams();
      if (mineral) p.set("mineral", mineral);
      if (province) p.set("province", province);
      if (featuredOnly) p.set("featured_only", "true");
      p.set("skip", String(skip));
      return api.get(`/api/finds/feed?${p}`);
    },
  });

  const saveMutation = useMutation({
    mutationFn: (findId: string) => api.post(`/api/finds/${findId}/save`, {}, { auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finds-feed"] }),
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const PAGE = 20;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">Find Feed</h1>
          <p className="text-stone-500 text-sm mt-0.5">What rockhounds are finding across Ontario</p>
        </div>
        {user && (
          <Link href="/finds/new" className="btn-primary flex items-center gap-2 self-start sm:self-auto">
            <PlusCircle className="h-4 w-4" /> Log a find
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Filter by mineral…"
          value={mineral}
          onChange={(e) => { setMineral(e.target.value); setSkip(0); }}
          className="input flex-1 min-w-40"
        />
        <select
          value={province}
          onChange={(e) => { setProvince(e.target.value); setSkip(0); }}
          className="input w-44"
        >
          <option value="">All provinces</option>
          {PROVINCES.filter(Boolean).map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button
          onClick={() => setFeaturedOnly(!featuredOnly)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${
            featuredOnly
              ? "border-amber-300 bg-amber-50 text-amber-700"
              : "border-stone-200 text-stone-500 hover:bg-stone-50"
          }`}
        >
          <Star className="h-4 w-4" />
          Featured
        </button>
        {user && (
          <Link href="/finds/my" className="btn-secondary text-sm">
            My Journal
          </Link>
        )}
      </div>

      {isLoading && (
        <div className="flex h-48 items-center justify-center text-stone-400">Loading…</div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="flex h-48 flex-col items-center justify-center gap-2 text-stone-400">
          <p>No finds yet — be the first to log one!</p>
          {user && <Link href="/finds/new" className="btn-primary text-sm">Log a find</Link>}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((find) => (
          <FindCard
            key={find.id}
            find={find}
            onSave={user ? () => saveMutation.mutate(find.id) : undefined}
          />
        ))}
      </div>

      {/* Pagination */}
      {total > PAGE && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            disabled={skip === 0}
            onClick={() => setSkip(Math.max(0, skip - PAGE))}
            className="btn-secondary disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="text-sm text-stone-500">
            {skip + 1}–{Math.min(skip + PAGE, total)} of {total}
          </span>
          <button
            disabled={skip + PAGE >= total}
            onClick={() => setSkip(skip + PAGE)}
            className="btn-secondary disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function FindCard({
  find,
  onSave,
}: {
  find: Find;
  onSave?: () => void;
}) {
  const v = VERIFICATION_LABELS[find.verification_status] ?? VERIFICATION_LABELS.unverified;

  return (
    <Link
      href={`/finds/${find.id}`}
      className="card block p-0 overflow-hidden hover:shadow-md transition group"
    >
      {find.photo_urls.length > 0 && (
        <div className="aspect-[4/3] overflow-hidden bg-stone-100">
          <img
            src={find.photo_urls[0]}
            alt={find.mineral_name}
            className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-stone-900">{find.mineral_name}</h3>
          <div className="flex items-center gap-2 shrink-0">
            {find.is_featured && <Star className="h-4 w-4 text-amber-500 fill-amber-400" />}
            {onSave && (
              <button
                onClick={(e) => { e.preventDefault(); onSave(); }}
                className="text-stone-400 hover:text-brand-600 transition"
              >
                {find.saved
                  ? <BookmarkCheck className="h-4 w-4 text-brand-600" />
                  : <Bookmark className="h-4 w-4" />
                }
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${v.cls}`}>{v.label}</span>
          {find.geological_province && (
            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs text-violet-700">
              {find.geological_province}
            </span>
          )}
        </div>

        {find.notes && (
          <p className="text-sm text-stone-600 line-clamp-2 mb-2">{find.notes}</p>
        )}

        <div className="flex items-center justify-between text-xs text-stone-400 mt-auto">
          <span>{find.author_name}</span>
          <span className="flex items-center gap-1">
            {find.site_name && <><MapPin className="h-3 w-3" />{find.site_name}</>}
          </span>
        </div>
        <p className="text-xs text-stone-400 mt-0.5">
          {new Date(find.date).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" })}
          {find.save_count > 0 && ` · ${find.save_count} saved`}
        </p>
      </div>
    </Link>
  );
}
