"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { CheckCircle, Instagram } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";

const PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "other", label: "Other / Blog" },
] as const;

const PERKS = [
  { title: "Comp booking credits", body: "Access to select dig sites at no cost, for content purposes." },
  { title: "Specimen drop priority", body: "First access to limited specimen releases before they open to the public." },
  { title: "Creator badge", body: "Visible tier badge on your public Digby creator profile." },
];

type MeUser = {
  is_creator: boolean;
  creator_application_submitted: boolean;
};

export default function CreatorApplyPage() {
  const user = useAuthStore((s) => s.user);
  const [form, setForm] = useState({
    handle: "",
    platform: "instagram",
    short_answer: "",
    content_url: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const { data: me, isLoading } = useQuery<MeUser>({
    queryKey: ["me-creator-status"],
    queryFn: () => api.get("/api/auth/me", { auth: true }),
    enabled: !!user,
  });

  const mutation = useMutation({
    mutationFn: () =>
      api.post(
        "/api/creators/apply",
        {
          handle: form.handle,
          platform: form.platform,
          short_answer: form.short_answer,
          content_url: form.content_url || undefined,
        },
        { auth: true }
      ),
    onSuccess: () => setSubmitted(true),
  });

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-stone-600">You need to be signed in to apply.</p>
        <Link href="/login" className="btn-primary mt-4 inline-block">
          Sign in
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return <div className="mx-auto max-w-lg px-4 py-20 text-center text-stone-400">Loading…</div>;
  }

  if (me?.is_creator) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <CheckCircle className="mx-auto mb-3 h-10 w-10 text-green-500" />
        <h2 className="font-display text-xl text-stone-900">You&rsquo;re already a creator.</h2>
        <p className="mt-2 text-stone-500">Your profile is live on the Creator directory.</p>
        <Link href="/creators" className="btn-primary mt-5 inline-block">
          View directory
        </Link>
      </div>
    );
  }

  if (me?.creator_application_submitted || submitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <CheckCircle className="mx-auto mb-3 h-10 w-10 text-green-500" />
        <h2 className="font-display text-xl text-stone-900">Application received.</h2>
        <p className="mt-2 text-stone-500">
          We review every application personally. You&rsquo;ll hear back within a few days.
        </p>
        <p className="mt-4 text-sm text-stone-400">Keep creating in the meantime.</p>
        <Link href="/creators" className="mt-5 inline-block text-sm font-medium text-brand-600 hover:underline">
          Browse the creator directory →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400 mb-2">
          Creator Programme
        </p>
        <h1 className="font-display text-3xl text-stone-900">Apply to join</h1>
        <p className="mt-2 text-stone-500 max-w-lg">
          We&rsquo;re looking for Ontario rockhounds who document their finds and share the craft.
          Every application is reviewed personally — this cohort is curated, not automated.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-6"
        >
          {/* Social handle + platform */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">
              Primary social handle
            </label>
            <div className="flex gap-2">
              <select
                value={form.platform}
                onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
                className="input w-36 shrink-0"
              >
                {PLATFORMS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={form.handle}
                onChange={(e) => setForm((f) => ({ ...f, handle: e.target.value }))}
                required
                className="input flex-1"
                placeholder="@yourhandle"
              />
            </div>
          </div>

          {/* Content URL */}
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Link to your content{" "}
              <span className="font-normal text-stone-400">(optional)</span>
            </label>
            <input
              type="url"
              value={form.content_url}
              onChange={(e) => setForm((f) => ({ ...f, content_url: e.target.value }))}
              className="input"
              placeholder="https://instagram.com/yourhandle"
            />
          </div>

          {/* Short answer */}
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Tell us about your content
            </label>
            <p className="mb-1.5 text-xs text-stone-400">
              What do you cover, who&rsquo;s your audience, and why do you want to be part of the Digby Creator Programme?
            </p>
            <textarea
              value={form.short_answer}
              onChange={(e) => setForm((f) => ({ ...f, short_answer: e.target.value }))}
              required
              rows={5}
              maxLength={800}
              className="input"
              placeholder="I post field geology content on Instagram — amethyst and sodalite digs mostly. My audience is mostly Ontario-based rockhounds…"
            />
            <p className="mt-1 text-right text-xs text-stone-400">
              {form.short_answer.length}/800
            </p>
          </div>

          {mutation.isError && (
            <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary w-full"
          >
            {mutation.isPending ? "Submitting…" : "Submit application"}
          </button>
        </form>

        {/* Perks sidebar */}
        <aside className="space-y-4">
          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Instagram className="h-4 w-4 text-stone-400" />
              <h3 className="text-sm font-semibold text-stone-900">What you get</h3>
            </div>
            <ul className="space-y-4">
              {PERKS.map(({ title, body }) => (
                <li key={title}>
                  <p className="text-sm font-medium text-stone-800">{title}</p>
                  <p className="mt-0.5 text-xs text-stone-500 leading-relaxed">{body}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-5">
            <h3 className="mb-2 text-sm font-semibold text-stone-900">How it works</h3>
            <ol className="space-y-2 text-sm text-stone-500">
              <li className="flex gap-2">
                <span className="shrink-0 font-semibold text-stone-400">1.</span>
                Submit this form
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 font-semibold text-stone-400">2.</span>
                We review your application (usually a few days)
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 font-semibold text-stone-400">3.</span>
                If accepted, your profile goes live on the Creator directory
              </li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
