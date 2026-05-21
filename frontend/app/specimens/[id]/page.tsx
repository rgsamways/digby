"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { api } from "@/lib/api";
import type { Specimen } from "@/lib/types";
import { useAuthStore } from "@/lib/auth";
import { MapPin, Gem, ArrowLeft } from "lucide-react";
import Link from "next/link";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

function PurchaseForm({ clientSecret, amount }: { clientSecret: string; amount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    setError("");
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });
    if (stripeError) {
      setError(stripeError.message ?? "Payment failed");
      setPaying(false);
    } else {
      router.push("/bookings?tab=specimens");
    }
  }

  return (
    <form onSubmit={handlePay} className="space-y-4 mt-4">
      <PaymentElement />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={paying || !stripe} className="btn-primary w-full">
        {paying ? "Processing…" : `Pay $${amount.toFixed(2)} CAD`}
      </button>
    </form>
  );
}

export default function SpecimenDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  const { data: specimen, isLoading } = useQuery<Specimen>({
    queryKey: ["specimen", id],
    queryFn: () => api.get(`/api/specimens/${id}`),
  });

  const [shipping, setShipping] = useState("");
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);

  async function handleStartPurchase() {
    if (!user) { router.push("/login"); return; }
    setPurchasing(true);
    setPurchaseError("");
    try {
      const data = await api.post<{ order_id: string; client_secret: string }>(
        `/api/specimens/${id}/purchase`,
        { shipping_address: shipping },
        { auth: true },
      );
      setClientSecret(data.client_secret);
      setTotalAmount(specimen?.price ?? 0);
    } catch (e: unknown) {
      setPurchaseError(e instanceof Error ? e.message : "Could not start purchase");
    } finally {
      setPurchasing(false);
    }
  }

  if (isLoading) return <div className="flex h-64 items-center justify-center text-stone-500">Loading…</div>;
  if (!specimen) return <div className="p-8 text-center text-stone-500">Specimen not found.</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/specimens" className="mb-6 flex items-center gap-1 text-sm text-stone-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back to marketplace
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Images */}
        <div>
          {specimen.images[0] ? (
            <img src={specimen.images[0]} alt={specimen.title} className="w-full rounded-xl object-cover aspect-square" />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-stone-100">
              <Gem className="h-16 w-16 text-stone-300" />
            </div>
          )}
          {specimen.images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {specimen.images.slice(1).map((img, i) => (
                <img key={i} src={img} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
              ))}
            </div>
          )}
        </div>

        {/* Details + purchase */}
        <div>
          <h1 className="mb-1 text-2xl font-extrabold text-stone-900">{specimen.title}</h1>
          <div className="mb-3 flex items-center gap-1 text-sm text-stone-400">
            <MapPin className="h-4 w-4" /> {specimen.province}
          </div>

          {specimen.minerals.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {specimen.minerals.map((m) => (
                <span key={m} className="rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-700">{m}</span>
              ))}
            </div>
          )}

          {specimen.description && (
            <p className="mb-4 text-stone-600 leading-relaxed">{specimen.description}</p>
          )}

          <div className="mb-6 flex items-center justify-between rounded-xl bg-stone-50 p-4">
            <p className="text-2xl font-bold text-stone-900">${specimen.price.toFixed(2)} <span className="text-sm font-normal text-stone-500">CAD</span></p>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${specimen.available > 0 ? "bg-green-100 text-green-700" : "bg-red-50 text-red-500"}`}>
              {specimen.available > 0 ? `${specimen.available} in stock` : "Sold out"}
            </span>
          </div>

          {specimen.available > 0 && !clientSecret && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Shipping address</label>
                <textarea
                  value={shipping}
                  onChange={(e) => setShipping(e.target.value)}
                  rows={2}
                  className="input resize-none"
                  placeholder="Street, city, province, postal code"
                />
              </div>
              {purchaseError && <p className="text-sm text-red-600">{purchaseError}</p>}
              <button
                onClick={handleStartPurchase}
                disabled={purchasing || !shipping}
                className="btn-primary w-full"
              >
                {purchasing ? "Preparing checkout…" : "Buy now"}
              </button>
            </div>
          )}

          {clientSecret && (
            <Elements
              stripe={stripePromise}
              options={{ clientSecret, appearance: { theme: "stripe" } }}
            >
              <PurchaseForm clientSecret={clientSecret} amount={totalAmount} />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
}
