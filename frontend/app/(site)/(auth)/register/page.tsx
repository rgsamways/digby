"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const SURVEY_OPTIONS = [
  { id: "finding_sites", label: "Finding dig sites", emoji: "🪨" },
  { id: "sharing_land", label: "Sharing my land", emoji: "📍" },
  { id: "booking_group", label: "Booking for a class or group", emoji: "🎒" },
  { id: "research_science", label: "Research or science", emoji: "🔬" },
  { id: "just_browsing", label: "Just browsing", emoji: "👀" },
];

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  const initialRole = (["operator", "guide"].includes(params.get("role") ?? "") ? params.get("role") : "visitor") as string;

  const [step, setStep] = useState<"account" | "survey">("account");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: initialRole });
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function toggleOption(id: string) {
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  }

  async function submit(answers: string[]) {
    setError("");
    setLoading(true);
    try {
      const data = await api.post<{
        access_token: string; user_id: string; name: string;
        role: "visitor" | "operator" | "admin"; roles: string[]; email_flags: string[];
      }>("/api/auth/register", { ...form, onboarding_answers: answers });
      setAuth(data.access_token, {
        id: data.user_id, name: data.name, role: data.role,
        roles: data.roles ?? [], email_flags: data.email_flags ?? [],
        onboarding_answers: answers,
      });
      router.push(data.role === "operator" ? "/dashboard" : "/sites");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
      setStep("account");
    } finally {
      setLoading(false);
    }
  }

  function handleAccountSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStep("survey");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {step === "account" && (
          <div className="card p-8">
            <h1 className="mb-1 text-2xl font-bold text-stone-900">Create account</h1>
            <p className="mb-6 text-sm text-stone-500">Join Ontario&rsquo;s rockhound community.</p>
            <form onSubmit={handleAccountSubmit} className="space-y-4">
              {[
                { label: "Full name", key: "name", type: "text", placeholder: "Jane Smith" },
                { label: "Email", key: "email", type: "email", placeholder: "you@example.com" },
                { label: "Password", key: "password", type: "password", placeholder: "" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="mb-1 block text-sm font-medium text-stone-700">{label}</label>
                  <input
                    type={type}
                    value={form[key as keyof typeof form]}
                    onChange={set(key)}
                    required
                    className="input"
                    placeholder={placeholder}
                  />
                </div>
              ))}
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">I am a…</label>
                <select value={form.role} onChange={set("role")} className="input">
                  <option value="visitor">Visitor / Rockhound</option>
                  <option value="operator">Operator / Landowner</option>
                  <option value="guide">Guide / Expert</option>
                </select>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" className="btn-primary w-full">
                Continue →
              </button>
            </form>
            <p className="mt-4 text-center text-sm text-stone-600">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-brand-600 hover:underline">Sign in</Link>
            </p>
          </div>
        )}

        {step === "survey" && (
          <div className="card p-8">
            <h2 className="mb-1 text-xl font-bold text-stone-900">What brings you here?</h2>
            <p className="mb-5 text-sm text-stone-500">Pick all that apply. You can skip this.</p>
            <div className="mb-5 space-y-2">
              {SURVEY_OPTIONS.map(({ id, label, emoji }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleOption(id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                    selected.includes(id)
                      ? "border-brand-400 bg-brand-50 text-brand-800"
                      : "border-stone-200 text-stone-700 hover:border-stone-300 hover:bg-stone-50"
                  )}
                >
                  <span className="text-lg">{emoji}</span>
                  {label}
                  {selected.includes(id) && <span className="ml-auto text-brand-600">✓</span>}
                </button>
              ))}
            </div>
            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => submit([])}
                disabled={loading}
                className="flex-1 rounded-xl border border-stone-200 py-2.5 text-sm font-medium text-stone-500 hover:bg-stone-50 disabled:opacity-50"
              >
                Skip
              </button>
              <button
                onClick={() => submit(selected)}
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? "Creating…" : "Finish →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
