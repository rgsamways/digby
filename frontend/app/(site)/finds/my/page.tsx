"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { PlusCircle, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import type { Find } from "@/lib/types";

const VERIFICATION_LABELS: Record<string, { label: string; cls: string }> = {
  unverified: { label: "Unverified", cls: "bg-stone-100 text-stone-500" },
  ai_likely: { label: "AI-likely", cls: "bg-blue-100 text-blue-700" },
  community_verified: { label: "Community verified", cls: "bg-green-100 text-green-700" },
  ogs_reviewed: { label: "OGS reviewed", cls: "bg-violet-100 text-violet-700" },
  disputed: { label: "Disputed", cls: "bg-red-100 text-red-600" },
};

export default function MyFindsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: finds = [], isLoading } = useQuery<Find[]>({
    queryKey: ["my-finds"],
    queryFn: () => api.get("/api/finds/my", { auth: true }),
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del(`/api/finds/${id}`, { auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-finds"] }),
  });

  if (!user) {
    router.push("/login?redirect=/finds/my");
    return null;
  }

  const publicCount = finds.filter((f) => f.visibility === "public").length;
  const csCount = finds.filter((f) => f.citizen_science_eligible).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl text-stone-900">My Find Journal</h1>
          <p className="mt-2 text-stone-400">
            {finds.length} finds · {publicCount} public · {csCount} citizen science eligible
          </p>
        </div>
        <Link href="/finds/new" className="btn-primary flex items-center gap-2">
          <PlusCircle className="h-4 w-4" /> Log a find
        </Link>
      </div>

      {isLoading && (
        <div className="flex h-48 items-center justify-center text-stone-400">Loading…</div>
      )}

      {!isLoading && finds.length === 0 && (
        <div className="flex h-48 flex-col items-center justify-center gap-3 text-stone-400">
          <p>No finds logged yet.</p>
          <Link href="/finds/new" className="btn-primary text-sm">Log your first find</Link>
        </div>
      )}

      <div className="space-y-3">
        {finds.map((find) => {
          const v = VERIFICATION_LABELS[find.verification_status];
          return (
            <div key={find.id} className="card p-4 flex gap-4">
              {find.photo_urls.length > 0 && (
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                  <img src={find.photo_urls[0]} alt="" className="h-full w-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/finds/${find.id}`}
                    className="font-bold text-stone-900 hover:text-brand-600 truncate"
                  >
                    {find.mineral_name}
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${v.cls}`}>
                      {v.label}
                    </span>
                    <button
                      onClick={() => deleteMutation.mutate(find.id)}
                      disabled={deleteMutation.isPending}
                      className="text-stone-300 hover:text-red-500 transition"
                      title="Delete find"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-stone-500 mt-0.5">
                  {new Date(find.date).toLocaleDateString("en-CA", {
                    year: "numeric", month: "short", day: "numeric",
                  })}
                  {find.site_name && ` · ${find.site_name}`}
                  {find.geological_province && ` · ${find.geological_province}`}
                </p>
                {find.notes && (
                  <p className="text-sm text-stone-600 line-clamp-1 mt-0.5">{find.notes}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5 text-xs text-stone-400">
                  <span>{find.visibility === "private" ? "Private" : "Public"}</span>
                  {find.citizen_science_eligible && (
                    <span className="text-violet-600 font-medium">Citizen science ✓</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
