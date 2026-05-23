"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Guide, GuideBooking } from "@/lib/types";

export default function GuideDashboardPage() {
  const qc = useQueryClient();

  const { data: profile } = useQuery<Guide>({
    queryKey: ["guide-profile"],
    queryFn: () => api.get("/api/guides/me", { auth: true }),
  });

  const { data: bookings = [] } = useQuery<GuideBooking[]>({
    queryKey: ["guide-bookings-incoming"],
    queryFn: () => api.get("/api/guide-bookings/incoming", { auth: true }),
  });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    bio: profile?.bio ?? "",
    specialties: profile?.specialties.join(", ") ?? "",
    years_experience: profile?.years_experience ?? 0,
    rate_per_day: profile?.rate_per_day ?? "",
    guide_location: profile?.guide_location ?? "",
    certifications: profile?.certifications.join(", ") ?? "",
  });

  const updateProfile = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.patch("/api/guides/me", data, { auth: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guide-profile"] });
      setEditing(false);
    },
  });

  const confirmBooking = useMutation({
    mutationFn: (id: string) =>
      api.patch(`/api/guide-bookings/${id}/confirm`, {}, { auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guide-bookings-incoming"] }),
  });

  function handleSave() {
    updateProfile.mutate({
      bio: form.bio,
      specialties: form.specialties.split(",").map((s) => s.trim()).filter(Boolean),
      years_experience: Number(form.years_experience),
      rate_per_day: form.rate_per_day ? Number(form.rate_per_day) : null,
      guide_location: form.guide_location,
      certifications: form.certifications.split(",").map((s) => s.trim()).filter(Boolean),
    });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      <h1 className="text-2xl font-extrabold text-stone-900">Guide Dashboard</h1>

      {/* Profile */}
      <section className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-stone-800">Your Profile</h2>
          <button onClick={() => setEditing(!editing)} className="btn-secondary text-sm px-3 py-1.5">
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>

        {editing ? (
          <div className="space-y-4">
            {[
              { label: "Bio", key: "bio", type: "textarea" },
              { label: "Specialties (comma-separated)", key: "specialties", type: "text" },
              { label: "Years experience", key: "years_experience", type: "number" },
              { label: "Rate per day (CAD)", key: "rate_per_day", type: "number" },
              { label: "Location", key: "guide_location", type: "text" },
              { label: "Certifications (comma-separated)", key: "certifications", type: "text" },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="mb-1 block text-sm font-medium text-stone-700">{label}</label>
                {type === "textarea" ? (
                  <textarea
                    value={form[key as keyof typeof form] as string}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    rows={3} className="input resize-none"
                  />
                ) : (
                  <input
                    type={type}
                    value={form[key as keyof typeof form] as string}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="input"
                  />
                )}
              </div>
            ))}
            <button onClick={handleSave} className="btn-primary">Save Profile</button>
          </div>
        ) : (
          <div className="space-y-2 text-sm text-stone-700">
            <p><span className="font-medium">Bio:</span> {profile?.bio || "—"}</p>
            <p><span className="font-medium">Location:</span> {profile?.guide_location || "—"}</p>
            <p><span className="font-medium">Rate:</span> {profile?.rate_per_day ? `$${profile.rate_per_day}/day` : "—"}</p>
            <p><span className="font-medium">Experience:</span> {profile?.years_experience || 0} years</p>
            <p><span className="font-medium">Specialties:</span> {profile?.specialties.join(", ") || "—"}</p>
            <p><span className="font-medium">Certifications:</span> {profile?.certifications.join(", ") || "—"}</p>
          </div>
        )}
      </section>

      {/* Incoming Bookings */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-stone-800">Incoming Bookings</h2>
        {bookings.length === 0 ? (
          <p className="text-stone-500">No bookings yet.</p>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="card flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold text-stone-900">
                    {new Date(b.date).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                  <p className="text-sm text-stone-500">
                    {b.party_size} person{b.party_size !== 1 ? "s" : ""} · ${b.total_amount} · {b.location_description || "Location TBD"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    b.status === "confirmed" ? "bg-green-100 text-green-700" :
                    b.status === "cancelled" ? "bg-red-100 text-red-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>{b.status}</span>
                  {b.status === "pending" && (
                    <button onClick={() => confirmBooking.mutate(b.id)} className="btn-primary text-xs px-3 py-1">
                      Confirm
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
