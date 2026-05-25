"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import type { GuideBooking, GuideReview, User } from "@/lib/types";

interface ReviewsResponse {
  reviews: GuideReview[];
  average_rating: number | null;
  review_count: number;
}

function statusCls(status: GuideBooking["status"]) {
  const map: Record<GuideBooking["status"], string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    completed: "bg-stone-100 text-stone-600",
  };
  return `rounded-full px-2 py-0.5 text-xs font-medium ${map[status]}`;
}

function BookingRow({ b, onConfirm }: { b: GuideBooking; onConfirm?: (id: string) => void }) {
  return (
    <div className="card flex items-center justify-between p-4">
      <div>
        <p className="font-semibold text-stone-900">
          {new Date(b.date).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" })}
        </p>
        <p className="text-sm text-stone-500">
          {b.party_size} person{b.party_size !== 1 ? "s" : ""} · ${b.total_amount} · {b.location_description || "Location TBD"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className={statusCls(b.status)}>{b.status}</span>
        {b.status === "pending" && onConfirm && (
          <button onClick={() => onConfirm(b.id)} className="btn-primary text-xs px-3 py-1">
            Confirm
          </button>
        )}
      </div>
    </div>
  );
}

export default function GuideDashboardPage() {
  const { user: authUser } = useAuthStore();
  const qc = useQueryClient();

  const { data: me } = useQuery<User>({
    queryKey: ["auth-me"],
    queryFn: () => api.get("/api/auth/me", { auth: true }),
    enabled: !!authUser,
  });

  const profileComplete = !!(
    me?.bio &&
    me?.rate_per_day && me.rate_per_day > 0 &&
    me?.guide_location &&
    me?.specialties?.length
  );
  const isVerified = me?.is_verified === true;

  const { data: bookings = [] } = useQuery<GuideBooking[]>({
    queryKey: ["guide-bookings-incoming"],
    queryFn: () => api.get("/api/guide-bookings/incoming", { auth: true }),
    enabled: !!me && isVerified,
  });

  const { data: reviewData } = useQuery<ReviewsResponse>({
    queryKey: ["guide-reviews", me?.id],
    queryFn: () => api.get(`/api/guide-reviews/guide/${me!.id}`, { auth: true }),
    enabled: !!me?.id && isVerified,
  });

  const confirmBooking = useMutation({
    mutationFn: (id: string) => api.patch(`/api/guide-bookings/${id}/confirm`, {}, { auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guide-bookings-incoming"] }),
  });

  if (!me) return <div className="mx-auto max-w-4xl px-4 py-10 text-stone-500">Loading…</div>;

  // ── State 1: profile incomplete ───────────────────────────────────────────
  if (!profileComplete) {
    const checks = [
      { label: "Bio", done: !!me.bio },
      { label: "Day rate", done: !!(me.rate_per_day && me.rate_per_day > 0) },
      { label: "Location", done: !!me.guide_location },
      { label: "Specialties", done: !!(me.specialties?.length) },
    ];
    const remaining = checks.filter((c) => !c.done).length;

    return (
      <div className="mx-auto max-w-2xl px-4 py-10 space-y-6">
        <h1 className="text-2xl font-extrabold text-stone-900">Guide Dashboard</h1>
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-stone-800">
            {remaining === checks.length
              ? "Let&apos;s get you set up"
              : `${remaining} more ${remaining === 1 ? "thing" : "things"} to go`}
          </h2>
          <p className="text-sm text-stone-600">
            Complete your profile so rockhounds can find and book you.
          </p>
          <ul className="space-y-2">
            {checks.map(({ label, done }) => (
              <li key={label} className="flex items-center gap-2 text-sm">
                {done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-stone-300" />
                )}
                <span className={done ? "text-stone-400 line-through" : "text-stone-700"}>{label}</span>
              </li>
            ))}
          </ul>
          <Link href="/dashboard/guide/edit" className="btn-primary inline-flex">
            Complete Profile
          </Link>
        </div>
      </div>
    );
  }

  // ── State 2: complete but not yet verified ────────────────────────────────
  if (!isVerified) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 space-y-6">
        <h1 className="text-2xl font-extrabold text-stone-900">Guide Dashboard</h1>

        <div className="card p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <span className="font-semibold text-stone-800">You&apos;re in the queue</span>
          </div>
          <p className="text-sm text-stone-600">
            Your profile is complete. Our team reviews guide applications within 3–5 business days.
            You&apos;ll get an email when you&apos;re approved.
          </p>
        </div>

        <div className="card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-stone-800">Profile Preview</h2>
            <Link href="/dashboard/guide/edit" className="btn-secondary text-sm py-1 px-3">
              Edit
            </Link>
          </div>
          <div className="space-y-2 text-sm text-stone-700">
            <p><span className="font-medium">Bio:</span> {me.bio}</p>
            <p><span className="font-medium">Location:</span> {me.guide_location}</p>
            <p><span className="font-medium">Rate:</span> ${me.rate_per_day}/day</p>
            <p><span className="font-medium">Specialties:</span> {me.specialties?.join(", ")}</p>
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800 space-y-1">
          <p className="font-medium">What happens next?</p>
          <ul className="list-disc list-inside space-y-0.5 text-blue-700">
            <li>Digby reviews your credentials and specialties</li>
            <li>You&apos;ll receive an email once approved</li>
            <li>Once verified, your profile goes live and bookings open</li>
          </ul>
        </div>
      </div>
    );
  }

  // ── State 3: verified & active ────────────────────────────────────────────
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const needsAttention = bookings.filter((b) => {
    if (b.status === "pending") return true;
    const d = new Date(b.date);
    return b.status === "confirmed" && d >= now && d <= in48h;
  });

  const upcoming = bookings
    .filter((b) => {
      const d = new Date(b.date);
      return b.status === "confirmed" && d >= now && d <= in7Days;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const reviews = reviewData?.reviews ?? [];
  const avgRating = reviewData?.average_rating ?? null;
  const recentReviews = [...reviews]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  const completed = bookings.filter((b) => b.status === "completed");
  const totalEarnings = completed.reduce((sum, b) => sum + b.total_amount, 0);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEarnings = completed
    .filter((b) => new Date(b.date) >= thisMonth)
    .reduce((sum, b) => sum + b.total_amount, 0);

  const firstName = me.name.split(" ")[0];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">{firstName}&apos;s Dashboard</h1>
          <p className="mt-0.5 text-sm text-stone-500">
            {now.toLocaleDateString("en-CA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <Link href="/dashboard/guide/edit" className="btn-secondary text-sm">
          Edit Profile
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total bookings", value: bookings.length },
          { label: "Avg rating", value: avgRating ? `${avgRating} ★` : "—" },
          { label: "This month", value: `$${monthEarnings.toFixed(0)}` },
          { label: "All time", value: `$${totalEarnings.toFixed(0)}` },
        ].map(({ label, value }) => (
          <div key={label} className="card p-4 text-center">
            <p className="text-xl font-bold text-stone-900">{value}</p>
            <p className="mt-0.5 text-xs text-stone-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Needs attention */}
      {needsAttention.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-stone-800">Needs attention</h2>
          <div className="space-y-2">
            {needsAttention.map((b) => (
              <BookingRow key={b.id} b={b} onConfirm={(id) => confirmBooking.mutate(id)} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming 7 days */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-stone-800">Upcoming — next 7 days</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-stone-400">No confirmed sessions in the next 7 days.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((b) => (
              <BookingRow key={b.id} b={b} />
            ))}
          </div>
        )}
      </section>

      {/* All bookings */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-stone-800">All Bookings</h2>
        {bookings.length === 0 ? (
          <p className="text-sm text-stone-400">No bookings yet.</p>
        ) : (
          <div className="space-y-2">
            {bookings.map((b) => (
              <BookingRow key={b.id} b={b} onConfirm={(id) => confirmBooking.mutate(id)} />
            ))}
          </div>
        )}
      </section>

      {/* Recent reviews */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-800">Recent Reviews</h2>
          {avgRating && (
            <span className="text-sm text-stone-500">
              {avgRating} ★ avg · {reviews.length} total
            </span>
          )}
        </div>
        {recentReviews.length === 0 ? (
          <p className="text-sm text-stone-400">No reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {recentReviews.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-stone-700">{r.visitor_name}</span>
                  <span className="text-sm text-amber-500">{"★".repeat(r.rating)}</span>
                </div>
                {r.body && <p className="text-sm text-stone-600">{r.body}</p>}
                <p className="mt-1 text-xs text-stone-400">
                  {new Date(r.created_at).toLocaleDateString("en-CA")}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
