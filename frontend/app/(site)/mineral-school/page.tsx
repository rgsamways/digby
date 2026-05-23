"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import type { FieldGuide } from "@/lib/types";
import { BookOpen, Gem } from "lucide-react";

const DIFFICULTIES = ["All levels", "beginner", "intermediate", "advanced"];
const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced: "bg-red-100 text-red-700",
};

export default function MineralSchoolPage() {
  const [difficulty, setDifficulty] = useState("All levels");
  const [mineralFilter, setMineralFilter] = useState("");

  const { data: guides = [], isLoading } = useQuery<FieldGuide[]>({
    queryKey: ["field-guides", difficulty, mineralFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (difficulty !== "All levels") params.set("difficulty", difficulty);
      if (mineralFilter) params.set("mineral", mineralFilter);
      return api.get(`/api/field-guides/?${params}`);
    },
  });

  const allMinerals = Array.from(new Set(guides.flatMap((g) => g.mineral_tags))).sort();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl text-stone-900">Mineral School</h1>
        <p className="mt-2 text-stone-400">
          Field guides for rockhounds — identification, formation, and collecting tips.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            onClick={() => setDifficulty(d)}
            className={`rounded-full border px-3 py-1 text-sm font-medium capitalize transition ${
              difficulty === d
                ? "border-brand-500 bg-brand-100 text-brand-700"
                : "border-stone-200 text-stone-600 hover:border-brand-300"
            }`}
          >
            {d}
          </button>
        ))}
        {allMinerals.slice(0, 6).map((m) => (
          <button
            key={m}
            onClick={() => setMineralFilter(mineralFilter === m ? "" : m)}
            className={`flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-medium transition ${
              mineralFilter === m
                ? "border-brand-500 bg-brand-100 text-brand-700"
                : "border-stone-200 text-stone-600 hover:border-brand-300"
            }`}
          >
            <Gem className="h-3 w-3" /> {m}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center text-stone-400">Loading…</div>
      ) : guides.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-200 py-20 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-stone-200" />
          <p className="font-medium text-stone-500">No guides yet.</p>
          <p className="mt-1 text-sm text-stone-400">Operators can publish field guides from the dashboard.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((g) => (
            <Link
              key={g.id}
              href={`/mineral-school/${g.slug}`}
              className="card group overflow-hidden hover:shadow-md transition-shadow"
            >
              {g.cover_image ? (
                <img src={g.cover_image} alt={g.title} className="h-36 w-full object-cover group-hover:scale-105 transition-transform duration-200" />
              ) : (
                <div className="flex h-36 items-center justify-center bg-gradient-to-br from-brand-50 to-stone-100">
                  <BookOpen className="h-10 w-10 text-brand-200" />
                </div>
              )}
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${DIFFICULTY_COLORS[g.difficulty] ?? "bg-stone-100 text-stone-500"}`}>
                    {g.difficulty}
                  </span>
                </div>
                <h3 className="font-semibold text-stone-900 leading-snug">{g.title}</h3>
                {g.mineral_tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {g.mineral_tags.slice(0, 3).map((m) => (
                      <span key={m} className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">{m}</span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
