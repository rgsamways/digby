"use client";

import { useState, useEffect } from "react";
import { revenueAdminApi, type AdminRevenue } from "@/lib/admin";
import { TrendingUp, ShoppingBag, CalendarCheck, Layers } from "lucide-react";

function StatCard({ label, value, sub, icon: Icon }: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm p-5">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-400">{label}</p>
        <Icon className="h-4 w-4 text-stone-300" />
      </div>
      <p className="mt-3 font-mono text-2xl font-bold text-stone-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-stone-400">{sub}</p>}
    </div>
  );
}

export default function AdminRevenuePage() {
  const [data, setData] = useState<AdminRevenue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    revenueAdminApi.get().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-stone-400">Loading…</p>;
  if (!data) return <p className="text-sm text-red-500">Failed to load revenue data.</p>;

  const maxMonthlyGmv = Math.max(...data.monthly.map((m) => m.bookings_gmv + m.orders_gmv), 1);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-stone-900 tracking-tight">Revenue</h1>
        <p className="mt-0.5 text-sm text-stone-400">Platform-wide financial summary</p>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Booking GMV"
          value={`$${data.booking_gmv.toLocaleString("en-CA", { minimumFractionDigits: 2 })}`}
          sub={`${data.total_bookings} bookings · $${data.booking_fee_revenue.toFixed(2)} fee`}
          icon={CalendarCheck}
        />
        <StatCard
          label="Shop GMV"
          value={`$${data.order_gmv.toLocaleString("en-CA", { minimumFractionDigits: 2 })}`}
          sub={`${data.total_orders} orders`}
          icon={ShoppingBag}
        />
        <StatCard
          label="Strata MRR"
          value={`$${data.subscription_mrr.toLocaleString("en-CA", { minimumFractionDigits: 2 })}`}
          sub={`${data.active_subscriptions} active subs`}
          icon={Layers}
        />
        <StatCard
          label="Total Fee Revenue"
          value={`$${(data.booking_fee_revenue).toLocaleString("en-CA", { minimumFractionDigits: 2 })}`}
          sub="Platform 12% on bookings"
          icon={TrendingUp}
        />
      </div>

      {/* Monthly chart (CSS bar chart) */}
      {data.monthly.length > 0 && (
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm p-5">
          <h2 className="mb-5 text-[11px] font-semibold uppercase tracking-widest text-stone-400">Monthly GMV (last 6 months)</h2>
          <div className="flex items-end gap-3 h-40">
            {data.monthly.map((m) => {
              const total = m.bookings_gmv + m.orders_gmv;
              const heightPct = Math.round((total / maxMonthlyGmv) * 100);
              const bookingPct = total > 0 ? Math.round((m.bookings_gmv / total) * 100) : 0;
              return (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-1.5">
                  <p className="font-mono text-[10px] text-stone-400">${total.toFixed(0)}</p>
                  <div className="w-full flex flex-col justify-end" style={{ height: "100px" }}>
                    <div
                      className="w-full rounded-t overflow-hidden flex flex-col-reverse"
                      style={{ height: `${heightPct}%`, minHeight: total > 0 ? "4px" : "0" }}
                    >
                      <div className="w-full bg-amber-400" style={{ height: `${bookingPct}%` }} title={`Bookings $${m.bookings_gmv.toFixed(2)}`} />
                      <div className="w-full flex-1 bg-sky-400/60" title={`Shop $${m.orders_gmv.toFixed(2)}`} />
                    </div>
                  </div>
                  <p className="font-mono text-[10px] text-stone-400">{m.month.slice(5)}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[11px] text-stone-400">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-400" /> Bookings
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-stone-400">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-sky-400/60" /> Shop orders
            </span>
          </div>
        </div>
      )}

      {/* Monthly table */}
      {data.monthly.length > 0 && (
        <div className="mt-6 rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-left text-[11px] font-semibold uppercase tracking-widest text-stone-400">
                <th className="px-4 py-2.5">Month</th>
                <th className="px-4 py-2.5">Booking GMV</th>
                <th className="px-4 py-2.5">Platform Fee</th>
                <th className="px-4 py-2.5">Shop GMV</th>
                <th className="px-4 py-2.5">Total</th>
              </tr>
            </thead>
            <tbody>
              {[...data.monthly].reverse().map((m, i) => (
                <tr key={m.month} className={`border-b border-stone-50 last:border-0 ${i % 2 === 1 ? "bg-stone-50/40" : ""}`}>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-stone-500">{m.month}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-stone-700">${m.bookings_gmv.toFixed(2)}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-stone-400">${m.fee.toFixed(2)}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-stone-700">${m.orders_gmv.toFixed(2)}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] font-bold text-stone-900">
                    ${(m.bookings_gmv + m.orders_gmv).toFixed(2)}
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
