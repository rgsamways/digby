"use client";

import { useEffect, useState } from "react";
import { expertAdminApi, type ExpertApplication } from "@/lib/admin";

const TIERS = [
  { value: "verified_expert", label: "Verified Expert" },
  { value: "community_reviewer", label: "Community Reviewer" },
  { value: "ogs_endorsed", label: "OGS-Endorsed" },
];

export default function AdminExpertPage() {
  const [applications, setApplications] = useState<ExpertApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setApplications(await expertAdminApi.listApplications());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function approve(userId: string, tier: string) {
    setActing(userId);
    try {
      await expertAdminApi.approve(userId, tier);
      await load();
    } finally {
      setActing(null);
    }
  }

  async function reject(userId: string) {
    setActing(userId);
    try {
      await expertAdminApi.reject(userId);
      await load();
    } finally {
      setActing(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-stone-900 tracking-tight">Expert Applications</h1>
        <p className="mt-0.5 text-sm text-stone-400">{applications.length} pending</p>
      </div>

      {loading ? (
        <p className="text-sm text-stone-400">Loading…</p>
      ) : applications.length === 0 ? (
        <p className="text-sm text-stone-400">No pending applications.</p>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="rounded-xl border border-stone-200 bg-white shadow-sm p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-semibold text-stone-900">{app.name}</p>
                  <p className="text-sm text-stone-400">{app.email}</p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Applied {new Date(app.created_at).toLocaleDateString("en-CA")}
                  </p>
                </div>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 shrink-0">
                  {app.credential_type}
                </span>
              </div>

              {app.credential_reference && (
                <div className="mb-2 rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-600 font-mono">
                  <span className="text-stone-400">Credential ref: </span>{app.credential_reference}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs text-stone-500 mb-3">
                {app.years_experience > 0 && <p>{app.years_experience} years experience</p>}
                {app.institutional_affiliation && <p>{app.institutional_affiliation}</p>}
              </div>

              {app.expert_specialisations.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {app.expert_specialisations.map((s) => (
                    <span key={s} className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-600">
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {app.bio && (
                <p className="text-sm text-stone-600 mb-3 line-clamp-2">{app.bio}</p>
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
