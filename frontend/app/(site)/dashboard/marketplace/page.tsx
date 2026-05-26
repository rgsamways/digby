"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Specimen, Site } from "@/lib/types";
import { Plus, ShoppingBag, Zap, Package } from "lucide-react";

type Tab = "specimens" | "drops";

export default function MarketplacePage() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("specimens");
  const isOperator = user?.role === "operator" || user?.role === "admin";

  const { data: mySites = [] } = useQuery<Site[]>({
    queryKey: ["operator-sites"],
    queryFn: () => api.get("/api/sites/my", { auth: true }),
    enabled: isOperator,
  });

  const { data: mySpecimens = [] } = useQuery<Specimen[]>({
    queryKey: ["my-specimens"],
    queryFn: () => api.get("/api/specimens/my", { auth: true }),
    enabled: isOperator,
  });

  const [form, setForm] = useState({
    site_id: "", title: "", description: "", minerals: "", price: "", images: "",
  });
  const createSpecimen = useMutation({
    mutationFn: (data: object) => api.post("/api/specimens/", data, { auth: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-specimens"] });
      setForm({ site_id: "", title: "", description: "", minerals: "", price: "", images: "" });
    },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 pb-24 md:pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl text-stone-900">Marketplace</h1>
          <p className="mt-0.5 text-sm text-stone-400">Specimen listings and limited-release Specimen Drops</p>
        </div>
        <Link href="/specimens" className="text-sm font-medium text-brand-600 hover:underline">
          View public marketplace →
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-stone-200 bg-stone-100 p-1">
        {([
          { id: "specimens" as Tab, label: "Specimen Listings", icon: <Package className="h-4 w-4" /> },
          { id: "drops" as Tab, label: "Specimen Drop", icon: <Zap className="h-4 w-4" /> },
        ]).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              tab === t.id ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
            )}>
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Specimen Listings */}
      {tab === "specimens" && (
        <div className="space-y-4">
          {/* Add form */}
          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4 text-brand-600" />
              <p className="text-sm font-semibold text-stone-800">List a specimen</p>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Title (e.g. Thunder Bay Amethyst Cluster)"
                value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="input" />
              <textarea placeholder="Description" value={form.description} rows={2}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input resize-none" />
              <input type="text" placeholder="Minerals (comma-separated)"
                value={form.minerals} onChange={(e) => setForm((f) => ({ ...f, minerals: e.target.value }))} className="input" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Price (CAD)" value={form.price} min="0" step="0.01"
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className="input" />
                <select value={form.site_id} onChange={(e) => setForm((f) => ({ ...f, site_id: e.target.value }))} className="input">
                  <option value="">Site (optional)…</option>
                  {mySites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <input type="text" placeholder="Image URL (optional)" value={form.images}
                onChange={(e) => setForm((f) => ({ ...f, images: e.target.value }))} className="input" />
              <button
                onClick={() => createSpecimen.mutate({
                  title: form.title,
                  description: form.description,
                  minerals: form.minerals.split(",").map((s) => s.trim()).filter(Boolean),
                  province: "Ontario",
                  price: Number(form.price),
                  images: form.images ? [form.images] : [],
                  quantity: 1,
                  ...(form.site_id && { site_id: form.site_id }),
                })}
                disabled={!form.title || !form.price || createSpecimen.isPending}
                className="btn-primary text-sm">
                <ShoppingBag className="mr-1.5 h-4 w-4" /> List Specimen
              </button>
            </div>
          </div>

          {/* Existing listings */}
          {mySpecimens.length === 0 ? (
            <div className="card px-5 py-12 text-center">
              <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-stone-200" />
              <p className="text-sm text-stone-400">No specimens listed yet.</p>
              <p className="mt-1 text-xs text-stone-300">Use the form above to list your first specimen.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {mySpecimens.map((s) => (
                <div key={s.id} className="card p-4">
                  {s.images?.[0] && (
                    <div className="mb-3 h-32 w-full overflow-hidden rounded-lg bg-stone-100">
                      <img src={s.images[0]} alt={s.title} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-stone-900 leading-snug">{s.title}</p>
                      <p className="mt-0.5 text-xs text-stone-500">{s.minerals.join(", ") || "No minerals"}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-bold text-stone-900">${s.price.toFixed(2)}</p>
                      <p className="text-xs text-stone-400">{s.available} available</p>
                    </div>
                  </div>
                  <Link href={`/specimens/${s.id}`} className="mt-3 block text-xs font-medium text-brand-600 hover:underline">
                    View listing →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Specimen Drop */}
      {tab === "drops" && (
        <div className="space-y-4">
          {/* Promo card */}
          <div className="rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-amber-50 p-6">
            <div className="mb-3 flex items-center gap-2">
              <Zap className="h-5 w-5 text-brand-600" />
              <span className="text-sm font-bold uppercase tracking-wider text-brand-700">Specimen Drop</span>
              <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white">Launching July 1</span>
            </div>
            <h2 className="font-display text-xl text-stone-900">Limited releases with provenance</h2>
            <p className="mt-2 text-sm text-stone-600 leading-relaxed">
              List exceptional finds as limited-release drops — numbered, with full provenance documentation.
              Collectors pay a premium for authenticated Ontario specimens. Operators get featured placement and 88% of every sale.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                { stat: "88%", label: "Goes to you" },
                { stat: "Priority", label: "Featured placement" },
                { stat: "CAD", label: "Payments" },
              ].map(({ stat, label }) => (
                <div key={label} className="rounded-lg bg-white/60 p-3">
                  <p className="text-lg font-bold text-brand-700">{stat}</p>
                  <p className="text-xs text-stone-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Early access sign-up */}
          <div className="card p-5">
            <p className="mb-1 text-sm font-semibold text-stone-800">Get early operator access</p>
            <p className="mb-4 text-sm text-stone-500">
              Operators who join in the first week get priority placement in the July 1 launch. Leave your email and we&rsquo;ll reach out with setup instructions.
            </p>
            <div className="flex gap-2">
              <input type="email" placeholder="Your email" className="input flex-1" defaultValue={user?.email ?? ""} readOnly />
              <button className="btn-primary text-sm shrink-0">Join waitlist</button>
            </div>
          </div>

          {/* How it works */}
          <div className="card p-5">
            <p className="mb-4 text-sm font-semibold text-stone-800">How Specimen Drop works</p>
            <div className="space-y-4">
              {[
                { n: "1", title: "List a drop", body: "Submit your specimen with photos, provenance details, find location, and asking price." },
                { n: "2", title: "Digby reviews", body: "We verify the provenance and generate a numbered certificate. Takes 1–2 business days." },
                { n: "3", title: "Drop goes live", body: "Your specimen is listed as a limited release. Collectors are notified by mineral interest." },
                { n: "4", title: "Sold", body: "Payment hits your Stripe account at 88%. Certificate and provenance doc transfer to the buyer." },
              ].map(({ n, title, body }) => (
                <div key={n} className="flex gap-4">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">{n}</div>
                  <div>
                    <p className="text-sm font-semibold text-stone-800">{title}</p>
                    <p className="text-xs text-stone-500">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
