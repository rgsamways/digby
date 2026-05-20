"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import type { Booking, Site } from "@/lib/types";

export default function NewDiaryEntryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking");
  const user = useAuthStore((s) => s.user);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [minerals, setMinerals] = useState<string[]>([]);
  const [mineralInput, setMineralInput] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photoInput, setPhotoInput] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState("");

  const { data: myBookings = [] } = useQuery<Booking[]>({
    queryKey: ["my-bookings"],
    queryFn: () => api.get("/api/bookings/my", { auth: true }),
    enabled: !!user,
  });

  const booking = bookingId ? myBookings.find((b) => b.id === bookingId) : null;

  const { data: site } = useQuery<Site>({
    queryKey: ["site", booking?.site_id],
    queryFn: () => api.get(`/api/sites/${booking!.site_id}`),
    enabled: !!booking?.site_id,
  });

  useEffect(() => {
    if (site && !title) {
      setTitle(`My dig at ${site.name}`);
    }
  }, [site, title]);

  const create = useMutation<{ id: string }, Error, void>({
    mutationFn: () =>
      api.post("/api/diary", {
        booking_id: bookingId,
        title,
        body,
        minerals_found: minerals,
        photo_urls: photoUrls,
        is_public: isPublic,
      }, { auth: true }),
    onSuccess: (data: { id: string }) => router.push(`/diary/${data.id}`),
    onError: (e: Error) => setError(e.message),
  });

  function addMineral() {
    const m = mineralInput.trim();
    if (m && !minerals.includes(m)) setMinerals((p) => [...p, m]);
    setMineralInput("");
  }

  function addPhoto() {
    const u = photoInput.trim();
    if (u && !photoUrls.includes(u)) setPhotoUrls((p) => [...p, u]);
    setPhotoInput("");
  }

  if (!user) return (
    <div className="flex h-64 items-center justify-center text-stone-500">Please log in to write a journal entry.</div>
  );

  const eligibleBookings = myBookings.filter(
    (b) => b.status === "confirmed" || b.status === "completed"
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-stone-900">New field journal entry</h1>

      <div className="card p-6 space-y-5">
        {/* Booking selector */}
        {!bookingId ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Select a booking</label>
            {eligibleBookings.length === 0 ? (
              <p className="text-sm text-stone-500">No eligible bookings. Book a site first.</p>
            ) : (
              <select
                className="input"
                onChange={(e) => router.push(`/diary/new?booking=${e.target.value}`)}
                defaultValue=""
              >
                <option value="" disabled>Choose a booking…</option>
                {eligibleBookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {new Date(b.date).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })} — ${b.total_amount.toFixed(2)}
                  </option>
                ))}
              </select>
            )}
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Site</label>
            <p className="input bg-stone-50 text-stone-500 cursor-default">
              {site?.name ?? "Loading…"} — {booking ? new Date(booking.date).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" }) : ""}
            </p>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="My dig at Thunder Bay Amethyst Mine" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Journal entry</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className="input resize-none"
            placeholder="What did you find? How was the site? Any tips for future visitors?"
          />
        </div>

        {/* Minerals tag input */}
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Minerals found</label>
          <div className="flex gap-2">
            <input
              value={mineralInput}
              onChange={(e) => setMineralInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMineral())}
              className="input flex-1"
              placeholder="e.g. Amethyst, Calcite…"
            />
            <button type="button" onClick={addMineral} className="btn-secondary">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {minerals.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {minerals.map((m) => (
                <span key={m} className="flex items-center gap-1 rounded-full bg-brand-100 px-3 py-0.5 text-xs font-medium text-brand-700">
                  {m}
                  <button onClick={() => setMinerals((p) => p.filter((x) => x !== m))}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Photo URLs */}
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Photo URLs <span className="font-normal text-stone-400">(optional)</span></label>
          <div className="flex gap-2">
            <input
              value={photoInput}
              onChange={(e) => setPhotoInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPhoto())}
              className="input flex-1"
              placeholder="Paste an image URL…"
            />
            <button type="button" onClick={addPhoto} className="btn-secondary">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {photoUrls.map((u) => (
            <div key={u} className="mt-1 flex items-center justify-between rounded bg-stone-50 px-2 py-1 text-xs text-stone-600">
              <span className="truncate">{u}</span>
              <button onClick={() => setPhotoUrls((p) => p.filter((x) => x !== u))} className="ml-2 text-stone-400 hover:text-red-400">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Public toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 accent-brand-600"
          />
          <span className="text-sm text-stone-700">
            Share publicly <span className="text-stone-400">(earns 15 pts, visible in community feed)</span>
          </span>
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={() => create.mutate()}
            disabled={!title || !bookingId || create.isPending}
            className="btn-primary"
          >
            {create.isPending ? "Saving…" : "Publish entry"}
          </button>
          <button onClick={() => router.back()} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}
