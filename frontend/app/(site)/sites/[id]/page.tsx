"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BookingForm } from "@/components/BookingForm";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import type { Site, YieldReport, WeatherAlert, ScavengerHunt, Booking, DiaryEntry, SiteQuestion, FieldGuide } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface PartnerBusiness {
  id: string;
  name: string;
  tagline: string;
  url: string;
  perk: string;
  region: string;
  categories: string[];
}
import { MapPin, Clock, Users, AlertTriangle, Map, BookOpen, TrendingUp, Trophy, Leaf, HelpCircle, Send, CheckCircle2 } from "lucide-react";

const MINERAL_COLORS: Record<string, { bg: string; text: string }> = {
  amethyst:       { bg: "bg-violet-100",  text: "text-violet-700" },
  sodalite:       { bg: "bg-blue-100",    text: "text-blue-700" },
  feldspar:       { bg: "bg-sky-100",     text: "text-sky-700" },
  amazonite:      { bg: "bg-teal-100",    text: "text-teal-700" },
  garnet:         { bg: "bg-red-100",     text: "text-red-700" },
  calcite:        { bg: "bg-amber-100",   text: "text-amber-800" },
  pyrite:         { bg: "bg-yellow-100",  text: "text-yellow-700" },
  quartz:         { bg: "bg-stone-100",   text: "text-stone-600" },
  apatite:        { bg: "bg-cyan-100",    text: "text-cyan-700" },
  tourmaline:     { bg: "bg-pink-100",    text: "text-pink-700" },
  mica:           { bg: "bg-stone-100",   text: "text-stone-500" },
  corundum:       { bg: "bg-rose-100",    text: "text-rose-700" },
  fluorite:       { bg: "bg-purple-100",  text: "text-purple-700" },
  "native silver":{ bg: "bg-slate-100",   text: "text-slate-600" },
  "native copper":{ bg: "bg-orange-100",  text: "text-orange-700" },
  granite:        { bg: "bg-stone-200",   text: "text-stone-600" },
  fossil:         { bg: "bg-lime-100",    text: "text-lime-700" },
};
function mStyle(m: string) {
  return MINERAL_COLORS[m.toLowerCase()] ?? { bg: "bg-emerald-100", text: "text-emerald-700" };
}

