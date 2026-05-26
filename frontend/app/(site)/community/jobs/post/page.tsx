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
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

const JOB_TYPES = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "seasonal", label: "Seasonal" },
  { value: "volunteer", label: "Volunteer" },
];

const CATEGORIES = [
  { value: "field-technician", label: "Field Technician" },
  { value: "geologist", label: "Geologist / P.Geo" },
  { value: "lab", label: "Lab & Sample Processing" },
  { value: "prospecting", label: "Prospecting & Claims" },
  { value: "mining-ops", label: "Mining Operations" },
  { value: "environmental", label: "Environmental & Reclamation" },
  { value: "education", label: "Education & Outreach" },
  { value: "consulting", label: "Consulting" },
  { value: "other", label: "Other" },
];

function PayStep({ listingId, clientSecret }: { listingId: string; clientSecret: string }) {
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
      confirmParams: {
        return_url: `${window.location.origin}/community/jobs/${listingId}/confirm`,
      },
    });
    if (stripeError) {
      setError(stripeError.message ?? "Payment failed");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h2 className="font-display text-xl text-stone-900">Complete payment</h2>
        <p className="mt-1 text-stone-500">
          $75 CAD — your listing will go live for 30 days once payment is confirmed.
        </p>
      </div>
      <form onSubmit={handlePay} className="space-y-4">
        <div className="card p-4">
          <PaymentElement />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={!stripe || loading} className="btn-primary w-full">
          {loading ? "Processing…" : "Pay $75 CAD and publish listing"}
        </button>
      </form>
      <p className="mt-3 text-center text-xs text-stone-400">
        Listing will be reviewed for relevance. Refunds not available after publication.
      </p>
    </div>
  );
}

export default function PostJobPage() {
  const user = useAuthStore((s) => s.user);
  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    job_type: "full-time",
    category: "field-technician",
    description: "",
    salary_range: "",
    apply_url: "",
    apply_email: "",
  });
  const [listingId, setListingId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const set =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const mutation = useMutation({
    mutationFn: () =>
      api.post<{ listing_id: string; client_secret: string }>(
        "/api/jobs/",
        {
          ...form,
          salary_range: form.salary_range || undefined,
          apply_url: form.apply_url || undefined,
          apply_email: form.apply_email || undefined,
        },
        { auth: true }
      ),
    onSuccess: (data) => {
      setListingId(data.listing_id);
      setClientSecret(data.client_secret);
    },
  });

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-stone-600">Sign in to post a job listing.</p>
        <Link href="/login" className="btn-primary mt-4 inline-block">Sign in</Link>
      </div>
    );
  }

  if (clientSecret && listingId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
          <PayStep listingId={listingId} clientSecret={clientSecret} />
        </Elements>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <Link href="/community/jobs" className="text-sm text-stone-400 hover:text-stone-600">
          ← Job Board
        </Link>
        <h1 className="mt-3 font-display text-2xl text-stone-900">Post a listing</h1>
        <p className="mt-1 text-stone-500">
          $75 CAD · 30 days · Ontario geology &amp; mining audience
        </p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
        className="space-y-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Job title</label>
            <input type="text" value={form.title} onChange={set("title")} required className="input" placeholder="e.g. Field Geologist" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Company / organization</label>
            <input type="text" value={form.company} onChange={set("company")} required className="input" placeholder="e.g. Teck Resources" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Location</label>
            <input type="text" value={form.location} onChange={set("location")} required className="input" placeholder="e.g. Timmins, ON" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Salary range <span className="font-normal text-stone-400">(optional)</span></label>
            <input type="text" value={form.salary_range} onChange={set("salary_range")} className="input" placeholder="e.g. $70,000–$90,000" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Job type</label>
            <select value={form.job_type} onChange={set("job_type")} className="input">
              {JOB_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Category</label>
            <select value={form.category} onChange={set("category")} className="input">
              {CATEGORIES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Job description</label>
          <textarea value={form.description} onChange={set("description")} required rows={6} className="input" placeholder="Responsibilities, requirements, what makes this role interesting…" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">How to apply</label>
          <p className="mb-1.5 text-xs text-stone-400">Provide a URL and/or email. At least one required.</p>
          <div className="space-y-2">
            <input type="url" value={form.apply_url} onChange={set("apply_url")} className="input" placeholder="Application URL (e.g. https://yourcompany.com/careers/...)" />
            <input type="email" value={form.apply_email} onChange={set("apply_email")} className="input" placeholder="Or: applications@yourcompany.com" />
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
          <p className="font-semibold text-stone-900">$75 CAD · 30-day listing</p>
          <ul className="mt-2 space-y-1 text-stone-500">
            <li>Visible to Ontario geologists, prospectors, and field workers on Digby</li>
            <li>Featured placement available ($100 — contact us after posting)</li>
            <li>Listing reviewed for relevance before going live</li>
          </ul>
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending || (!form.apply_url && !form.apply_email)}
          className="btn-primary w-full"
        >
          {mutation.isPending ? "Creating listing…" : "Continue to payment →"}
        </button>
      </form>
    </div>
  );
}
