"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { BookOpen, MapPin } from "lucide-react";
import { api } from "@/lib/api";
import type { DiaryEntry } from "@/lib/types";

export default function DiaryFeedPage() {
  const { data: entries = [], isLoading } = useQuery<DiaryEntry[]>({
    queryKey: ["diary-feed"],
    queryFn: () => api.get("/api/diary/feed"),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl text-stone-900">Field Journal</h1>
          <p className="mt-2 text-stone-400">What rockhounds are finding out there</p>
        </div>
        <Link href="/diary/new" className="btn-primary text-sm">Write entry</Link>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center text-stone-400">Loading…</div>
      ) : entries.length === 0 ? (
        <div className="card p-12 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-stone-300" />
          <p className="text-stone-500">No journal entries yet. Be the first to write one!</p>
          <Link href="/diary/new" className="mt-4 inline-block btn-primary text-sm">Write entry</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((e) => (
            <Link key={e.id} href={`/diary/${e.id}`} className="card block p-5 hover:shadow-md transition-shadow">
              <div className="mb-2 flex items-start justify-between gap-4">
                <h2 className="font-semibold text-stone-900 text-lg leading-snug">{e.title}</h2>
                <span className="shrink-0 text-xs text-stone-400">
                  {new Date(e.visit_date).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <p className="mb-3 flex items-center gap-1 text-sm text-stone-500">
                <MapPin className="h-3.5 w-3.5" /> {e.site_name}
                <span className="mx-1 text-stone-300">·</span>
                <span className="text-stone-400">{e.visitor_name}</span>
              </p>
              {e.body && (
                <p className="mb-3 text-sm text-stone-600 line-clamp-2">{e.body}</p>
              )}
              {e.minerals_found.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {e.minerals_found.map((m) => (
                    <span key={m} className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">{m}</span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
