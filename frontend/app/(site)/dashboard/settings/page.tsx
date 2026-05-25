"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CheckCircle, CreditCard, User, Bell, MapPin, ChevronRight } from "lucide-react";
import type { Site } from "@/lib/types";

type Tab = "profile" | "payments" | "sites" | "notifications";

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("payments");
  const isOperator = user?.role === "operator" || user?.role === "admin";

  type MeData = {
    id: string; email: string; name: string; role: string;
    stripe_account_id?: string; stripe_account_enabled?: boolean;
    bio?: string; phone?: string;
  };

  const { data: me } = useQuery<MeData>({
    queryKey: ["me"],
    queryFn: () => api.get("/api/auth/me", { auth: true }),
    enabled: !!user,
  });

  const { data: mySites = [] } = useQuery<Site[]>({
    queryKey: ["operator-sites"],
    queryFn: () => api.get("/api/sites/my", { auth: true }),
    enabled: isOperator,
  });

  const connectStripe = useMutation({
    mutationFn: () => api.post<{ url: string }>("/api/payments/connect/onboard", {}, { auth: true }),
    onSuccess: (data) => { window.location.href = data.url; },
  });

  const [profileForm, setProfileForm] = useState({ name: "", bio: "", phone: "" });
  const [profileInit, setProfileInit] = useState(false);
  if (me && !profileInit) {
    setProfileForm({ name: me.name ?? "", bio: me.bio ?? "", phone: me.phone ?? "" });
    setProfileInit(true);
  }

  const updateProfile = useMutation({
    mutationFn: (data: object) => api.patch("/api/auth/me", data, { auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "payments", label: "Payments", icon: <CreditCard className="h-4 w-4" /> },
    { id: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
    { id: "sites", label: "Sites", icon: <MapPin className="h-4 w-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 pb-24 md:pb-8">
      <div>
        <h1 className="font-display text-2xl text-stone-900">Settings</h1>
        <p className="mt-0.5 text-sm text-stone-400">Manage your account, payments, and site preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-stone-200 bg-stone-100 p-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium transition-colors",
              tab === t.id ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
            )}>
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Payments */}
      {tab === "payments" && (
        <div className="space-y-4">
          {/* Stripe status */}
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-stone-800">Stripe Connect</p>
                <p className="mt-0.5 text-xs text-stone-500">Digby sends 88% of every booking to your Stripe account</p>
              </div>
              {me?.stripe_account_enabled ? (
                <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                  <CheckCircle className="h-4 w-4" /> Connected
                </span>
              ) : (
                <button onClick={() => connectStripe.mutate()} disabled={connectStripe.isPending}
                  className="btn-primary text-sm py-1.5">
                  {connectStripe.isPending ? "Redirecting…" : me?.stripe_account_id ? "Complete setup" : "Connect Stripe"}
                </button>
              )}
            </div>
            {me?.stripe_account_id && (
              <p className="mt-3 text-xs text-stone-400">Account ID: {me.stripe_account_id}</p>
            )}
          </div>

          {/* Payout details */}
          <div className="card divide-y divide-stone-100">
            <div className="px-5 py-4">
              <p className="text-sm font-semibold text-stone-800">Payout schedule</p>
            </div>
            {[
              { label: "Schedule", value: "Bi-weekly (every other Friday)" },
              { label: "Platform fee", value: "12% to Digby · 88% to you" },
              { label: "Currency", value: "CAD" },
              { label: "Minimum payout", value: "$10.00 CAD" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-5 py-3">
                <p className="text-sm text-stone-500">{label}</p>
                <p className="text-sm font-medium text-stone-800">{value}</p>
              </div>
            ))}
          </div>

          {/* Stripe dashboard link */}
          {me?.stripe_account_enabled && (
            <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer"
              className="card flex items-center justify-between p-4 hover:bg-stone-50 transition-colors">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-stone-400" />
                <div>
                  <p className="text-sm font-medium text-stone-800">View Stripe dashboard</p>
                  <p className="text-xs text-stone-400">Payout history, bank details, tax documents</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-stone-300" />
            </a>
          )}
        </div>
      )}

      {/* Profile */}
      {tab === "profile" && (
        <div className="space-y-4">
          <div className="card p-5">
            <p className="mb-4 text-sm font-semibold text-stone-800">Your operator profile</p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-500">Display name</label>
                <input type="text" value={profileForm.name}
                  onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-500">Bio</label>
                <textarea rows={3} value={profileForm.bio} placeholder="Tell visitors about your site and your background…"
                  onChange={(e) => setProfileForm((f) => ({ ...f, bio: e.target.value }))} className="input resize-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-500">Phone (optional, not public)</label>
                <input type="tel" value={profileForm.phone}
                  onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-500">Email</label>
                <input type="email" value={me?.email ?? ""} readOnly className="input bg-stone-50 text-stone-400" />
              </div>
            </div>
            <button
              onClick={() => updateProfile.mutate({ name: profileForm.name, bio: profileForm.bio, phone: profileForm.phone })}
              disabled={updateProfile.isPending}
              className="btn-primary mt-4 text-sm"
            >
              {updateProfile.isPending ? "Saving…" : "Save changes"}
            </button>
            {updateProfile.isSuccess && <p className="mt-2 text-xs text-green-600">Profile updated.</p>}
          </div>
        </div>
      )}

      {/* Sites */}
      {tab === "sites" && (
        <div className="space-y-3">
          {mySites.length === 0 ? (
            <div className="card px-5 py-12 text-center">
              <MapPin className="mx-auto mb-3 h-8 w-8 text-stone-200" />
              <p className="text-sm text-stone-400">No sites yet.</p>
            </div>
          ) : (
            mySites.map((s) => (
              <div key={s.id} className="card flex items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-stone-900">{s.name}</p>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      s.is_active ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"
                    )}>
                      {s.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">{s.address}</p>
                  <p className="text-xs text-stone-400">${s.price_per_person}/person · max {s.max_group_size}</p>
                </div>
                <a href="/dashboard/sites" className="shrink-0 text-xs font-medium text-brand-600 hover:underline">Edit →</a>
              </div>
            ))
          )}
          <a href="/dashboard/sites/new" className="card flex items-center justify-center gap-2 p-4 text-sm font-medium text-stone-500 hover:text-brand-600 hover:border-brand-200 transition-colors">
            + Add a new site
          </a>
        </div>
      )}

      {/* Notifications */}
      {tab === "notifications" && (
        <div className="card divide-y divide-stone-100">
          <div className="px-5 py-4">
            <p className="text-sm font-semibold text-stone-800">Email notifications</p>
            <p className="mt-0.5 text-xs text-stone-400">Manage what Digby sends to {me?.email}</p>
          </div>
          {[
            { label: "New booking", desc: "When a visitor books one of your sites", enabled: true },
            { label: "Booking cancelled", desc: "When a confirmed booking is cancelled", enabled: true },
            { label: "New visitor question", desc: "When someone asks a question on your site listing", enabled: true },
            { label: "Weather alert reminders", desc: "Reminders to clear alerts after weather passes", enabled: false },
            { label: "Digby updates", desc: "Product news, feature launches, and operator announcements", enabled: true },
            { label: "Payout confirmations", desc: "When a payout is processed to your Stripe account", enabled: true },
          ].map(({ label, desc, enabled }) => (
            <div key={label} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium text-stone-800">{label}</p>
                <p className="text-xs text-stone-400">{desc}</p>
              </div>
              <button className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                enabled ? "bg-brand-600" : "bg-stone-200"
              )}>
                <span className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
                  enabled ? "left-5.5 translate-x-0.5" : "left-0.5"
                )} />
              </button>
            </div>
          ))}
          <div className="px-5 py-4">
            <p className="text-xs text-stone-400">Notification preferences — fully configurable — shipping soon.</p>
          </div>
        </div>
      )}
    </div>
  );
}
