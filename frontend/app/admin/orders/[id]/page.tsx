"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { adminApi, type AdminOrder } from "@/lib/admin";

const ALL_STATUSES = ["pending", "confirmed", "fulfilled", "shipped", "cancelled"];

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

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState("");
  const [tracking, setTracking] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminApi.getOrder(id).then((o) => {
      setOrder(o);
      setNewStatus(o.status);
      setTracking(o.tracking_number);
      setLoading(false);
    });
  }, [id]);

  async function handleSave() {
    if (!order) return;
    setSaving(true);
    try {
      await adminApi.updateOrderStatus(id, newStatus, tracking);
      setOrder((o) => o ? { ...o, status: newStatus, tracking_number: tracking } : o);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-stone-500">Loading…</p>;
  if (!order) return <p className="text-stone-500">Order not found.</p>;

  const addr = order.shipping_address;

  return (
    <div className="max-w-2xl">
      <Link href="/admin/orders" className="mb-6 flex items-center gap-1 text-sm text-stone-500 hover:text-brand-600">
        <ChevronLeft className="h-4 w-4" /> Orders
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Order</h1>
          <p className="mt-0.5 font-mono text-xs text-stone-400">{order.id}</p>
        </div>
        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${STATUS_STYLES[order.status] ?? "bg-stone-100 text-stone-500"}`}>
          {order.status}
        </span>
      </div>

      {/* Customer */}
      <div className="card p-5 mb-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">Customer</h2>
        <p className="text-sm text-stone-700">{order.user_email || order.user_id}</p>
      </div>

      {/* Shipping address */}
      <div className="card p-5 mb-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">Shipping Address</h2>
        <div className="text-sm text-stone-700 space-y-0.5">
          <p>{addr.name}</p>
          <p>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
          <p>{addr.city}, {addr.province} {addr.postal_code}</p>
          <p>{addr.country}</p>
        </div>
      </div>

      {/* Line items */}
      <div className="card p-5 mb-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">Items</h2>
        <div className="space-y-2">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-stone-700">{item.product_name} ×{item.qty}</span>
              <span className="tabular-nums text-stone-900">{fmt(item.price * item.qty)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 border-t border-stone-100 pt-3 flex justify-between font-semibold text-stone-900">
          <span>Total</span>
          <span>{fmt(order.total)}</span>
        </div>
      </div>

      {/* Stripe */}
      <div className="card p-5 mb-4">
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">Stripe Payment</h2>
        <p className="font-mono text-xs text-stone-500">{order.stripe_payment_intent_id || "—"}</p>
      </div>

      {/* Update status */}
      <div className="card p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">Update Order</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Status</label>
            <select className="input" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Tracking Number</label>
            <input
              className="input"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="e.g. 1Z999AA10123456784"
            />
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 btn-primary"
        >
          {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
