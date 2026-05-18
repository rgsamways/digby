import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function StripeCompletePage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card max-w-md w-full p-10 text-center">
        <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
        <h1 className="mb-2 text-2xl font-bold text-stone-900">Payouts enabled!</h1>
        <p className="mb-6 text-stone-600">
          Your Stripe account is connected. You'll receive payouts automatically
          after each completed booking, minus the 12% platform fee.
        </p>
        <Link href="/dashboard" className="btn-primary">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
