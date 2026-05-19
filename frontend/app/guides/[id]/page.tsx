"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Guide } from "@/lib/types";
import { useAuthStore } from "@/lib/auth";

export default function GuideDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const { data: guide, isLoading } = useQuery<Guide>({
    queryKey: ["guide", id],
    queryFn: () => api.get(`/api/guides/${id}`),
  });

  const [date, setDate] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { router.push("/login"); return; }
    setLoading(true);
    setError("");
    try {
      const data = await api.post<{ booking_id: string; client_secret: string }>(
        "/api/guide-bookings/",
        { guide_id: id, date: new Date(date).toISOString(), party_size: partySize, location_description: location, notes },
        { auth: true },
      );
      router.push(`/guide-bookings/${data.booking_id}/confirm?secret=${data.client_secret}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setLoading(false);
    }
  }

  if (isLoading) return <div className="flex h-64 items-center justify-center text-stone-500">Loading…</div>;
  if (!guide) return <div className="p-8 text-center text-stone-500">Guide not found.</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Guide header */}
      <div className="card mb-6 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-100 text-3xl">
            {guide.avatar_url ? (
              <img src={guide.avatar_url} alt={guide.name} className="h-16 w-16 rounded-full object-cover" />
            ) : "🧭"}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-stone-900">{guide.name}</h1>
            {guide.guide_location && <p className="text-stone-500">{guide.guide_location}</p>}
            {guide.years_experience > 0 && (
              <p className="text-sm text-stone-500">{guide.years_experience} years experience</p>
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
        <div className="card p-6">
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

            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Booking…" : "Book Guide"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
