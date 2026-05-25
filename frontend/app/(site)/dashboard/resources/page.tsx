"use client";

import Link from "next/link";
import { ExternalLink, BookOpen, FileText, Shield, TrendingUp, Pickaxe, MapPin } from "lucide-react";

const RESOURCES = [
  {
    category: "Getting started",
    icon: <BookOpen className="h-5 w-5 text-brand-600" />,
    items: [
      { title: "Operator onboarding guide", desc: "From Stripe setup to your first live booking — step by step.", href: "/learn", external: false },
      { title: "Site listing best practices", desc: "Photos, descriptions, and pricing that convert browsers into bookers.", href: "/dashboard/sites", external: false },
      { title: "Setting availability", desc: "How to open dates, set slot limits, and manage blackout periods.", href: "/dashboard/sites", external: false },
    ],
  },
  {
    category: "Legal & safety",
    icon: <Shield className="h-5 w-5 text-amber-600" />,
    items: [
      { title: "Liability waiver template (Ontario)", desc: "Standard waiver covering group bookings, minors, and field safety. Customize before use.", href: "#", external: false },
      { title: "Mining Act — surface access basics", desc: "What operators on Crown Land and private land need to know.", href: "https://www.ontario.ca/laws/statute/90m14", external: true },
      { title: "Ontario Parks collecting rules", desc: "What's permitted, what isn't. Provincial Parks are off limits for commercial operations.", href: "https://www.ontarioparks.com", external: true },
    ],
  },
  {
    category: "Payments & payouts",
    icon: <TrendingUp className="h-5 w-5 text-green-600" />,
    items: [
      { title: "How Stripe Connect works", desc: "How Digby handles payments, the 12% platform fee, and when you get paid.", href: "/dashboard/settings", external: false },
      { title: "Payout schedule", desc: "Payouts are sent bi-weekly. See the current schedule and upcoming dates.", href: "/dashboard/settings", external: false },
      { title: "Invoicing and tax records", desc: "Access your payout history and download statements from your Stripe dashboard.", href: "https://dashboard.stripe.com", external: true },
    ],
  },
  {
    category: "Citizen science",
    icon: <Pickaxe className="h-5 w-5 text-stone-600" />,
    items: [
      { title: "Why citizen science matters for operators", desc: "Operators generate the richest find data on the platform. Here's how to contribute to OGS records.", href: "/dashboard/bookings", external: false },
      { title: "OMI occurrence database", desc: "Search the Ontario Mineral Inventory — the same dataset your finds can feed into.", href: "https://geologyontario.mines.gov.on.ca", external: true },
      { title: "Yield report guide", desc: "How to log session data that counts toward provincial geological records.", href: "/dashboard/bookings", external: false },
    ],
  },
  {
    category: "Growing your site",
    icon: <MapPin className="h-5 w-5 text-brand-600" />,
    items: [
      { title: "Seasonal windows", desc: "Tag your site with optimal collecting months to appear in mineral-interest alerts.", href: "/dashboard/sites", external: false },
      { title: "Scavenger hunts", desc: "Add a hunt to your site to give visitors a structured challenge and increase dwell time.", href: "/dashboard/hunts", external: false },
      { title: "Community board", desc: "Talk to other operators about pricing, safety, and seasonal patterns.", href: "/dashboard/community", external: false },
    ],
  },
];

export default function ResourcesPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 pb-24 md:pb-8">
      <div>
        <h1 className="font-display text-2xl text-stone-900">Resources</h1>
        <p className="mt-0.5 text-sm text-stone-400">Guides, templates, and reference material for Digby operators</p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Waiver template", href: "#", icon: <FileText className="h-5 w-5" /> },
          { label: "Payout history", href: "/dashboard/settings", icon: <TrendingUp className="h-5 w-5" /> },
          { label: "Community board", href: "/dashboard/community", icon: <BookOpen className="h-5 w-5" /> },
          { label: "OGS database", href: "https://geologyontario.mines.gov.on.ca", icon: <Pickaxe className="h-5 w-5" /> },
        ].map(({ label, href, icon }) => (
          <Link key={label} href={href}
            className="card flex flex-col items-center gap-2 p-4 text-center transition-shadow hover:shadow-md group">
            <span className="text-brand-600 group-hover:text-brand-700">{icon}</span>
            <span className="text-xs font-medium text-stone-700">{label}</span>
          </Link>
        ))}
      </div>

      {/* Resource sections */}
      {RESOURCES.map((section) => (
        <section key={section.category}>
          <div className="mb-3 flex items-center gap-2">
            {section.icon}
            <h2 className="text-sm font-semibold text-stone-800">{section.category}</h2>
          </div>
          <div className="space-y-2">
            {section.items.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                className="card flex items-start gap-4 p-4 transition-shadow hover:shadow-md group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-stone-800 group-hover:text-brand-600 transition-colors">{item.title}</p>
                    {item.external && <ExternalLink className="h-3 w-3 text-stone-300 shrink-0" />}
                  </div>
                  <p className="mt-0.5 text-xs text-stone-500">{item.desc}</p>
                </div>
                <span className="shrink-0 text-stone-300 group-hover:text-brand-400 transition-colors">→</span>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {/* Feedback prompt */}
      <div className="rounded-xl border border-stone-200 bg-stone-50 p-5 text-center">
        <p className="text-sm text-stone-600">
          Missing something? Tell us what resources would help you run your site.
        </p>
        <Link href="/dashboard/community" className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline">
          Post on the operator board →
        </Link>
      </div>
    </div>
  );
}
