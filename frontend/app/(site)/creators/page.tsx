"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Globe, Instagram } from "lucide-react";
import { api } from "@/lib/api";
import type { Creator } from "@/lib/types";

const TIER_LABELS: Record<string, { label: string; cls: string }> = {
  resident_geologist: {
    label: "Resident Geologist",
    cls: "bg-violet-100 text-violet-700",
  },
  field_geologist: {
    label: "Field Geologist",
    cls: "bg-brand-100 text-brand-700",
  },
  explorer: {
    label: "Explorer",
    cls: "bg-stone-100 text-stone-600",
  },
};

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.22 8.22 0 004.8 1.54V6.79a4.85 4.85 0 01-1.03-.1z"/>
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.12C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.57A3.02 3.02 0 00.5 6.19C0 8.03 0 12 0 12s0 3.97.5 5.81a3.02 3.02 0 002.12 2.12C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.57a3.02 3.02 0 002.12-2.12C24 15.97 24 12 24 12s0-3.97-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/>
    </svg>
  );
}

function CreatorCard({ creator }: { creator: Creator }) {
  const tier = creator.creator_tier ? TIER_LABELS[creator.creator_tier] : null;

  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="shrink-0 h-12 w-12 rounded-full bg-stone-100 overflow-hidden">
          {creator.avatar_url ? (
            <img src={creator.avatar_url} alt={creator.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-stone-400 font-bold text-lg">
              {creator.name[0]}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-stone-900">{creator.name}</h3>
          {creator.guide_location && (
            <p className="text-xs text-stone-400 mt-0.5">{creator.guide_location}</p>
          )}
          {tier && (
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${tier.cls}`}>
              {tier.label}
            </span>
          )}
        </div>
      </div>

      {creator.bio && (
        <p className="text-sm text-stone-600 line-clamp-3">{creator.bio}</p>
      )}

      {creator.specialties.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {creator.specialties.map((s) => (
            <span key={s} className="rounded-full bg-stone-50 border border-stone-200 px-2 py-0.5 text-[11px] text-stone-600">
              {s}
            </span>
          ))}
        </div>
      )}

      {(creator.social_instagram || creator.social_tiktok || creator.social_youtube || creator.content_url) && (
        <div className="flex items-center gap-3 pt-1 border-t border-stone-100">
          {creator.social_instagram && (
            <a
              href={`https://instagram.com/${creator.social_instagram.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 transition"
            >
              <Instagram className="h-4 w-4" />
              {creator.social_instagram.replace("@", "")}
            </a>
          )}
          {creator.social_tiktok && (
            <a
              href={`https://tiktok.com/@${creator.social_tiktok.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 transition"
            >
              <TikTokIcon />
              {creator.social_tiktok.replace("@", "")}
            </a>
          )}
          {creator.social_youtube && (
            <a
              href={creator.social_youtube.startsWith("http") ? creator.social_youtube : `https://youtube.com/@${creator.social_youtube}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 transition"
            >
              <YouTubeIcon />
            </a>
          )}
          {creator.content_url && (
            <a
              href={creator.content_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 transition"
            >
              <Globe className="h-4 w-4" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function CreatorsPage() {
  const { data: creators = [], isLoading } = useQuery<Creator[]>({
    queryKey: ["creators"],
    queryFn: () => api.get("/api/creators/"),
  });

  const residents = creators.filter((c) => c.creator_tier === "resident_geologist");
  const fields = creators.filter((c) => c.creator_tier === "field_geologist");
  const explorers = creators.filter((c) => c.creator_tier === "explorer" || !c.creator_tier);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400 mb-2">Creator Programme</p>
        <h1 className="font-display text-4xl text-stone-900">Our Creators</h1>
        <p className="mt-2 text-stone-500 max-w-xl">
          Ontario rockhounds documenting their finds, sharing the craft, and showing what
          it feels like to pull something out of the ground for the first time.
        </p>
      </div>

      {isLoading && (
        <div className="flex h-48 items-center justify-center text-stone-400">Loading…</div>
      )}

      {!isLoading && creators.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
          <p className="text-stone-500 font-medium">Creator directory coming soon.</p>
          <p className="text-sm text-stone-400 max-w-sm">
            We&apos;re building relationships with Ontario rockhound creators.
            Watch this space.
          </p>
        </div>
      )}

      {residents.length > 0 && (
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-violet-600">Resident Geologists</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {residents.map((c) => <CreatorCard key={c.id} creator={c} />)}
          </div>
        </section>
      )}

      {fields.length > 0 && (
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">Field Geologists</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map((c) => <CreatorCard key={c.id} creator={c} />)}
          </div>
        </section>
      )}

      {explorers.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-stone-400">Explorers</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {explorers.map((c) => <CreatorCard key={c.id} creator={c} />)}
          </div>
        </section>
      )}

      {/* Apply CTA */}
      <section className="mt-16 rounded-2xl border border-stone-200 bg-stone-50 px-8 py-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400 mb-2">
          Join the Programme
        </p>
        <h2 className="font-display text-2xl text-stone-900">
          Are you documenting Ontario geology?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-stone-500">
          We&rsquo;re looking for creators who cover rockhounding, field geology, and mineral collecting.
          Accepted creators get comp booking credits, specimen drop priority, and a public Digby profile.
        </p>
        <Link href="/creators/apply" className="btn-primary mt-6 inline-block">
          Apply to join →
        </Link>
      </section>
    </div>
  );
}
