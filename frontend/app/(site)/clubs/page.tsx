"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, Users } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";

interface ClubSummary {
  id: string;
  name: string;
  description: string;
  slug: string;
  member_count: number;
  is_member: boolean;
  is_public: boolean;
}

export default function ClubsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [createError, setCreateError] = useState("");

  const { data: clubs = [], isLoading } = useQuery<ClubSummary[]>({
    queryKey: ["clubs"],
    queryFn: () => api.get("/api/clubs/", { auth: true }),
    enabled: !!user,
  });

  const joinMutation = useMutation({
    mutationFn: (slug: string) => api.post(`/api/clubs/${slug}/join`, {}, { auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clubs"] }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post("/api/clubs/", { name, description, is_public: isPublic }, { auth: true }),
    onSuccess: (data: unknown) => {
      qc.invalidateQueries({ queryKey: ["clubs"] });
      router.push(`/clubs/${(data as ClubSummary).slug}`);
    },
    onError: (e: unknown) =>
      setCreateError(e instanceof Error ? e.message : "Failed to create club"),
  });

  if (!user) {
    router.push("/login?redirect=/clubs");
    return null;
  }

  const myClubs = clubs.filter((c) => c.is_member);
  const otherClubs = clubs.filter((c) => !c.is_member);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl text-stone-900">Clubs</h1>
          <p className="mt-2 text-stone-400">
            Join a rockhound club to share finds and connect with collectors near you.
          </p>
        </div>
        <button
          onClick={() => setCreating(!creating)}
          className="btn-primary flex items-center gap-2 shrink-0"
        >
          <PlusCircle className="h-4 w-4" /> New club
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="mb-8 rounded-2xl border border-brand-100 bg-brand-50 p-6">
          <h2 className="font-bold text-stone-900 mb-4">Create a club</h2>
          <div className="space-y-3">
            <div>
              <label className="form-label">Club name *</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bancroft Rockhounds, Grenville Gem Society" />
            </div>
            <div>
              <label className="form-label">Description</label>
              <textarea className="input min-h-20 resize-none" value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does your club collect? Where do you dig?" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300 text-brand-600" />
              <span className="text-sm text-stone-700">Public — anyone can find and join</span>
            </label>
            {createError && <p className="text-sm text-red-600">{createError}</p>}
            <div className="flex gap-3">
              <button onClick={() => createMutation.mutate()} disabled={!name || createMutation.isPending}
                className="btn-primary flex-1">
                {createMutation.isPending ? "Creating…" : "Create club"}
              </button>
              <button onClick={() => setCreating(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {isLoading && <div className="h-32 flex items-center justify-center text-stone-400">Loading…</div>}

      {/* My clubs */}
      {myClubs.length > 0 && (
        <section className="mb-8">
          <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-wide mb-3">My clubs</h2>
          <div className="space-y-3">
            {myClubs.map((club) => (
              <ClubCard key={club.id} club={club} isMember />
            ))}
          </div>
        </section>
      )}

      {/* Other clubs */}
      {otherClubs.length > 0 && (
        <section>
          <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-wide mb-3">
            {myClubs.length > 0 ? "Other clubs" : "All clubs"}
          </h2>
          <div className="space-y-3">
            {otherClubs.map((club) => (
              <ClubCard key={club.id} club={club} isMember={false}
                onJoin={() => joinMutation.mutate(club.slug)}
                joining={joinMutation.isPending} />
            ))}
          </div>
        </section>
      )}

      {!isLoading && clubs.length === 0 && !creating && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="h-10 w-10 text-stone-200 mb-3" />
          <p className="text-stone-500">No clubs yet — create the first one!</p>
        </div>
      )}
    </div>
  );
}

function ClubCard({
  club, isMember, onJoin, joining,
}: {
  club: ClubSummary;
  isMember: boolean;
  onJoin?: () => void;
  joining?: boolean;
}) {
  return (
    <div className="card p-4 flex items-center gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700 font-extrabold text-lg">
        {club.name[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <Link href={`/clubs/${club.slug}`} className="font-semibold text-stone-900 hover:text-brand-600">
          {club.name}
        </Link>
        {club.description && (
          <p className="text-sm text-stone-500 mt-0.5 line-clamp-1">{club.description}</p>
        )}
        <p className="text-xs text-stone-400 mt-1">
          {club.member_count} member{club.member_count !== 1 ? "s" : ""}
          {!club.is_public && " · Private"}
        </p>
      </div>
      {isMember ? (
        <Link href={`/clubs/${club.slug}`} className="shrink-0 text-xs font-semibold text-brand-600 hover:underline">
          View →
        </Link>
      ) : (
        <button onClick={onJoin} disabled={joining}
          className="shrink-0 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 disabled:opacity-50">
          {joining ? "…" : "Join"}
        </button>
      )}
    </div>
  );
}
