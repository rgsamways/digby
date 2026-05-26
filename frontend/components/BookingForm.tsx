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
import Link from "next/link";
import { GraduationCap, FileText, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import type { Site } from "@/lib/types";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

const GRADE_LEVELS = [
  { value: "primary", label: "Primary (K–3)" },
  { value: "junior", label: "Junior (4–6)" },
  { value: "intermediate", label: "Intermediate (7–8)" },
  { value: "secondary-lower", label: "Secondary (9–10)" },
  { value: "secondary-upper", label: "Secondary (11–12)" },
  { value: "post-secondary", label: "Post-secondary" },
  { value: "adult", label: "Adult education" },
];

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

  // Educator / field trip state
  const [isEducatorMode, setIsEducatorMode] = useState(false);
  const [institution, setInstitution] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [invoiceRequested, setInvoiceRequested] = useState(false);
  const [waiverAcknowledged, setWaiverAcknowledged] = useState(false);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [invoiceSubmitted, setInvoiceSubmitted] = useState(false);

  const isEducator = !!(user?.roles?.includes("educator") || user?.email_flags?.includes("school_board") || user?.email_flags?.includes("university"));
  const showEducatorSection = isEducatorMode || isEducator || partySize > 6;
  const needsWaiver = partySize > 6 || showEducatorSection;

  const total = (site.price_per_person * partySize).toFixed(2);
  const perPerson = site.price_per_person.toFixed(2);

  const mutation = useMutation({
    mutationFn: () =>
      api.post<{ booking_id: string; client_secret: string | null; invoice_requested: boolean }>(
        "/api/bookings",
        {
          site_id: site.id,
          date: new Date(date).toISOString(),
          party_size: partySize,
          is_group_booking: isGroup || showEducatorSection,
          group_members: isGroup
            ? members.filter((m) => m.name && m.email).map((m) => ({
                name: m.name,
                email: m.email,
                amount_owed: site.price_per_person,
                paid: false,
              }))
            : [],
          is_educator_booking: showEducatorSection,
          educator_institution: showEducatorSection ? institution : undefined,
          educator_grade_level: showEducatorSection ? gradeLevel : undefined,
          po_number: poNumber || undefined,
          invoice_requested: invoiceRequested,
          group_waiver_acknowledged: needsWaiver ? waiverAcknowledged : false,
        },
        { auth: true }
      ),
    onSuccess: (data) => {
      if (data.invoice_requested || !data.client_secret) {
        setInvoiceSubmitted(true);
        setBookingId(data.booking_id);
      } else {
        setClientSecret(data.client_secret);
        setBookingId(data.booking_id);
      }
    },
  });

  function addMember() {
    setMembers((m) => [...m, { name: "", email: "" }]);
  }

  function updateMember(i: number, field: keyof GroupMember, value: string) {
    setMembers((m) => m.map((mem, idx) => (idx === i ? { ...mem, [field]: value } : mem)));
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

  // ── Invoice submitted state ──────────────────────────────────────────────
  if (invoiceSubmitted) {
    return (
      <div className="space-y-4 text-center">
        <CheckCircle className="mx-auto h-10 w-10 text-green-500" />
        <div>
          <p className="font-semibold text-stone-900">Field trip request submitted</p>
          <p className="mt-1 text-sm text-stone-500">
            The site operator will contact you within 2 business days with an invoice.
          </p>
          {poNumber && (
            <p className="mt-1 text-xs text-stone-400">PO reference: {poNumber}</p>
          )}
        </div>
        <Link href="/bookings" className="block text-sm font-medium text-brand-600 hover:underline">
          View my bookings →
        </Link>
      </div>
    );
  }

  // ── Stripe payment state ──────────────────────────────────────────────────
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
          {showEducatorSection && institution && (
            <p className="mt-1 text-xs text-stone-400">Field trip — {institution}</p>
          )}
          {isGroup && (
            <p className="mt-1 text-xs text-stone-400">Group booking — leader pays full amount</p>
          )}
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

  // ── Booking form ──────────────────────────────────────────────────────────
  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
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

      {/* Group member toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="group"
          checked={isGroup}
          onChange={(e) => setIsGroup(e.target.checked)}
          className="h-4 w-4 rounded border-stone-300 accent-brand-600"
        />
        <label htmlFor="group" className="text-sm text-stone-700">
          Group booking (add member details)
        </label>
      </div>

      {isGroup && (
        <div className="space-y-2 rounded-lg border border-stone-200 p-3">
          <p className="text-xs font-medium text-stone-600">Group members</p>
          {members.map((m, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                placeholder="Name"
                value={m.name}
                onChange={(e) => updateMember(i, "name", e.target.value)}
                className="input flex-1"
              />
              <input
                type="email"
                placeholder="Email"
                value={m.email}
                onChange={(e) => updateMember(i, "email", e.target.value)}
                className="input flex-1"
              />
              {members.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMember(i)}
                  className="text-xs text-stone-400 hover:text-red-500"
                >✕</button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addMember}
            className="text-xs font-medium text-brand-600 hover:underline"
          >+ Add member</button>
        </div>
      )}

      {/* Educator / field trip trigger (only show if not auto-detected) */}
      {!isEducator && partySize <= 6 && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="educator"
            checked={isEducatorMode}
            onChange={(e) => setIsEducatorMode(e.target.checked)}
            className="h-4 w-4 rounded border-stone-300 accent-brand-600"
          />
          <label htmlFor="educator" className="text-sm text-stone-700">
            Planning a school or group field trip
          </label>
        </div>
      )}

      {/* Educator section */}
      {showEducatorSection && (
        <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-semibold text-amber-900">
              {isEducator || isEducatorMode ? "Field trip booking" : "Large group booking"}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-amber-900">
              School / institution {isEducator ? "" : "(optional)"}
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              required={isEducator || isEducatorMode}
              className="input text-sm"
              placeholder="e.g. Westview Public School"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-amber-900">Grade level</label>
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              required={isEducator || isEducatorMode}
              className="input text-sm"
            >
              <option value="">Select…</option>
              {GRADE_LEVELS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-amber-900">
              PO number <span className="font-normal text-amber-700">(optional)</span>
            </label>
            <input
              type="text"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              className="input text-sm"
              placeholder="e.g. PO-2026-0042"
            />
          </div>

          {/* Invoice option */}
          <div className="flex items-start gap-2 rounded-lg bg-white p-3">
            <input
              type="checkbox"
              id="invoice"
              checked={invoiceRequested}
              onChange={(e) => setInvoiceRequested(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-stone-300 accent-brand-600"
            />
            <div>
              <label htmlFor="invoice" className="text-sm font-medium text-stone-800 cursor-pointer">
                <FileText className="inline h-3.5 w-3.5 mr-1 text-stone-400" />
                Request an invoice instead of paying by card
              </label>
              <p className="mt-0.5 text-xs text-stone-500">
                The operator will send an invoice within 2 business days. Booking held pending payment.
              </p>
            </div>
          </div>

          {/* Curriculum docs link */}
          <p className="text-xs text-amber-700">
            <Link href="/educators" className="font-medium underline" target="_blank">
              Curriculum alignment notes
            </Link>
            {" "}— how dig sites connect to Ontario science expectations.
          </p>
        </div>
      )}

      {/* Group waiver acknowledgment */}
      {needsWaiver && (
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="waiver"
            checked={waiverAcknowledged}
            onChange={(e) => setWaiverAcknowledged(e.target.checked)}
            required
            className="mt-0.5 h-4 w-4 rounded border-stone-300 accent-brand-600"
          />
          <label htmlFor="waiver" className="text-xs text-stone-600">
            I acknowledge that all participants in my group are bound by the site&rsquo;s
            visitor waiver, and I accept responsibility as group leader.
          </label>
        </div>
      )}

      {/* Price summary */}
      <div className="rounded-lg bg-stone-50 p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-stone-600">${perPerson} × {partySize}</span>
          <span className="font-semibold">${total} CAD</span>
        </div>
        {invoiceRequested ? (
          <p className="mt-1 text-xs text-stone-400">Invoice will be sent to your email</p>
        ) : (
          <p className="mt-1 text-xs text-stone-400">12% platform fee included</p>
        )}
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>
      )}

      <button
        type="submit"
        disabled={mutation.isPending || !date || (needsWaiver && !waiverAcknowledged)}
        className="btn-primary w-full"
      >
        {mutation.isPending
          ? "Submitting…"
          : invoiceRequested
          ? "Submit field trip request"
          : `Reserve for $${total}`}
      </button>
    </form>
  );
}
