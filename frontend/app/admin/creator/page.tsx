"use client";

import { useEffect, useState } from "react";
import { creatorAdminApi, type CreatorApplication } from "@/lib/admin";

const TIERS = [
  { value: "explorer", label: "Explorer" },
  { value: "field_geologist", label: "Field Geologist" },
  { value: "resident_geologist", label: "Resident Geologist" },
];

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  other: "Other / Blog",
};

export default function AdminCreatorPage() {
  const [applications, setApplications] = useState<CreatorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setApplications(await creatorAdminApi.listApplications());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function approve(userId: string, tier: string) {
    setActing(userId);
    try {
      await creatorAdminApi.approve(userId, tier);
      await load();
    } finally {
      setActing(null);
    }
  }

  async function reject(userId: string) {
    setActing(userId);
    try {
      await creatorAdminApi.reject(userId);
      await load();
    } finally {
      setActing(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-stone-900 tracking-tight">Creator Applications</h1>
        <p className="mt-0.5 text-sm text-stone-400">{applications.length} pending</p>
      </div>

      {loading ? (
        <p className="text-sm text-stone-400">Loading…</p>
      ) : applications.length === 0 ? (
        <p className="text-sm text-stone-400">No pending applications.</p>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="rounded-xl border border-stone-200 bg-white shadow-sm p-5"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-semibold text-stone-900">{app.name}</p>
                  <p className="text-sm text-stone-400">{app.email}</p>
                  {app.creator_application_at && (
                    <p className="text-xs text-stone-400 mt-0.5">
                      Applied {new Date(app.creator_application_at).toLocaleDateString("en-CA")}
                    </p>
                  )}
                </div>
                {app.creator_application_platform && (
                  <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700 shrink-0">
                    {PLATFORM_LABELS[app.creator_application_platform] ?? app.creator_application_platform}
                  </span>
                )}
              </div>

              {app.creator_application_handle && (
                <div className="mb-2 rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-600 font-mono">
                  <span className="text-stone-400">Handle: </span>@{app.creator_application_handle}
                </div>
              )}

              {app.content_url && (
                <div className="mb-2">
                  <a
                    href={app.content_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-brand-600 hover:underline"
                  >
                    {app.content_url} ↗
                  </a>
                </div>
              )}

              {app.creator_application_short_answer && (
                <p className="text-sm text-stone-600 mb-3 leading-relaxed">
                  {app.creator_application_short_answer}
                </p>
              )}

              {app.bio && (
                <p className="text-xs text-stone-400 mb-3 italic line-clamp-2">{app.bio}</p>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                {TIERS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => approve(app.id, value)}
                    disabled={acting === app.id}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-40"
                  >
                    {acting === app.id ? "…" : `Approve as ${label}`}
                  </button>
                ))}
                <button
                  onClick={() => reject(app.id)}
                  disabled={acting === app.id}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
