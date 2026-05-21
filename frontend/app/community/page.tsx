"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { BookOpen, Gem, MapPin, Calendar } from "lucide-react";
import { api } from "@/lib/api";
import type { DiaryEntry } from "@/lib/types";

export default function CommunityPage() {
  const [filterMineral, setFilterMineral] = useState("");

  const { data: entries = [], isLoading } = useQuery<DiaryEntry[]>({
    queryKey: ["diary-feed"],
    queryFn: () => api.get("/api/diary/feed"),
  });

  // Build unique mineral list from feed for filter chips
  const allMinerals = Array.from(
    new Set(entries.flatMap((e) => e.minerals_found))
  ).sort();

  const filtered = filterMineral
    ? entries.filter((e) => e.minerals_found.includes(filterMineral))
    : entries;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-6 w-6 text-brand-600" />
          <h1 className="text-3xl font-extrabold text-stone-900">Field Journal Feed</h1>
        </div>
        <p className="text-stone-500">
          Recent finds from Ontario rockhounds — what they dug up and where.
        </p>
      </div>

      {/* Mineral filter chips */}
      {allMinerals.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilterMineral("")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              filterMineral === ""
                ? "bg-brand-600 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            All finds
          </button>
          {allMinerals.map((m) => (
            <button
              key={m}
              onClick={() => setFilterMineral(filterMineral === m ? "" : m)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                filterMineral === m
                  ? "bg-brand-600 text-white"
                  : "bg-brand-50 text-brand-700 hover:bg-brand-100"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="flex h-48 items-center justify-center text-stone-400">
          Loading field journals…
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Gem className="h-10 w-10 text-stone-300" />
          <p className="text-stone-500">
            {filterMineral
              ? `No journals mentioning ${filterMineral} yet.`
              : "No public field journals yet — be the first to share a dig!"}
          </p>
          {!filterMineral && (
            <Link href="/sites" className="btn-primary mt-2">Browse sites</Link>
          )}
        </div>
      )}

      <div className="space-y-4">
        {filtered.map((entry) => (
          <Link
            key={entry.id}
            href={`/diary/${entry.id}`}
            className="block card p-5 hover:border-brand-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-stone-900 truncate">{entry.title}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <Link
                      href={`/sites/${entry.site_id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:text-brand-600 hover:underline"
                    >
                      {entry.site_name}
                    </Link>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(entry.visit_date).toLocaleDateString("en-CA", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="font-medium text-stone-500">{entry.visitor_name}</span>
                </div>

                {entry.body && (
                  <p className="mt-2 text-sm text-stone-600 line-clamp-2">{entry.body}</p>
                )}

                {entry.minerals_found.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {entry.minerals_found.map((m) => (
                      <span
                        key={m}
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          m === filterMineral
                            ? "bg-brand-600 text-white"
                            : "bg-brand-100 text-brand-700"
                        }`}
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {entry.photo_urls[0] && (
                <img
                  src={entry.photo_urls[0]}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-lg object-cover"
                />
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
