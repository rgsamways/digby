"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, Check, X } from "lucide-react";
import { strataAdminApi, type StrataFulfilmentRow, type StrataBoxSummary } from "@/lib/admin";

const TIER_STYLES: Record<string, string> = {
  discoverer: "bg-sky-400/10 text-sky-600",
  collector:  "bg-violet-400/10 text-violet-600",
  geologist:  "bg-amber-400/10 text-amber-600",
};

export default function AdminStrataFulfilmentPage() {
  const [boxes, setBoxes] = useState<StrataBoxSummary[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [rows, setRows] = useState<StrataFulfilmentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    strataAdminApi.listBoxes().then((data) => {
      setBoxes(data);
      if (data.length > 0) setSelectedMonth(data[data.length - 1].month_number);
    });
  }, []);

  const loadFulfilment = useCallback(async (month: number) => {
    setLoading(true);
    try {
      const data = await strataAdminApi.getFulfilment(month);
      setRows(data);
      const t: Record<string, string> = {};
      data.forEach((r) => { t[r.id] = r.tracking_number ?? ""; });
      setTracking(t);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedMonth !== null) loadFulfilment(selectedMonth);
  }, [selectedMonth, loadFulfilment]);

  async function markShipped(subId: string) {
    if (selectedMonth === null) return;
    setSaving(subId);
    try {
      await strataAdminApi.markShipped(selectedMonth, subId, tracking[subId] ?? "");
      await loadFulfilment(selectedMonth);
    } finally {
      setSaving(null);
    }
  }

  async function unmarkShipped(subId: string) {
    if (selectedMonth === null) return;
    setSaving(subId);
    try {
      await strataAdminApi.unmarkShipped(selectedMonth, subId);
      await loadFulfilment(selectedMonth);
    } finally {
      setSaving(null);
    }
  }

  function fmtAddress(addr: Record<string, string>) {
    const line1 = addr.line1 ?? "";
    const city = addr.city ?? "";
    const prov = addr.province ?? "";
    const postal = addr.postal_code ?? "";
    return [line1, [city, prov, postal].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  }

  const shipped = rows.filter((r) => r.shipped).length;
  const total = rows.length;
  const selectedBox = boxes.find((b) => b.month_number === selectedMonth);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Box Fulfilment</h1>
          {selectedBox && (
            <p className="mt-0.5 text-sm text-stone-400">
              Month {selectedBox.month_number} — {selectedBox.theme}
            </p>
          )}
          {total > 0 && (
            <p className="mt-0.5 text-sm text-stone-400">
              <span className="text-emerald-600 font-medium">{shipped}</span> / {total} shipped
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <select
            className="input w-52 text-sm"
            value={selectedMonth ?? ""}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {boxes.map((b) => (
              <option key={b.month_number} value={b.month_number}>
                Box {b.month_number} — {b.theme}
              </option>
            ))}
          </select>
          {selectedMonth !== null && (
            <a
              href={strataAdminApi.shippingLabelsUrl(selectedMonth)}
              className="btn-secondary flex items-center gap-1.5 text-sm"
              download
            >
              <Download className="h-4 w-4" />
              Labels CSV
            </a>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-stone-400">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-stone-400">No subscribers.</p>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-left text-[11px] font-semibold uppercase tracking-widest text-stone-400">
                <th className="px-4 py-2.5">Subscriber</th>
                <th className="px-4 py-2.5">Tier</th>
                <th className="px-4 py-2.5">Ship to</th>
                <th className="px-4 py-2.5">Tracking #</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={`border-b border-stone-50 last:border-0 transition-colors ${r.shipped ? "bg-emerald-50/30" : i % 2 === 1 ? "bg-stone-50/40" : ""} hover:bg-stone-50/60`}>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-stone-900">{r.user_name || "—"}</p>
                    <p className="text-[11px] text-stone-400">{r.user_email}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-semibold capitalize tracking-wide ${TIER_STYLES[r.tier] ?? "bg-stone-100 text-stone-400"}`}>
                      {r.tier}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[11px] text-stone-400">{fmtAddress(r.shipping_address)}</td>
                  <td className="px-4 py-2.5">
                    <input
                      type="text"
                      className="input w-36 py-1 text-xs font-mono"
                      placeholder="optional"
                      value={tracking[r.id] ?? ""}
                      onChange={(e) => setTracking((prev) => ({ ...prev, [r.id]: e.target.value }))}
                      disabled={r.shipped}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    {r.shipped ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <Check className="h-3 w-3" />
                        {r.shipped_at ? new Date(r.shipped_at).toLocaleDateString("en-CA") : "Shipped"}
                      </span>
                    ) : (
                      <span className="text-[11px] text-stone-400">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {r.shipped ? (
                      <button
                        onClick={() => unmarkShipped(r.id)}
                        disabled={saving === r.id}
                        className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-stone-400 hover:bg-stone-100 hover:text-stone-600 disabled:opacity-40"
                      >
                        <X className="h-3 w-3" /> Unmark
                      </button>
                    ) : (
                      <button
                        onClick={() => markShipped(r.id)}
                        disabled={saving === r.id}
                        className="flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
                      >
                        <Check className="h-3 w-3" />
                        {saving === r.id ? "Saving…" : "Mark shipped"}
                      </button>
                    )}
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
