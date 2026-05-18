"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Booking } from "@/lib/types";
import { Calendar, MapPin } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-stone-100 text-stone-500",
  completed: "bg-blue-100 text-blue-700",
};

export default function MyBookingsPage() {
  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ["my-bookings"],
    queryFn: () => api.get("/api/bookings/my", { auth: true }),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">My bookings</h1>
        <Link href="/sites" className="btn-secondary text-sm">
          Find more sites
        </Link>
      </div>

      {isLoading ? (
        <p className="text-stone-500">Loading…</p>
      ) : bookings.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="mb-4 text-stone-500">You haven't made any bookings yet.</p>
          <Link href="/sites" className="btn-primary">Browse sites</Link>
        </div>
      ) : (
        <div className="card divide-y divide-stone-100">
          {bookings.map((b) => (
            <div key={b.id} className="flex items-center gap-4 px-5 py-4">
              <Calendar className="h-5 w-5 shrink-0 text-stone-400" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-stone-900">
                  {new Date(b.date).toLocaleDateString("en-CA", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="text-sm text-stone-500">Party of {b.party_size}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-stone-900">
                  ${b.total_amount.toFixed(2)} CAD
                </p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[b.status] ?? ""}`}>
                  {b.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
