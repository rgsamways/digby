"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { adminApi, type AdminOrder } from "@/lib/admin";

const STATUSES = ["", "pending", "confirmed", "fulfilled", "shipped", "cancelled"];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  fulfilled: "bg-brand-100 text-brand-700",
  shipped: "bg-green-100 text-green-700",
  cancelled: "bg-stone-100 text-stone-500",
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
        <h1 className="text-2xl font-bold text-stone-900">Orders</h1>
        <select
          className="input w-40"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s || "All statuses"}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-stone-500">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="text-stone-500">No orders found.</p>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3 font-mono text-xs text-stone-500">{o.id.slice(-8)}</td>
                  <td className="px-4 py-3 text-stone-700">{o.user_email || o.user_id.slice(-8)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[o.status] ?? "bg-stone-100 text-stone-500"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-stone-900">{fmt(o.total)}</td>
                  <td className="px-4 py-3 text-stone-500">
                    {new Date(o.created_at).toLocaleDateString("en-CA")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/orders/${o.id}`} className="text-sm text-brand-600 hover:text-brand-700">
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
