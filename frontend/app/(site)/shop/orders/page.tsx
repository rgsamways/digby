"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Package, Truck } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import type { ShopOrder } from "@/lib/types";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  fulfilled: "bg-purple-100 text-purple-700",
  shipped: "bg-green-100 text-green-700",
  cancelled: "bg-stone-100 text-stone-500",
};

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ShopOrdersPage() {
  const { user } = useAuthStore();

  const { data: orders = [], isLoading } = useQuery<ShopOrder[]>({
    queryKey: ["shop-orders"],
    queryFn: () => api.get("/api/shop/orders/my", { auth: true }),
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-stone-500">Sign in to view your orders.</p>
        <Link href="/login" className="btn-primary">Log in</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-4xl text-stone-900">My Orders</h1>
        <Link href="/shop" className="btn-secondary text-sm">Continue Shopping</Link>
      </div>

      {isLoading ? (
        <p className="text-stone-500">Loading…</p>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="mx-auto mb-4 h-10 w-10 text-stone-200" />
          <p className="mb-4 text-stone-500">No orders yet.</p>
          <Link href="/shop" className="btn-primary">Browse the Shop</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3">
                <div className="text-sm text-stone-500">
                  {new Date(order.created_at).toLocaleDateString("en-CA", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-stone-900">{fmt(order.total)}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                      STATUS_STYLES[order.status] ?? ""
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="divide-y divide-stone-50 px-5">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <p className="font-medium text-stone-900">{item.product_name}</p>
                      <p className="text-stone-400">Qty {item.qty}</p>
                    </div>
                    <p className="font-medium text-stone-700">{fmt(item.price * item.qty)}</p>
                  </div>
                ))}
              </div>

              {order.tracking_number && (
                <div className="flex items-center gap-2 border-t border-stone-100 px-5 py-3 text-sm text-stone-600">
                  <Truck className="h-4 w-4 text-stone-400" />
                  Tracking: <span className="font-mono font-medium">{order.tracking_number}</span>
                </div>
              )}

              {order.shipping_address?.line1 && (
                <div className="border-t border-stone-100 px-5 py-3 text-xs text-stone-400">
                  {order.shipping_address.name} · {order.shipping_address.line1},{" "}
                  {order.shipping_address.city}, {order.shipping_address.province}{" "}
                  {order.shipping_address.postal_code}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
