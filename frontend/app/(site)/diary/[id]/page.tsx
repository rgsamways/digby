"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { MapPin, Calendar } from "lucide-react";
import { api } from "@/lib/api";
import type { DiaryEntry } from "@/lib/types";

export default function DiaryEntryPage() {
  const { id } = useParams<{ id: string }>();

  const { data: entry, isLoading } = useQuery<DiaryEntry>({
    queryKey: ["diary-entry", id],
    queryFn: () => api.get(`/api/diary/${id}`),
    enabled: !!id,
    retry: false,
  });

  if (isLoading) return <div className="flex h-64 items-center justify-center text-stone-400">Loading…</div>;
  if (!entry) return <div className="p-8 text-center text-stone-500">Entry not found.</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/diary" className="mb-6 inline-block text-sm text-stone-400 hover:text-stone-600">← Field Journal</Link>

      <h1 className="mb-3 font-display text-4xl text-stone-900">{entry.title}</h1>

      <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-stone-500">
        <span className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4" />
          <Link href={`/sites/${entry.site_id}`} className="hover:text-brand-600 hover:underline">{entry.site_name}</Link>
        </span>
        <span className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4" />
          {new Date(entry.visit_date).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}
        </span>
        <span className="text-stone-400">by {entry.visitor_name}</span>
      </div>

      {entry.minerals_found.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {entry.minerals_found.map((m) => (
            <span key={m} className="rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-700">{m}</span>
          ))}
        </div>
      )}

      {entry.photo_urls.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3">
          {entry.photo_urls.map((url) => (
            <img key={url} src={url} alt="Find" className="rounded-xl object-cover w-full h-48" />
          ))}
        </div>
      )}

      {entry.body && (
        <div className="prose prose-stone max-w-none">
          <p className="whitespace-pre-line leading-relaxed text-stone-700">{entry.body}</p>
        </div>
      )}

      <div className="mt-8 border-t border-stone-100 pt-6">
        <Link href={`/sites/${entry.site_id}`} className="btn-primary text-sm">Book this site</Link>
      </div>
    </div>
  );
}
