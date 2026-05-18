"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import type { Site } from "@/lib/types";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

// ── Step 2: card input form ───────────────────────────────────────────────────
function CardStep({
  bookingId,
  total,
}: {
  bookingId: string;
  total: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError("");

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/bookings/${bookingId}/confirm`,
      },
    });

    if (stripeError) {
      setError(stripeError.message ?? "Payment failed");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <div className="rounded-lg border border-stone-200 p-4">
        <PaymentElement />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={!stripe || loading} className="btn-primary w-full">
        {loading ? "Processing…" : `Pay $${total} CAD`}
      </button>
    </form>
  );
}

// ── Step 1: date + party size ─────────────────────────────────────────────────
export function BookingForm({ site }: { site: Site }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [date, setDate] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const total = (site.price_per_person * partySize).toFixed(2);

  const mutation = useMutation({
    mutationFn: () =>
      api.post<{ booking_id: string; client_secret: string }>(
        "/api/bookings",
        { site_id: site.id, date: new Date(date).toISOString(), party_size: partySize },
        { auth: true }
      ),
    onSuccess: (data) => {
      setClientSecret(data.client_secret);
      setBookingId(data.booking_id);
    },
  });

  if (!user) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-stone-600">Sign in to book this site.</p>
        <a href="/login" className="btn-primary block w-full text-center">
          Sign in
        </a>
      </div>
    );
  }

  if (clientSecret && bookingId) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-stone-50 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-600">
              ${site.price_per_person.toFixed(2)} × {partySize} —{" "}
              {new Date(date).toLocaleDateString("en-CA")}
            </span>
            <span className="font-semibold">${total} CAD</span>
          </div>
        </div>
        <Elements
          stripe={stripePromise}
          options={{ clientSecret, appearance: { theme: "stripe" } }}
        >
          <CardStep bookingId={bookingId} total={total} />
        </Elements>
        <button
          onClick={() => { setClientSecret(null); setBookingId(null); }}
          className="w-full text-center text-xs text-stone-400 hover:text-stone-600"
        >
          ← Change date or party size
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
      className="space-y-4"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          min={new Date().toISOString().split("T")[0]}
          className="input"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">
          Party size (max {site.max_group_size})
        </label>
        <input
          type="number"
          value={partySize}
          onChange={(e) => setPartySize(Math.max(1, parseInt(e.target.value)))}
          min={1}
          max={site.max_group_size}
          required
          className="input"
        />
      </div>

      <div className="rounded-lg bg-stone-50 p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-stone-600">
            ${site.price_per_person.toFixed(2)} × {partySize}
          </span>
          <span className="font-semibold">${total} CAD</span>
        </div>
        <p className="mt-1 text-xs text-stone-400">12% platform fee included</p>
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>
      )}

      <button
        type="submit"
        disabled={mutation.isPending || !date}
        className="btn-primary w-full"
      >
        {mutation.isPending ? "Reserving…" : `Reserve for $${total}`}
      </button>
    </form>
  );
}
