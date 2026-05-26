"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { CheckCircle, XCircle, Loader } from "lucide-react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

export default function JobListingConfirmPage() {
  const params = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");

  useEffect(() => {
    const clientSecret = params.get("payment_intent_client_secret");
    if (!clientSecret) { setStatus("failed"); return; }

    stripePromise.then((stripe) => {
      if (!stripe) return;
      stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
        setStatus(paymentIntent?.status === "succeeded" ? "success" : "failed");
      });
    });
  }, [params]);

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="card max-w-md w-full p-10 text-center">
        {status === "loading" && (
          <>
            <Loader className="mx-auto mb-4 h-12 w-12 animate-spin text-brand-500" />
            <p className="text-stone-600">Confirming your payment…</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
            <h1 className="mb-2 text-2xl font-bold text-stone-900">Listing submitted!</h1>
            <p className="mb-6 text-stone-600">
              Your job listing will go live within a few hours once it&apos;s been reviewed.
              You&apos;ll receive a confirmation at your email.
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/community/jobs" className="btn-primary">View the job board</Link>
              <Link href="/sites" className="btn-secondary">Back to Digby</Link>
            </div>
          </>
        )}
        {status === "failed" && (
          <>
            <XCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h1 className="mb-2 text-2xl font-bold text-stone-900">Payment failed</h1>
            <p className="mb-6 text-stone-600">
              Something went wrong. You have not been charged.
            </p>
            <Link href="/community/jobs/post" className="btn-primary">Try again</Link>
          </>
        )}
      </div>
    </div>
  );
}
