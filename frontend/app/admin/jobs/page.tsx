"use client";

import { useEffect, useState } from "react";
import { jobAdminApi, type AdminJobListing as JobListing } from "@/lib/admin";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  active: "bg-green-100 text-green-700",
  expired: "bg-stone-100 text-stone-500",
  rejected: "bg-red-100 text-red-600",
};

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  async function load() {
    setLoading(true);
    try {
      setJobs(await jobAdminApi.listAll());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function update(id: string, payload: { status?: string; is_featured?: boolean }) {
    setActing(id);
    try {
      await jobAdminApi.update(id, payload);
      await load();
    } finally {
      setActing(null);
    }
  }

  const filtered = filter === "all" ? jobs : jobs.filter((j) => j.status === filter);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Job Board</h1>
          <p className="mt-0.5 text-sm text-stone-400">{jobs.length} total listings</p>
        </div>
        <div className="flex gap-2">
          {["all", "pending", "active", "expired", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === s
                  ? "bg-stone-900 text-white"
                  : "border border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-stone-400">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-stone-400">No listings.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => (
            <div key={job.id} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <p className="font-semibold text-stone-900">{job.title}</p>
                  <p className="text-sm text-stone-500">{job.company} · {job.location}</p>
                  <p className="mt-0.5 text-xs text-stone-400">{job.posted_by_email}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[job.status] ?? ""}`}>
                    {job.status}
                  </span>
                  {job.is_featured && (
                    <span className="text-[10px] font-bold uppercase text-amber-600">Featured</span>
                  )}
                </div>
              </div>

              <div className="mb-3 grid grid-cols-3 gap-2 text-xs text-stone-500">
                <span>{job.job_type}</span>
                <span>{job.category}</span>
                {job.salary_range && <span>{job.salary_range}</span>}
              </div>

              <p className="mb-3 line-clamp-2 text-sm text-stone-600">{job.description}</p>

              {job.expires_at && (
                <p className="mb-3 text-xs text-stone-400">
                  Expires: {new Date(job.expires_at).toLocaleDateString("en-CA")}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                {job.status === "pending" && (
                  <button
                    onClick={() => update(job.id, { status: "active" })}
                    disabled={acting === job.id}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-40"
                  >
                    Activate
                  </button>
                )}
                {job.status === "active" && (
                  <button
                    onClick={() => update(job.id, { status: "expired" })}
                    disabled={acting === job.id}
                    className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-40"
                  >
                    Expire
                  </button>
                )}
                {job.status !== "rejected" && (
                  <button
                    onClick={() => update(job.id, { status: "rejected" })}
                    disabled={acting === job.id}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                  >
                    Reject
                  </button>
                )}
                <button
                  onClick={() => update(job.id, { is_featured: !job.is_featured })}
                  disabled={acting === job.id}
                  className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-40"
                >
                  {job.is_featured ? "Unfeature" : "Feature"}
                </button>
                {(job.apply_url || job.apply_email) && (
                  <a
                    href={job.apply_url ?? `mailto:${job.apply_email}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-brand-600 hover:underline"
                  >
                    View application link ↗
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
