"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Booking, WeatherAlert, YieldReport, ScavengerHunt, Specimen, Site, SiteQuestion } from "@/lib/types";
import {
  Calendar, Plus, AlertTriangle, Pickaxe, CreditCard, CheckCircle, Map, ShoppingBag, Bell,
  CheckCircle2, HelpCircle, Gem, Users, Award, ChevronRight, BookOpen, Zap, TrendingUp,
  MessageSquare,
} from "lucide-react";

// ─── Visitor dashboard types ──────────────────────────────────────────────────

type PassportData = {
  stamps: Array<{ site_name: string; date: string; mineral_highlights?: string[] }>;
  points: number;
  badges: Array<{ badge_id: string; name: string; earned: boolean; earned_at?: string }>;
  citizen_science_finds: number;
};

type JuniorProfile = {
  id: string;
  name: string;
  avatar: string;
  streak: number;
  cards_count: number;
  badges_earned: number;
};

const BADGE_TIERS = [
  { label: "First Dig", threshold: 1 },
  { label: "Rock Hound", threshold: 5 },
  { label: "Gem Hunter", threshold: 10 },
  { label: "Mineral Master", threshold: 25 },
];

function nextBadge(stampCount: number) {
  return BADGE_TIERS.find((b) => b.threshold > stampCount) ?? null;
}

function daysUntil(dateStr: string) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / 86400000);
}

// ─── Visitor Dashboard ────────────────────────────────────────────────────────

