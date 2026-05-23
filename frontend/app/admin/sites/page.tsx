"use client";

import { useState, useEffect } from "react";
import { sitesAdminApi, type AdminSite } from "@/lib/admin";
import { Star } from "lucide-react";

const TYPE_STYLES: Record<string, string> = {
  "pay-to-dig":      "bg-amber-400/10 text-amber-600",
  "guided-tour":     "bg-violet-400/10 text-violet-600",
  "collecting-walk": "bg-sky-400/10 text-sky-600",
};

export default function AdminSitesPage() {
  const [sites, setSites] = useState<AdminSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const active = activeFilter === "all" ? undefined : activeFilter === "active";
      setSites(await sitesAdminApi.list(active));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [activeFilter]);

  async function toggleActive(site: AdminSite) {
    setPending(site.id);
    try {
      await sitesAdminApi.setStatus(site.id, !site.is_active);
      setSites((s) => s.map((x) => (x.id === site.id ? { ...x, is_active: !x.is_active } : x)));
    } finally {
      setPending(null);
    }
  }

  const visible = sites.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.operator_name.toLowerCase().includes(q) || s.province.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Sites</h1>
          <p className="mt-0.5 text-sm text-stone-400">{sites.length} sites</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search site or operator…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-52 text-sm"
          />
          <select className="input w-32 text-sm" value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as typeof activeFilter)}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-stone-400">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-stone-400">No sites found.</p>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-left text-[11px] font-semibold uppercase tracking-widest text-stone-400">
                <th className="px-4 py-2.5">Site</th>
                <th className="px-4 py-2.5">Operator</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Price</th>
                <th className="px-4 py-2.5">Rating</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s, i) => (
                <tr key={s.id} className={`border-b border-stone-50 last:border-0 hover:bg-stone-50/60 transition-colors ${i % 2 === 1 ? "bg-stone-50/40" : ""} ${!s.is_active ? "opacity-50" : ""}`}>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-stone-900">{s.name}</p>
                    <p className="text-[11px] text-stone-400">{s.province} · {s.minerals.slice(0, 3).join(", ")}</p>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-stone-500">{s.operator_name || "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-semibold tracking-wide ${TYPE_STYLES[s.site_type] ?? "bg-stone-100 text-stone-400"}`}>
                      {s.site_type.replace(/-/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-stone-500">${s.price_per_person.toFixed(2)}</td>
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-0.5 text-xs text-stone-500">
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                      {s.rating.toFixed(1)}
                      <span className="text-stone-300 ml-0.5">({s.review_count})</span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-semibold ${s.is_active ? "bg-emerald-400/10 text-emerald-600" : "bg-stone-100 text-stone-400"}`}>
                      {s.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => toggleActive(s)}
                      disabled={pending === s.id}
                      className="text-xs font-medium text-amber-500 hover:text-amber-600 disabled:opacity-40"
                    >
                      {s.is_active ? "Deactivate" : "Activate"}
                    </button>
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
