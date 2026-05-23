"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { strataAdminApi, type StrataSubscriber } from "@/lib/admin";

const STATUSES = ["", "active", "pending", "paused", "past_due", "cancelled"];

const STATUS_STYLES: Record<string, string> = {
  active:   "bg-emerald-400/10 text-emerald-600",
  pending:  "bg-amber-400/10 text-amber-500",
  paused:   "bg-stone-200 text-stone-500",
  past_due: "bg-red-400/10 text-red-500",
  cancelled:"bg-stone-200 text-stone-400",
};

const TIER_STYLES: Record<string, string> = {
  discoverer: "bg-sky-400/10 text-sky-600",
  collector:  "bg-violet-400/10 text-violet-600",
  geologist:  "bg-amber-400/10 text-amber-600",
};

export default function AdminStrataPage() {
  const [subs, setSubs] = useState<StrataSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  async function load(status: string) {
    setLoading(true);
    try {
      const data = await strataAdminApi.listSubscribers(status || undefined);
      setSubs(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(filter); }, [filter]);

  function fmtAddress(addr: Record<string, string>) {
    return [addr.city, addr.province].filter(Boolean).join(", ") || "—";
  }

  const active = subs.filter((s) => s.status === "active").length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Strata Subscribers</h1>
          <p className="mt-0.5 text-sm text-stone-400">{active} active · {subs.length} total</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="input w-44 text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s || "All statuses"}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <Link href="/admin/strata/boxes" className="btn-secondary text-sm">
              Box Editor →
            </Link>
            <Link href="/admin/strata/fulfilment" className="btn-primary text-sm">
              Fulfilment →
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-stone-400">Loading…</p>
      ) : subs.length === 0 ? (
        <p className="text-sm text-stone-400">No subscribers found.</p>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-left text-[11px] font-semibold uppercase tracking-widest text-stone-400">
                <th className="px-4 py-2.5">Subscriber</th>
                <th className="px-4 py-2.5">Tier</th>
                <th className="px-4 py-2.5">Billing</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Renews</th>
                <th className="px-4 py-2.5">Ship to</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s, i) => (
                <tr key={s.id} className={`border-b border-stone-50 last:border-0 hover:bg-stone-50/60 transition-colors ${i % 2 === 1 ? "bg-stone-50/40" : ""}`}>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-stone-900">{s.user_name || "—"}</p>
                    <p className="text-[11px] text-stone-400">{s.user_email}</p>
                    {s.is_gift && (
                      <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold bg-pink-400/10 text-pink-500">Gift</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-semibold capitalize tracking-wide ${TIER_STYLES[s.tier] ?? "bg-stone-100 text-stone-400"}`}>
                      {s.tier}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs capitalize text-stone-500">{s.billing_frequency}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-semibold tracking-wide ${STATUS_STYLES[s.status] ?? "bg-stone-100 text-stone-400"}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-stone-400">
                    {s.current_period_end ? new Date(s.current_period_end).toLocaleDateString("en-CA") : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-stone-400">{fmtAddress(s.shipping_address)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
