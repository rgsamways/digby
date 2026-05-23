"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FlaskConical, Plus, Star, Trophy } from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { juniorApi, type ParentSummaryEntry } from "@/lib/junior";

const AVATARS = ["🪨", "💎", "🔬", "⛏️", "🌋", "🦕", "🧲", "🏔️"];

export default function JuniorLandingPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const { data: summaries, isLoading } = useQuery({
    queryKey: ["junior-summary"],
    queryFn: juniorApi.getParentSummary,
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-5xl">
          🪨
        </div>
        <h1 className="text-3xl font-extrabold text-stone-900 mb-2">Junior Geologist Club</h1>
        <p className="text-stone-500 mb-8 text-lg">
          Collect mineral cards, solve rock mysteries, and explore Ontario&apos;s geology — made for
          kids ages 6–12!
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/login?redirect=/junior" className="btn-primary">
            Log in to play
          </Link>
          <Link href="/register" className="btn-secondary">
            Create account
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-3 gap-4 text-center">
          {[
            { icon: "💎", label: "45 Minerals", sub: "to collect" },
            { icon: "🔍", label: "20 Cases", sub: "to solve" },
            { icon: "🏅", label: "19 Badges", sub: "to earn" },
          ].map((f) => (
            <div key={f.label} className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
              <div className="text-3xl mb-1">{f.icon}</div>
              <p className="font-bold text-stone-800 text-sm">{f.label}</p>
              <p className="text-xs text-stone-500">{f.sub}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">Junior Geologist Club</h1>
          <p className="text-stone-500 text-sm mt-0.5">Who&apos;s playing today?</p>
        </div>
        {(summaries ?? []).length < 4 && (
          <Link href="/junior/setup" className="btn-primary flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Add Junior
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-stone-100 animate-pulse" />
          ))}
        </div>
      ) : summaries && summaries.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {summaries.map((s) => (
            <ProfileCard key={s.id} summary={s} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function ProfileCard({ summary }: { summary: ParentSummaryEntry }) {
  return (
    <Link
      href={`/junior/${summary.id}`}
      className="relative rounded-2xl border-2 border-stone-100 bg-white p-5 hover:border-brand-300 hover:shadow-md transition group"
    >
      <div className="text-5xl mb-3">{summary.avatar}</div>
      <p className="font-extrabold text-stone-900 text-lg">{summary.first_name}</p>
      <p className="text-xs text-stone-400 mb-3">{summary.age_range} years</p>
      <div className="flex flex-col gap-1 text-xs text-stone-600">
        <span className="flex items-center gap-1">
          <span>💎</span> {summary.cards_collected} cards
        </span>
        <span className="flex items-center gap-1">
          <Trophy className="h-3 w-3 text-amber-500" /> {summary.badges_earned} badges
        </span>
        {summary.login_streak >= 2 && (
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 text-orange-400" /> {summary.login_streak} day streak!
          </span>
        )}
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-stone-200 p-12 text-center">
      <FlaskConical className="h-10 w-10 text-stone-300 mx-auto mb-3" />
      <p className="font-semibold text-stone-700 mb-1">No junior geologists yet</p>
      <p className="text-stone-500 text-sm mb-4">Create a profile for your child to get started</p>
      <Link href="/junior/setup" className="btn-primary">
        Create first profile
      </Link>
    </div>
  );
}