function VisitorDashboard({ passport, bookings }: { passport: PassportData; bookings: Booking[] }) {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const upcomingBookings = bookings
    .filter((b) => b.status === "confirmed" && new Date(b.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const pastBookings = bookings.filter((b) => b.status === "completed");
  const stampCount = passport.stamps?.length ?? 0;
  const findCount = passport.citizen_science_finds ?? 0;

  const isNew = stampCount === 0 && upcomingBookings.length === 0 && pastBookings.length === 0;
  const hasUpcoming = !isNew && upcomingBookings.length > 0;
  const hasPastNoFinds = !isNew && !hasUpcoming && pastBookings.length > 0 && findCount === 0;
  const isActive = !isNew && !hasUpcoming && !hasPastNoFinds;

  const { data: juniorProfiles = [] } = useQuery<JuniorProfile[]>({
    queryKey: ["parent-summary"],
    queryFn: () => api.get("/api/junior/parent-summary", { auth: true }),
    enabled: isActive,
  });

  const badge = nextBadge(stampCount);

  function PassportTeaser() {
    return (
      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-brand-600" />
            <span className="text-sm font-semibold text-stone-800">Your Passport</span>
          </div>
          <Link href="/passport" className="text-xs font-medium text-brand-600 hover:underline">View →</Link>
        </div>
        <div className="mb-3 flex gap-6">
          <div>
            <p className="text-2xl font-bold text-stone-900">{passport.points}</p>
            <p className="text-xs text-stone-500">points</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-stone-900">{stampCount}</p>
            <p className="text-xs text-stone-500">stamps</p>
          </div>
        </div>
        {badge && (
          <>
            <div className="mb-1 flex justify-between text-xs text-stone-500">
              <span>{stampCount} of {badge.threshold} digs to {badge.label}</span>
              <span>{Math.round((stampCount / badge.threshold) * 100)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-stone-100">
              <div
                className="h-1.5 rounded-full bg-brand-500"
                style={{ width: `${Math.min((stampCount / badge.threshold) * 100, 100)}%` }}
              />
            </div>
          </>
        )}
      </div>
    );
  }

  // State 1 — Brand new
  if (isNew) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
        <div className="py-6 text-center">
          <h1 className="mb-3 font-display text-4xl text-stone-900">Welcome to Digby, {firstName}.</h1>
          <p className="mb-6 text-lg text-stone-500">
            Ontario&rsquo;s rockhound community. Find a site, dig something up, log what you found.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/sites" className="btn-primary">Browse Sites</Link>
            <Link href="/map" className="btn-secondary">Explore the Map</Link>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              icon: <Award className="h-6 w-6 text-brand-600" />,
              heading: "Your Digby Passport",
              body: "Every dig earns stamps and points. Track your history and climb the leaderboard.",
              href: "/passport",
            },
            {
              icon: <Gem className="h-6 w-6 text-brand-600" />,
              heading: "Log What You Find",
              body: "Photo, GPS, mineral name. Your finds can contribute to Ontario citizen science.",
              href: "/finds/new",
            },
            {
              icon: <Users className="h-6 w-6 text-brand-600" />,
              heading: "Kids Along?",
              body: "Set up junior profiles. Card collecting, detective cases, and badge hunts for young geologists.",
              href: "/junior",
            },
          ].map(({ icon, heading, body, href }) => (
            <Link key={href} href={href} className="card group p-6 transition-shadow hover:shadow-md">
              <div className="mb-3">{icon}</div>
              <h2 className="mb-1 font-semibold text-stone-900 transition-colors group-hover:text-brand-600">{heading}</h2>
              <p className="text-sm text-stone-500">{body}</p>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // State 2 — Has upcoming booking
  if (hasUpcoming) {
    const soonest = upcomingBookings[0];
    const days = daysUntil(soonest.date);
    const dayLabel = days === 0 ? "Today!" : days === 1 ? "Tomorrow" : `${days} days away`;
    const dateLabel = new Date(soonest.date).toLocaleDateString("en-CA", {
      weekday: "long", month: "long", day: "numeric",
    });

    return (
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
        <h1 className="font-display text-3xl text-stone-900">Your next dig</h1>

        <div className="card border-l-4 border-brand-500 p-6">
          <p className="mb-1 text-sm text-stone-500">{dateLabel} · {dayLabel}</p>
          <h2 className="mb-4 font-display text-2xl text-stone-900">{soonest.site_name}</h2>
          <Link href={`/bookings/${soonest.id}`} className="btn-primary inline-flex items-center gap-1.5">
            View Booking <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-stone-600">Get ready</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: "/shop", icon: <ShoppingBag className="h-4 w-4" />, label: "Gear Shop", sub: "Pack the right tools" },
              { href: "/mineral-id", icon: <Zap className="h-4 w-4" />, label: "Mineral ID", sub: "Learn what to look for" },
              { href: "/mineral-school", icon: <BookOpen className="h-4 w-4" />, label: "Field Guides", sub: "Site-specific guides" },
            ].map(({ href, icon, label, sub }) => (
              <Link key={href} href={href} className="card p-4 text-center transition-shadow hover:shadow-md">
                <div className="mb-2 flex justify-center text-brand-600">{icon}</div>
                <p className="text-sm font-medium text-stone-800">{label}</p>
                <p className="mt-0.5 text-xs text-stone-500">{sub}</p>
              </Link>
            ))}
          </div>
        </div>

        <PassportTeaser />
      </div>
    );
  }

  // State 3 — Past digs, no finds logged
  if (hasPastNoFinds) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
        <div className="card p-8 text-center">
          <Pickaxe className="mx-auto mb-4 h-10 w-10 text-brand-600" />
          <h1 className="mb-2 font-display text-3xl text-stone-900">
            You&rsquo;ve been out — what did you find?
          </h1>
          <p className="mb-6 text-stone-500">
            Log your minerals. Add photos and GPS. Your finds can contribute to Ontario geological records.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/finds/new" className="btn-primary">Log a Find</Link>
            <Link href="/mineral-id" className="btn-secondary">Try Mineral ID</Link>
          </div>
        </div>

        {pastBookings.length > 0 && (
          <div>
            <p className="mb-3 text-sm font-semibold text-stone-600">Your past digs</p>
            <div className="space-y-2">
              {pastBookings.slice(0, 3).map((b) => (
                <div key={b.id} className="card flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-stone-800">{b.site_name}</p>
                    <p className="text-xs text-stone-500">
                      {new Date(b.date).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <Link
                    href={`/finds/new${b.site_name ? `?site_name=${encodeURIComponent(b.site_name)}` : ""}`}
                    className="whitespace-nowrap text-xs font-medium text-brand-600 hover:underline"
                  >
                    Log finds →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <PassportTeaser />
      </div>
    );
  }

  // State 4 — Active user
  type ActivityItem = { type: "dig" | "badge"; label: string; date: string; href: string };
  const activity: ActivityItem[] = [
    ...passport.stamps.map((s) => ({
      type: "dig" as const,
      label: `Dig at ${s.site_name}`,
      date: s.date,
      href: "/bookings",
    })),
    ...passport.badges
      .filter((b) => b.earned && b.earned_at)
      .map((b) => ({
        type: "badge" as const,
        label: `Earned: ${b.name}`,
        date: b.earned_at!,
        href: "/passport",
      })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <h1 className="font-display text-3xl text-stone-900">Welcome back, {firstName}.</h1>

      {/* Passport progress */}
      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-stone-800">Your Passport</h2>
          </div>
          <Link href="/passport" className="text-sm font-medium text-brand-600 hover:underline">View full passport →</Link>
        </div>
        <div className="mb-4 flex gap-8">
          <div>
            <p className="text-3xl font-bold text-stone-900">{passport.points}</p>
            <p className="text-sm text-stone-500">points</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-stone-900">{stampCount}</p>
            <p className="text-sm text-stone-500">stamps</p>
          </div>
          {findCount > 0 && (
            <div>
              <p className="text-3xl font-bold text-stone-900">{findCount}</p>
              <p className="text-sm text-stone-500">citizen science finds</p>
            </div>
          )}
        </div>
        {badge && (
          <>
            <div className="mb-1 flex justify-between text-sm text-stone-500">
              <span>{stampCount} of {badge.threshold} digs to {badge.label}</span>
              <span>{Math.round((stampCount / badge.threshold) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-stone-100">
              <div
                className="h-2 rounded-full bg-brand-500 transition-all"
                style={{ width: `${Math.min((stampCount / badge.threshold) * 100, 100)}%` }}
              />
            </div>
          </>
        )}
        {findCount > 0 && (
          <p className="mt-2 text-sm text-stone-500">
            {findCount} {findCount === 1 ? "find" : "finds"} contributed to Ontario geology data
          </p>
        )}
      </div>

      {/* Activity feed */}
      {activity.length > 0 && (
        <div className="card divide-y divide-stone-100">
          <div className="px-5 py-3 text-sm font-semibold text-stone-700">Recent activity</div>
          {activity.map((item, i) => (
            <Link
              key={i}
              href={item.href}
              className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-stone-50"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                {item.type === "dig" ? <Pickaxe className="h-4 w-4" /> : <Award className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-800">{item.label}</p>
                <p className="text-xs text-stone-400">
                  {new Date(item.date).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-stone-300" />
            </Link>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div>
        <p className="mb-3 text-sm font-semibold text-stone-600">Quick actions</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { href: "/finds/new", label: "Log a Find", icon: <Gem className="h-5 w-5" /> },
            { href: "/sites", label: "Browse Sites", icon: <Map className="h-5 w-5" /> },
            { href: "/finds/my", label: "My Journal", icon: <BookOpen className="h-5 w-5" /> },
            { href: "/diary", label: "Trip Diary", icon: <Calendar className="h-5 w-5" /> },
          ].map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className="card group flex flex-col items-center gap-2 p-4 text-center transition-shadow hover:shadow-md"
            >
              <span className="text-brand-600 transition-colors group-hover:text-brand-700">{icon}</span>
              <span className="text-sm font-medium text-stone-700">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Junior Club card */}
      {juniorProfiles.length > 0 && (
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-600" />
              <h2 className="text-base font-semibold text-stone-800">Junior Club</h2>
            </div>
            <Link href="/junior" className="text-sm font-medium text-brand-600 hover:underline">Go to Junior Club →</Link>
          </div>
          <div className="space-y-2">
            {juniorProfiles.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-stone-800">{p.avatar} {p.name}</span>
                <span className="text-stone-500">
                  {p.streak > 0 ? `${p.streak} day streak` : `${p.cards_count} cards`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Operator Setup Checklist (States 1 & 2) ──────────────────────────────────

function OperatorSetup({
  stripeConnected,
  hasSites,
  hasAvailability,
  firstName,
  firstSiteId,
  onConnectStripe,
  connectStripeIsPending,
}: {
  stripeConnected: boolean;
  hasSites: boolean;
  hasAvailability: boolean;
  firstName: string;
  firstSiteId?: string;
  onConnectStripe: () => void;
  connectStripeIsPending: boolean;
}) {
  const stepsRemaining = [!stripeConnected, !hasSites, !hasAvailability].filter(Boolean).length;
  const isFirstVisit = !stripeConnected && !hasSites;

  const heading = isFirstVisit
    ? `Let's get you live, ${firstName}.`
    : stepsRemaining === 1
    ? `Almost there, ${firstName} — one more step to go live.`
    : `Almost there, ${firstName} — ${stepsRemaining} more steps to go live.`;

  const availabilityHref = firstSiteId ? `/dashboard/sites` : "/dashboard/sites";

  const steps = [
    {
      num: 1,
      title: "Connect Stripe",
      description: "Set up payouts so Digby can send you 88% of every booking.",
      done: stripeConnected,
      active: !stripeConnected,
      cta: (
        <button
          onClick={onConnectStripe}
          disabled={connectStripeIsPending}
          className="btn-primary text-sm"
        >
          {connectStripeIsPending ? "Redirecting…" : "Connect Stripe →"}
        </button>
      ),
    },
    {
      num: 2,
      title: "List your first site",
      description: "Add your dig site — location, minerals, pricing, photos.",
      done: hasSites,
      active: stripeConnected && !hasSites,
      cta: (
        <Link
          href="/dashboard/sites/new"
          className={cn("btn-primary text-sm", !stripeConnected && "pointer-events-none opacity-40")}
          aria-disabled={!stripeConnected}
        >
          Create a Site →
        </Link>
      ),
    },
    {
      num: 3,
      title: "Set availability",
      description: "Open up dates so visitors can book.",
      done: hasAvailability,
      active: hasSites && !hasAvailability,
      cta: (
        <Link
          href={availabilityHref}
          className={cn("btn-primary text-sm", !hasSites && "pointer-events-none opacity-40")}
          aria-disabled={!hasSites}
        >
          Set Availability →
        </Link>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-stone-900">{heading}</h1>
        {isFirstVisit && (
          <p className="mt-2 text-lg text-stone-500">
            Three steps to start accepting bookings and getting paid.
          </p>
        )}
      </div>

      <div className="space-y-3">
        {steps.map((step) => (
          <div
            key={step.num}
            className={cn(
              "card p-5 transition-all",
              step.done && "bg-stone-50 opacity-70",
              step.active && "border-brand-300 ring-1 ring-brand-200"
            )}
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  step.done
                    ? "bg-green-100 text-green-700"
                    : step.active
                    ? "bg-brand-600 text-white"
                    : "bg-stone-100 text-stone-400"
                )}
              >
                {step.done ? <CheckCircle className="h-5 w-5" /> : step.num}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2
                      className={cn(
                        "font-semibold",
                        step.done ? "text-stone-400 line-through" : "text-stone-900"
                      )}
                    >
                      {step.title}
                    </h2>
                    <p className="mt-0.5 text-sm text-stone-500">{step.description}</p>
                  </div>
                  {!step.done && <div className="shrink-0">{step.cta}</div>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────

type AvailSlot = { date: string; slots_remaining: number; slots_total: number; is_blocked: boolean };

function statusBadge(status: string) {
  const cls =
    status === "confirmed"
      ? "bg-green-100 text-green-700"
      : status === "pending"
      ? "bg-yellow-100 text-yellow-700"
      : status === "completed"
      ? "bg-blue-100 text-blue-700"
      : "bg-stone-100 text-stone-500";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{status}</span>;
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  // No redirect — logout uses window.location.href which handles navigation.

  const isVisitorRole = user?.role === "visitor";
  const isOperatorRole = user?.role === "operator" || user?.role === "admin";

  // ── Visitor queries ────────────────────────────────────────────────────
  const { data: passport } = useQuery<PassportData>({
    queryKey: ["passport-me"],
    queryFn: () => api.get("/api/passport/me", { auth: true }),
    enabled: isVisitorRole,
  });

  const { data: visitorBookings = [] } = useQuery<Booking[]>({
    queryKey: ["visitor-bookings"],
    queryFn: () => api.get("/api/bookings/my", { auth: true }),
    enabled: isVisitorRole,
  });

  // ── Operator queries ───────────────────────────────────────────────────
  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ["operator-bookings"],
    queryFn: () => api.get("/api/bookings/operator", { auth: true }),
    enabled: isOperatorRole,
  });

  const { data: alerts = [] } = useQuery<WeatherAlert[]>({
    queryKey: ["my-alerts"],
    queryFn: () => api.get("/api/weather-alerts/my", { auth: true }),
    enabled: isOperatorRole,
  });

  const { data: reports = [] } = useQuery<YieldReport[]>({
    queryKey: ["my-yield-reports"],
    queryFn: () => api.get("/api/yield-reports/my", { auth: true }),
    enabled: isOperatorRole,
  });

  const [alertForm, setAlertForm] = useState({ site_id: "", message: "", affected_dates: "" });
  const createAlert = useMutation({
    mutationFn: (data: object) => api.post("/api/weather-alerts/", data, { auth: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-alerts"] });
      setAlertForm({ site_id: "", message: "", affected_dates: "" });
    },
  });

  const [reportForm, setReportForm] = useState({ site_id: "", session_date: "", minerals_found: "", quantity_notes: "" });
  const createReport = useMutation({
    mutationFn: (data: object) => api.post("/api/yield-reports/", data, { auth: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-yield-reports"] });
      setReportForm({ site_id: "", session_date: "", minerals_found: "", quantity_notes: "" });
    },
  });

  const resolveAlert = useMutation({
    mutationFn: (id: string) => api.patch(`/api/weather-alerts/${id}/resolve`, {}, { auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-alerts"] }),
  });

  const completeBooking = useMutation({
    mutationFn: (id: string) => api.patch(`/api/bookings/${id}/complete`, {}, { auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["operator-bookings"] }),
  });

  const { data: me } = useQuery<typeof user>({
    queryKey: ["me"],
    queryFn: () => api.get("/api/auth/me", { auth: true }),
    enabled: !!user,
  });

  const { data: unansweredQuestions = [] } = useQuery<SiteQuestion[]>({
    queryKey: ["unanswered-questions"],
    queryFn: async () => {
      const sites: Site[] = await api.get("/api/sites/my", { auth: true });
      const allQs = await Promise.all(
        sites.map((s) => api.get<SiteQuestion[]>(`/api/site-questions/site/${s.id}`))
      );
      return allQs.flat().filter((q: SiteQuestion) => !q.answer);
    },
    enabled: isOperatorRole,
  });

  const [answerForms, setAnswerForms] = useState<Record<string, string>>({});
  const answerQuestion = useMutation({
    mutationFn: ({ id, answer }: { id: string; answer: string }) =>
      api.patch(`/api/site-questions/${id}/answer`, { answer }, { auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["unanswered-questions"] }),
  });

  const toggleOpenToday = useMutation({
    mutationFn: ({ siteId, value }: { siteId: string; value: boolean }) =>
      api.patch(`/api/sites/${siteId}`, { is_open_today: value }, { auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["operator-sites"] }),
  });

  const { data: mySites = [] } = useQuery<Site[]>({
    queryKey: ["operator-sites"],
    queryFn: () => api.get("/api/sites/my", { auth: true }),
    enabled: isOperatorRole,
  });

  const { data: mySpecimens = [] } = useQuery<Specimen[]>({
    queryKey: ["my-specimens"],
    queryFn: () => api.get("/api/specimens/my", { auth: true }),
    enabled: isOperatorRole,
  });

  const [specimenForm, setSpecimenForm] = useState({
    site_id: "", title: "", description: "", minerals: "", province: "Ontario", price: "", images: "",
  });
  const createSpecimen = useMutation({
    mutationFn: (data: object) => api.post("/api/specimens/", data, { auth: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-specimens"] });
      setSpecimenForm({ site_id: "", title: "", description: "", minerals: "", province: "Ontario", price: "", images: "" });
    },
  });

  const [seasonalForm, setSeasonalForm] = useState({ site_id: "", mineral: "", start_month: "4", end_month: "6", notes: "" });
  const addSeasonalWindow = useMutation({
    mutationFn: async (data: { site_id: string; mineral: string; start_month: number; end_month: number; notes: string }) => {
      const site = mySites.find((s) => s.id === data.site_id);
      if (!site) throw new Error("Site not found");
      const windows = [...(site.seasonal_windows ?? []), { mineral: data.mineral, start_month: data.start_month, end_month: data.end_month, notes: data.notes }];
      return api.patch(`/api/sites/${data.site_id}`, { seasonal_windows: windows }, { auth: true });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["operator-sites"] });
      setSeasonalForm({ site_id: "", mineral: "", start_month: "4", end_month: "6", notes: "" });
    },
  });

  const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const { data: hunts = [] } = useQuery<ScavengerHunt[]>({
    queryKey: ["my-hunts"],
    queryFn: () => api.get("/api/hunts/my", { auth: true }),
    enabled: isOperatorRole,
  });

  type OperatorUpdateItem = { id: string; title: string; body: string; category: string; action_label: string; action_url: string; created_at: string };
  const { data: digbyUpdates = [] } = useQuery<OperatorUpdateItem[]>({
    queryKey: ["operator-updates"],
    queryFn: () => api.get("/api/operator-updates/", { auth: true }),
    enabled: isOperatorRole,
  });

  const toggleHunt = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      api.patch(`/api/hunts/${id}`, { is_active }, { auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-hunts"] }),
  });

  const connectStripe = useMutation({
    mutationFn: () => api.post<{ url: string }>("/api/payments/connect/onboard", {}, { auth: true }),
    onSuccess: (data) => { window.location.href = data.url; },
  });

  const { data: operatorAvailability = [] } = useQuery<(AvailSlot & { site_id: string })[]>({
    queryKey: ["operator-availability"],
    queryFn: () => api.get("/api/availability/operator", { auth: true }),
    enabled: isOperatorRole,
  });

  // ── Render ─────────────────────────────────────────────────────────────

  if (!user) return null;

  if (isVisitorRole) {
    if (!passport) return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-stone-400">Loading…</div>;
    return <VisitorDashboard passport={passport} bookings={visitorBookings} />;
  }

  // Operator — wait for me to load before deriving setup state
  if (!me) return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-stone-400">Loading…</div>;

  // ── Operator state derivation ──────────────────────────────────────────
  const stripeConnected = me?.stripe_account_enabled === true;
  const hasSites = mySites.length > 0;
  const hasAvailability = operatorAvailability.length > 0;
  const isSetupDone = stripeConnected && hasSites && hasAvailability;
  const firstName = user.name.split(" ")[0];

  // States 1 & 2 — setup checklist
  if (!isSetupDone) {
    return (
      <OperatorSetup
        stripeConnected={stripeConnected}
        hasSites={hasSites}
        hasAvailability={hasAvailability}
        firstName={firstName}
        firstSiteId={mySites[0]?.id}
        onConnectStripe={() => connectStripe.mutate()}
        connectStripeIsPending={connectStripe.isPending}
      />
    );
  }

  // State 3 — Operator Portal Overview
  const now = new Date();
  const in14days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
  const completedBookings = bookings.filter((b) => b.status === "completed");
  const thisMonthBookings = bookings.filter((b) => {
    const d = new Date(b.date);
    return d >= thisMonthStart && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const thisMonthRevenue = completedBookings
    .filter((b) => new Date(b.created_at) >= thisMonthStart)
    .reduce((sum, b) => sum + b.total_amount, 0);
  const avgPartySize = confirmedBookings.length > 0
    ? confirmedBookings.reduce((sum, b) => sum + b.party_size, 0) / confirmedBookings.length
    : 0;
  const openSpots = operatorAvailability.filter(
    (s) => !s.is_blocked && s.slots_remaining > 0 && s.date >= now.toISOString().slice(0, 10) && s.date <= in14days.toISOString().slice(0, 10)
  ).reduce((sum, s) => sum + s.slots_remaining, 0);

  const upcomingSessions = bookings
    .filter((b) => b.status === "confirmed" && new Date(b.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const siteNameOf = (b: Booking) =>
    mySites.find((s) => s.id === b.site_id)?.name ?? b.site_name ?? "—";

  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const questionCount = unansweredQuestions.length;

  const CATEGORY_COLOR: Record<string, string> = {
    urgent: "#DC2626",
    payout: "#D97706",
    product: "#2563EB",
    opportunity: "#059669",
    general: "#6B7280",
  };

  const operatorTools = [
    { href: "/dashboard/sites", icon: "📍", label: "Site Listing", sub: "Photos, pricing, profile" },
    { href: "/dashboard/bookings", icon: "📋", label: "Waivers & Safety", sub: "Forms, field safety" },
    { href: "/dashboard/settings", icon: "💳", label: "Pricing & Payouts", sub: "Payment history, guidance" },
    { href: "/dashboard/marketplace", icon: "💎", label: "Specimen Drop", sub: "Limited releases with provenance" },
    { href: "/dashboard/bookings", icon: "🔬", label: "Citizen Science", sub: "Log finds, OGS dataset" },
    { href: "/dashboard/community", icon: "🗣️", label: "Community Board", sub: "Talk to other operators" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 pb-24 md:pb-8">

      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl text-stone-900 sm:text-3xl">
            {firstName}&rsquo;s Portal
          </h1>
          <p className="mt-0.5 text-sm text-stone-400">
            {now.toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {pendingCount > 0 && (
            <Link href="/dashboard/bookings" className="flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
              <AlertTriangle className="h-3.5 w-3.5" /> {pendingCount} pending
            </Link>
          )}
          {questionCount > 0 && (
            <Link href="/dashboard/bookings" className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              <HelpCircle className="h-3.5 w-3.5" /> {questionCount} questions
            </Link>
          )}
          <Link href="/dashboard/sites/new" className="btn-primary gap-1.5 text-sm py-1.5">
            <Plus className="h-4 w-4" /> New Site
          </Link>
        </div>
      </div>

      {/* ── Season at a glance ── */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Bookings this month", value: thisMonthBookings.length.toString(), sub: "confirmed + pending" },
          { label: "Revenue (CAD)", value: `$${thisMonthRevenue.toLocaleString("en-CA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, sub: "this month" },
          { label: "Avg party size", value: avgPartySize > 0 ? avgPartySize.toFixed(1) : "—", sub: "confirmed bookings" },
          { label: "Open spots (next 14d)", value: openSpots.toString(), sub: openSpots > 0 ? "available slots" : "check availability" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="card p-4">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-stone-400">{label}</p>
            <p className="text-2xl font-bold text-stone-900">{value}</p>
            <p className="mt-0.5 text-xs text-stone-400">{sub}</p>
          </div>
        ))}
      </section>

      {/* ── Messages + Updates row ── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">

        {/* Messages — stub (no backend yet) */}
        <section className="card">
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-stone-400" />
              <span className="text-sm font-semibold text-stone-800">Messages</span>
            </div>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-400">Coming soon</span>
          </div>
          <div className="divide-y divide-stone-50">
            {[
              { from: "Digby Team", preview: "New payout schedule update — action required before June…", badge: "NEW", time: "Yesterday" },
              { from: "Ontario Mineral Exchange", preview: "Interested in stocking your sodalite — let's talk pricing", badge: null, time: "2d ago" },
              { from: "Bancroft Heritage Digs", preview: "Can we coordinate the Aug long weekend schedule?", badge: null, time: "3d ago" },
            ].map((msg) => (
              <div key={msg.from} className="flex items-start gap-3 px-5 py-3.5 opacity-60">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-bold text-stone-600">
                  {msg.from[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-stone-800">{msg.from}</p>
                    {msg.badge && <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-brand-700">{msg.badge}</span>}
                    <span className="ml-auto shrink-0 text-xs text-stone-400">{msg.time}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-stone-500">{msg.preview}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-stone-100 px-5 py-3">
            <p className="text-xs text-stone-400">Operator messaging launches with the Community update.</p>
          </div>
        </section>

        {/* Updates from Digby */}
        <section className="card">
          <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-stone-400" />
              <span className="text-sm font-semibold text-stone-800">Updates from Digby</span>
            </div>
            {digbyUpdates.length > 0 && (
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">{digbyUpdates.length}</span>
            )}
          </div>
          {digbyUpdates.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-xs text-stone-400">No updates right now. Check back soon.</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-50">
              {digbyUpdates.slice(0, 5).map((u) => (
                <div key={u.id} className="px-4 py-3">
                  <div className="mb-1 flex items-center gap-2">
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: CATEGORY_COLOR[u.category] ?? "#6B7280", flexShrink: 0, display: "inline-block" }} />
                    <p className="text-sm font-medium text-stone-900">{u.title}</p>
                  </div>
                  <p className="text-xs text-stone-500 leading-relaxed">{u.body}</p>
                  {u.action_label && u.action_url && (
                    <Link href={u.action_url} className="mt-1.5 inline-block text-xs font-medium text-brand-600 hover:underline">
                      {u.action_label} →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Upcoming sessions ── */}
      <section className="card">
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-stone-400" />
            <span className="text-sm font-semibold text-stone-800">Upcoming sessions</span>
          </div>
          <Link href="/dashboard/bookings" className="text-xs font-medium text-brand-600 hover:underline">Manage all →</Link>
        </div>
        {upcomingSessions.length === 0 ? (
          <div className="px-5 py-6 text-center">
            <p className="text-sm text-stone-400">No upcoming sessions.</p>
            <Link href="/dashboard/sites" className="mt-1 block text-xs font-medium text-brand-600 hover:underline">Set availability →</Link>
          </div>
        ) : (
          <div className="divide-y divide-stone-50">
            {upcomingSessions.map((b) => {
              const spotsLeft = (() => {
                const slot = operatorAvailability.find(
                  (s) => s.site_id === b.site_id && s.date.startsWith(b.date.slice(0, 10))
                );
                return slot ? slot.slots_remaining : null;
              })();
              const isWaitlist = spotsLeft === 0;
              const isOpen = !isWaitlist && spotsLeft !== null && spotsLeft > 0;
              return (
                <div key={b.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <span className="text-[10px] font-bold uppercase">{new Date(b.date).toLocaleDateString("en-CA", { month: "short" })}</span>
                    <span className="text-sm font-bold leading-none">{new Date(b.date).getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-900">{siteNameOf(b)}</p>
                    <p className="text-xs text-stone-500">
                      {new Date(b.date).toLocaleDateString("en-CA", { weekday: "short", hour: "numeric", minute: "2-digit" })}
                      {b.is_group_booking ? ` · Group of ${b.party_size}` : ` · Party of ${b.party_size}`}
                    </p>
                  </div>
                  {isWaitlist ? (
                    <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Waitlist</span>
                  ) : isOpen ? (
                    <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">{spotsLeft} left</span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">Confirmed</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Open Today toggles ── */}
      {mySites.length > 0 && (
        <section className="card p-4">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm font-semibold text-stone-800">Open today</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {mySites.map((s) => (
              <button
                key={s.id}
                onClick={() => toggleOpenToday.mutate({ siteId: s.id, value: !s.is_open_today })}
                disabled={toggleOpenToday.isPending}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  s.is_open_today
                    ? "border-green-300 bg-green-100 text-green-700"
                    : "border-stone-200 bg-white text-stone-500 hover:border-stone-300"
                }`}
              >
                {s.is_open_today ? "✓ " : ""}{s.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Operator tools grid ── */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400">Operator tools</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {operatorTools.map(({ href, icon, label, sub }) => (
            <Link key={label} href={href}
              className="card group flex items-start gap-3 p-4 transition-shadow hover:shadow-md">
              <span className="text-xl leading-none">{icon}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-800 group-hover:text-brand-600 transition-colors">{label}</p>
                <p className="mt-0.5 text-xs text-stone-400 leading-snug">{sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
