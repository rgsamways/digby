"use client";

import { useState, useEffect } from "react";
import { bookingsAdminApi, type AdminBooking } from "@/lib/admin";

const STATUSES = ["", "pending", "confirmed", "completed", "cancelled"];

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-emerald-400/10 text-emerald-600",
  pending:   "bg-amber-400/10 text-amber-500",
  completed: "bg-sky-400/10 text-sky-600",
  cancelled: "bg-stone-100 text-stone-400",
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setBookings(await bookingsAdminApi.list(statusFilter || undefined));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [statusFilter]);

  async function setStatus(booking: AdminBooking, status: string) {
    if (status === booking.status) return;
    setPending(booking.id);
    try {
      await bookingsAdminApi.setStatus(booking.id, status);
      setBookings((b) => b.map((x) => (x.id === booking.id ? { ...x, status } : x)));
    } finally {
      setPending(null);
    }
  }

  const totalGmv = bookings
    .filter((b) => b.status === "confirmed" || b.status === "completed")
    .reduce((n, b) => n + b.total_amount, 0);
  const totalFee = bookings
    .filter((b) => b.status === "confirmed" || b.status === "completed")
    .reduce((n, b) => n + b.platform_fee, 0);

  const visible = bookings.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return b.site_name.toLowerCase().includes(q) || b.visitor_name.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Bookings</h1>
          <p className="mt-0.5 text-sm text-stone-400">
            {bookings.length} bookings · GMV ${totalGmv.toFixed(2)} · Fee ${totalFee.toFixed(2)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search site or visitor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-52 text-sm"
          />
          <select className="input w-36 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s || "All statuses"}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-stone-400">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-stone-400">No bookings found.</p>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-left text-[11px] font-semibold uppercase tracking-widest text-stone-400">
                <th className="px-4 py-2.5">Site</th>
                <th className="px-4 py-2.5">Visitor</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Party</th>
                <th className="px-4 py-2.5">Total</th>
                <th className="px-4 py-2.5">Fee</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((b, i) => (
                <tr key={b.id} className={`border-b border-stone-50 last:border-0 hover:bg-stone-50/60 transition-colors ${i % 2 === 1 ? "bg-stone-50/40" : ""}`}>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-stone-900">{b.site_name || "—"}</p>
                    {b.is_group_booking && (
                      <span className="text-[10px] font-semibold bg-violet-400/10 text-violet-500 rounded px-1.5 py-0.5">Group</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-stone-500">{b.visitor_name || "—"}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-stone-400">
                    {new Date(b.date).toLocaleDateString("en-CA")}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-stone-500">{b.party_size}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-stone-700">${b.total_amount.toFixed(2)}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-stone-400">${b.platform_fee.toFixed(2)}</td>
                  <td className="px-4 py-2.5">
                    <select
                      value={b.status}
                      onChange={(e) => setStatus(b, e.target.value)}
                      disabled={pending === b.id}
                      className={`rounded px-2 py-0.5 text-[11px] font-semibold border-0 cursor-pointer ${STATUS_STYLES[b.status] ?? "bg-stone-100 text-stone-400"}`}
                    >
                      {STATUSES.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
