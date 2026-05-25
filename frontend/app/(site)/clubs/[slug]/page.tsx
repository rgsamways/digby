"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, LogOut } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";

interface ClubDetail {
  id: string;
  name: string;
  description: string;
  slug: string;
  owner_id: string;
  member_count: number;
  is_member: boolean;
  user_role: "owner" | "member" | null;
  members: { id: string; name: string; role: string; joined_at: string }[];
  recent_finds: {
    id: string;
    mineral_name: string;
    date: string;
    geological_province: string | null;
    photo_url: string | null;
    author_name: string;
    verification_status: string;
  }[];
}

const VERIFICATION_COLORS: Record<string, string> = {
  unverified: "bg-stone-100 text-stone-500",
  ai_likely: "bg-blue-100 text-blue-700",
  community_verified: "bg-green-100 text-green-700",
  ogs_reviewed: "bg-violet-100 text-violet-700",
  disputed: "bg-red-100 text-red-600",
};

export default function ClubDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: club, isLoading, error } = useQuery<ClubDetail>({
    queryKey: ["club", slug],
    queryFn: () => api.get(`/api/clubs/${slug}`, { auth: true }),
    enabled: !!user && !!slug,
  });

  const leaveMutation = useMutation({
    mutationFn: () => api.del(`/api/clubs/${slug}/leave`, { auth: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clubs"] });
      router.push("/clubs");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.del(`/api/clubs/${slug}`, { auth: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clubs"] });
      router.push("/clubs");
    },
  });

  if (!user) {
    router.push("/login");
    return null;
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-4">
        <div className="h-24 animate-pulse rounded-2xl bg-stone-100" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-48 animate-pulse rounded-xl bg-stone-100" />
          <div className="h-48 animate-pulse rounded-xl bg-stone-100" />
        </div>
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center">
        <p className="text-stone-500">Club not found.</p>
        <Link href="/clubs" className="mt-4 inline-block text-sm text-brand-600 hover:underline">Back to clubs</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link href="/clubs" className="mb-4 flex items-center gap-1 text-sm text-stone-400 hover:text-stone-700">
          <ArrowLeft className="h-4 w-4" /> All clubs
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl text-stone-900">{club.name}</h1>
            {club.description && <p className="mt-2 text-stone-500">{club.description}</p>}
            <p className="mt-2 text-sm text-stone-400">{club.member_count} member{club.member_count !== 1 ? "s" : ""}</p>
          </div>
          {club.is_member && club.user_role !== "owner" && (
            <button
              onClick={() => leaveMutation.mutate()}
              disabled={leaveMutation.isPending}
              className="shrink-0 flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-500 hover:border-red-200 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" /> Leave
            </button>
          )}
          {club.user_role === "owner" && (
            <button
              onClick={() => { if (confirm("Delete this club?")) deleteMutation.mutate(); }}
              className="shrink-0 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Delete club
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Members sidebar */}
        <div>
          <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-wide mb-3">Members</h2>
          <div className="space-y-2">
            {club.members.map((m) => (
              <div key={m.id} className="flex items-center gap-2.5 rounded-xl border border-stone-100 bg-white p-3">
                <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded-full bg-stone-100 text-sm font-bold text-stone-600">
                  {m.name[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-900 truncate">{m.name}</p>
                  {m.role === "owner" && (
                    <p className="text-[10px] text-brand-600 font-semibold uppercase tracking-wide">Owner</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent finds feed */}
        <div className="md:col-span-2">
          <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-wide mb-3">
            Recent finds
          </h2>
          {club.recent_finds.length === 0 ? (
            <p className="text-sm text-stone-400">No public finds yet — members can log finds to populate this feed.</p>
          ) : (
            <div className="space-y-3">
              {club.recent_finds.map((find) => (
                <Link
                  key={find.id}
                  href={`/finds/${find.id}`}
                  className="card p-3 flex gap-3 hover:border-brand-200 transition"
                >
                  {find.photo_url ? (
                    <img src={find.photo_url} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover bg-stone-100" />
                  ) : (
                    <div className="h-14 w-14 shrink-0 rounded-lg bg-stone-100 flex items-center justify-center text-2xl">🪨</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-900 text-sm">{find.mineral_name}</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {find.author_name} · {find.geological_province || "Unknown province"} · {new Date(find.date).toLocaleDateString("en-CA")}
                    </p>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${VERIFICATION_COLORS[find.verification_status] ?? "bg-stone-100 text-stone-500"}`}>
                      {find.verification_status.replace("_", " ")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
