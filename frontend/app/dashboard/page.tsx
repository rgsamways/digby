"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";
import type { Booking } from "@/lib/types";
import { Calendar, MapPin, Plus } from "lucide-react";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ["operator-bookings"],
    queryFn: () => api.get("/api/bookings/operator", { auth: true }),
    enabled: user?.role === "operator",
  });

  const confirmed = bookings.filter((b) => b.status === "confirmed");
  const pending = bookings.filter((b) => b.status === "pending");
  const revenue = confirmed.reduce((sum, b) => sum + b.total_amount, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Welcome back, {user?.name}</h1>
          <p className="text-stone-500">Operator dashboard</p>
        </div>
        <Link href="/dashboard/sites/new" className="btn-primary gap-2">
          <Plus className="h-4 w-4" /> Add site
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        {[
          { label: "Confirmed bookings", value: confirmed.length },
          { label: "Pending bookings", value: pending.length },
          { label: "Total revenue (CAD)", value: `$${revenue.toFixed(2)}` },
        ].map(({ label, value }) => (
          <div key={label} className="card p-5">
            <p className="text-sm text-stone-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-stone-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="card divide-y divide-stone-100">
        <div className="px-5 py-4 font-semibold text-stone-800">Recent bookings</div>
        {bookings.length === 0 ? (
          <p className="px-5 py-8 text-center text-stone-500">No bookings yet.</p>
        ) : (
          bookings.slice(0, 10).map((b) => (
            <div key={b.id} className="flex items-center gap-4 px-5 py-4">
              <Calendar className="h-5 w-5 flex-shrink-0 text-stone-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-800">
                  {new Date(b.date).toLocaleDateString("en-CA")}
                </p>
                <p className="text-xs text-stone-500">Party of {b.party_size}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">${b.total_amount.toFixed(2)}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    b.status === "confirmed"
                      ? "bg-green-100 text-green-700"
                      : b.status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {b.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6">
        <Link href="/dashboard/sites" className="text-sm font-medium text-brand-600 hover:underline">
          Manage my sites →
        </Link>
      </div>
    </div>
  );
}
