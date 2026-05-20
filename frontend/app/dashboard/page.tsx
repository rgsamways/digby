"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";
import type { Booking, WeatherAlert, YieldReport } from "@/lib/types";
import { Calendar, Plus, AlertTriangle, Pickaxe, CreditCard, CheckCircle } from "lucide-react";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ["operator-bookings"],
    queryFn: () => api.get("/api/bookings/operator", { auth: true }),
    enabled: user?.role === "operator",
  });

  const { data: alerts = [] } = useQuery<WeatherAlert[]>({
    queryKey: ["my-alerts"],
    queryFn: () => api.get("/api/weather-alerts/my", { auth: true }),
    enabled: user?.role === "operator",
  });

  const { data: reports = [] } = useQuery<YieldReport[]>({
    queryKey: ["my-yield-reports"],
    queryFn: () => api.get("/api/yield-reports/my", { auth: true }),
    enabled: user?.role === "operator",
  });

  // Alert form
  const [alertForm, setAlertForm] = useState({ site_id: "", message: "", affected_dates: "" });
  const createAlert = useMutation({
    mutationFn: (data: object) => api.post("/api/weather-alerts/", data, { auth: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-alerts"] });
      setAlertForm({ site_id: "", message: "", affected_dates: "" });
    },
  });

  // Yield report form
  const [reportForm, setReportForm] = useState({ site_id: "", session_date: "", minerals_found: "", quantity_notes: "" });
  const createReport = useMutation({
    mutationFn: (data: object) => api.post("/api/yield-reports/", data, { auth: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-yield-reports"] });
      setReportForm({ site_id: "", session_date: "", minerals_found: "", quantity_notes: "" });
    },
  });

  const resolveAlert = useMutation({
    mutationFn: (id: string) => api.patch(`/api/weather-alerts/${id}/resolve`, {}, { auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-alerts"] }),
  });

  const completeBooking = useMutation({
    mutationFn: (id: string) => api.patch(`/api/bookings/${id}/complete`, {}, { auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["operator-bookings"] }),
  });

  const { data: me } = useQuery<typeof user>({
    queryKey: ["me"],
    queryFn: () => api.get("/api/auth/me", { auth: true }),
    enabled: !!user,
  });

  const connectStripe = useMutation({
    mutationFn: () => api.post<{ url: string }>("/api/payments/connect/onboard", {}, { auth: true }),
    onSuccess: (data) => { window.location.href = data.url; },
  });

  const confirmed = bookings.filter((b) => b.status === "confirmed");
  const pending = bookings.filter((b) => b.status === "pending");
  const revenue = confirmed.reduce((sum, b) => sum + b.total_amount, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Welcome back, {user?.name}</h1>
          <p className="text-stone-500">Operator dashboard</p>
        </div>
        <Link href="/dashboard/sites/new" className="btn-primary gap-2">
          <Plus className="h-4 w-4" /> Add site
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Confirmed bookings", value: confirmed.length },
          { label: "Pending bookings", value: pending.length },
          { label: "Total revenue (CAD)", value: `$${revenue.toFixed(2)}` },
        ].map(({ label, value }) => (
          <div key={label} className="card p-5">
            <p className="text-sm text-stone-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-stone-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Stripe Connect */}
      <section className="card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-stone-500" />
            <h2 className="text-lg font-semibold text-stone-800">Stripe Payments</h2>
          </div>
          {me?.stripe_account_enabled ? (
            <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
              <CheckCircle className="h-4 w-4" /> Connected
            </span>
          ) : (
            <button
              onClick={() => connectStripe.mutate()}
              disabled={connectStripe.isPending}
              className="btn-primary text-sm"
            >
              {connectStripe.isPending ? "Redirecting…" : me?.stripe_account_id ? "Complete Stripe setup" : "Connect Stripe"}
            </button>
          )}
        </div>
        {!me?.stripe_account_enabled && (
          <p className="mt-2 text-sm text-stone-500">
            Connect a Stripe account to receive payments from visitors.
          </p>
        )}
      </section>

      {/* Weather Alerts */}
      <section className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-stone-800">Weather Alerts</h2>
        </div>

        {/* Create alert */}
        <div className="mb-4 rounded-lg bg-stone-50 p-4 space-y-3">
          <p className="text-sm font-medium text-stone-700">Post a new alert</p>
          <input type="text" placeholder="Site ID" value={alertForm.site_id}
            onChange={(e) => setAlertForm((f) => ({ ...f, site_id: e.target.value }))} className="input" />
          <input type="text" placeholder="Message (e.g. Site closed due to flooding)"
            value={alertForm.message}
            onChange={(e) => setAlertForm((f) => ({ ...f, message: e.target.value }))} className="input" />
          <button
            onClick={() => createAlert.mutate({ site_id: alertForm.site_id, message: alertForm.message, affected_dates: [] })}
            disabled={!alertForm.site_id || !alertForm.message}
            className="btn-primary text-sm"
          >
            Post Alert
          </button>
        </div>

        {alerts.filter((a) => a.is_active).length === 0 ? (
          <p className="text-sm text-stone-500">No active alerts.</p>
        ) : (
          <div className="space-y-2">
            {alerts.filter((a) => a.is_active).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm text-amber-800">{a.message}</p>
                <button onClick={() => resolveAlert.mutate(a.id)}
                  className="text-xs font-medium text-amber-700 hover:underline">Resolve</button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Yield Reports */}
      <section className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Pickaxe className="h-5 w-5 text-brand-600" />
          <h2 className="text-lg font-semibold text-stone-800">Yield Reports</h2>
        </div>

        <div className="mb-4 rounded-lg bg-stone-50 p-4 space-y-3">
          <p className="text-sm font-medium text-stone-700">Log a new session</p>
          <input type="text" placeholder="Site ID" value={reportForm.site_id}
            onChange={(e) => setReportForm((f) => ({ ...f, site_id: e.target.value }))} className="input" />
          <input type="date" value={reportForm.session_date}
            onChange={(e) => setReportForm((f) => ({ ...f, session_date: e.target.value }))} className="input" />
          <input type="text" placeholder="Minerals found (comma-separated)" value={reportForm.minerals_found}
            onChange={(e) => setReportForm((f) => ({ ...f, minerals_found: e.target.value }))} className="input" />
          <input type="text" placeholder="Quantity notes (optional)" value={reportForm.quantity_notes}
            onChange={(e) => setReportForm((f) => ({ ...f, quantity_notes: e.target.value }))} className="input" />
          <button
            onClick={() => createReport.mutate({
              site_id: reportForm.site_id,
              session_date: reportForm.session_date,
              minerals_found: reportForm.minerals_found.split(",").map((s) => s.trim()).filter(Boolean),
              quantity_notes: reportForm.quantity_notes,
            })}
            disabled={!reportForm.site_id || !reportForm.session_date}
            className="btn-primary text-sm"
          >
            Log Report
          </button>
        </div>

        {reports.length === 0 ? (
          <p className="text-sm text-stone-500">No yield reports yet.</p>
        ) : (
          <div className="space-y-2">
            {reports.slice(0, 5).map((r) => (
              <div key={r.id} className="rounded-lg border border-stone-200 p-3 text-sm">
                <p className="font-medium text-stone-800">{r.session_date} — {r.minerals_found.join(", ") || "No minerals logged"}</p>
                {r.quantity_notes && <p className="text-stone-500">{r.quantity_notes}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent bookings */}
      <section className="card divide-y divide-stone-100">
        <div className="px-5 py-4 font-semibold text-stone-800">Recent bookings</div>
        {bookings.length === 0 ? (
          <p className="px-5 py-8 text-center text-stone-500">No bookings yet.</p>
        ) : (
          bookings.slice(0, 10).map((b) => (
            <div key={b.id} className="flex items-center gap-4 px-5 py-4">
              <Calendar className="h-5 w-5 shrink-0 text-stone-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-800">
                  {new Date(b.date).toLocaleDateString("en-CA")}
                </p>
                <p className="text-xs text-stone-500">
                  Party of {b.party_size}{b.is_group_booking ? " (group)" : ""}
                </p>
              </div>
              <div className="flex items-center gap-3 text-right">
                <div>
                  <p className="text-sm font-semibold">${b.total_amount.toFixed(2)}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    b.status === "confirmed" ? "bg-green-100 text-green-700" :
                    b.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                    b.status === "completed" ? "bg-blue-100 text-blue-700" :
                    "bg-stone-100 text-stone-500"
                  }`}>{b.status}</span>
                </div>
                {b.status === "confirmed" && (
                  <button
                    onClick={() => completeBooking.mutate(b.id)}
                    disabled={completeBooking.isPending}
                    className="rounded-md border border-brand-600 px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50"
                  >
                    Mark complete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </section>

      <Link href="/dashboard/sites" className="text-sm font-medium text-brand-600 hover:underline">
        Manage my sites →
      </Link>
    </div>
  );
}
