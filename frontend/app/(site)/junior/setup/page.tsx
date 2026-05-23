"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { juniorApi } from "@/lib/junior";
import { useAuthStore } from "@/lib/auth";

const AVATARS = ["🪨", "💎", "🔬", "⛏️", "🌋", "🦕", "🧲", "🏔️", "🌿", "🦎", "🐊", "🌊"];
const AGE_RANGES = [
  { value: "6-8", label: "6–8 years", emoji: "🌱" },
  { value: "8-10", label: "8–10 years", emoji: "🌿" },
  { value: "10-12", label: "10–12 years", emoji: "🌲" },
];

export default function JuniorSetupPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [firstName, setFirstName] = useState("");
  const [ageRange, setAgeRange] = useState("8-10");
  const [avatar, setAvatar] = useState("🪨");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!user) {
    router.push("/login?redirect=/junior/setup");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim()) return;
    setSaving(true);
    setError("");
    try {
      const profile = await juniorApi.createProfile({
        first_name: firstName.trim(),
        age_range: ageRange,
        avatar,
      });
      router.push(`/junior/${profile.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create profile");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="text-center mb-8">
        <div className="text-6xl mb-3">{avatar}</div>
        <h1 className="text-2xl font-extrabold text-stone-900">New Junior Geologist!</h1>
        <p className="text-stone-500 mt-1">Let&apos;s set up your profile</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="label">First name</label>
          <input
            required
            autoFocus
            className="input text-lg"
            placeholder="e.g. Alex"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Age group</label>
          <div className="grid grid-cols-3 gap-2 mt-1">
            {AGE_RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setAgeRange(r.value)}
                className={`rounded-xl border-2 p-3 text-center transition ${
                  ageRange === r.value
                    ? "border-brand-400 bg-brand-50"
                    : "border-stone-200 hover:border-stone-300"
                }`}
              >
                <div className="text-2xl mb-1">{r.emoji}</div>
                <p className="text-xs font-semibold text-stone-700">{r.label}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Choose your avatar</label>
          <div className="grid grid-cols-6 gap-2 mt-1">
            {AVATARS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAvatar(a)}
                className={`rounded-xl border-2 p-2 text-2xl text-center transition ${
                  avatar === a
                    ? "border-brand-400 bg-brand-50 scale-110"
                    : "border-stone-200 hover:border-stone-300"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !firstName.trim()}
            className="btn-primary flex-1"
          >
            {saving ? "Creating…" : "Let's go! 🪨"}
          </button>
        </div>
      </form>
    </div>
  );
}
