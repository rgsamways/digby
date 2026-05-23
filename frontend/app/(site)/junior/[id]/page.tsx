"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Flame, Gift, Lock } from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { juniorApi, hasClaimedToday, type JuniorProfile } from "@/lib/junior";

const GAMES = [
  {
    id: "collection",
    emoji: "💎",
    title: "Mineral Collection",
    description: "Collect cards and open your daily pack!",
    color: "from-violet-400 to-violet-600",
    textColor: "text-white",
  },
  {
    id: "detective",
    emoji: "🔍",
    title: "Rock Detective",
    description: "Solve mineral mysteries and earn rare cards.",
    color: "from-amber-400 to-orange-500",
    textColor: "text-white",
  },
  {
    id: "dig",
    emoji: "⛏️",
    title: "Dig Site",
    description: "Dig for specimens at a real Ontario mineral site!",
    color: "from-stone-400 to-stone-600",
    textColor: "text-white",
  },
  {
    id: "match",
    emoji: "🃏",
    title: "Mineral Match",
    description: "Flip cards and match minerals to their properties.",
    color: "from-teal-400 to-cyan-600",
    textColor: "text-white",
  },
  {
    id: "badges",
    emoji: "🏅",
    title: "My Badges",
    description: "See all the badges you've earned so far.",
    color: "from-brand-400 to-brand-600",
    textColor: "text-white",
  },
  {
    id: "explore",
    emoji: "🗺️",
    title: "Formation Explorer",
    description: "Explore the geology map of Ontario!",
    color: "from-emerald-400 to-green-600",
    textColor: "text-white",
  },
];

export default function JuniorHubPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const router = useRouter();

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["junior-profiles"],
    queryFn: juniorApi.listProfiles,
    enabled: !!user,
  });

  if (!user) {
    router.push("/login?redirect=/junior");
    return null;
  }

  const profile = profiles?.find((p) => p.id === id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="h-24 rounded-2xl bg-stone-100 animate-pulse mb-6" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-36 rounded-2xl bg-stone-100 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center">
        <p className="text-stone-500">Profile not found.</p>
        <Link href="/junior" className="btn-primary mt-4 inline-block">Back to profiles</Link>
      </div>
    );
  }

  const claimedToday = hasClaimedToday(profile);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/junior" className="text-stone-400 hover:text-stone-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1" />
      </div>

      <div className="rounded-2xl bg-gradient-to-r from-brand-500 to-violet-600 p-6 mb-6 text-white">
        <div className="flex items-center gap-4">
          <div className="text-6xl">{profile.avatar}</div>
          <div className="flex-1">
            <p className="text-brand-100 text-sm font-medium">Junior Geologist</p>
            <h1 className="text-2xl font-extrabold">{profile.first_name}</h1>
            <p className="text-brand-200 text-sm">{profile.age_range} years</p>
          </div>
          {profile.login_streak >= 2 && (
            <div className="text-center">
              <Flame className="h-6 w-6 text-orange-300 mx-auto" />
              <p className="font-bold text-lg leading-none">{profile.login_streak}</p>
              <p className="text-xs text-brand-200">day streak</p>
            </div>
          )}
        </div>

        {!claimedToday && (
          <Link
            href={`/junior/${id}/collection`}
            className="mt-4 flex items-center gap-2 rounded-xl bg-white/20 hover:bg-white/30 transition px-4 py-2.5 text-sm font-semibold"
          >
            <Gift className="h-4 w-4" />
            Your daily pack is ready! Open it now →
          </Link>
        )}
      </div>

      {/* Game grid */}
      <div className="grid grid-cols-2 gap-4">
        {GAMES.map((game) => (
          <Link
            key={game.id}
            href={`/junior/${id}/${game.id}`}
            className={`rounded-2xl bg-gradient-to-br ${game.color} p-5 hover:opacity-90 hover:scale-[1.02] active:scale-100 transition`}
          >
            <div className="text-4xl mb-2">{game.emoji}</div>
            <p className={`font-extrabold text-base ${game.textColor}`}>{game.title}</p>
            <p className={`text-xs mt-0.5 opacity-80 ${game.textColor}`}>{game.description}</p>
            {game.id === "collection" && !claimedToday && (
              <span className="mt-2 inline-block rounded-full bg-white/30 px-2 py-0.5 text-xs font-bold text-white">
                Pack ready!
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
