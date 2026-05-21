"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dices, Sparkles, MapPin, Gem } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

const PROVINCES = [
  "Ontario", "British Columbia", "Quebec", "Alberta",
  "Nova Scotia", "New Brunswick", "Manitoba", "Saskatchewan",
];

const POPULAR_MINERALS = [
  "Amethyst", "Fluorite", "Calcite", "Pyrite", "Quartz",
  "Garnet", "Agate", "Mica", "Feldspar", "Hematite",
];

interface MysteryResult {
  booking_id: string;
  client_secret: string;
  total_amount: number;
}

function CheckoutForm({ result, province, onSuccess }: {
  result: MysteryResult;
  province: string;
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
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });
    if (stripeError) {
      setError(stripeError.message ?? "Payment failed");
      setPaying(false);
    } else {
      onSuccess();
    }
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
        <div className="flex items-center gap-2">
          <Dices className="h-5 w-5 text-brand-600" />
          <div>
            <p className="font-semibold text-stone-800">Mystery Site in {province}</p>
            <p className="text-sm text-stone-500">Site revealed after booking · ${result.total_amount.toFixed(2)} CAD</p>
          </div>
        </div>
      </div>
      <PaymentElement />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={paying || !stripe} className="btn-primary w-full">
        {paying ? "Processing…" : `Pay $${result.total_amount.toFixed(2)} — Reveal My Site`}
      </button>
    </form>
  );
}

export default function MysteryPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [province, setProvince] = useState("Ontario");
  const [mineral, setMineral] = useState("Amethyst");
  const [customMineral, setCustomMineral] = useState("");
  const [date, setDate] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<MysteryResult | null>(null);
  const [paid, setPaid] = useState(false);

  const chosenMineral = mineral === "__custom" ? customMineral : mineral;

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { router.push("/login"); return; }
    setLoading(true);
    setError("");
    try {
      const data = await api.post<MysteryResult>(
        "/api/bookings/mystery",
        { date: new Date(date).toISOString(), province, mineral: chosenMineral, party_size: partySize },
        { auth: true },
      );
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No mystery sites available");
    } finally {
      setLoading(false);
    }
  }

  if (paid) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="card max-w-md w-full p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-4xl">
            🪨
          </div>
          <h1 className="mb-2 text-2xl font-bold text-stone-900">Your mystery site is booked!</h1>
          <p className="mb-6 text-stone-500">
            Head to My Bookings to see where your adventure begins.
          </p>
          <button onClick={() => router.push("/bookings")} className="btn-primary w-full">
            Reveal my site →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-3xl">
          🎲
        </div>
        <h1 className="text-2xl font-extrabold text-stone-900">Mystery Dig</h1>
        <p className="mt-1 text-stone-500">
          Pick a date and mineral interest. We&apos;ll assign you a surprise site — revealed only after you book.
        </p>
      </div>

      {!result ? (
        <form onSubmit={handleSearch} className="card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Province</label>
              <select value={province} onChange={(e) => setProvince(e.target.value)} className="input">
                {PROVINCES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Party size</label>
              <input type="number" value={partySize} onChange={(e) => setPartySize(Number(e.target.value))}
                min={1} max={20} className="input" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required
              min={new Date().toISOString().split("T")[0]} className="input" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">Mineral interest</label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_MINERALS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMineral(m)}
                  className={`flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-medium transition ${
                    mineral === m
                      ? "border-brand-500 bg-brand-100 text-brand-700"
                      : "border-stone-200 text-stone-600 hover:border-brand-300"
                  }`}
                >
                  <Gem className="h-3 w-3" /> {m}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setMineral("__custom")}
                className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                  mineral === "__custom"
                    ? "border-brand-500 bg-brand-100 text-brand-700"
                    : "border-stone-200 text-stone-600 hover:border-brand-300"
                }`}
              >
                Other…
              </button>
            </div>
            {mineral === "__custom" && (
              <input
                type="text"
                value={customMineral}
                onChange={(e) => setCustomMineral(e.target.value)}
                placeholder="e.g. Sodalite"
                className="input mt-2"
              />
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading || !date || (mineral === "__custom" && !customMineral)}
            className="btn-primary w-full gap-2">
            {loading ? (
              "Finding your mystery site…"
            ) : (
              <><Sparkles className="h-4 w-4" /> Find My Mystery Site</>
            )}
          </button>

          <p className="text-center text-xs text-stone-400">
            <MapPin className="inline h-3 w-3" /> Site name revealed after payment
          </p>
        </form>
      ) : (
        <div className="card p-6">
          <Elements
            stripe={stripePromise}
            options={{ clientSecret: result.client_secret, appearance: { theme: "stripe" } }}
          >
            <CheckoutForm result={result} province={province} onSuccess={() => setPaid(true)} />
          </Elements>
          <button
            onClick={() => setResult(null)}
            className="mt-3 w-full text-sm text-stone-400 hover:text-stone-600"
          >
            ← Try different criteria
          </button>
        </div>
      )}
    </div>
  );
}