export default function SitePage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [question, setQuestion] = useState("");
  const [questionSent, setQuestionSent] = useState(false);
  const [waitlistDate, setWaitlistDate] = useState("");
  const [waitlistJoined, setWaitlistJoined] = useState(false);

  const { data: site, isLoading } = useQuery<Site>({
    queryKey: ["site", id],
    queryFn: () => api.get(`/api/sites/${id}`),
  });

  const { data: alerts = [] } = useQuery<WeatherAlert[]>({
    queryKey: ["site-alerts", id],
    queryFn: () => api.get(`/api/weather-alerts/site/${id}`),
    enabled: !!id,
  });

  const { data: reports = [] } = useQuery<YieldReport[]>({
    queryKey: ["site-yields", id],
    queryFn: () => api.get(`/api/yield-reports/site/${id}`),
    enabled: !!id,
  });

  const { data: diaryEntries = [] } = useQuery<DiaryEntry[]>({
    queryKey: ["site-diary", id],
    queryFn: () => api.get(`/api/diary/site/${id}`),
    enabled: !!id,
  });

  const { data: partners = [] } = useQuery<PartnerBusiness[]>({
    queryKey: ["partners", site?.address],
    queryFn: () =>
      api.get(`/api/partners/near?region=${encodeURIComponent(site!.address + " " + site!.province)}`),
    enabled: !!site,
  });

  const { data: hunt } = useQuery<ScavengerHunt>({
    queryKey: ["site-hunt", id],
    queryFn: () => api.get(`/api/hunts/site/${id}`, { auth: true }),
    enabled: !!id && !!user,
    retry: false,
  });

  const { data: questions = [] } = useQuery<SiteQuestion[]>({
    queryKey: ["site-questions", id],
    queryFn: () => api.get(`/api/site-questions/site/${id}`),
    enabled: !!id,
  });

  const { data: leaderboard } = useQuery<{ top_minerals: {mineral:string;count:number}[]; top_finders: {name:string;entries:number}[]; total_entries: number }>({
    queryKey: ["site-leaderboard", id],
    queryFn: () => api.get(`/api/sites/${id}/leaderboard`),
    enabled: !!id,
  });

  const { data: relatedGuides = [] } = useQuery<FieldGuide[]>({
    queryKey: ["field-guides"],
    queryFn: () => api.get("/api/field-guides/"),
    enabled: !!site,
    select: (guides: FieldGuide[]) => guides.filter((g) =>
      g.mineral_tags.some((t) => site?.minerals.includes(t))
    ).slice(0, 3),
  });

  const askQuestion = useMutation({
    mutationFn: () => api.post("/api/site-questions/", { site_id: id, question }, { auth: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site-questions", id] });
      setQuestion("");
      setQuestionSent(true);
      setTimeout(() => setQuestionSent(false), 3000);
    },
  });

  const joinWaitlist = useMutation({
    mutationFn: () => api.post("/api/waitlist/", { site_id: id, date: waitlistDate }, { auth: true }),
    onSuccess: () => {
      setWaitlistJoined(true);
      setWaitlistDate("");
    },
  });

  const { data: myBookings = [] } = useQuery<Booking[]>({
    queryKey: ["my-bookings"],
    queryFn: () => api.get("/api/bookings/my", { auth: true }),
    enabled: !!user,
  });

  // Aggregate community mineral finds from diary entries
  const mineralCounts = diaryEntries.reduce<Record<string, number>>((acc, e) => {
    e.minerals_found.forEach((m) => { acc[m] = (acc[m] ?? 0) + 1; });
    return acc;
  }, {});
  const topMinerals = Object.entries(mineralCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const confirmedBookingForSite = myBookings.find(
    (b) => b.site_id === id && (b.status === "confirmed" || b.status === "completed")
  );

  if (isLoading) return <div className="flex h-64 items-center justify-center text-stone-500">Loading…</div>;
  if (!site) return <div className="p-8 text-center text-stone-500">Site not found.</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Weather alerts */}
      {alerts.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-800">Operator Alert</p>
              {alerts.map((a) => (
                <p key={a.id} className="text-sm text-amber-700">{a.message}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {hunt && confirmedBookingForSite && (
        <div className="mb-6 rounded-xl border border-brand-200 bg-brand-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Map className="h-5 w-5 text-brand-600" />
              <div>
                <p className="font-semibold text-brand-800">Scavenger Hunt available</p>
                <p className="text-sm text-brand-600">{hunt.title} · {hunt.items.length} items</p>
              </div>
            </div>
            <Link href={`/sites/${id}/hunt?booking=${confirmedBookingForSite.id}`} className="btn-primary text-sm">
              Start hunt
            </Link>
          </div>
        </div>
      )}

      {hunt && !confirmedBookingForSite && (
        <div className="mb-6 rounded-xl border border-stone-200 bg-stone-50 p-4">
          <div className="flex items-center gap-2">
            <Map className="h-5 w-5 text-stone-400" />
            <div>
              <p className="font-semibold text-stone-700">Scavenger Hunt: {hunt.title}</p>
              <p className="text-sm text-stone-500">{hunt.items.length} items to find — book this site to play</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Details */}
        <div className="lg:col-span-3">
          {site.images[0] && (
            <img src={site.images[0]} alt={site.name} className="mb-6 h-80 w-full rounded-lg object-cover shadow-[0_4px_20px_rgba(0,0,0,0.12)]" />
          )}
          <div className="mb-2 flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-4xl text-stone-900">{site.name}</h1>
            {site.is_open_today && (
              <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                <CheckCircle2 className="h-4 w-4" /> Open Today
              </span>
            )}
          </div>
          <p className="mb-4 flex items-center gap-1.5 text-stone-500">
            <MapPin className="h-4 w-4" /> {site.address}, {site.province}
          </p>

          <div className="mb-6 flex flex-wrap gap-2">
            {site.minerals.map((m) => {
              const { bg, text } = mStyle(m);
              return (
                <span key={m} className={`rounded-full px-3 py-1 text-xs font-medium ${bg} ${text}`}>{m}</span>
              );
            })}
          </div>

          <p className="mb-6 leading-relaxed text-stone-700">{site.description}</p>

          <div className="grid grid-cols-2 gap-4 rounded-xl bg-stone-100 p-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-stone-500" />
              <span>{site.duration_hours}h session</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-stone-500" />
              <span>Up to {site.max_group_size} people</span>
            </div>
          </div>

          {site.rules && (
            <div className="mt-6">
              <h3 className="mb-2 font-semibold text-stone-800">Site rules</h3>
              <p className="whitespace-pre-line text-sm text-stone-600">{site.rules}</p>
            </div>
          )}

          {/* Community aggregate minerals */}
          {topMinerals.length > 0 && (
            <div className="mt-8 rounded-xl border border-brand-200 bg-brand-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-brand-600" />
                <h3 className="font-semibold text-stone-800">
                  Community finds
                  <span className="ml-2 text-xs font-normal text-stone-500">
                    from {diaryEntries.length} field journal{diaryEntries.length !== 1 ? "s" : ""}
                  </span>
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {topMinerals.map(([mineral, count]) => (
                  <span
                    key={mineral}
                    className="flex items-center gap-1.5 rounded-full bg-white border border-brand-200 px-3 py-1 text-xs font-medium text-brand-700"
                  >
                    {mineral}
                    <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-brand-600 font-semibold">
                      {count}×
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Yield reports */}
          {reports.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-3 font-semibold text-stone-800">Recent Finds</h3>
              <div className="space-y-3">
                {reports.slice(0, 5).map((r) => (
                  <div key={r.id} className="rounded-lg border border-stone-200 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-stone-800">
                        {new Date(r.session_date).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>
                    {r.minerals_found.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {r.minerals_found.map((m) => (
                          <span key={m} className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">{m}</span>
                        ))}
                      </div>
                    )}
                    {r.quantity_notes && <p className="mt-1 text-xs text-stone-500">{r.quantity_notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* From the Field — diary entries */}
          {diaryEntries.length > 0 && (
            <div className="mt-8">
              <div className="mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-stone-500" />
                <h3 className="font-semibold text-stone-800">From the Field</h3>
              </div>
              <div className="space-y-3">
                {diaryEntries.slice(0, 4).map((e) => (
                  <Link key={e.id} href={`/diary/${e.id}`} className="block rounded-lg border border-stone-200 p-3 hover:border-brand-300 hover:bg-brand-50 transition-colors">
                    <p className="font-medium text-stone-800 text-sm">{e.title}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{e.visitor_name} · {new Date(e.visit_date).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}</p>
                    {e.minerals_found.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {e.minerals_found.slice(0, 4).map((m) => (
                          <span key={m} className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">{m}</span>
                        ))}
                      </div>
                    )}
                    {e.body && <p className="mt-1 text-xs text-stone-500 line-clamp-2">{e.body}</p>}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {/* Leaderboard */}
          {leaderboard && leaderboard.total_entries > 0 && (
            <div className="mt-8">
              <div className="mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                <h3 className="font-semibold text-stone-800">Site Leaderboard</h3>
                <span className="text-xs text-stone-400">{leaderboard.total_entries} journal{leaderboard.total_entries !== 1 ? "s" : ""}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {leaderboard.top_minerals.slice(0, 4).length > 0 && (
                  <div className="rounded-lg border border-stone-200 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">Top finds</p>
                    <div className="space-y-1">
                      {leaderboard.top_minerals.slice(0, 4).map((m, i) => (
                        <div key={m.mineral} className="flex items-center justify-between text-sm">
                          <span className={i === 0 ? "font-semibold text-amber-700" : "text-stone-700"}>{m.mineral}</span>
                          <span className="text-stone-400 text-xs">{m.count}×</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {leaderboard.top_finders.length > 0 && (
                  <div className="rounded-lg border border-stone-200 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">Top finders</p>
                    <div className="space-y-1">
                      {leaderboard.top_finders.slice(0, 4).map((f, i) => (
                        <div key={f.name + i} className="flex items-center justify-between text-sm">
                          <span className={i === 0 ? "font-semibold text-amber-700" : "text-stone-700"}>{f.name}</span>
                          <span className="text-stone-400 text-xs">{f.entries} trip{f.entries !== 1 ? "s" : ""}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Related field guides */}
          {relatedGuides.length > 0 && (
            <div className="mt-8">
              <div className="mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-brand-500" />
                <h3 className="font-semibold text-stone-800">Field Guides for this Site</h3>
              </div>
              <div className="space-y-2">
                {relatedGuides.map((g) => (
                  <Link key={g.id} href={`/mineral-school/${g.slug}`}
                    className="flex items-center justify-between rounded-lg border border-stone-200 p-3 hover:border-brand-300 hover:bg-brand-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-stone-800">{g.title}</p>
                      <div className="mt-0.5 flex gap-1">
                        {g.mineral_tags.filter((t) => site.minerals.includes(t)).map((t) => (
                          <span key={t} className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">{t}</span>
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-stone-400 capitalize">{g.difficulty}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Q&A */}
          <div className="mt-8">
            <div className="mb-3 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-stone-500" />
              <h3 className="font-semibold text-stone-800">Questions & Answers</h3>
            </div>
            {questions.length > 0 && (
              <div className="mb-4 space-y-3">
                {questions.map((q) => (
                  <div key={q.id} className="rounded-lg border border-stone-200 p-3">
                    <p className="text-sm font-medium text-stone-800">Q: {q.question}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{q.visitor_name}</p>
                    {q.answer && (
                      <p className="mt-2 rounded bg-brand-50 p-2 text-sm text-brand-800">A: {q.answer}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {user ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question about this site…"
                  className="input flex-1 text-sm"
                  onKeyDown={(e) => { if (e.key === "Enter" && question.trim()) askQuestion.mutate(); }}
                />
                <button
                  onClick={() => askQuestion.mutate()}
                  disabled={!question.trim() || askQuestion.isPending}
                  className="btn-primary text-sm gap-1"
                >
                  {questionSent ? <><CheckCircle2 className="h-4 w-4" /> Sent</> : <><Send className="h-4 w-4" /> Ask</>}
                </button>
              </div>
            ) : (
              <p className="text-sm text-stone-400">
                <Link href="/login" className="text-brand-600 hover:underline">Sign in</Link> to ask a question.
              </p>
            )}
          </div>

          {/* Waitlist */}
          {user && (
            <div className="mt-6 rounded-xl border border-stone-200 p-4">
              <p className="mb-2 text-sm font-medium text-stone-700">Can&apos;t find availability? Join the waitlist.</p>
              {waitlistJoined ? (
                <p className="flex items-center gap-1.5 text-sm text-green-700">
                  <CheckCircle2 className="h-4 w-4" /> You&apos;re on the waitlist — we&apos;ll email you if a spot opens.
                </p>
              ) : (
                <div className="flex gap-2">
                  <input type="date" value={waitlistDate} onChange={(e) => setWaitlistDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]} className="input text-sm" />
                  <button
                    onClick={() => joinWaitlist.mutate()}
                    disabled={!waitlistDate || joinWaitlist.isPending}
                    className="btn-secondary text-sm whitespace-nowrap"
                  >
                    {joinWaitlist.isPending ? "Joining…" : "Join waitlist"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Local partners */}
          {partners.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-3 text-sm font-medium text-stone-400 uppercase tracking-wide">
                Near this site
              </h3>
              <div className="space-y-2">
                {partners.map((p) => (
                  <div key={p.id} className="flex items-start gap-3 rounded-lg border border-stone-100 bg-stone-50 p-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        {p.url ? (
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-stone-800 hover:text-brand-600"
                          >
                            {p.name}
                          </a>
                        ) : (
                          <span className="text-sm font-medium text-stone-800">{p.name}</span>
                        )}
                        {p.categories[0] && (
                          <span className="text-xs text-stone-400">{p.categories[0]}</span>
                        )}
                      </div>
                      {p.tagline && (
                        <p className="text-xs text-stone-500 mt-0.5">{p.tagline}</p>
                      )}
                      {p.perk && (
                        <p className="mt-1 text-xs font-medium text-brand-700 bg-brand-50 border border-brand-100 rounded px-2 py-0.5 inline-block">
                          {p.perk}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-stone-300">Partner listings</p>
            </div>
          )}
        </div>

        {/* Booking panel */}
        <div className="lg:col-span-2">
          <div className="card sticky top-24 p-6">
            <p className="mb-1 text-2xl font-bold text-stone-900">
              ${site.price_per_person.toFixed(2)}
              <span className="text-base font-normal text-stone-500"> / person</span>
            </p>
            <p className="mb-4 text-xs uppercase tracking-wide text-stone-500">{site.site_type.replace("-", " ")}</p>
            {site.conservation_contribution > 0 && (
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-green-50 border border-green-200 p-3 text-xs">
                <Leaf className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <div>
                  <span className="font-semibold text-green-800">${site.conservation_contribution.toFixed(2)} per booking</span>
                  <span className="text-green-700"> {site.conservation_note || "goes to conservation"}</span>
                </div>
              </div>
            )}
            <BookingForm site={site} />
          </div>
        </div>
      </div>
    </div>
  );
}
