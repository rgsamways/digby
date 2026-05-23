"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Check, Star } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const PROVINCES = ["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"];

const TIERS = [
  {
    id: "discoverer",
    name: "Discoverer",
    monthly: 39,
    annual: Math.round(39 * 12 * 0.9),
    highlights: ["2 specimens", "Field card", "Formation map", "Collector card"],
    shipping: "Free shipping in Ontario",
  },
  {
    id: "collector",
    name: "Collector",
    monthly: 59,
    annual: Math.round(59 * 12 * 0.9),
    highlights: ["3 specimens", "Field card", "Formation map", "Collector card", "Extended booklet"],
    shipping: "Free shipping Canada-wide",
    recommended: true,
  },
  {
    id: "geologist",
    name: "Geologist",
    monthly: 89,
    annual: Math.round(89 * 12 * 0.9),
    highlights: ["4 specimens (one rare)", "Full booklet", "Field card + map", "Gear item", "Priority specimen drop access"],
    shipping: "Free shipping Canada-wide + US",
  },
];

function PaymentStep({
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
      confirmParams: { return_url: window.location.origin + "/strata/my" },
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
        {paying ? "Processing…" : "Start subscription"}
      </button>
    </form>
  );
}

export default function StrataPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [selectedTier, setSelectedTier] = useState("collector");
  const [frequency, setFrequency] = useState<"monthly" | "annual">("monthly");
  const [stage, setStage] = useState<"tiers" | "address" | "payment">("tiers");
  const [clientSecret, setClientSecret] = useState("");
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

  const tier = TIERS.find((t) => t.id === selectedTier)!;
  const price = frequency === "annual" ? tier.annual : tier.monthly * 12;
  const monthlyEquiv = frequency === "annual" ? Math.round(tier.annual / 12) : tier.monthly;

  async function handleAddressSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      router.push("/login?redirect=/strata");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await api.post(
        "/api/strata/subscribe",
        { tier: selectedTier, billing_frequency: frequency, shipping_address: address },
        { auth: true }
      ) as { client_secret: string };
      setClientSecret(result.client_secret);
      setStage("payment");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero */}
      <div className="relative overflow-hidden bg-stone-900 px-6 py-20 text-center text-white mb-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(202,138,4,0.2),_transparent_60%)]" />
        <div className="relative">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-brand-400">Digby Strata</p>
          <h1 className="font-display mb-5 text-5xl text-white sm:text-6xl">
            Ontario geology,<br />delivered monthly.
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-stone-300">
            Not a rock box. A time machine. Each month, a curated collection of Ontario specimens anchored
            to a real geological event — with field cards, formation maps, and site links.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link href="/strata/archive" className="text-sm font-medium text-brand-400 hover:text-brand-300">
              See past boxes →
            </Link>
          </div>
        </div>
      </div>
      <div className="px-4 pb-12">

      {stage === "tiers" && (
        <>
          {/* Billing toggle */}
          <div className="mb-8 flex justify-center">
            <div className="inline-flex rounded-xl border border-stone-200 bg-white p-1">
              {(["monthly", "annual"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={`rounded-lg px-5 py-2 text-sm font-medium transition ${
                    frequency === f
                      ? "bg-brand-600 text-white"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  {f === "monthly" ? "Monthly" : "Annual (save 10%)"}
                </button>
              ))}
            </div>
          </div>

          {/* Tier cards */}
          <div className="grid gap-6 md:grid-cols-3">
            {TIERS.map((t) => {
              const monthlyPrice = frequency === "annual"
                ? Math.round(t.annual / 12)
                : t.monthly;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTier(t.id)}
                  className={`card cursor-pointer p-6 transition ${
                    selectedTier === t.id
                      ? "ring-2 ring-brand-600"
                      : "hover:ring-1 hover:ring-stone-300"
                  } ${t.recommended ? "relative" : ""}`}
                >
                  {t.recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                        Most popular
                      </span>
                    </div>
                  )}
                  <div className="mb-4">
                    <h3 className="font-bold text-stone-900">{t.name}</h3>
                    <div className="mt-1 flex items-end gap-1">
                      <span className="text-3xl font-extrabold text-stone-900">${monthlyPrice}</span>
                      <span className="mb-1 text-stone-400">/month</span>
                    </div>
                    {frequency === "annual" && (
                      <p className="text-xs text-brand-600">${t.annual}/year billed annually</p>
                    )}
                    <p className="mt-1 text-xs text-stone-400">{t.shipping}</p>
                  </div>
                  <ul className="mb-4 space-y-1.5">
                    {t.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2 text-sm text-stone-600">
                        <Check className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                  <div className={`h-1 rounded-full ${selectedTier === t.id ? "bg-brand-600" : "bg-stone-100"}`} />
                </div>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                if (!user) router.push("/login?redirect=/strata");
                else setStage("address");
              }}
              className="btn-primary px-10 py-3 text-base"
            >
              Subscribe as {tier.name} →
            </button>
            <p className="mt-3 text-xs text-stone-400">
              Cancel anytime · No dark patterns · Ships September 2026 for founding members
            </p>
          </div>

          {/* Month 1 preview */}
          <div className="mt-16 rounded-2xl bg-stone-900 p-8 text-white">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-brand-300">Box 1 — September 2026</p>
            <h2 className="text-2xl font-bold">The Grenville Orogeny</h2>
            <p className="mt-2 text-stone-300">1 billion years ago. The continental collision that built Eastern Ontario.</p>
            <p className="mt-4 text-stone-400 text-sm">
              Specimens: sodalite, calcite, phlogopite mica — sourced from the Bancroft area.
              Field card: 400-word narrative on the Grenville Province. Formation map: Eastern Ontario geological provinces.
            </p>
          </div>
        </>
      )}

      {stage === "address" && (
        <div className="mx-auto max-w-lg">
          <h2 className="mb-6 text-xl font-bold text-stone-900">Shipping Address</h2>
          <p className="mb-6 text-sm text-stone-500">
            {tier.name} · ${monthlyEquiv}/month
            {frequency === "annual" ? ` · $${price} billed annually` : ""}
          </p>
          <form onSubmit={handleAddressSubmit} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input required className="input" value={address.name} onChange={(e) => setAddress((a) => ({ ...a, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Address line 1</label>
              <input required className="input" value={address.line1} onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))} />
            </div>
            <div>
              <label className="label">Address line 2 (optional)</label>
              <input className="input" value={address.line2} onChange={(e) => setAddress((a) => ({ ...a, line2: e.target.value }))} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label className="label">City</label>
                <input required className="input" value={address.city} onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))} />
              </div>
              <div>
                <label className="label">Province</label>
                <select className="input" value={address.province} onChange={(e) => setAddress((a) => ({ ...a, province: e.target.value }))}>
                  {PROVINCES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Postal code</label>
                <input required className="input" value={address.postal_code} onChange={(e) => setAddress((a) => ({ ...a, postal_code: e.target.value }))} />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={() => setStage("tiers")} className="btn-secondary">← Back</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? "Loading…" : "Proceed to payment →"}
              </button>
            </div>
          </form>
        </div>
      )}

      {stage === "payment" && clientSecret && (
        <div className="mx-auto max-w-lg">
          <h2 className="mb-2 text-xl font-bold text-stone-900">Payment</h2>
          <p className="mb-6 text-sm text-stone-500">
            {tier.name} · ${monthlyEquiv}/month
            {frequency === "annual" ? ` · $${price} billed annually` : ""}
          </p>
          <Elements
            stripe={stripePromise}
            options={{ clientSecret, appearance: { theme: "stripe" } }}
          >
            <PaymentStep
              clientSecret={clientSecret}
              onSuccess={() => router.push("/strata/my")}
            />
          </Elements>
        </div>
      )}
    </div>
    </div>
  );
}
