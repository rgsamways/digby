import Link from "next/link";
import { GraduationCap, FileText, MapPin, CheckCircle } from "lucide-react";

const CURRICULUM = [
  {
    grade: "Grade 4",
    strand: "Rocks, Minerals & Erosion",
    expectations: [
      "Identify and classify common rocks and minerals by observable properties",
      "Describe how rocks and minerals are used in everyday life",
      "Describe the physical properties of the three classes of rocks",
    ],
    note: "Dig sites give students hands-on identification practice with real specimens in context.",
  },
  {
    grade: "Grade 8",
    strand: "Earth and Space Systems",
    expectations: [
      "Investigate the characteristics and properties of minerals found in rocks",
      "Demonstrate an understanding of the relationship between the properties of minerals and their practical uses",
      "Explain the processes by which rocks are formed, changed, and broken down",
    ],
    note: "A site visit makes the rock cycle concrete — students see stratification, erosion, and mineralization in place.",
  },
  {
    grade: "Secondary — Earth Science (Gr. 11/12)",
    strand: "Earth Materials",
    expectations: [
      "Classify minerals using physical and chemical properties",
      "Describe the processes involved in the formation of igneous, sedimentary, and metamorphic rocks",
      "Analyze the economic and environmental significance of mineral resources",
    ],
    note: "Ontario has one of the most mineral-diverse geological records in Canada. Secondary students benefit from site-specific context.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Find a site",
    body: "Browse by mineral type, location, or site type. Filter for group-friendly capacity.",
  },
  {
    step: "2",
    title: "Request or book",
    body: "Pay by card, or request an invoice if your school requires a purchase order. Booking held until payment confirmed.",
  },
  {
    step: "3",
    title: "Arrive and dig",
    body: "Your group arrives on the booked date. The site operator handles access and safety briefing.",
  },
  {
    step: "4",
    title: "Connect to curriculum",
    body: "Students collect specimens, complete identification activities, and bring real geology back to the classroom.",
  },
];

export default function EducatorsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Header */}
      <div className="mb-12">
        <div className="mb-3 flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-stone-400" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
            Educators
          </p>
        </div>
        <h1 className="font-display text-4xl text-stone-900">
          Bring the rock cycle to life.
        </h1>
        <p className="mt-3 max-w-xl text-lg text-stone-500 leading-relaxed">
          Digby connects Ontario classrooms with real dig sites. Students collect actual specimens,
          identify minerals in context, and see Ontario&rsquo;s geological record firsthand.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/sites" className="btn-primary">
            Find sites for your class →
          </Link>
          <Link
            href="/sites"
            className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Browse by mineral
          </Link>
        </div>
      </div>

      {/* How it works */}
      <section className="mb-14">
        <h2 className="mb-6 font-display text-2xl text-stone-900">How it works</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map(({ step, title, body }) => (
            <div key={step} className="card p-5">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {step}
              </div>
              <p className="mb-1 text-sm font-semibold text-stone-900">{title}</p>
              <p className="text-sm text-stone-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Invoice / PO checkout */}
      <section className="mb-14 rounded-2xl border border-stone-200 bg-stone-50 p-8">
        <div className="flex items-start gap-4">
          <FileText className="mt-0.5 h-6 w-6 shrink-0 text-stone-400" />
          <div>
            <h2 className="font-display text-xl text-stone-900">Purchase orders &amp; invoices</h2>
            <p className="mt-2 text-stone-600">
              Schools that can&rsquo;t pay by credit card can request an invoice at checkout.
              Select &ldquo;Request an invoice instead of paying by card&rdquo; when booking,
              enter your PO number if you have one, and the site operator will send an invoice
              within 2 business days.
            </p>
            <ul className="mt-4 space-y-1.5">
              {[
                "Booking held pending invoice payment",
                "PO number stored with the booking for your records",
                "Operator contacts you directly via email",
                "Works for any group size — no minimum",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-stone-600">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Ontario curriculum alignment */}
      <section className="mb-14">
        <h2 className="mb-2 font-display text-2xl text-stone-900">Ontario curriculum alignment</h2>
        <p className="mb-6 text-stone-500">
          Dig site visits directly support expectations in the Ontario Science and Technology
          curriculum. Below are the most relevant connections.
        </p>
        <div className="space-y-5">
          {CURRICULUM.map(({ grade, strand, expectations, note }) => (
            <div key={grade} className="card p-6">
              <div className="mb-3 flex flex-wrap items-baseline gap-2">
                <span className="text-sm font-bold text-stone-900">{grade}</span>
                <span className="text-sm text-stone-400">—</span>
                <span className="text-sm font-medium text-brand-700">{strand}</span>
              </div>
              <ul className="mb-3 space-y-1.5">
                {expectations.map((e) => (
                  <li key={e} className="flex items-start gap-2 text-sm text-stone-600">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-300" />
                    {e}
                  </li>
                ))}
              </ul>
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 leading-relaxed">
                {note}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-stone-400">
          Curriculum references: Ontario Ministry of Education Science and Technology, Grades 1–8
          (2022) and Science, Grades 11 and 12 (2008, revised). Site visits may also support
          Indigenous ways of knowing expectations around land and resource relationships.
        </p>
      </section>

      {/* Find a site CTA */}
      <section className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
        <MapPin className="mx-auto mb-3 h-8 w-8 text-stone-300" />
        <h2 className="font-display text-xl text-stone-900">Find a site near you</h2>
        <p className="mx-auto mt-2 max-w-sm text-stone-500">
          Browse pay-to-dig sites across Ontario. Filter by mineral type, group capacity,
          and distance from your school.
        </p>
        <Link href="/sites" className="btn-primary mt-5 inline-block">
          Browse dig sites →
        </Link>
      </section>
    </div>
  );
}
