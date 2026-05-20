"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BookingForm } from "@/components/BookingForm";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import type { Site, YieldReport, WeatherAlert, ScavengerHunt, Booking } from "@/lib/types";
import { MapPin, Clock, Users, AlertTriangle, Map } from "lucide-react";

export default function SitePage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);

  const { data: site, isLoading } = useQuery<Site>({
    queryKey: ["site", id],
    queryFn: () => api.get(`/api/sites/${id}`),
  });

  const { data: alerts = [] } = useQuery<WeatherAlert[]>({
    queryKey: ["site-alerts", id],
    queryFn: () => api.get(`/api/weather-alerts/site/${id}`),
    enabled: !!id,
  });

  const { data: reports = [] } = useQuery<YieldReport[]>({
    queryKey: ["site-yields", id],
    queryFn: () => api.get(`/api/yield-reports/site/${id}`),
    enabled: !!id,
  });

  const { data: hunt } = useQuery<ScavengerHunt>({
    queryKey: ["site-hunt", id],
    queryFn: () => api.get(`/api/hunts/site/${id}`, { auth: true }),
    enabled: !!id && !!user,
    retry: false,
  });

  const { data: myBookings = [] } = useQuery<Booking[]>({
    queryKey: ["my-bookings"],
    queryFn: () => api.get("/api/bookings/my", { auth: true }),
    enabled: !!user,
  });

  const confirmedBookingForSite = myBookings.find(
    (b) => b.site_id === id && (b.status === "confirmed" || b.status === "completed")
  );

  if (isLoading) return <div className="flex h-64 items-center justify-center text-stone-500">Loading…</div>;
  if (!site) return <div className="p-8 text-center text-stone-500">Site not found.</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Weather alerts */}
      {alerts.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-800">Operator Alert</p>
              {alerts.map((a) => (
                <p key={a.id} className="text-sm text-amber-700">{a.message}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {hunt && confirmedBookingForSite && (
        <div className="mb-6 rounded-xl border border-brand-200 bg-brand-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Map className="h-5 w-5 text-brand-600" />
              <div>
                <p className="font-semibold text-brand-800">Scavenger Hunt available</p>
                <p className="text-sm text-brand-600">{hunt.title} · {hunt.items.length} items</p>
              </div>
            </div>
            <Link href={`/sites/${id}/hunt?booking=${confirmedBookingForSite.id}`} className="btn-primary text-sm">
              Start hunt
            </Link>
          </div>
        </div>
      )}

      {hunt && !confirmedBookingForSite && (
        <div className="mb-6 rounded-xl border border-stone-200 bg-stone-50 p-4">
          <div className="flex items-center gap-2">
            <Map className="h-5 w-5 text-stone-400" />
            <div>
              <p className="font-semibold text-stone-700">Scavenger Hunt: {hunt.title}</p>
              <p className="text-sm text-stone-500">{hunt.items.length} items to find — book this site to play</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Details */}
        <div className="lg:col-span-3">
          {site.images[0] && (
            <img src={site.images[0]} alt={site.name} className="mb-6 h-64 w-full rounded-xl object-cover" />
          )}
          <h1 className="mb-2 text-3xl font-extrabold text-stone-900">{site.name}</h1>
          <p className="mb-4 flex items-center gap-1.5 text-stone-500">
            <MapPin className="h-4 w-4" /> {site.address}, {site.province}
          </p>

          <div className="mb-6 flex flex-wrap gap-2">
            {site.minerals.map((m) => (
              <span key={m} className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">{m}</span>
            ))}
          </div>

          <p className="mb-6 leading-relaxed text-stone-700">{site.description}</p>

          <div className="grid grid-cols-2 gap-4 rounded-xl bg-stone-100 p-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-stone-500" />
              <span>{site.duration_hours}h session</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-stone-500" />
              <span>Up to {site.max_group_size} people</span>
            </div>
          </div>

          {site.rules && (
            <div className="mt-6">
              <h3 className="mb-2 font-semibold text-stone-800">Site rules</h3>
              <p className="whitespace-pre-line text-sm text-stone-600">{site.rules}</p>
            </div>
          )}

          {/* Yield reports */}
          {reports.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-3 font-semibold text-stone-800">Recent Finds</h3>
              <div className="space-y-3">
                {reports.slice(0, 5).map((r) => (
                  <div key={r.id} className="rounded-lg border border-stone-200 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-stone-800">
                        {new Date(r.session_date).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>
                    {r.minerals_found.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {r.minerals_found.map((m) => (
                          <span key={m} className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">{m}</span>
                        ))}
                      </div>
                    )}
                    {r.quantity_notes && <p className="mt-1 text-xs text-stone-500">{r.quantity_notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Booking panel */}
        <div className="lg:col-span-2">
          <div className="card sticky top-24 p-6">
            <p className="mb-1 text-2xl font-bold text-stone-900">
              ${site.price_per_person.toFixed(2)}
              <span className="text-base font-normal text-stone-500"> / person</span>
            </p>
            <p className="mb-5 text-xs uppercase tracking-wide text-stone-500">{site.site_type.replace("-", " ")}</p>
            <BookingForm site={site} />
          </div>
        </div>
      </div>
    </div>
  );
}
