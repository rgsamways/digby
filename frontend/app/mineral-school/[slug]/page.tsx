"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import type { FieldGuide } from "@/lib/types";
import { BookOpen, ArrowLeft, Gem } from "lucide-react";

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced: "bg-red-100 text-red-700",
};

function SimpleBody({ body }: { body: string }) {
  const blocks = body.split(/\n\n+/);
  return (
    <div className="space-y-4 text-stone-700 leading-relaxed">
      {blocks.map((block, i) => {
        if (block.startsWith("# ")) {
          return <h2 key={i} className="text-xl font-bold text-stone-900 mt-6">{block.slice(2)}</h2>;
        }
        if (block.startsWith("## ")) {
          return <h3 key={i} className="text-lg font-semibold text-stone-800 mt-4">{block.slice(3)}</h3>;
        }
        if (block.startsWith("- ") || block.startsWith("* ")) {
          const items = block.split("\n").filter((l) => l.startsWith("- ") || l.startsWith("* "));
          return (
            <ul key={i} className="list-disc list-inside space-y-1">
              {items.map((item, j) => <li key={j}>{item.slice(2)}</li>)}
            </ul>
          );
        }
        return <p key={i}>{block}</p>;
      })}
    </div>
  );
}

export default function FieldGuidePage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: guide, isLoading, isError } = useQuery<FieldGuide>({
    queryKey: ["field-guide", slug],
    queryFn: () => api.get(`/api/field-guides/${slug}`),
    enabled: !!slug,
    retry: false,
  });

  if (isLoading) return <div className="flex h-64 items-center justify-center text-stone-500">Loading…</div>;
  if (isError || !guide) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <BookOpen className="h-10 w-10 text-stone-200" />
        <p className="text-stone-500">Guide not found.</p>
        <Link href="/mineral-school" className="btn-secondary text-sm">Browse guides</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/mineral-school" className="mb-6 flex items-center gap-1 text-sm text-stone-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Mineral School
      </Link>

      {guide.cover_image && (
        <img src={guide.cover_image} alt={guide.title} className="mb-6 h-56 w-full rounded-xl object-cover" />
      )}

      <div className="mb-3 flex items-center gap-3 flex-wrap">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${DIFFICULTY_COLORS[guide.difficulty] ?? "bg-stone-100 text-stone-500"}`}>
          {guide.difficulty}
        </span>
        {guide.mineral_tags.map((m) => (
          <span key={m} className="flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            <Gem className="h-3 w-3" /> {m}
          </span>
        ))}
      </div>

      <h1 className="mb-6 text-3xl font-extrabold text-stone-900">{guide.title}</h1>

      {guide.body ? (
        <SimpleBody body={guide.body} />
      ) : (
        <p className="text-stone-400 italic">No content yet.</p>
      )}

      <div className="mt-10 rounded-xl border border-brand-200 bg-brand-50 p-4 text-center">
        <p className="text-sm font-medium text-stone-700">Ready to find some yourself?</p>
        <Link href="/sites" className="mt-2 inline-block btn-primary text-sm">
          Browse dig sites →
        </Link>
      </div>
    </div>
  );
}
