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
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import type { Site } from "@/lib/types";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

interface GroupMember {
  name: string;
  email: string;
}

function CardStep({ bookingId, total }: { bookingId: string; total: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError("");
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/bookings/${bookingId}/confirm` },
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

export function BookingForm({ site }: { site: Site }) {
  const user = useAuthStore((s) => s.user);
  const [date, setDate] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [isGroup, setIsGroup] = useState(false);
  const [members, setMembers] = useState<GroupMember[]>([{ name: "", email: "" }]);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const total = (site.price_per_person * partySize).toFixed(2);
  const perPerson = site.price_per_person.toFixed(2);

  const mutation = useMutation({
    mutationFn: () =>
      api.post<{ booking_id: string; client_secret: string }>(
        "/api/bookings",
        {
          site_id: site.id,
          date: new Date(date).toISOString(),
          party_size: partySize,
          is_group_booking: isGroup,
          group_members: isGroup
            ? members.filter((m) => m.name && m.email).map((m) => ({
                name: m.name,
                email: m.email,
                amount_owed: site.price_per_person,
                paid: false,
              }))
            : [],
        },
        { auth: true }
      ),
    onSuccess: (data) => {
      setClientSecret(data.client_secret);
      setBookingId(data.booking_id);
    },
  });

  function addMember() {
    setMembers((m) => [...m, { name: "", email: "" }]);
  }

  function updateMember(i: number, field: keyof GroupMember, value: string) {
    setMembers((m) => m.map((mem, idx) => idx === i ? { ...mem, [field]: value } : mem));
  }

  function removeMember(i: number) {
    setMembers((m) => m.filter((_, idx) => idx !== i));
  }

  if (!user) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-stone-600">Sign in to book this site.</p>
        <a href="/login" className="btn-primary block w-full text-center">Sign in</a>
      </div>
    );
  }

  if (clientSecret && bookingId) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-stone-50 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-600">
              ${perPerson} × {partySize} — {new Date(date).toLocaleDateString("en-CA")}
            </span>
            <span className="font-semibold">${total} CAD</span>
          </div>
          {isGroup && <p className="mt-1 text-xs text-stone-400">Group booking — leader pays full amount</p>}
        </div>
        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
          <CardStep bookingId={bookingId} total={total} />
        </Elements>
        <button
          onClick={() => { setClientSecret(null); setBookingId(null); }}
          className="w-full text-center text-xs text-stone-400 hover:text-stone-600"
        >
          ← Change details
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          required min={new Date().toISOString().split("T")[0]} className="input" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">
          Party size (max {site.max_group_size})
        </label>
        <input type="number" value={partySize}
          onChange={(e) => setPartySize(Math.max(1, parseInt(e.target.value)))}
          min={1} max={site.max_group_size} required className="input" />
      </div>

      {/* Group booking toggle */}
      <div className="flex items-center gap-2">
        <input type="checkbox" id="group" checked={isGroup}
          onChange={(e) => setIsGroup(e.target.checked)} className="h-4 w-4 rounded border-stone-300 accent-brand-600" />
        <label htmlFor="group" className="text-sm text-stone-700">Group booking (add member details)</label>
      </div>

      {isGroup && (
        <div className="space-y-2 rounded-lg border border-stone-200 p-3">
          <p className="text-xs font-medium text-stone-600">Group members</p>
          {members.map((m, i) => (
            <div key={i} className="flex gap-2">
              <input type="text" placeholder="Name" value={m.name}
                onChange={(e) => updateMember(i, "name", e.target.value)} className="input flex-1" />
              <input type="email" placeholder="Email" value={m.email}
                onChange={(e) => updateMember(i, "email", e.target.value)} className="input flex-1" />
              {members.length > 1 && (
                <button type="button" onClick={() => removeMember(i)}
                  className="text-xs text-stone-400 hover:text-red-500">✕</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addMember}
            className="text-xs font-medium text-brand-600 hover:underline">+ Add member</button>
        </div>
      )}

      <div className="rounded-lg bg-stone-50 p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-stone-600">${perPerson} × {partySize}</span>
          <span className="font-semibold">${total} CAD</span>
        </div>
        <p className="mt-1 text-xs text-stone-400">12% platform fee included</p>
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>
      )}

      <button type="submit" disabled={mutation.isPending || !date} className="btn-primary w-full">
        {mutation.isPending ? "Reserving…" : `Reserve for $${total}`}
      </button>
    </form>
  );
}
