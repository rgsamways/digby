"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Site } from "@/lib/types";
import { Plus, MapPin } from "lucide-react";

export default function OperatorSitesPage() {
  const { data: sites = [], isLoading } = useQuery<Site[]>({
    queryKey: ["my-sites"],
    queryFn: () => api.get("/api/sites?my=true", { auth: true }),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">My sites</h1>
        <Link href="/dashboard/sites/new" className="btn-primary gap-2">
          <Plus className="h-4 w-4" /> Add site
        </Link>
      </div>

      {isLoading ? (
        <p className="text-stone-500">Loading…</p>
      ) : sites.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="mb-4 text-stone-500">You haven&apos;t listed any sites yet.</p>
          <Link href="/dashboard/sites/new" className="btn-primary">
            List your first site
          </Link>
        </div>
      ) : (
        <div className="card divide-y divide-stone-100">
          {sites.map((site) => (
            <div key={site.id} className="flex items-center gap-4 px-5 py-4">
              <MapPin className="h-5 w-5 flex-shrink-0 text-stone-400" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-stone-900">{site.name}</p>
                <p className="text-sm text-stone-500">{site.address}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">${site.price_per_person}/person</p>
                <span
                  className={`text-xs ${site.is_active ? "text-green-600" : "text-stone-400"}`}
                >
                  {site.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <Link href={`/sites/${site.id}`} className="btn-secondary text-xs">
                View
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
