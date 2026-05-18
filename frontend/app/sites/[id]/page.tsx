import { BookingForm } from "@/components/BookingForm";
import { api } from "@/lib/api";
import type { Site } from "@/lib/types";
import { MapPin, Clock, Users } from "lucide-react";

export default async function SitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const site: Site = await api.get(`/api/sites/${id}`);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-5">
        {/* Details */}
        <div className="lg:col-span-3">
          {site.images[0] && (
            <img
              src={site.images[0]}
              alt={site.name}
              className="mb-6 h-64 w-full rounded-xl object-cover"
            />
          )}
          <h1 className="mb-2 text-3xl font-extrabold text-stone-900">{site.name}</h1>
          <p className="mb-4 flex items-center gap-1.5 text-stone-500">
            <MapPin className="h-4 w-4" /> {site.address}, {site.province}
          </p>

          <div className="mb-6 flex flex-wrap gap-2">
            {site.minerals.map((m) => (
              <span key={m} className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">
                {m}
              </span>
            ))}
          </div>

          <p className="mb-6 text-stone-700 leading-relaxed">{site.description}</p>

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
              <p className="text-sm text-stone-600 whitespace-pre-line">{site.rules}</p>
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
            <p className="mb-5 text-xs text-stone-500 uppercase tracking-wide">{site.site_type.replace("-", " ")}</p>
            <BookingForm site={site} />
          </div>
        </div>
      </div>
    </div>
  );
}
