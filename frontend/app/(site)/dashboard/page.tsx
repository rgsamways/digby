"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";
import type { Booking, WeatherAlert, YieldReport, ScavengerHunt, Specimen, Site, SiteQuestion } from "@/lib/types";
import { Calendar, Plus, AlertTriangle, Pickaxe, CreditCard, CheckCircle, Map, ShoppingBag, Bell, CheckCircle2, HelpCircle } from "lucide-react";

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

  const { data: unansweredQuestions = [] } = useQuery<SiteQuestion[]>({
    queryKey: ["unanswered-questions"],
    queryFn: async () => {
      const sites: Site[] = await api.get("/api/sites/my", { auth: true });
      const allQs = await Promise.all(
        sites.map((s) => api.get<SiteQuestion[]>(`/api/site-questions/site/${s.id}`))
      );
      return allQs.flat().filter((q: SiteQuestion) => !q.answer);
    },
    enabled: user?.role === "operator",
  });

  const [answerForms, setAnswerForms] = useState<Record<string, string>>({});
  const answerQuestion = useMutation({
    mutationFn: ({ id, answer }: { id: string; answer: string }) =>
      api.patch(`/api/site-questions/${id}/answer`, { answer }, { auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["unanswered-questions"] }),
  });

  const toggleOpenToday = useMutation({
    mutationFn: ({ siteId, value }: { siteId: string; value: boolean }) =>
      api.patch(`/api/sites/${siteId}`, { is_open_today: value }, { auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["operator-sites"] }),
  });

  const { data: mySites = [] } = useQuery<Site[]>({
    queryKey: ["operator-sites"],
    queryFn: () => api.get("/api/sites/my", { auth: true }),
    enabled: user?.role === "operator",
  });

  const { data: mySpecimens = [] } = useQuery<Specimen[]>({
    queryKey: ["my-specimens"],
    queryFn: () => api.get("/api/specimens/my", { auth: true }),
    enabled: user?.role === "operator",
  });

  const [specimenForm, setSpecimenForm] = useState({
    site_id: "", title: "", description: "", minerals: "", province: "Ontario", price: "", images: "",
  });
  const createSpecimen = useMutation({
    mutationFn: (data: object) => api.post("/api/specimens/", data, { auth: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-specimens"] });
      setSpecimenForm({ site_id: "", title: "", description: "", minerals: "", province: "Ontario", price: "", images: "" });
    },
  });

  const [seasonalForm, setSeasonalForm] = useState({ site_id: "", mineral: "", start_month: "4", end_month: "6", notes: "" });
  const addSeasonalWindow = useMutation({
    mutationFn: async (data: { site_id: string; mineral: string; start_month: number; end_month: number; notes: string }) => {
      const site = mySites.find((s) => s.id === data.site_id);
      if (!site) throw new Error("Site not found");
      const windows = [...(site.seasonal_windows ?? []), { mineral: data.mineral, start_month: data.start_month, end_month: data.end_month, notes: data.notes }];
      return api.patch(`/api/sites/${data.site_id}`, { seasonal_windows: windows }, { auth: true });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["operator-sites"] });
      setSeasonalForm({ site_id: "", mineral: "", start_month: "4", end_month: "6", notes: "" });
    },
  });

  const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const { data: hunts = [] } = useQuery<ScavengerHunt[]>({
    queryKey: ["my-hunts"],
    queryFn: () => api.get("/api/hunts/my", { auth: true }),
    enabled: user?.role === "operator",
  });

  const toggleHunt = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      api.patch(`/api/hunts/${id}`, { is_active }, { auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-hunts"] }),
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-4xl text-stone-900">Welcome back, {user?.name}</h1>
          <p className="mt-2 text-stone-400">Operator dashboard</p>
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

      {/* Scavenger Hunts */}
      <section className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Map className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-stone-800">Scavenger Hunts</h2>
          </div>
          <Link href="/dashboard/hunts/new" className="btn-primary text-sm gap-1">
            <Plus className="h-4 w-4" /> New hunt
          </Link>
        </div>
        {hunts.length === 0 ? (
          <p className="text-sm text-stone-500">No hunts yet. Create one to give visitors a challenge at your site.</p>
        ) : (
          <div className="space-y-2">
            {hunts.map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-lg border border-stone-200 p-3">
                <div>
                  <p className="text-sm font-medium text-stone-800">{h.title}</p>
                  <p className="text-xs text-stone-500">{h.items.length} items · {h.is_active ? "Active" : "Inactive"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/hunts/${h.id}/edit`} className="text-xs font-medium text-brand-600 hover:underline">Edit</Link>
                  <button
                    onClick={() => toggleHunt.mutate({ id: h.id, is_active: !h.is_active })}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${h.is_active ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"}`}
                  >
                    {h.is_active ? "Active" : "Inactive"}
                  </button>
                </div>
              </div>
            ))}
          </div>
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
          <select value={alertForm.site_id}
            onChange={(e) => setAlertForm((f) => ({ ...f, site_id: e.target.value }))} className="input">
            <option value="">Select site…</option>
            {mySites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
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
          <select value={reportForm.site_id}
            onChange={(e) => setReportForm((f) => ({ ...f, site_id: e.target.value }))} className="input">
            <option value="">Select site…</option>
            {mySites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
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

      {/* Open Today toggles */}
      {mySites.length > 0 && (
        <section className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold text-stone-800">Open Today</h2>
          </div>
          <p className="mb-4 text-sm text-stone-500">
            Toggle your sites open — visitors nearby will see a green badge.
          </p>
          <div className="space-y-2">
            {mySites.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-stone-200 p-3">
                <p className="text-sm font-medium text-stone-800">{s.name}</p>
                <button
                  onClick={() => toggleOpenToday.mutate({ siteId: s.id, value: !s.is_open_today })}
                  disabled={toggleOpenToday.isPending}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    s.is_open_today ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {s.is_open_today ? "Open" : "Closed"}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Unanswered Q&A */}
      {unansweredQuestions.length > 0 && (
        <section className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-stone-800">
              Visitor Questions <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-sm text-amber-700">{unansweredQuestions.length}</span>
            </h2>
          </div>
          <div className="space-y-4">
            {unansweredQuestions.map((q) => (
              <div key={q.id} className="rounded-lg border border-stone-200 p-3">
                <p className="text-sm font-medium text-stone-800">{q.question}</p>
                <p className="text-xs text-stone-400 mt-0.5">{q.visitor_name}</p>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    placeholder="Your answer…"
                    value={answerForms[q.id] ?? ""}
                    onChange={(e) => setAnswerForms((f) => ({ ...f, [q.id]: e.target.value }))}
                    className="input flex-1 text-sm"
                  />
                  <button
                    onClick={() => answerQuestion.mutate({ id: q.id, answer: answerForms[q.id] ?? "" })}
                    disabled={!answerForms[q.id] || answerQuestion.isPending}
                    className="btn-primary text-sm"
                  >
                    Answer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Seasonal Windows */}
      <section className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-brand-600" />
          <h2 className="text-lg font-semibold text-stone-800">Seasonal Windows</h2>
        </div>
        <p className="mb-4 text-sm text-stone-500">
          Tag your sites with optimal collecting windows. Visitors subscribed to those minerals get notified.
        </p>
        <div className="mb-4 rounded-lg bg-stone-50 p-4 space-y-3">
          <select value={seasonalForm.site_id}
            onChange={(e) => setSeasonalForm((f) => ({ ...f, site_id: e.target.value }))} className="input">
            <option value="">Select site…</option>
            {mySites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input type="text" placeholder="Mineral (e.g. Agates)" value={seasonalForm.mineral}
            onChange={(e) => setSeasonalForm((f) => ({ ...f, mineral: e.target.value }))} className="input" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-stone-500">Start month</label>
              <select value={seasonalForm.start_month}
                onChange={(e) => setSeasonalForm((f) => ({ ...f, start_month: e.target.value }))} className="input">
                {MONTHS.slice(1).map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-stone-500">End month</label>
              <select value={seasonalForm.end_month}
                onChange={(e) => setSeasonalForm((f) => ({ ...f, end_month: e.target.value }))} className="input">
                {MONTHS.slice(1).map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
          </div>
          <input type="text" placeholder="Notes (e.g. best after spring thaw)" value={seasonalForm.notes}
            onChange={(e) => setSeasonalForm((f) => ({ ...f, notes: e.target.value }))} className="input" />
          <button
            onClick={() => addSeasonalWindow.mutate({
              site_id: seasonalForm.site_id,
              mineral: seasonalForm.mineral,
              start_month: Number(seasonalForm.start_month),
              end_month: Number(seasonalForm.end_month),
              notes: seasonalForm.notes,
            })}
            disabled={!seasonalForm.site_id || !seasonalForm.mineral}
            className="btn-primary text-sm"
          >
            Add Window
          </button>
        </div>
        {mySites.some((s) => s.seasonal_windows?.length > 0) && (
          <div className="space-y-2">
            {mySites.filter((s) => s.seasonal_windows?.length > 0).map((s) =>
              s.seasonal_windows.map((w, i) => (
                <div key={`${s.id}-${i}`} className="flex items-center justify-between rounded-lg border border-stone-200 p-3 text-sm">
                  <span className="font-medium text-stone-800">{s.name}</span>
                  <span className="text-stone-500">{w.mineral} · {MONTHS[w.start_month]}–{MONTHS[w.end_month]}</span>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* Specimen Marketplace */}
      <section className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-stone-800">Specimen Listings</h2>
          </div>
          <Link href="/specimens" className="text-sm font-medium text-brand-600 hover:underline">
            View marketplace →
          </Link>
        </div>
        <div className="mb-4 rounded-lg bg-stone-50 p-4 space-y-3">
          <p className="text-sm font-medium text-stone-700">List a new specimen</p>
          <input type="text" placeholder="Title (e.g. Thunder Bay Amethyst Cluster)" value={specimenForm.title}
            onChange={(e) => setSpecimenForm((f) => ({ ...f, title: e.target.value }))} className="input" />
          <textarea placeholder="Description" value={specimenForm.description} rows={2}
            onChange={(e) => setSpecimenForm((f) => ({ ...f, description: e.target.value }))} className="input resize-none" />
          <input type="text" placeholder="Minerals (comma-separated)" value={specimenForm.minerals}
            onChange={(e) => setSpecimenForm((f) => ({ ...f, minerals: e.target.value }))} className="input" />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="Price (CAD)" value={specimenForm.price}
              onChange={(e) => setSpecimenForm((f) => ({ ...f, price: e.target.value }))} className="input" min="0" step="0.01" />
            <input type="text" placeholder="Image URL (optional)" value={specimenForm.images}
              onChange={(e) => setSpecimenForm((f) => ({ ...f, images: e.target.value }))} className="input" />
          </div>
          <button
            onClick={() => createSpecimen.mutate({
              title: specimenForm.title,
              description: specimenForm.description,
              minerals: specimenForm.minerals.split(",").map((s) => s.trim()).filter(Boolean),
              province: specimenForm.province,
              price: Number(specimenForm.price),
              images: specimenForm.images ? [specimenForm.images] : [],
              quantity: 1,
            })}
            disabled={!specimenForm.title || !specimenForm.price}
            className="btn-primary text-sm"
          >
            List Specimen
          </button>
        </div>
        {mySpecimens.length === 0 ? (
          <p className="text-sm text-stone-500">No specimens listed yet.</p>
        ) : (
          <div className="space-y-2">
            {mySpecimens.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-stone-200 p-3 text-sm">
                <div>
                  <p className="font-medium text-stone-800">{s.title}</p>
                  <p className="text-xs text-stone-500">{s.minerals.join(", ") || "No minerals"}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${s.price.toFixed(2)}</p>
                  <p className="text-xs text-stone-400">{s.available} available</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Link href="/dashboard/sites" className="text-sm font-medium text-brand-600 hover:underline">
        Manage my sites →
      </Link>
    </div>
  );
}
