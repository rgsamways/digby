"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { strataAdminApi, type StrataSubscriber } from "@/lib/admin";

const STATUSES = ["", "active", "pending", "paused", "past_due", "cancelled"];

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  paused: "bg-stone-100 text-stone-600",
  past_due: "bg-red-100 text-red-700",
  cancelled: "bg-stone-100 text-stone-400",
};

const TIER_STYLES: Record<string, string> = {
  discoverer: "bg-sky-100 text-sky-700",
  collector: "bg-violet-100 text-violet-700",
  geologist: "bg-amber-100 text-amber-700",
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
    const parts = [addr.city, addr.province, addr.country].filter(Boolean);
    return parts.join(", ") || "—";
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Strata Subscribers</h1>
          <p className="mt-1 text-sm text-stone-500">{subs.length} subscriber{subs.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="input w-44"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s || "All statuses"}</option>
            ))}
          </select>
          <Link
            href="/admin/strata/fulfilment"
            className="btn-primary text-sm"
          >
            Box Fulfilment →
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-stone-500">Loading…</p>
      ) : subs.length === 0 ? (
        <p className="text-stone-500">No subscribers found.</p>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">
                <th className="px-4 py-3">Subscriber</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Billing</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Renews</th>
                <th className="px-4 py-3">Ship to</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {subs.map((s) => (
                <tr key={s.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-900">{s.user_name || "—"}</p>
                    <p className="text-xs text-stone-400">{s.user_email}</p>
                    {s.is_gift && (
                      <span className="mt-0.5 inline-block rounded-full bg-pink-100 px-1.5 py-0.5 text-xs font-medium text-pink-700">Gift</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${TIER_STYLES[s.tier] ?? "bg-stone-100 text-stone-500"}`}>
                      {s.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize text-stone-600">{s.billing_frequency}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[s.status] ?? "bg-stone-100 text-stone-500"}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-500">
                    {s.current_period_end
                      ? new Date(s.current_period_end).toLocaleDateString("en-CA")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-stone-500">{fmtAddress(s.shipping_address)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
