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
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    if (user === null) router.push("/login?next=/dashboard");
  }, [user, router]);

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

  // State 3 — Live operator dashboard
  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const needsAttention = bookings.filter(
    (b) =>
      b.status === "pending" ||
      (b.status === "confirmed" && new Date(b.date) >= now && new Date(b.date) <= in48h)
  );

  const upcoming7 = bookings
    .filter((b) => b.status === "confirmed" && new Date(b.date) >= now && new Date(b.date) <= in7days)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const siteNameOf = (b: Booking) =>
    mySites.find((s) => s.id === b.site_id)?.name ?? b.site_name ?? "—";

  // Revenue summary
  const completedBookings = bookings.filter((b) => b.status === "completed");
  const thisMonthRevenue = completedBookings
    .filter((b) => {
      const d = new Date(b.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, b) => sum + b.total_amount, 0);
  const allTimeRevenue = completedBookings.reduce((sum, b) => sum + b.total_amount, 0);

  // Next available date per site (earliest future non-blocked slot)
  const nextAvailableDate = (siteId: string): string | null => {
    const today = now.toISOString().slice(0, 10);
    const future = operatorAvailability
      .filter((s) => s.site_id === siteId && !s.is_blocked && s.slots_remaining > 0 && s.date >= today)
      .map((s) => s.date)
      .sort();
    return future[0] ?? null;
  };

  // Keep legacy vars for existing sections below
  const confirmed = bookings.filter((b) => b.status === "confirmed");
  const pending = bookings.filter((b) => b.status === "pending");
  const revenue = confirmed.reduce((sum, b) => sum + b.total_amount, 0);

  const todayStr = now.toLocaleDateString("en-CA", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">

      {/* ── Page header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-4xl text-stone-900">{firstName}&apos;s Dashboard</h1>
          <p className="mt-1 text-sm text-stone-400">{todayStr}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/sites/new" className="btn-primary gap-1.5 text-sm">
            <Plus className="h-4 w-4" /> New Site
          </Link>
          <a href="#yield-reports" className="btn-secondary gap-1.5 text-sm">
            <Pickaxe className="h-4 w-4" /> Yield Report
          </a>
          <a href="#alerts" className="btn-secondary gap-1.5 text-sm">
            <AlertTriangle className="h-4 w-4" /> Weather Alert
          </a>
        </div>
      </div>

      {/* ── Bookings needing attention ── */}
      <section className="card divide-y divide-stone-100">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="font-semibold text-stone-800">Needs attention</h2>
          {needsAttention.length > 0 && (
            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">
              {needsAttention.length}
            </span>
          )}
        </div>
        {needsAttention.length === 0 ? (
          <p className="px-5 py-5 text-sm text-stone-400">No pending bookings — you&apos;re all caught up.</p>
        ) : (
          needsAttention.map((b) => (
            <div key={b.id} className="flex items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-stone-800">
                  {siteNameOf(b)} · Party of {b.party_size}
                </p>
                <p className="text-xs text-stone-500">
                  {new Date(b.date).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {statusBadge(b.status)}
                <Link href={`/bookings/${b.id}`} className="text-xs font-medium text-brand-600 hover:underline">
                  View →
                </Link>
              </div>
            </div>
          ))
        )}
      </section>

      {/* ── Upcoming bookings (next 7 days) ── */}
      <section className="card divide-y divide-stone-100">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="font-semibold text-stone-800">Upcoming this week</h2>
          <Link href="/dashboard/bookings" className="text-xs font-medium text-brand-600 hover:underline">
            All Bookings →
          </Link>
        </div>
        {upcoming7.length === 0 ? (
          <div className="px-5 py-5">
            <p className="text-sm text-stone-400">No upcoming bookings this week.</p>
            <Link href="/sites" className="mt-1 block text-xs font-medium text-brand-600 hover:underline">
              Browse how your sites look to visitors →
            </Link>
          </div>
        ) : (
          upcoming7.map((b) => (
            <div key={b.id} className="flex items-center gap-4 px-5 py-3">
              <Calendar className="h-4 w-4 shrink-0 text-stone-300" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-stone-800">{siteNameOf(b)}</p>
                <p className="text-xs text-stone-500">
                  {new Date(b.date).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })}
                  {b.is_group_booking ? ` · Group of ${b.party_size}` : ` · Party of ${b.party_size}`}
                </p>
              </div>
              <Link href={`/bookings/${b.id}`} className="text-xs font-medium text-brand-600 hover:underline shrink-0">
                View →
              </Link>
            </div>
          ))
        )}
      </section>

      {/* ── Your sites ── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-stone-800">Your sites</h2>
          {mySites.length > 3 && (
            <Link href="/dashboard/sites" className="text-xs font-medium text-brand-600 hover:underline">
              View all {mySites.length} sites →
            </Link>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mySites.slice(0, 3).map((s) => {
            const nextDate = nextAvailableDate(s.id);
            return (
              <div key={s.id} className="card p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="font-medium text-stone-900 leading-snug">{s.name}</h3>
                  <span className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                    s.is_active ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"
                  )}>
                    {s.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-xs text-stone-400">
                  {nextDate
                    ? `Next available: ${new Date(nextDate).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}`
                    : "No availability set"}
                </p>
                <Link href={`/dashboard/sites`} className="mt-3 block text-xs font-medium text-brand-600 hover:underline">
                  Manage →
                </Link>
              </div>
            );
          })}
          <Link href="/dashboard/sites/new" className="card flex items-center justify-center gap-2 p-4 text-sm font-medium text-stone-500 hover:text-brand-600 hover:border-brand-200 transition-colors">
            <Plus className="h-4 w-4" /> Add another site
          </Link>
        </div>
      </section>

      {/* ── Revenue summary ── */}
      <section className="card p-5">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-brand-600" />
          <h2 className="font-semibold text-stone-800">Revenue</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-stone-500">This month</p>
            <p className="text-2xl font-bold text-stone-900">${thisMonthRevenue.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-stone-500">All time</p>
            <p className="text-2xl font-bold text-stone-900">${allTimeRevenue.toFixed(2)}</p>
          </div>
        </div>
      </section>

      {/* ── Quick links ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: "/dashboard/sites", label: "Set Availability", icon: <Calendar className="h-5 w-5" /> },
          { href: "#yield-reports", label: "Yield Report", icon: <Pickaxe className="h-5 w-5" /> },
          { href: "/dashboard/hunts", label: "Manage Hunts", icon: <Map className="h-5 w-5" /> },
          { href: "#alerts", label: "Weather Alerts", icon: <AlertTriangle className="h-5 w-5" /> },
        ].map(({ href, label, icon }) => (
          <a
            key={label}
            href={href}
            className="card group flex flex-col items-center gap-2 p-4 text-center transition-shadow hover:shadow-md"
          >
            <span className="text-brand-600 transition-colors group-hover:text-brand-700">{icon}</span>
            <span className="text-sm font-medium text-stone-700">{label}</span>
          </a>
        ))}
      </div>

      {/* ── Stripe status ── */}
      <section className="card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-stone-500" />
            <h2 className="text-lg font-semibold text-stone-800">Stripe Payments</h2>
          </div>
          {me?.stripe_account_enabled ? (
            <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
              <CheckCircle className="h-4 w-4" /> Connected
            </span>
          ) : (
            <button
              onClick={() => connectStripe.mutate()}
              disabled={connectStripe.isPending}
              className="btn-primary text-sm"
            >
              {connectStripe.isPending ? "Redirecting…" : me?.stripe_account_id ? "Complete Stripe setup" : "Connect Stripe"}
            </button>
          )}
        </div>
        {!me?.stripe_account_enabled && (
          <p className="mt-2 text-sm text-stone-500">
            Connect a Stripe account to receive payments from visitors.
          </p>
        )}
      </section>

      {/* ── Scavenger Hunts ── */}
      <section className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Map className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-stone-800">Scavenger Hunts</h2>
          </div>
          <Link href="/dashboard/hunts/new" className="btn-primary gap-1 text-sm">
            <Plus className="h-4 w-4" /> New hunt
          </Link>
        </div>
        {hunts.length === 0 ? (
          <p className="text-sm text-stone-500">No hunts yet. Create one to give visitors a challenge at your site.</p>
        ) : (
          <div className="space-y-2">
            {hunts.map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-lg border border-stone-200 p-3">
                <div>
                  <p className="text-sm font-medium text-stone-800">{h.title}</p>
                  <p className="text-xs text-stone-500">{h.items.length} items · {h.is_active ? "Active" : "Inactive"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/hunts/${h.id}/edit`} className="text-xs font-medium text-brand-600 hover:underline">Edit</Link>
                  <button
                    onClick={() => toggleHunt.mutate({ id: h.id, is_active: !h.is_active })}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${h.is_active ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"}`}
                  >
                    {h.is_active ? "Active" : "Inactive"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Weather Alerts ── */}
      <section id="alerts" className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-stone-800">Weather Alerts</h2>
        </div>
        <div className="mb-4 space-y-3 rounded-lg bg-stone-50 p-4">
          <p className="text-sm font-medium text-stone-700">Post a new alert</p>
          <select value={alertForm.site_id}
            onChange={(e) => setAlertForm((f) => ({ ...f, site_id: e.target.value }))} className="input">
            <option value="">Select site…</option>
            {mySites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input type="text" placeholder="Message (e.g. Site closed due to flooding)"
            value={alertForm.message}
            onChange={(e) => setAlertForm((f) => ({ ...f, message: e.target.value }))} className="input" />
          <button
            onClick={() => createAlert.mutate({ site_id: alertForm.site_id, message: alertForm.message, affected_dates: [] })}
            disabled={!alertForm.site_id || !alertForm.message}
            className="btn-primary text-sm"
          >
            Post Alert
          </button>
        </div>
        {alerts.filter((a) => a.is_active).length === 0 ? (
          <p className="text-sm text-stone-500">No active alerts.</p>
        ) : (
          <div className="space-y-2">
            {alerts.filter((a) => a.is_active).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm text-amber-800">{a.message}</p>
                <button onClick={() => resolveAlert.mutate(a.id)}
                  className="text-xs font-medium text-amber-700 hover:underline">Resolve</button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Yield Reports ── */}
      <section id="yield-reports" className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Pickaxe className="h-5 w-5 text-brand-600" />
          <h2 className="text-lg font-semibold text-stone-800">Yield Reports</h2>
        </div>
        <div className="mb-4 space-y-3 rounded-lg bg-stone-50 p-4">
          <p className="text-sm font-medium text-stone-700">Log a new session</p>
          <select value={reportForm.site_id}
            onChange={(e) => setReportForm((f) => ({ ...f, site_id: e.target.value }))} className="input">
            <option value="">Select site…</option>
            {mySites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input type="date" value={reportForm.session_date}
            onChange={(e) => setReportForm((f) => ({ ...f, session_date: e.target.value }))} className="input" />
          <input type="text" placeholder="Minerals found (comma-separated)" value={reportForm.minerals_found}
            onChange={(e) => setReportForm((f) => ({ ...f, minerals_found: e.target.value }))} className="input" />
          <input type="text" placeholder="Quantity notes (optional)" value={reportForm.quantity_notes}
            onChange={(e) => setReportForm((f) => ({ ...f, quantity_notes: e.target.value }))} className="input" />
          <button
            onClick={() => createReport.mutate({
              site_id: reportForm.site_id,
              session_date: reportForm.session_date,
              minerals_found: reportForm.minerals_found.split(",").map((s) => s.trim()).filter(Boolean),
              quantity_notes: reportForm.quantity_notes,
            })}
            disabled={!reportForm.site_id || !reportForm.session_date}
            className="btn-primary text-sm"
          >
            Log Report
          </button>
        </div>
        {reports.length === 0 ? (
          <p className="text-sm text-stone-500">No yield reports yet.</p>
        ) : (
          <div className="space-y-2">
            {reports.slice(0, 5).map((r) => (
              <div key={r.id} className="rounded-lg border border-stone-200 p-3 text-sm">
                <p className="font-medium text-stone-800">{r.session_date} — {r.minerals_found.join(", ") || "No minerals logged"}</p>
                {r.quantity_notes && <p className="text-stone-500">{r.quantity_notes}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Recent bookings (full list) ── */}
      <section className="card divide-y divide-stone-100">
        <div className="flex items-center justify-between px-5 py-4">
          <span className="font-semibold text-stone-800">Recent bookings</span>
          <Link href="/dashboard/bookings" className="text-xs font-medium text-brand-600 hover:underline">All Bookings →</Link>
        </div>
        {bookings.length === 0 ? (
          <p className="px-5 py-8 text-center text-stone-500">No bookings yet.</p>
        ) : (
          bookings.slice(0, 10).map((b) => (
            <div key={b.id} className="flex items-center gap-4 px-5 py-4">
              <Calendar className="h-5 w-5 shrink-0 text-stone-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-800">
                  {new Date(b.date).toLocaleDateString("en-CA")}
                </p>
                <p className="text-xs text-stone-500">
                  Party of {b.party_size}{b.is_group_booking ? " (group)" : ""}
                </p>
              </div>
              <div className="flex items-center gap-3 text-right">
                <div>
                  <p className="text-sm font-semibold">${b.total_amount.toFixed(2)}</p>
                  {statusBadge(b.status)}
                </div>
                {b.status === "confirmed" && (
                  <button
                    onClick={() => completeBooking.mutate(b.id)}
                    disabled={completeBooking.isPending}
                    className="rounded-md border border-brand-600 px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50"
                  >
                    Mark complete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </section>

      {/* ── Open Today toggles ── */}
      {mySites.length > 0 && (
        <section className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold text-stone-800">Open Today</h2>
          </div>
          <p className="mb-4 text-sm text-stone-500">
            Toggle your sites open — visitors nearby will see a green badge.
          </p>
          <div className="space-y-2">
            {mySites.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-stone-200 p-3">
                <p className="text-sm font-medium text-stone-800">{s.name}</p>
                <button
                  onClick={() => toggleOpenToday.mutate({ siteId: s.id, value: !s.is_open_today })}
                  disabled={toggleOpenToday.isPending}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    s.is_open_today ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {s.is_open_today ? "Open" : "Closed"}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Unanswered Q&A ── */}
      {unansweredQuestions.length > 0 && (
        <section className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-stone-800">
              Visitor Questions{" "}
              <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-sm text-amber-700">{unansweredQuestions.length}</span>
            </h2>
          </div>
          <div className="space-y-4">
            {unansweredQuestions.map((q) => (
              <div key={q.id} className="rounded-lg border border-stone-200 p-3">
                <p className="text-sm font-medium text-stone-800">{q.question}</p>
                <p className="mt-0.5 text-xs text-stone-400">{q.visitor_name}</p>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    placeholder="Your answer…"
                    value={answerForms[q.id] ?? ""}
                    onChange={(e) => setAnswerForms((f) => ({ ...f, [q.id]: e.target.value }))}
                    className="input flex-1 text-sm"
                  />
                  <button
                    onClick={() => answerQuestion.mutate({ id: q.id, answer: answerForms[q.id] ?? "" })}
                    disabled={!answerForms[q.id] || answerQuestion.isPending}
                    className="btn-primary text-sm"
                  >
                    Answer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Seasonal Windows ── */}
      <section className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-brand-600" />
          <h2 className="text-lg font-semibold text-stone-800">Seasonal Windows</h2>
        </div>
        <p className="mb-4 text-sm text-stone-500">
          Tag your sites with optimal collecting windows. Visitors subscribed to those minerals get notified.
        </p>
        <div className="mb-4 space-y-3 rounded-lg bg-stone-50 p-4">
          <select value={seasonalForm.site_id}
            onChange={(e) => setSeasonalForm((f) => ({ ...f, site_id: e.target.value }))} className="input">
            <option value="">Select site…</option>
            {mySites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input type="text" placeholder="Mineral (e.g. Agates)" value={seasonalForm.mineral}
            onChange={(e) => setSeasonalForm((f) => ({ ...f, mineral: e.target.value }))} className="input" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-stone-500">Start month</label>
              <select value={seasonalForm.start_month}
                onChange={(e) => setSeasonalForm((f) => ({ ...f, start_month: e.target.value }))} className="input">
                {MONTHS.slice(1).map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-stone-500">End month</label>
              <select value={seasonalForm.end_month}
                onChange={(e) => setSeasonalForm((f) => ({ ...f, end_month: e.target.value }))} className="input">
                {MONTHS.slice(1).map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
          </div>
          <input type="text" placeholder="Notes (e.g. best after spring thaw)" value={seasonalForm.notes}
            onChange={(e) => setSeasonalForm((f) => ({ ...f, notes: e.target.value }))} className="input" />
          <button
            onClick={() => addSeasonalWindow.mutate({
              site_id: seasonalForm.site_id,
              mineral: seasonalForm.mineral,
              start_month: Number(seasonalForm.start_month),
              end_month: Number(seasonalForm.end_month),
              notes: seasonalForm.notes,
            })}
            disabled={!seasonalForm.site_id || !seasonalForm.mineral}
            className="btn-primary text-sm"
          >
            Add Window
          </button>
        </div>
        {mySites.some((s) => s.seasonal_windows?.length > 0) && (
          <div className="space-y-2">
            {mySites.filter((s) => s.seasonal_windows?.length > 0).map((s) =>
              s.seasonal_windows.map((w, i) => (
                <div key={`${s.id}-${i}`} className="flex items-center justify-between rounded-lg border border-stone-200 p-3 text-sm">
                  <span className="font-medium text-stone-800">{s.name}</span>
                  <span className="text-stone-500">{w.mineral} · {MONTHS[w.start_month]}–{MONTHS[w.end_month]}</span>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* ── Specimen Marketplace ── */}
      <section className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-stone-800">Specimen Listings</h2>
          </div>
          <Link href="/specimens" className="text-sm font-medium text-brand-600 hover:underline">
            View marketplace →
          </Link>
        </div>
        <div className="mb-4 space-y-3 rounded-lg bg-stone-50 p-4">
          <p className="text-sm font-medium text-stone-700">List a new specimen</p>
          <input type="text" placeholder="Title (e.g. Thunder Bay Amethyst Cluster)" value={specimenForm.title}
            onChange={(e) => setSpecimenForm((f) => ({ ...f, title: e.target.value }))} className="input" />
          <textarea placeholder="Description" value={specimenForm.description} rows={2}
            onChange={(e) => setSpecimenForm((f) => ({ ...f, description: e.target.value }))} className="input resize-none" />
          <input type="text" placeholder="Minerals (comma-separated)" value={specimenForm.minerals}
            onChange={(e) => setSpecimenForm((f) => ({ ...f, minerals: e.target.value }))} className="input" />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="Price (CAD)" value={specimenForm.price}
              onChange={(e) => setSpecimenForm((f) => ({ ...f, price: e.target.value }))} className="input" min="0" step="0.01" />
            <input type="text" placeholder="Image URL (optional)" value={specimenForm.images}
              onChange={(e) => setSpecimenForm((f) => ({ ...f, images: e.target.value }))} className="input" />
          </div>
          <button
            onClick={() => createSpecimen.mutate({
              title: specimenForm.title,
              description: specimenForm.description,
              minerals: specimenForm.minerals.split(",").map((s) => s.trim()).filter(Boolean),
              province: specimenForm.province,
              price: Number(specimenForm.price),
              images: specimenForm.images ? [specimenForm.images] : [],
              quantity: 1,
            })}
            disabled={!specimenForm.title || !specimenForm.price}
            className="btn-primary text-sm"
          >
            List Specimen
          </button>
        </div>
        {mySpecimens.length === 0 ? (
          <p className="text-sm text-stone-500">No specimens listed yet.</p>
        ) : (
          <div className="space-y-2">
            {mySpecimens.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-stone-200 p-3 text-sm">
                <div>
                  <p className="font-medium text-stone-800">{s.title}</p>
                  <p className="text-xs text-stone-500">{s.minerals.join(", ") || "No minerals"}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${s.price.toFixed(2)}</p>
                  <p className="text-xs text-stone-400">{s.available} available</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Link href="/dashboard/sites" className="text-sm font-medium text-brand-600 hover:underline">
        Manage my sites →
      </Link>
    </div>
  );
}
