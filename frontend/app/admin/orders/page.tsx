"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { adminApi, type AdminOrder } from "@/lib/admin";

const STATUSES = ["", "pending", "confirmed", "fulfilled", "shipped", "cancelled"];

const STATUS_STYLES: Record<string, string> = {
  pending:   "bg-amber-400/10 text-amber-500",
  confirmed: "bg-sky-400/10 text-sky-500",
  fulfilled: "bg-violet-400/10 text-violet-500",
  shipped:   "bg-emerald-400/10 text-emerald-500",
  cancelled: "bg-stone-200 text-stone-400",
};

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  async function load(status: string) {
    setLoading(true);
    try {
      const data = await adminApi.listOrders(0, 100, status || undefined);
      setOrders(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(filter); }, [filter]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Orders</h1>
          <p className="mt-0.5 text-sm text-stone-400">{orders.length} order{orders.length !== 1 ? "s" : ""}</p>
        </div>
        <select
          className="input w-40 text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s || "All statuses"}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-stone-400 text-sm">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="text-stone-400 text-sm">No orders found.</p>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-left text-[11px] font-semibold uppercase tracking-widest text-stone-400">
                <th className="px-4 py-2.5">ID</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Total</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <tr key={o.id} className={`border-b border-stone-50 last:border-0 hover:bg-stone-50/60 transition-colors ${i % 2 === 1 ? "bg-stone-50/40" : ""}`}>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-stone-400">{o.id.slice(-8)}</td>
                  <td className="px-4 py-2.5 text-stone-700">{o.user_email || o.user_id.slice(-8)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-semibold tracking-wide ${STATUS_STYLES[o.status] ?? "bg-stone-100 text-stone-400"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-sm font-medium text-stone-900">{fmt(o.total)}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-stone-400">
                    {new Date(o.created_at).toLocaleDateString("en-CA")}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link href={`/admin/orders/${o.id}`} className="text-xs font-medium text-amber-600 hover:text-amber-700">
                      View →
                    </Link>
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
