import Link from "next/link";
import { MapPin, Star, Clock } from "lucide-react";
import type { Site } from "@/lib/types";

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
  marble:         { bg: "bg-stone-100",   text: "text-stone-500" },
  fossil:         { bg: "bg-lime-100",    text: "text-lime-700" },
};

function mineralStyle(mineral: string) {
  const key = mineral.toLowerCase();
  return MINERAL_COLORS[key] ?? { bg: "bg-emerald-100", text: "text-emerald-700" };
}

export function SiteCard({ site }: { site: Site }) {
  return (
    <Link
      href={`/sites/${site.id}`}
      className="card block overflow-hidden transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.11)] hover:-translate-y-0.5"
    >
      {site.images[0] ? (
        <img
          src={site.images[0]}
          alt={site.name}
          className="h-44 w-full object-cover"
        />
      ) : (
        <div className="flex h-44 items-center justify-center bg-stone-100">
          <span className="text-5xl opacity-30">🪨</span>
        </div>
      )}
      <div className="p-4">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="font-semibold text-stone-900 leading-tight">{site.name}</h3>
          {site.review_count > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-xs text-stone-500">
              <Star className="h-3.5 w-3.5 fill-brand-400 text-brand-400" />
              {site.rating.toFixed(1)}
            </span>
          )}
        </div>
        <p className="mb-3 flex items-center gap-1 text-xs text-stone-400">
          <MapPin className="h-3.5 w-3.5 shrink-0" /> {site.address}
        </p>
        <div className="mb-3 flex flex-wrap gap-1">
          {site.minerals.slice(0, 3).map((m) => {
            const { bg, text } = mineralStyle(m);
            return (
              <span key={m} className={`rounded-full px-2 py-0.5 text-xs font-medium ${bg} ${text}`}>
                {m}
              </span>
            );
          })}
          {site.minerals.length > 3 && (
            <span className="text-xs text-stone-400">+{site.minerals.length - 3}</span>
          )}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-stone-400 text-xs">
            <Clock className="h-3.5 w-3.5" /> {site.duration_hours}h
          </span>
          <span className="font-bold text-stone-900">${site.price_per_person.toFixed(2)}<span className="text-xs font-normal text-stone-400">/person</span></span>
        </div>
      </div>
    </Link>
  );
}
