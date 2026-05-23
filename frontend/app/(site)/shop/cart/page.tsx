"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { ShoppingCart, Trash2, Package, ArrowLeft } from "lucide-react";
import { useCartStore } from "@/lib/cart";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const PROVINCES = [
  "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT",
];

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function PayForm({
  clientSecret,
  onSuccess,
}: {
  clientSecret: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    setError("");
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + "/shop/orders" },
      redirect: "if_required",
    });
    if (result.error) {
      setError(result.error.message ?? "Payment failed");
      setPaying(false);
    } else {
      onSuccess();
    }
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={paying || !stripe} className="btn-primary w-full">
        {paying ? "Processing…" : "Pay Now"}
      </button>
    </form>
  );
}

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQty = useCartStore((s) => s.updateQty);
  const clear = useCartStore((s) => s.clear);

  const [stage, setStage] = useState<"cart" | "address" | "payment">("cart");
  const [clientSecret, setClientSecret] = useState("");
  const [orderSummary, setOrderSummary] = useState<{
    subtotal: number;
    shipping: number;
    total: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [address, setAddress] = useState({
    name: user?.name ?? "",
    line1: "",
    line2: "",
    city: "",
    province: "ON",
    postal_code: "",
    country: "CA",
  });

  const subtotalPreview = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shippingPreview = subtotalPreview >= 10000 ? 0 : 1299;

  async function handleProceedToPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      router.push("/login?redirect=/shop/cart");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await api.post(
        "/api/shop/orders/intent",
        {
          items: items.map((i) => ({ product_id: i.product_id, qty: i.qty })),
          shipping_address: address,
        },
        { auth: true }
      ) as { client_secret: string; subtotal: number; shipping: number; total: number };
      setClientSecret(result.client_secret);
      setOrderSummary({ subtotal: result.subtotal, shipping: result.shipping, total: result.total });
      setStage("payment");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0 && stage !== "payment") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-stone-200" />
        <h1 className="mb-2 text-xl font-bold text-stone-900">Your cart is empty</h1>
        <p className="mb-6 text-stone-500">Find gear to make your next dig legendary.</p>
        <Link href="/shop" className="btn-primary">Browse the Shop</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/shop" className="mb-6 flex items-center gap-1 text-sm text-stone-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Continue Shopping
      </Link>

      <h1 className="mb-8 text-2xl font-bold text-stone-900">
        {stage === "payment" ? "Payment" : stage === "address" ? "Shipping Address" : "Your Cart"}
      </h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: cart / address / payment */}
        <div className="lg:col-span-2">
          {stage === "cart" && (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.product_id} className="card flex items-center gap-4 p-4">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.product_name}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-stone-100">
                      <Package className="h-6 w-6 text-stone-300" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-stone-900">{item.product_name}</p>
                    <p className="text-sm text-stone-500">{fmt(item.price)} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center overflow-hidden rounded-lg border border-stone-200">
                      <button
                        onClick={() => updateQty(item.product_id, item.qty - 1)}
                        className="px-2.5 py-1 text-stone-600 hover:bg-stone-50"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.product_id, item.qty + 1)}
                        className="px-2.5 py-1 text-stone-600 hover:bg-stone-50"
                      >
                        +
                      </button>
                    </div>
                    <p className="w-20 text-right font-semibold text-stone-900">
                      {fmt(item.price * item.qty)}
                    </p>
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="text-stone-300 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="pt-2 text-right">
                <button
                  onClick={() => setStage("address")}
                  className="btn-primary"
                >
                  Proceed to Shipping →
                </button>
              </div>
            </div>
          )}

          {stage === "address" && (
            <form onSubmit={handleProceedToPayment} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label">Full name</label>
                  <input
                    required
                    className="input"
                    value={address.name}
                    onChange={(e) => setAddress((a) => ({ ...a, name: e.target.value }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Address line 1</label>
                  <input
                    required
                    className="input"
                    value={address.line1}
                    onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Address line 2 (optional)</label>
                  <input
                    className="input"
                    value={address.line2}
                    onChange={(e) => setAddress((a) => ({ ...a, line2: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">City</label>
                  <input
                    required
                    className="input"
                    value={address.city}
                    onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Province</label>
                  <select
                    className="input"
                    value={address.province}
                    onChange={(e) => setAddress((a) => ({ ...a, province: e.target.value }))}
                  >
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Postal code</label>
                  <input
                    required
                    className="input"
                    placeholder="K0L 1C0"
                    value={address.postal_code}
                    onChange={(e) => setAddress((a) => ({ ...a, postal_code: e.target.value }))}
                  />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStage("cart")}
                  className="btn-secondary"
                >
                  ← Back
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? "Loading…" : "Proceed to Payment →"}
                </button>
              </div>
            </form>
          )}

          {stage === "payment" && clientSecret && (
            <Elements
              stripe={stripePromise}
              options={{ clientSecret, appearance: { theme: "stripe" } }}
            >
              <PayForm
                clientSecret={clientSecret}
                onSuccess={() => {
                  clear();
                  router.push("/shop/orders");
                }}
              />
            </Elements>
          )}
        </div>

        {/* Right: order summary */}
        <div className="card h-fit p-5">
          <h2 className="mb-4 font-semibold text-stone-900">Order Summary</h2>
          <div className="space-y-2 text-sm">
            {items.map((i) => (
              <div key={i.product_id} className="flex justify-between text-stone-600">
                <span className="line-clamp-1 flex-1 pr-2">{i.product_name} ×{i.qty}</span>
                <span>{fmt(i.price * i.qty)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 border-t border-stone-100 pt-4 text-sm">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal</span>
              <span>{fmt(orderSummary?.subtotal ?? subtotalPreview)}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Shipping</span>
              <span>
                {(orderSummary?.shipping ?? shippingPreview) === 0
                  ? "Free"
                  : fmt(orderSummary?.shipping ?? shippingPreview)}
              </span>
            </div>
            <div className="flex justify-between border-t border-stone-100 pt-2 font-semibold text-stone-900">
              <span>Total</span>
              <span>{fmt(orderSummary?.total ?? subtotalPreview + shippingPreview)}</span>
            </div>
          </div>
          {(orderSummary?.shipping ?? shippingPreview) > 0 && (
            <p className="mt-3 text-xs text-stone-400">
              Add {fmt(10000 - (orderSummary?.subtotal ?? subtotalPreview))} more for free shipping
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
