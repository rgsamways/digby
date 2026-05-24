"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { ArrowLeft, CheckCircle, Clock, MapPin, X } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { DropPiece, SpecimenDrop } from "@/lib/types";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function useCountdown(target: string) {
  const [diff, setDiff] = useState(() => Math.max(0, new Date(target).getTime() - Date.now()));
  useEffect(() => {
    const id = setInterval(() => {
      setDiff(Math.max(0, new Date(target).getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [target]);
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  return { diff, d, h, m, s };
}

function CountdownBlock({ target, label }: { target: string; label: string }) {
  const { diff, d, h, m, s } = useCountdown(target);
  if (diff === 0) return null;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-3 font-mono text-3xl font-bold text-stone-900">
        {d > 0 && <><span>{d}</span><span className="text-stone-300">d</span></>}
        <span>{String(h).padStart(2, "0")}</span>
        <span className="text-stone-300">:</span>
        <span>{String(m).padStart(2, "0")}</span>
        <span className="text-stone-300">:</span>
        <span>{String(s).padStart(2, "0")}</span>
      </div>
      <p className="text-xs text-stone-400 uppercase tracking-widest">{label}</p>
    </div>
  );
}

// ── Stripe pay form ──────────────────────────────────────────────────────────

function DropPayForm({ onSuccess }: { onSuccess: () => void }) {
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
      confirmParams: { return_url: window.location.href },
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
        {paying ? "Processing…" : "Complete Purchase"}
      </button>
    </form>
  );
}

// ── Buy modal ────────────────────────────────────────────────────────────────

type ModalStep = "city" | "payment" | "success";

function BuyModal({
  drop,
  piece,
  onClose,
}: {
  drop: SpecimenDrop;
  piece: DropPiece;
  onClose: (purchased: boolean) => void;
}) {
  const [step, setStep] = useState<ModalStep>("city");
  const [buyerCity, setBuyerCity] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleProceed() {
    setLoading(true);
    setError("");
    try {
      const data = await api.post(
        `/api/drops/${drop.slug}/pieces/${piece.id}/purchase`,
        { buyer_city: buyerCity },
      ) as { client_secret: string };
      setClientSecret(data.client_secret);
      setStep("payment");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to initialize payment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl text-stone-900">{piece.mineral_name}</h2>
            {piece.formation && <p className="text-sm text-stone-500">{piece.formation}</p>}
          </div>
          <button onClick={() => onClose(false)} className="text-stone-400 hover:text-stone-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === "city" && (
          <div className="space-y-4">
            {piece.photo_url && (
              <img src={piece.photo_url} alt={piece.mineral_name}
                className="w-full aspect-square object-cover rounded-xl" />
            )}
            {piece.description && (
              <p className="text-sm text-stone-600">{piece.description}</p>
            )}
            <div className="rounded-xl bg-stone-50 p-4 flex items-center justify-between">
              <span className="text-sm text-stone-600">Price</span>
              <span className="font-bold text-stone-900">${piece.price_cad.toFixed(2)} CAD</span>
            </div>
            <div>
              <label className="form-label">Your city (shown on the drop page, optional)</label>
              <input
                className="input"
                value={buyerCity}
                onChange={(e) => setBuyerCity(e.target.value)}
                placeholder="e.g. Toronto"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              onClick={handleProceed}
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? "Loading…" : `Proceed to payment · $${piece.price_cad.toFixed(2)}`}
            </button>
          </div>
        )}

        {step === "payment" && clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <DropPayForm onSuccess={() => setStep("success")} />
          </Elements>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <CheckCircle className="h-14 w-14 text-green-500" />
            <h3 className="font-display text-xl text-stone-900">Payment complete</h3>
            <p className="text-sm text-stone-500">
              Your <strong>{piece.mineral_name}</strong> specimen has found a new home.
              We&apos;ll be in touch with shipping details.
            </p>
            <button onClick={() => onClose(true)} className="btn-secondary">
              Back to drop
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Piece card ───────────────────────────────────────────────────────────────

function PieceCard({
  piece,
  dropActive,
  onBuy,
}: {
  piece: DropPiece;
  dropActive: boolean;
  onBuy: () => void;
}) {
  return (
    <div className={`rounded-xl border overflow-hidden ${
      piece.status === "sold" ? "border-stone-100 opacity-60" : "border-stone-200"
    }`}>
      <div className="aspect-square bg-stone-100 overflow-hidden">
        {piece.photo_url ? (
          <img src={piece.photo_url} alt={piece.mineral_name}
            className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-stone-300 text-4xl">💎</div>
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-stone-900 text-sm capitalize">{piece.mineral_name}</p>
        {piece.formation && <p className="text-xs text-stone-500 mt-0.5">{piece.formation}</p>}
        {piece.description && (
          <p className="text-xs text-stone-500 mt-1 line-clamp-2">{piece.description}</p>
        )}
        <div className="mt-2 flex items-center justify-between">
          <span className="font-bold text-stone-900">${piece.price_cad.toFixed(2)}</span>
          {piece.status === "available" && dropActive && (
            <button onClick={onBuy} className="rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-700 transition">
              Buy
            </button>
          )}
          {piece.status === "reserved" && (
            <span className="text-xs text-stone-400">Reserved</span>
          )}
          {piece.status === "sold" && (
            <span className="flex items-center gap-1 text-xs text-stone-400">
              <MapPin className="h-3 w-3" />
              {piece.buyer_city ? `${piece.buyer_city}` : "Found a home"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Notification form ────────────────────────────────────────────────────────

function NotifyForm({ slug }: { slug: string }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/api/drops/${slug}/notify`, { email });
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  if (done) return (
    <p className="text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3 border border-green-100">
      You&apos;re on the list. We&apos;ll email you when this drop goes live.
    </p>
  );

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        required
        className="input flex-1"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit" disabled={loading} className="btn-primary shrink-0">
        {loading ? "…" : "Notify me"}
      </button>
    </form>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DropDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const qc = useQueryClient();
  const [buyingPiece, setBuyingPiece] = useState<DropPiece | null>(null);

  const { data: drop, isLoading } = useQuery<SpecimenDrop>({
    queryKey: ["drop", slug],
    queryFn: () => api.get(`/api/drops/${slug}`),
  });

  if (isLoading) return (
    <div className="flex flex-1 items-center justify-center text-stone-400">Loading…</div>
  );

  if (!drop) return (
    <div className="flex flex-1 items-center justify-center text-stone-400">Drop not found.</div>
  );

  const isActive = drop.status === "active";
  const isUpcoming = drop.status === "upcoming";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/drops" className="mb-6 inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800">
        <ArrowLeft className="h-4 w-4" /> All drops
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
            Specimen Drop
          </p>
          {isActive && (
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
              Live now
            </span>
          )}
          {isUpcoming && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              Coming soon
            </span>
          )}
        </div>
        <h1 className="font-display text-4xl text-stone-900">{drop.title}</h1>
        {drop.subtitle && <p className="mt-1 text-xl text-stone-500">{drop.subtitle}</p>}
        {drop.description && (
          <p className="mt-3 max-w-2xl text-stone-600 leading-relaxed">{drop.description}</p>
        )}
      </div>

      {/* Countdown */}
      {isUpcoming && (
        <div className="mb-8 rounded-2xl border border-amber-100 bg-amber-50 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 mb-4">
            Opens in
          </p>
          <CountdownBlock target={drop.opens_at} label="until this drop goes live" />
          <div className="mt-6 max-w-sm">
            <p className="text-sm text-stone-600 mb-3">Get notified when it opens:</p>
            <NotifyForm slug={drop.slug} />
          </div>
        </div>
      )}

      {isActive && (
        <div className="mb-6 flex items-center justify-between rounded-xl bg-stone-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-stone-600">
            <Clock className="h-4 w-4 text-stone-400" />
            <span>{drop.available_count} of {drop.total_pieces} pieces available</span>
          </div>
          <CountdownBlock target={drop.closes_at} label="remaining" />
        </div>
      )}

      {/* Pieces grid */}
      {(drop.pieces.length > 0) && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {drop.pieces.map((piece) => (
            <PieceCard
              key={piece.id}
              piece={piece}
              dropActive={isActive}
              onBuy={() => setBuyingPiece(piece)}
            />
          ))}
        </div>
      )}

      {drop.status === "closed" && (
        <div className="mt-8 rounded-xl bg-stone-50 p-6 text-center">
          <p className="text-stone-500">This drop has ended.</p>
          <Link href="/drops" className="mt-2 inline-block text-sm text-brand-600 hover:underline">
            See upcoming drops →
          </Link>
        </div>
      )}

      {/* Buy modal */}
      {buyingPiece && drop && (
        <BuyModal
          drop={drop}
          piece={buyingPiece}
          onClose={(purchased) => {
            setBuyingPiece(null);
            if (purchased) qc.invalidateQueries({ queryKey: ["drop", slug] });
          }}
        />
      )}
    </div>
  );
}
