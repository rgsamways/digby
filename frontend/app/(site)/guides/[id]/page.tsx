"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Guide, GuideBooking, GuideReview } from "@/lib/types";
import { useAuthStore } from "@/lib/auth";
import { Star, Compass } from "lucide-react";

interface ReviewsResponse {
  reviews: GuideReview[];
  average_rating: number | null;
  review_count: number;
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
        >
          <Star
            className={`h-5 w-5 ${n <= value ? "fill-amber-400 text-amber-400" : "text-stone-300"}`}
          />
        </button>
      ))}
    </div>
  );
}

export default function GuideDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: guide, isLoading } = useQuery<Guide>({
    queryKey: ["guide", id],
    queryFn: () => api.get(`/api/guides/${id}`),
  });

  const { data: reviewsData } = useQuery<ReviewsResponse>({
    queryKey: ["guide-reviews", id],
    queryFn: () => api.get(`/api/guide-reviews/guide/${id}`),
    enabled: !!id,
  });

  // Completed guide bookings for this guide (to enable review form)
  const { data: myGuideBookings = [] } = useQuery<GuideBooking[]>({
    queryKey: ["my-guide-bookings"],
    queryFn: () => api.get("/api/guide-bookings/my", { auth: true }),
    enabled: !!user,
  });

  const completedBookingForThisGuide = myGuideBookings.find(
    (b) => b.guide_id === id && b.status === "completed",
  );

  const alreadyReviewed = reviewsData?.reviews.some((r) => r.visitor_id === user?.id);

  // Booking form state
  const [date, setDate] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [bookLoading, setBookLoading] = useState(false);
  const [bookError, setBookError] = useState("");

  // Review form state
  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");
  const [reviewError, setReviewError] = useState("");

  const submitReview = useMutation({
    mutationFn: () =>
      api.post(
        "/api/guide-reviews/",
        { guide_booking_id: completedBookingForThisGuide!.id, rating, body: reviewBody },
        { auth: true },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guide-reviews", id] });
      setReviewBody("");
      setRating(5);
      setReviewError("");
    },
    onError: (err: unknown) => {
      setReviewError(err instanceof Error ? err.message : "Failed to submit review");
    },
  });

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { router.push("/login"); return; }
    setBookLoading(true);
    setBookError("");
    try {
      const data = await api.post<{ booking_id: string; client_secret: string }>(
        "/api/guide-bookings/",
        { guide_id: id, date: new Date(date).toISOString(), party_size: partySize, location_description: location, notes },
        { auth: true },
      );
      router.push(`/guide-bookings/${data.booking_id}/confirm?secret=${data.client_secret}`);
    } catch (err: unknown) {
      setBookError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setBookLoading(false);
    }
  }

  if (isLoading) return <div className="flex h-64 items-center justify-center text-stone-500">Loading…</div>;
  if (!guide) return <div className="p-8 text-center text-stone-500">Guide not found.</div>;

  const avgRating = reviewsData?.average_rating;
  const reviewCount = reviewsData?.review_count ?? 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Guide header */}
      <div className="card mb-6 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-100 text-3xl">
            {guide.avatar_url ? (
              <img src={guide.avatar_url} alt={guide.name} className="h-16 w-16 rounded-full object-cover" />
            ) : <Compass className="h-8 w-8 text-stone-400" />}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-3xl text-stone-900">{guide.name}</h1>
            {guide.guide_location && <p className="text-stone-400">{guide.guide_location}</p>}
            {guide.years_experience > 0 && (
              <p className="text-sm text-stone-500">{guide.years_experience} years experience</p>
            )}
            {avgRating !== null && avgRating !== undefined && (
              <div className="mt-1 flex items-center gap-2">
                <StarRating value={Math.round(avgRating)} />
                <span className="text-sm text-stone-500">
                  {avgRating.toFixed(1)} · {reviewCount} review{reviewCount !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
          {guide.rate_per_day && (
            <div className="text-right">
              <p className="text-2xl font-bold text-brand-700">${guide.rate_per_day}</p>
              <p className="text-xs text-stone-500">per day</p>
            </div>
          )}
        </div>

        {guide.bio && <p className="mt-4 text-stone-600">{guide.bio}</p>}

        {guide.specialties.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold text-stone-700">Specialties</p>
            <div className="flex flex-wrap gap-2">
              {guide.specialties.map((s) => (
                <span key={s} className="rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-700">{s}</span>
              ))}
            </div>
          </div>
        )}

        {guide.certifications.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold text-stone-700">Certifications</p>
            <ul className="list-inside list-disc text-sm text-stone-600">
              {guide.certifications.map((c) => <li key={c}>{c}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* Booking form */}
      {guide.rate_per_day && (
        <div className="card mb-6 p-6">
          <h2 className="mb-4 text-lg font-semibold text-stone-900">Book this Guide</h2>
          <form onSubmit={handleBook} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="input"
                min={new Date().toISOString().split("T")[0]} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Party size</label>
              <input type="number" value={partySize} onChange={(e) => setPartySize(Number(e.target.value))}
                min={1} max={20} required className="input" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Meeting location / description</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Crown land north of Bancroft" className="input" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                rows={2} className="input resize-none" placeholder="Any special requests…" />
            </div>

            {guide.rate_per_day && partySize > 0 && (
              <div className="rounded-lg bg-stone-50 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-600">${guide.rate_per_day} × {partySize} person{partySize !== 1 ? "s" : ""}</span>
                  <span className="font-semibold">${(guide.rate_per_day * partySize).toFixed(2)}</span>
                </div>
              </div>
            )}

            {bookError && <p className="text-sm text-red-600">{bookError}</p>}
            <button type="submit" disabled={bookLoading} className="btn-primary w-full">
              {bookLoading ? "Booking…" : "Book Guide"}
            </button>
          </form>
        </div>
      )}

      {/* Leave a review (only if user has a completed booking and hasn't reviewed yet) */}
      {completedBookingForThisGuide && !alreadyReviewed && (
        <div className="card mb-6 p-6">
          <h2 className="mb-4 text-lg font-semibold text-stone-900">Leave a Review</h2>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Rating</label>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Your experience</label>
              <textarea
                value={reviewBody}
                onChange={(e) => setReviewBody(e.target.value)}
                rows={3}
                className="input resize-none"
                placeholder="Tell others about your time in the field…"
              />
            </div>
            {reviewError && <p className="text-sm text-red-600">{reviewError}</p>}
            <button
              onClick={() => submitReview.mutate()}
              disabled={submitReview.isPending}
              className="btn-primary"
            >
              {submitReview.isPending ? "Submitting…" : "Submit Review"}
            </button>
          </div>
        </div>
      )}

      {/* Reviews list */}
      {reviewCount > 0 && (
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold text-stone-900">
            Reviews
            {avgRating !== null && avgRating !== undefined && (
              <span className="ml-2 text-sm font-normal text-stone-500">
                {avgRating.toFixed(1)} avg · {reviewCount} total
              </span>
            )}
          </h2>
          <div className="space-y-4">
            {reviewsData?.reviews.map((r) => (
              <div key={r.id} className="border-b border-stone-100 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-stone-800">{r.visitor_name || "Rockhound"}</span>
                  <span className="text-xs text-stone-400">
                    {new Date(r.created_at).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" })}
                  </span>
                </div>
                <StarRating value={r.rating} />
                {r.body && <p className="mt-1 text-sm text-stone-600">{r.body}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
