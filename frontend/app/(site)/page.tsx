"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Calendar, Building2, ArrowRight, Gem, Map, Zap } from "lucide-react";
import { api } from "@/lib/api";
import { SiteCard } from "@/components/SiteCard";
import type { Find, FindFeedResponse, Site } from "@/lib/types";

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Discover",
    body: "Browse an interactive map of bookable mineral sites across Ontario. Filter by species, site type, and distance.",
    icon: Map,
  },
  {
    step: "02",
    title: "Book",
    body: "Real-time availability, instant confirmation, and secure Stripe payments. Group bookings supported.",
    icon: Calendar,
  },
  {
    step: "03",
    title: "Collect",
    body: "Show up, dig, and stamp your Digby passport. Log your finds in the field journal and earn badges.",
    icon: Gem,
  },
];

export default function HomePage() {
  const { data: sites = [] } = useQuery<Site[]>({
    queryKey: ["featured-sites"],
    queryFn: () => api.get("/api/sites?limit=3"),
  });

  const { data: haulData } = useQuery<FindFeedResponse>({
    queryKey: ["homepage-haul"],
    queryFn: () => api.get("/api/finds/feed?haul_only=true&limit=1"),
  });
  const featuredHaul = haulData?.items[0] ?? null;

  return (
    <div>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-stone-900 px-6 py-28 text-white">
        {/* Subtle texture overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(202,138,4,0.15),_transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(120,113,108,0.2),_transparent_60%)]" />

        <div className="relative mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-brand-400">
            Bancroft, Ontario &amp; Beyond
          </p>
          <h1 className="font-display mb-6 text-5xl leading-tight text-white sm:text-6xl">
            Canada&apos;s mineral heartland,<br />
            <span className="text-brand-400">one dig at a time.</span>
          </h1>
          <p className="mb-10 text-lg text-stone-300 sm:text-xl">
            Book pay-to-dig sites, guided mineral tours, and collecting walks
            across Ontario. From backyard quarries to gem-quality pegmatites.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/sites" className="btn-primary gap-2 px-7 py-3 text-base">
              Browse Sites <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/map" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/5 px-7 py-3 text-base font-semibold text-white backdrop-blur hover:bg-white/10 transition-colors">
              <Map className="h-4 w-4" /> View Map
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl text-stone-900 sm:text-4xl">How it works</h2>
          <p className="mt-3 text-stone-500">Three steps from your couch to your first crystal.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {HOW_IT_WORKS.map(({ step, title, body, icon: Icon }) => (
            <div key={step} className="card p-7">
              <p className="font-display mb-3 text-4xl text-brand-300">{step}</p>
              <div className="mb-3 flex items-center gap-2">
                <Icon className="h-5 w-5 text-brand-600" />
                <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
              </div>
              <p className="text-sm leading-relaxed text-stone-500">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured sites ───────────────────────────────────────────── */}
      {sites.length > 0 && (
        <section className="border-t border-stone-200/60 bg-white px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <h2 className="font-display text-3xl text-stone-900 sm:text-4xl">Featured sites</h2>
                <p className="mt-2 text-stone-500">Hand-picked collecting locations across Ontario.</p>
              </div>
              <Link href="/sites" className="hidden items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 sm:flex">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sites.slice(0, 3).map((site) => (
                <SiteCard key={site.id} site={site} />
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Link href="/sites" className="btn-secondary">View all sites</Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Featured haul ────────────────────────────────────────────── */}
      {featuredHaul && (
        <section className="border-t border-stone-200/60 bg-stone-50 px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500 mb-1">
                  What&apos;s in the bag
                </p>
                <h2 className="font-display text-3xl text-stone-900 sm:text-4xl">Latest haul</h2>
              </div>
              <Link href="/finds?haul_only=true" className="hidden items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 sm:flex">
                All hauls <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <Link
              href={`/finds/${featuredHaul.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm hover:shadow-md transition sm:flex-row"
            >
              {featuredHaul.photo_urls.length > 0 && (
                <div className="aspect-video overflow-hidden bg-stone-100 sm:aspect-square sm:w-72 shrink-0">
                  <img
                    src={featuredHaul.photo_urls[0]}
                    alt={featuredHaul.mineral_name}
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
              )}
              <div className="flex flex-col justify-center p-6 gap-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-brand-500" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">Haul</span>
                </div>
                <h3 className="font-display text-2xl text-stone-900">{featuredHaul.mineral_name}</h3>
                {featuredHaul.notes && (
                  <p className="text-stone-500 line-clamp-3">{featuredHaul.notes}</p>
                )}
                <div className="flex items-center gap-3 text-sm text-stone-400">
                  <span>{featuredHaul.author_name}</span>
                  {featuredHaul.site_name && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {featuredHaul.site_name}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ── UV Gallery promo ──────────────────────────────────────────── */}
      <section className="border-t border-stone-900 bg-stone-950 px-6 py-20">
        <div className="mx-auto max-w-5xl flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left sm:items-start sm:gap-16">
          <div className="shrink-0 grid grid-cols-2 gap-1.5 w-40">
            {["shadow-[0_0_20px_rgba(74,222,128,0.6)]","shadow-[0_0_20px_rgba(96,165,250,0.6)]","shadow-[0_0_20px_rgba(248,113,113,0.6)]","shadow-[0_0_20px_rgba(251,191,36,0.6)]"].map((glow, i) => (
              <div key={i} className={`aspect-square rounded-lg bg-stone-800 ${glow}`} />
            ))}
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500 mb-2">UV Gallery</p>
            <h2 className="font-display text-3xl text-white sm:text-4xl">
              Ontario minerals under ultraviolet light
            </h2>
            <p className="mt-3 text-stone-400 max-w-lg">
              Sodalite glows orange. Calcite lights up pink. Willemite goes radioactive green.
              These are real rocks from real sites — an hour and a half from Toronto.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/gallery/uv" className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-stone-900 hover:bg-stone-100 transition">
                Browse the gallery <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/shop?tag=uv" className="inline-flex items-center justify-center gap-2 rounded-lg border border-stone-700 px-6 py-2.5 text-sm font-semibold text-stone-300 hover:border-stone-500 hover:text-white transition">
                UV lamps from $29
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Operator CTA ─────────────────────────────────────────────── */}
      <section className="border-t border-stone-200/60 px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex rounded-full bg-brand-100 p-3">
            <Building2 className="h-6 w-6 text-brand-700" />
          </div>
          <h2 className="font-display mb-4 text-3xl text-stone-900 sm:text-4xl">
            Own land with mineral potential?
          </h2>
          <p className="mb-8 text-stone-500">
            List your site in minutes. Manage availability, accept bookings, and receive payouts — all in one place.
            Digby handles payments and takes just 12%.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/register?role=operator" className="btn-primary gap-2 px-7 py-3 text-base">
              List Your Site <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/sites" className="btn-secondary px-7 py-3 text-base">
              Browse as visitor
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-stone-200 bg-white px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 text-center sm:flex-row sm:justify-between">
          <p className="flex items-center gap-1.5 text-sm text-stone-400">
            <Gem className="h-4 w-4 text-brand-500" />
            © {new Date().getFullYear()} Digby.rocks
          </p>
          <p className="text-xs text-stone-400">Mineral Capital of Canada — Bancroft, Ontario</p>
        </div>
      </footer>
    </div>
  );
}
