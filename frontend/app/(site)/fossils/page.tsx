"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Site } from "@/lib/types";
import { SiteCard } from "@/components/SiteCard";

const ONTARIO_FOSSIL_SITES = [
  {
    region: "Bruce Peninsula & Niagara Escarpment",
    age: "Silurian — ~420 million years",
    description:
      "Ancient tropical sea floor. The Escarpment exposes reef limestone packed with coral, stromatoporoids, crinoids, brachiopods, and trilobite fragments. Some of the most accessible Palaeozoic fossil hunting in eastern Canada.",
    finds: ["Colonial coral", "Brachiopods", "Crinoid stems", "Stromatoporoids", "Horn coral"],
  },
  {
    region: "Lake Simcoe & Barrie Area",
    age: "Ordovician — ~450 million years",
    description:
      "Ordovician limestone and shale outcrops around the lake and in nearby quarries. Classic Ontario trilobite country — Isotelus is the provincial fossil of Ontario and was first described from Ordovician rocks in this region.",
    finds: ["Isotelus trilobites", "Cephalopods", "Gastropods", "Bryozoans", "Brachiopods"],
  },
  {
    region: "Scarborough & Lake Erie Bluffs",
    age: "Pleistocene — ~50,000 years",
    description:
      "Interglacial deposits in the bluffs contain Pleistocene megafauna remains and plant material. Erosion continually exposes new material, especially after storm events.",
    finds: ["Mastodon fragments", "Pleistocene plants", "Freshwater shells", "Insect inclusions"],
  },
  {
    region: "Southern Ontario Quarries",
    age: "Devonian — ~385 million years",
    description:
      "Active and former limestone quarries across southwestern Ontario expose Devonian reef communities. Rich in fish remains, large corals, and complete invertebrate specimens.",
    finds: ["Devonian fish", "Hexagonaria coral", "Productid brachiopods", "Rugose coral"],
  },
];

export default function FossilsPage() {
  const { data: sites = [], isLoading } = useQuery<Site[]>({
    queryKey: ["sites-fossil"],
    queryFn: () => api.get("/api/sites?category=fossil"),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Header */}
      <div className="mb-12">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
          Palaeontology
        </p>
        <h1 className="font-display text-4xl text-stone-900">
          Fossil hunting in Ontario
        </h1>
        <p className="mt-3 max-w-xl text-lg text-stone-500 leading-relaxed">
          Ontario sits on some of the most fossil-rich Palaeozoic rock in North America.
          From Ordovician trilobites near Lake Simcoe to Silurian reefs along the Niagara
          Escarpment, the geology here is remarkable — and accessible.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/sites?category=fossil" className="btn-primary">
            Browse fossil sites →
          </Link>
          <Link
            href="/sites"
            className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            All dig sites
          </Link>
        </div>
      </div>

      {/* Ontario's fossil record */}
      <section className="mb-14">
        <h2 className="mb-6 font-display text-2xl text-stone-900">Ontario&rsquo;s fossil record</h2>
        <div className="space-y-4">
          {ONTARIO_FOSSIL_SITES.map(({ region, age, description, finds }) => (
            <div key={region} className="card p-6">
              <div className="mb-3 flex flex-wrap items-baseline gap-3">
                <h3 className="font-semibold text-stone-900">{region}</h3>
                <span className="text-xs font-medium text-stone-400">{age}</span>
              </div>
              <p className="mb-3 text-sm text-stone-600 leading-relaxed">{description}</p>
              <div className="flex flex-wrap gap-1.5">
                {finds.map((f) => (
                  <span
                    key={f}
                    className="rounded-full bg-lime-100 px-2.5 py-0.5 text-xs font-medium text-lime-700"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Live fossil sites */}
      <section className="mb-14">
        <h2 className="mb-2 font-display text-2xl text-stone-900">Bookable fossil sites</h2>
        <p className="mb-6 text-stone-500">
          Pay-to-dig and guided fossil hunting sites listed on Digby.
        </p>

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-stone-100" />
            ))}
          </div>
        ) : sites.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-8 py-12 text-center">
            <p className="font-medium text-stone-600">No fossil sites listed yet.</p>
            <p className="mt-1.5 text-sm text-stone-400">
              Own land with exposed fossil-bearing rock? List it on Digby.
            </p>
            <Link href="/dashboard" className="btn-primary mt-5 inline-block">
              List your site →
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sites.map((site) => (
              <SiteCard key={site.id} site={site} />
            ))}
          </div>
        )}
      </section>

      {/* What to know */}
      <section className="mb-14 rounded-2xl border border-lime-200 bg-lime-50 p-8">
        <h2 className="mb-4 font-display text-xl text-stone-900">Before you go</h2>
        <ul className="space-y-3 text-sm text-stone-700">
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lime-500" />
            <span>
              <strong>Ontario fossil law:</strong> Fossils found on Crown land belong to the Crown.
              Sites listed on Digby are on private land — you keep what you find under the site&rsquo;s
              stated rules.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lime-500" />
            <span>
              <strong>Tools:</strong> Most fossil sites are surface collecting or soft sediment work.
              A rock hammer, cold chisel, and brush are usually sufficient. Ask the site operator
              before bringing power equipment.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lime-500" />
            <span>
              <strong>Identification:</strong> Ontario&rsquo;s Ordovician and Silurian fauna is well-documented.
              The Royal Ontario Museum has reference collections, and the Digby community can help
              ID unusual finds.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lime-500" />
            <span>
              <strong>Best season:</strong> Spring and fall, after frost heave and rain have
              exposed fresh surfaces. Summer works but vegetation can obscure outcrops.
            </span>
          </li>
        </ul>
      </section>

      {/* Host CTA */}
      <section className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
        <h2 className="font-display text-xl text-stone-900">
          Do you have fossil-bearing rock on your land?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-stone-500">
          Niagara Escarpment exposures, quarry faces, lakeshore outcrops — if you have
          Palaeozoic limestone and you&rsquo;d like to host fossil hunters, list your site on Digby.
        </p>
        <Link href="/dashboard" className="btn-primary mt-5 inline-block">
          Become a host →
        </Link>
      </section>
    </div>
  );
}
