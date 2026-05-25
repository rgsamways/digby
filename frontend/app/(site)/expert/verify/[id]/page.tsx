"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import type { Expert } from "@/lib/types";

interface FindDetail {
  id: string;
  mineral_name: string;
  photo_urls: string[];
  host_rock: string | null;
  geological_province: string | null;
  formation: string | null;
  specimen_quality: string | null;
  uv_fluorescence: string | null;
  notes: string;
  verification_status: string;
  citizen_science_opted_in: boolean;
  created_at: string;
  review_count: number;
}

interface PriorReview {
  id: string;
  reviewer_name: string;
  reviewer_tier: string;
  action: string;
  corrected_mineral: string | null;
  note: string | null;
  created_at: string;
}

const ACTION_OPTIONS = [
  { value: "confirm", label: "Confirm identification", description: "The mineral ID is correct", colour: "green" },
  { value: "correct", label: "Correct identification", description: "Mineral is different — specify below", colour: "blue" },
  { value: "confirm_with_note", label: "Confirm with note", description: "Correct but add context", colour: "green" },
  { value: "request_photos", label: "Request more photos", description: "Need better images to assess", colour: "amber" },
  { value: "unidentifiable", label: "Unidentifiable", description: "Cannot determine from photos", colour: "stone" },
  { value: "escalate", label: "Escalate / dispute", description: "Flag for senior review", colour: "red" },
];

const TIER_LABELS: Record<string, string> = {
  community_reviewer: "Community Reviewer",
  verified_expert: "Verified Expert",
  ogs_endorsed: "OGS-Endorsed",
};

const ACTION_LABELS: Record<string, string> = {
  confirm: "Confirmed",
  correct: "Corrected",
  confirm_with_note: "Confirmed with note",
  request_photos: "Requested photos",
  unidentifiable: "Unidentifiable",
  escalate: "Escalated",
};

