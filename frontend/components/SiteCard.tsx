import Link from "next/link";
import { MapPin, Star, Clock } from "lucide-react";
import type { Site } from "@/lib/types";

export function SiteCard({ site }: { site: Site }) {
  return (
    <Link href={`/sites/${site.id}`} className="card block overflow-hidden hover:shadow-md transition-shadow">
      {site.images[0] ? (
        <img
          src={site.images[0]}
          alt={site.name}
          className="h-44 w-full object-cover"
        />
      ) : (
        <div className="flex h-44 items-center justify-center bg-stone-100 text-stone-400">
          <span className="text-4xl">🪨</span>
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
        <p className="mb-2 flex items-center gap-1 text-xs text-stone-500">
          <MapPin className="h-3.5 w-3.5" /> {site.address}
        </p>
        <div className="mb-3 flex flex-wrap gap-1">
          {site.minerals.slice(0, 3).map((m) => (
            <span key={m} className="rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-700">
              {m}
            </span>
          ))}
          {site.minerals.length > 3 && (
            <span className="text-xs text-stone-400">+{site.minerals.length - 3}</span>
          )}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-stone-500">
            <Clock className="h-3.5 w-3.5" /> {site.duration_hours}h
          </span>
          <span className="font-bold text-stone-900">${site.price_per_person.toFixed(2)}/person</span>
        </div>
      </div>
    </Link>
  );
}
