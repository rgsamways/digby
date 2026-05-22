"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { api } from "@/lib/api";

interface StrataBox {
  id: string;
  month_number: number;
  theme: string;
  subtitle: string;
  cover_image_url: string;
  contents: string[];
  field_card_text: string;
  site_links: { site_slug: string; site_name: string; mineral: string }[];
  shipped_at: string | null;
}

export default function StrataArchivePage() {
  const { data: boxes = [], isLoading } = useQuery<StrataBox[]>({
    queryKey: ["strata-boxes"],
    queryFn: () => api.get("/api/strata/boxes"),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <Link href="/strata" className="text-sm text-brand-600 hover:text-brand-700">← Digby Strata</Link>
        <h1 className="mt-2 text-3xl font-extrabold text-stone-900">Box Archive</h1>
        <p className="mt-1 text-stone-500">Every box, every geological chapter — a growing reference library.</p>
      </div>

      {isLoading && <p className="text-stone-500">Loading…</p>}

      {!isLoading && boxes.length === 0 && (
        <div className="py-20 text-center">
          <BookOpen className="mx-auto mb-4 h-12 w-12 text-stone-200" />
          <p className="text-stone-500">The first box ships September 2026.</p>
          <Link href="/strata" className="mt-4 inline-block btn-primary">Subscribe now</Link>
        </div>
      )}

      <div className="space-y-6">
        {boxes.map((box) => (
          <div key={box.id} className="card overflow-hidden">
            <div className="flex">
              {box.cover_image_url && (
                <img
                  src={box.cover_image_url}
                  alt={box.theme}
                  className="h-40 w-40 shrink-0 object-cover"
                />
              )}
              <div className="p-5 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-semibold text-brand-600 uppercase tracking-wide">
                    Box {box.month_number}
                  </span>
                  {box.shipped_at && (
                    <span className="text-xs text-stone-400">
                      · {new Date(box.shipped_at).toLocaleDateString("en-CA", { year: "numeric", month: "long" })}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-stone-900">{box.theme}</h2>
                {box.subtitle && <p className="text-sm text-stone-500">{box.subtitle}</p>}

                {box.contents.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {box.contents.map((c) => (
                      <span key={c} className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-600">
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                {box.site_links.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-stone-400 mb-1">Find it yourself:</p>
                    <div className="flex flex-wrap gap-2">
                      {box.site_links.map((s) => (
                        <Link
                          key={s.site_slug}
                          href={`/sites/${s.site_slug}`}
                          className="text-xs text-brand-600 hover:text-brand-700"
                        >
                          {s.site_name} ({s.mineral}) →
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {box.field_card_text && (
              <div className="border-t border-stone-100 bg-stone-50 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Field Card</p>
                <p className="text-sm text-stone-600 leading-relaxed">{box.field_card_text}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
