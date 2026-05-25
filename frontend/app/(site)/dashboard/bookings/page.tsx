"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Booking, Site, WeatherAlert, YieldReport, SiteQuestion } from "@/lib/types";
import {
  Calendar, CheckCircle, AlertTriangle, Pickaxe, HelpCircle, ChevronDown, ChevronUp, Filter,
} from "lucide-react";

type Tab = "upcoming" | "past" | "alerts" | "yield" | "qa";

function statusBadge(status: string) {
  const cls =
    status === "confirmed" ? "bg-green-100 text-green-700" :
    status === "pending" ? "bg-yellow-100 text-yellow-700" :
    status === "completed" ? "bg-blue-100 text-blue-700" :
    "bg-stone-100 text-stone-500";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{status}</span>;
}

export default function BookingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [filter, setFilter] = useState<"all" | "confirmed" | "pending" | "completed">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isOperator = user?.role === "operator" || user?.role === "admin";
  if (!isOperator && user !== undefined) { router.push("/dashboard"); }

  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ["operator-bookings"],
    queryFn: () => api.get("/api/bookings/operator", { auth: true }),
    enabled: isOperator,
  });

  const { data: mySites = [] } = useQuery<Site[]>({
    queryKey: ["operator-sites"],
    queryFn: () => api.get("/api/sites/my", { auth: true }),
    enabled: isOperator,
  });

  const { data: alerts = [] } = useQuery<WeatherAlert[]>({
    queryKey: ["my-alerts"],
    queryFn: () => api.get("/api/weather-alerts/my", { auth: true }),
    enabled: isOperator,
  });

  const { data: reports = [] } = useQuery<YieldReport[]>({
    queryKey: ["my-yield-reports"],
    queryFn: () => api.get("/api/yield-reports/my", { auth: true }),
    enabled: isOperator,
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
    enabled: isOperator,
  });

  const completeBooking = useMutation({
    mutationFn: (id: string) => api.patch(`/api/bookings/${id}/complete`, {}, { auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["operator-bookings"] }),
  });

  const [alertForm, setAlertForm] = useState({ site_id: "", message: "" });
  const createAlert = useMutation({
    mutationFn: (data: object) => api.post("/api/weather-alerts/", data, { auth: true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-alerts"] }); setAlertForm({ site_id: "", message: "" }); },
  });
  const resolveAlert = useMutation({
    mutationFn: (id: string) => api.patch(`/api/weather-alerts/${id}/resolve`, {}, { auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-alerts"] }),
  });

  const [reportForm, setReportForm] = useState({ site_id: "", session_date: "", minerals_found: "", quantity_notes: "" });
  const createReport = useMutation({
    mutationFn: (data: object) => api.post("/api/yield-reports/", data, { auth: true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-yield-reports"] }); setReportForm({ site_id: "", session_date: "", minerals_found: "", quantity_notes: "" }); },
  });

  const [answerForms, setAnswerForms] = useState<Record<string, string>>({});
  const answerQuestion = useMutation({
    mutationFn: ({ id, answer }: { id: string; answer: string }) =>
      api.patch(`/api/site-questions/${id}/answer`, { answer }, { auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["unanswered-questions"] }),
  });

  const now = new Date();
  const siteNameOf = (b: Booking) => mySites.find((s) => s.id === b.site_id)?.name ?? b.site_name ?? "—";

  const upcomingBookings = bookings
    .filter((b) => new Date(b.date) >= now && (filter === "all" || b.status === filter))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pastBookings = bookings
    .filter((b) => new Date(b.date) < now && (filter === "all" || b.status === filter))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "upcoming", label: "Upcoming", count: upcomingBookings.length },
    { id: "past", label: "Past", count: pastBookings.length },
    { id: "alerts", label: "Alerts", count: alerts.filter((a) => a.is_active).length },
    { id: "yield", label: "Yield Reports" },
    { id: "qa", label: "Q&A", count: unansweredQuestions.length },
  ];

  function BookingRow({ b }: { b: Booking }) {
    const expanded = expandedId === b.id;
    return (
      <div className="border-b border-stone-100 last:border-0">
        <div
          className="flex cursor-pointer items-center gap-3 px-5 py-4 hover:bg-stone-50"
          onClick={() => setExpandedId(expanded ? null : b.id)}
        >
          <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <span className="text-[10px] font-bold uppercase">{new Date(b.date).toLocaleDateString("en-CA", { month: "short" })}</span>
            <span className="text-sm font-bold leading-none">{new Date(b.date).getDate()}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-stone-900">{siteNameOf(b)}</p>
            <p className="text-xs text-stone-500">
              {new Date(b.date).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })}
              {b.is_group_booking ? ` · Group of ${b.party_size}` : ` · Party of ${b.party_size}`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden text-sm font-semibold text-stone-800 sm:block">${b.total_amount.toFixed(2)}</span>
            {statusBadge(b.status)}
            {expanded ? <ChevronUp className="h-4 w-4 text-stone-300" /> : <ChevronDown className="h-4 w-4 text-stone-300" />}
          </div>
        </div>
        {expanded && (
          <div className="border-t border-stone-50 bg-stone-50 px-5 py-4">
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div><p className="text-xs text-stone-400">Total</p><p className="font-semibold text-stone-800">${b.total_amount.toFixed(2)}</p></div>
              <div><p className="text-xs text-stone-400">Party size</p><p className="font-semibold text-stone-800">{b.party_size}</p></div>
              <div><p className="text-xs text-stone-400">Status</p><p className="font-semibold text-stone-800">{b.status}</p></div>
              {b.notes && <div className="col-span-2"><p className="text-xs text-stone-400">Notes</p><p className="text-stone-700">{b.notes}</p></div>}
            </div>
            <div className="mt-3 flex gap-2">
              {b.status === "confirmed" && (
                <button
                  onClick={() => completeBooking.mutate(b.id)}
                  disabled={completeBooking.isPending}
                  className="flex items-center gap-1.5 rounded-md border border-brand-600 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50"
                >
                  <CheckCircle className="h-3.5 w-3.5" /> Mark complete
                </button>
              )}
              <Link href={`/bookings/${b.id}`} className="rounded-md border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-white">
                View booking →
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 pb-24 md:pb-8">
      <div>
        <h1 className="font-display text-2xl text-stone-900">Bookings</h1>
        <p className="mt-0.5 text-sm text-stone-400">Manage sessions, alerts, yields, and visitor questions</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-stone-200 bg-stone-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              tab === t.id ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
            )}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold", tab === t.id ? "bg-brand-100 text-brand-700" : "bg-stone-200 text-stone-500")}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filter bar for booking tabs */}
      {(tab === "upcoming" || tab === "past") && (
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-stone-400" />
          {(["all", "confirmed", "pending", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                filter === f ? "bg-stone-800 text-white" : "border border-stone-200 text-stone-500 hover:border-stone-300"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      {tab === "upcoming" && (
        <section className="card">
          {upcomingBookings.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Calendar className="mx-auto mb-3 h-8 w-8 text-stone-200" />
              <p className="text-sm text-stone-400">No upcoming bookings{filter !== "all" ? ` with status "${filter}"` : ""}.</p>
              <Link href="/dashboard/sites" className="mt-2 block text-xs font-medium text-brand-600 hover:underline">Set availability →</Link>
            </div>
          ) : (
            upcomingBookings.map((b) => <BookingRow key={b.id} b={b} />)
          )}
        </section>
      )}

      {tab === "past" && (
        <section className="card">
          {pastBookings.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-stone-400">No past bookings.</p>
            </div>
          ) : (
            pastBookings.map((b) => <BookingRow key={b.id} b={b} />)
          )}
        </section>
      )}

      {tab === "alerts" && (
        <section className="space-y-4">
          <div className="card p-5">
            <p className="mb-3 text-sm font-semibold text-stone-800">Post a new alert</p>
            <div className="space-y-3">
              <select value={alertForm.site_id} onChange={(e) => setAlertForm((f) => ({ ...f, site_id: e.target.value }))} className="input">
                <option value="">Select site…</option>
                {mySites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input type="text" placeholder="Message (e.g. Site closed due to flooding)" value={alertForm.message}
                onChange={(e) => setAlertForm((f) => ({ ...f, message: e.target.value }))} className="input" />
              <button onClick={() => createAlert.mutate({ site_id: alertForm.site_id, message: alertForm.message, affected_dates: [] })}
                disabled={!alertForm.site_id || !alertForm.message || createAlert.isPending}
                className="btn-primary text-sm">
                <AlertTriangle className="mr-1.5 h-4 w-4" /> Post Alert
              </button>
            </div>
          </div>
          {alerts.length === 0 ? (
            <p className="text-center text-sm text-stone-400">No alerts posted yet.</p>
          ) : (
            <div className="space-y-2">
              {alerts.map((a) => (
                <div key={a.id} className={cn("card flex items-start justify-between gap-3 p-4", a.is_active ? "border-amber-200 bg-amber-50" : "opacity-50")}>
                  <div>
                    <p className="text-sm font-medium text-amber-900">{a.message}</p>
                    <p className="mt-0.5 text-xs text-amber-600">{a.is_active ? "Active" : "Resolved"}</p>
                  </div>
                  {a.is_active && (
                    <button onClick={() => resolveAlert.mutate(a.id)} className="shrink-0 text-xs font-medium text-amber-700 hover:underline">
                      Resolve
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "yield" && (
        <section className="space-y-4">
          <div className="card p-5">
            <p className="mb-3 text-sm font-semibold text-stone-800">Log a session</p>
            <div className="space-y-3">
              <select value={reportForm.site_id} onChange={(e) => setReportForm((f) => ({ ...f, site_id: e.target.value }))} className="input">
                <option value="">Select site…</option>
                {mySites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input type="date" value={reportForm.session_date} onChange={(e) => setReportForm((f) => ({ ...f, session_date: e.target.value }))} className="input" />
              <input type="text" placeholder="Minerals found (comma-separated)" value={reportForm.minerals_found}
                onChange={(e) => setReportForm((f) => ({ ...f, minerals_found: e.target.value }))} className="input" />
              <input type="text" placeholder="Quantity notes (optional)" value={reportForm.quantity_notes}
                onChange={(e) => setReportForm((f) => ({ ...f, quantity_notes: e.target.value }))} className="input" />
              <button onClick={() => createReport.mutate({
                site_id: reportForm.site_id,
                session_date: reportForm.session_date,
                minerals_found: reportForm.minerals_found.split(",").map((s) => s.trim()).filter(Boolean),
                quantity_notes: reportForm.quantity_notes,
              })} disabled={!reportForm.site_id || !reportForm.session_date || createReport.isPending} className="btn-primary text-sm">
                <Pickaxe className="mr-1.5 h-4 w-4" /> Log Report
              </button>
            </div>
          </div>
          {reports.length === 0 ? (
            <p className="text-center text-sm text-stone-400">No yield reports yet.</p>
          ) : (
            <div className="space-y-2">
              {reports.map((r) => (
                <div key={r.id} className="card p-4">
                  <p className="text-sm font-semibold text-stone-800">{r.session_date}</p>
                  <p className="text-sm text-stone-600">{r.minerals_found.join(", ") || "No minerals logged"}</p>
                  {r.quantity_notes && <p className="mt-1 text-xs text-stone-400">{r.quantity_notes}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "qa" && (
        <section className="space-y-3">
          {unansweredQuestions.length === 0 ? (
            <div className="card px-5 py-10 text-center">
              <HelpCircle className="mx-auto mb-3 h-8 w-8 text-stone-200" />
              <p className="text-sm text-stone-400">No unanswered visitor questions.</p>
            </div>
          ) : (
            unansweredQuestions.map((q) => (
              <div key={q.id} className="card p-4">
                <p className="text-sm font-medium text-stone-900">{q.question}</p>
                <p className="mt-0.5 text-xs text-stone-400">{q.visitor_name}</p>
                <div className="mt-3 flex gap-2">
                  <input type="text" placeholder="Your answer…"
                    value={answerForms[q.id] ?? ""}
                    onChange={(e) => setAnswerForms((f) => ({ ...f, [q.id]: e.target.value }))}
                    className="input flex-1 text-sm" />
                  <button onClick={() => answerQuestion.mutate({ id: q.id, answer: answerForms[q.id] ?? "" })}
                    disabled={!answerForms[q.id] || answerQuestion.isPending}
                    className="btn-primary text-sm">Answer</button>
                </div>
              </div>
            ))
          )}
        </section>
      )}
    </div>
  );
}
