"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Booking, GroupMember, WaitlistEntry } from "@/lib/types";
import { BookOpen, Calendar, Users, Clock, X } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-stone-100 text-stone-500",
  completed: "bg-blue-100 text-blue-700",
};

export default function MyBookingsPage() {
  const qc = useQueryClient();
  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ["my-bookings"],
    queryFn: () => api.get("/api/bookings/my", { auth: true }),
  });

  const { data: waitlist = [] } = useQuery<WaitlistEntry[]>({
    queryKey: ["my-waitlist"],
    queryFn: () => api.get("/api/waitlist/my", { auth: true }),
  });

  const leaveWaitlist = useMutation({
    mutationFn: (entryId: string) => api.del(`/api/waitlist/${entryId}`, { auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-waitlist"] }),
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">My bookings</h1>
        <Link href="/sites" className="btn-secondary text-sm">
          Find more sites
        </Link>
      </div>

      {waitlist.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-stone-700">
            <Clock className="h-4 w-4" /> Waitlist
          </h2>
          <div className="space-y-2">
            {waitlist.map((w) => (
              <div key={w.id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-stone-800">{w.site_name}</p>
                  <p className="text-xs text-stone-400">
                    {new Date(w.date).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                    {w.notified_at && " · Notified!"}
                  </p>
                </div>
                <button
                  onClick={() => leaveWaitlist.mutate(w.id)}
                  disabled={leaveWaitlist.isPending}
                  className="flex items-center gap-1 text-xs text-stone-400 hover:text-red-500"
                >
                  <X className="h-3.5 w-3.5" /> Leave
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-stone-500">Loading…</p>
      ) : bookings.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="mb-4 text-stone-500">You haven't made any bookings yet.</p>
          <Link href="/sites" className="btn-primary">Browse sites</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="card">
              <div className="flex items-center gap-4 px-5 py-4">
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
                  <p className="text-sm text-stone-500">
                    Party of {b.party_size}
                    {b.is_group_booking && ` · ${(b.group_members?.length ?? 0)} member${b.group_members?.length === 1 ? "" : "s"}`}
                  </p>
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

              {b.status === "completed" && (
                <div className="border-t border-stone-100 px-5 py-3">
                  <Link href={`/diary/new?booking=${b.id}`} className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline">
                    <BookOpen className="h-4 w-4" />
                    Write a field journal entry
                  </Link>
                </div>
              )}

              {b.status !== "cancelled" && b.status !== "completed" && (
                <div className="border-t border-stone-100 px-5 py-3">
                  <button
                    onClick={() => setEditingId(editingId === b.id ? null : b.id)}
                    className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
                  >
                    <Users className="h-4 w-4" />
                    {editingId === b.id ? "Hide members" : b.is_group_booking ? "Edit members" : "Add group members"}
                  </button>
                  {editingId === b.id && (
                    <MemberEditor
                      booking={b}
                      onSaved={() => {
                        qc.invalidateQueries({ queryKey: ["my-bookings"] });
                        setEditingId(null);
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MemberEditor({ booking, onSaved }: { booking: Booking; onSaved: () => void }) {
  const perPerson = booking.total_amount / booking.party_size;
  const [members, setMembers] = useState<GroupMember[]>(
    booking.group_members?.length
      ? booking.group_members
      : [{ name: "", email: "", amount_owed: perPerson, paid: false }]
  );

  const save = useMutation({
    mutationFn: (data: GroupMember[]) =>
      api.patch(`/api/bookings/${booking.id}/members`, { group_members: data }, { auth: true }),
    onSuccess: onSaved,
  });

  function update(i: number, field: keyof GroupMember, value: string | boolean | number) {
    setMembers((m) => m.map((mem, idx) => (idx === i ? { ...mem, [field]: value } : mem)));
  }

  return (
    <div className="mt-3 space-y-2 rounded-lg bg-stone-50 p-3">
      {members.map((m, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Name"
            value={m.name}
            onChange={(e) => update(i, "name", e.target.value)}
            className="input flex-1 min-w-[140px]"
          />
          <input
            type="email"
            placeholder="Email"
            value={m.email}
            onChange={(e) => update(i, "email", e.target.value)}
            className="input flex-1 min-w-[180px]"
          />
          <label className="flex items-center gap-1 text-xs text-stone-600">
            <input
              type="checkbox"
              checked={m.paid}
              onChange={(e) => update(i, "paid", e.target.checked)}
              className="h-3.5 w-3.5 accent-brand-600"
            />
            paid
          </label>
          <button
            type="button"
            onClick={() => setMembers((mm) => mm.filter((_, idx) => idx !== i))}
            className="text-xs text-stone-400 hover:text-red-500"
          >
            ✕
          </button>
        </div>
      ))}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => setMembers((m) => [...m, { name: "", email: "", amount_owed: perPerson, paid: false }])}
          className="text-xs font-medium text-brand-600 hover:underline"
        >
          + Add member
        </button>
        <button
          type="button"
          onClick={() => save.mutate(members.filter((m) => m.name && m.email))}
          disabled={save.isPending}
          className="btn-primary text-xs"
        >
          {save.isPending ? "Saving…" : "Save members"}
        </button>
      </div>
      {save.isError && (
        <p className="text-xs text-red-600">{(save.error as Error).message}</p>
      )}
    </div>
  );
}
