"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Pencil, EyeOff } from "lucide-react";
import { adminApi, type AdminProduct } from "@/lib/admin";

const CATEGORY_LABELS: Record<string, string> = {
  "get-started": "Get Started",
  "field-gear": "Field Gear",
  "identify-display": "Identify & Display",
  "bancroft-collection": "Bancroft Collection",
};

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [deactivating, setDeactivating] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await adminApi.listProducts();
      setProducts(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDeactivate(id: string, name: string) {
    if (!confirm(`Deactivate "${name}"? It will no longer appear in the shop.`)) return;
    setDeactivating(id);
    try {
      await adminApi.deactivateProduct(id);
      setProducts((ps) => ps.map((p) => p.id === id ? { ...p, active: false } : p));
    } finally {
      setDeactivating(null);
    }
  }

  const active = products.filter((p) => p.active).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Products</h1>
          <p className="mt-0.5 text-sm text-stone-400">{active} active · {products.length} total</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary flex items-center gap-1.5 text-sm">
          <Plus className="h-4 w-4" /> New Product
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-stone-400">Loading…</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-stone-400">No products yet.</p>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-left text-[11px] font-semibold uppercase tracking-widest text-stone-400">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">SKU</th>
                <th className="px-4 py-2.5 text-right">Price</th>
                <th className="px-4 py-2.5 text-right">Stock</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={p.id} className={`border-b border-stone-50 last:border-0 hover:bg-stone-50/60 transition-colors ${i % 2 === 1 ? "bg-stone-50/40" : ""} ${!p.active ? "opacity-50" : ""}`}>
                  <td className="px-4 py-2.5 font-medium text-stone-900">{p.name}</td>
                  <td className="px-4 py-2.5 text-stone-500 text-xs">{CATEGORY_LABELS[p.category] ?? p.category}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-stone-400">{p.sku || "—"}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-sm font-medium text-stone-900">{fmt(p.price)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-sm text-stone-600">
                    {p.dropship ? <span className="text-xs text-stone-400">dropship</span> : p.stock}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-semibold tracking-wide ${
                      p.active ? "bg-emerald-400/10 text-emerald-600" : "bg-stone-200 text-stone-400"
                    }`}>
                      {p.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/admin/products/${p.id}`} className="text-stone-400 hover:text-amber-600 transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      {p.active && (
                        <button
                          onClick={() => handleDeactivate(p.id, p.name)}
                          disabled={deactivating === p.id}
                          className="text-stone-300 hover:text-red-500 transition-colors disabled:opacity-40"
                          title="Deactivate"
                        >
                          <EyeOff className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
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