export default function ExpertVerifyFindPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [find, setFind] = useState<FindDetail | null>(null);
  const [reviews, setReviews] = useState<PriorReview[]>([]);
  const [activePhoto, setActivePhoto] = useState(0);
  const [loading, setLoading] = useState(true);

  const [action, setAction] = useState("");
  const [correctedMineral, setCorrectedMineral] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [findData, reviewData] = await Promise.all([
          api.get(`/api/experts/verification/queue?status_filter=all&limit=200`) as Promise<{ total: number; items: FindDetail[] }>,
          api.get(`/api/experts/verification/${id}/reviews`) as Promise<PriorReview[]>,
        ]);
        const match = findData.items.find((f) => f.id === id);
        if (match) setFind(match);
        setReviews(reviewData);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const reviewerTiers = ["community_reviewer", "verified_expert", "ogs_endorsed"];
  const isOGS = (user as unknown as Expert)?.expert_tier === "ogs_endorsed";

  async function submit() {
    if (!action) { setError("Select an action."); return; }
    if (action === "correct" && !correctedMineral.trim()) { setError("Enter the corrected mineral name."); return; }
    setError("");
    setSubmitting(true);
    try {
      await api.post(`/api/experts/verification/${id}`, {
        action,
        corrected_mineral: action === "correct" ? correctedMineral.trim() : undefined,
        note: note.trim() || undefined,
      });
      setSubmitted(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="h-64 rounded-2xl bg-stone-100 animate-pulse" />
      </div>
    );
  }

  if (!find) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-stone-500">Find not found or no longer in the queue.</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-amber-700 hover:underline">
          ← Back to queue
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-stone-900 mb-2">Review submitted</h2>
        <p className="text-stone-500 text-sm mb-8">
          Thank you for contributing to the expert network.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push("/expert/verify")}
            className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Back to queue
          </button>
        </div>
      </div>
    );
  }

  const alreadyReviewed = reviews.some(
    (r) => user && r.reviewer_name === (user as { name?: string }).name
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <button onClick={() => router.back()} className="mb-6 text-sm text-stone-500 hover:text-stone-700 flex items-center gap-1">
        ← Queue
      </button>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: photos + metadata */}
        <div>
          {/* Main photo */}
          <div className="rounded-2xl overflow-hidden bg-stone-100 aspect-square mb-3">
            {find.photo_urls[activePhoto] ? (
              <img
                src={find.photo_urls[activePhoto]}
                alt={find.mineral_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-300 text-6xl">
                🪨
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {find.photo_urls.length > 1 && (
            <div className="flex gap-2 mb-6">
              {find.photo_urls.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setActivePhoto(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    i === activePhoto ? "border-amber-500" : "border-transparent"
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Metadata */}
          <div className="space-y-3">
            <div>
              <h1 className="text-2xl font-bold text-stone-900">{find.mineral_name}</h1>
              <p className="text-sm text-stone-400 mt-0.5">
                Submitted {new Date(find.created_at).toLocaleDateString("en-CA")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              {find.geological_province && (
                <div className="rounded-xl bg-stone-50 px-3 py-2">
                  <p className="text-[11px] text-stone-400 font-medium uppercase tracking-wide">Province</p>
                  <p className="text-stone-700 font-medium mt-0.5">{find.geological_province}</p>
                </div>
              )}
              {find.formation && (
                <div className="rounded-xl bg-stone-50 px-3 py-2">
                  <p className="text-[11px] text-stone-400 font-medium uppercase tracking-wide">Formation</p>
                  <p className="text-stone-700 font-medium mt-0.5">{find.formation}</p>
                </div>
              )}
              {find.host_rock && (
                <div className="rounded-xl bg-stone-50 px-3 py-2">
                  <p className="text-[11px] text-stone-400 font-medium uppercase tracking-wide">Host rock</p>
                  <p className="text-stone-700 font-medium mt-0.5">{find.host_rock}</p>
                </div>
              )}
              {find.specimen_quality && (
                <div className="rounded-xl bg-stone-50 px-3 py-2">
                  <p className="text-[11px] text-stone-400 font-medium uppercase tracking-wide">Quality</p>
                  <p className="text-stone-700 font-medium mt-0.5 capitalize">{find.specimen_quality}</p>
                </div>
              )}
              {find.uv_fluorescence && (
                <div className="rounded-xl bg-stone-50 px-3 py-2 col-span-2">
                  <p className="text-[11px] text-stone-400 font-medium uppercase tracking-wide">UV fluorescence</p>
                  <p className="text-stone-700 font-medium mt-0.5 capitalize">{find.uv_fluorescence}</p>
                </div>
              )}
            </div>

            {find.notes && (
              <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <p className="font-medium text-amber-700 text-xs uppercase tracking-wide mb-1">Collector notes</p>
                {find.notes}
              </div>
            )}

            {find.citizen_science_opted_in && (
              <p className="text-xs text-stone-400">
                ✓ Contributor opted in to citizen science data sharing
              </p>
            )}
          </div>

          {/* Prior reviews */}
          {reviews.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-stone-700 mb-3">
                Prior reviews ({reviews.length})
              </h3>
              <div className="space-y-2">
                {reviews.map((r) => (
                  <div key={r.id} className="rounded-xl border border-stone-100 bg-stone-50 px-4 py-3 text-sm">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-stone-800">{r.reviewer_name}</span>
                      <span className="text-[11px] text-stone-400">{TIER_LABELS[r.reviewer_tier] ?? r.reviewer_tier}</span>
                    </div>
                    <p className="text-stone-600">
                      <span className="font-medium">{ACTION_LABELS[r.action] ?? r.action}</span>
                      {r.corrected_mineral && <span className="text-blue-700"> → {r.corrected_mineral}</span>}
                    </p>
                    {r.note && <p className="text-stone-500 mt-1 text-xs italic">{r.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: review form */}
        <div>
          <div className="rounded-2xl border border-stone-200 bg-white shadow-sm p-6">
            <h2 className="text-lg font-bold text-stone-900 mb-1">Submit your review</h2>
            {isOGS && (
              <p className="text-xs text-blue-600 mb-4">
                As an OGS-endorsed reviewer, your confirmation immediately upgrades this find to OGS reviewed status.
              </p>
            )}

            {alreadyReviewed ? (
              <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                You have already submitted a review for this find.
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-5">
                  {ACTION_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 rounded-xl border-2 p-3 cursor-pointer transition-colors ${
                        action === opt.value
                          ? "border-amber-400 bg-amber-50"
                          : "border-stone-100 hover:border-stone-200 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="action"
                        value={opt.value}
                        checked={action === opt.value}
                        onChange={(e) => setAction(e.target.value)}
                        className="mt-0.5 accent-amber-600"
                      />
                      <div>
                        <p className="text-sm font-semibold text-stone-800">{opt.label}</p>
                        <p className="text-xs text-stone-500">{opt.description}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {action === "correct" && (
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1">
                      Corrected mineral name
                    </label>
                    <input
                      type="text"
                      value={correctedMineral}
                      onChange={(e) => setCorrectedMineral(e.target.value)}
                      placeholder="e.g. Calcite (not Quartz)"
                      className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                )}

                {action && (
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1">
                      Note{action === "confirm_with_note" ? " (required)" : " (optional)"}
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      placeholder="Add context for the community…"
                      className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                    />
                  </div>
                )}

                {error && (
                  <p className="text-sm text-red-600 mb-3">{error}</p>
                )}

                <button
                  onClick={submit}
                  disabled={submitting || !action}
                  className="w-full rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-40 transition-colors"
                >
                  {submitting ? "Submitting…" : "Submit review"}
                </button>
              </>
            )}
          </div>

          {/* Quick nav */}
          <div className="mt-4 text-center">
            <button
              onClick={() => router.push("/expert/verify")}
              className="text-sm text-stone-500 hover:text-stone-700"
            >
              Back to queue →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
