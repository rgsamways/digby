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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Products</h1>
        <Link href="/admin/products/new" className="btn-primary flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> New Product
        </Link>
      </div>

      {loading ? (
        <p className="text-stone-500">Loading…</p>
      ) : products.length === 0 ? (
        <p className="text-stone-500">No products yet.</p>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {products.map((p) => (
                <tr key={p.id} className={`hover:bg-stone-50 ${!p.active ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3 font-medium text-stone-900">{p.name}</td>
                  <td className="px-4 py-3 text-stone-500">{CATEGORY_LABELS[p.category] ?? p.category}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-stone-700">{fmt(p.price)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-stone-700">
                    {p.dropship ? <span className="text-xs text-stone-400">dropship</span> : p.stock}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.active ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"
                    }`}>
                      {p.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/products/${p.id}`} className="text-stone-400 hover:text-brand-600">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      {p.active && (
                        <button
                          onClick={() => handleDeactivate(p.id, p.name)}
                          disabled={deactivating === p.id}
                          className="text-stone-400 hover:text-red-500"
                          title="Deactivate"
                        >
                          <EyeOff className="h-4 w-4" />
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
