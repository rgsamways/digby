"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Guide } from "@/lib/types";

export default function GuidesPage() {
  const { data: guides = [], isLoading } = useQuery<Guide[]>({
    queryKey: ["guides"],
    queryFn: () => api.get("/api/guides/"),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-stone-900">Find a Guide</h1>
        <p className="mt-1 text-stone-500">
          Book a local expert for a day of rockhounding on Crown land or private sites.
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-stone-500">Loading guides…</div>
      ) : guides.length === 0 ? (
        <p className="text-center text-stone-500">No guides available yet.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <Link key={guide.id} href={`/guides/${guide.id}`} className="card block p-5 hover:shadow-md transition-shadow">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-2xl">
                  {guide.avatar_url ? (
                    <img src={guide.avatar_url} alt={guide.name} className="h-12 w-12 rounded-full object-cover" />
                  ) : "🧭"}
                </div>
                <div>
                  <p className="font-semibold text-stone-900">{guide.name}</p>
                  {guide.guide_location && (
                    <p className="text-xs text-stone-500">{guide.guide_location}</p>
                  )}
                </div>
              </div>

              {guide.bio && (
                <p className="mb-3 line-clamp-2 text-sm text-stone-600">{guide.bio}</p>
              )}

              {guide.specialties.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1">
                  {guide.specialties.slice(0, 3).map((s) => (
                    <span key={s} className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                      {s}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-500">
                  {guide.years_experience > 0 ? `${guide.years_experience} yrs exp` : "New guide"}
                </span>
                {guide.rate_per_day && (
                  <span className="font-semibold text-brand-700">${guide.rate_per_day}/day</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-10 rounded-xl border border-brand-200 bg-brand-50 p-6 text-center">
        <p className="mb-3 text-stone-700">Are you a local rockhound expert?</p>
        <Link href="/register?role=guide" className="btn-primary">
          Join as a Guide
        </Link>
      </div>
    </div>
  );
}
