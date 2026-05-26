"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Briefcase, MapPin, Clock, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";

interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  job_type: string;
  category: string;
  description: string;
  salary_range: string | null;
  apply_url: string | null;
  apply_email: string | null;
  is_featured: boolean;
  expires_at: string | null;
  created_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  "field-technician": "Field Technician",
  "geologist": "Geologist / P.Geo",
  "lab": "Lab & Sample Processing",
  "prospecting": "Prospecting & Claims",
  "mining-ops": "Mining Operations",
  "environmental": "Environmental & Reclamation",
  "education": "Education & Outreach",
  "consulting": "Consulting",
  "other": "Other",
};

const JOB_TYPE_COLORS: Record<string, string> = {
  "full-time": "bg-green-100 text-green-700",
  "part-time": "bg-blue-100 text-blue-700",
  "contract": "bg-purple-100 text-purple-700",
  "seasonal": "bg-amber-100 text-amber-700",
  "volunteer": "bg-stone-100 text-stone-600",
};

function daysLeft(expiresAt: string | null): string {
  if (!expiresAt) return "";
  const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
  if (days <= 3) return `${days}d left`;
  return "";
}

function JobCard({ job }: { job: JobListing }) {
  const typeColor = JOB_TYPE_COLORS[job.job_type] ?? "bg-stone-100 text-stone-600";
  const expiry = daysLeft(job.expires_at);

  return (
    <div className={`card p-5 ${job.is_featured ? "border-amber-300 ring-1 ring-amber-200" : ""}`}>
      {job.is_featured && (
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-amber-600">
          Featured
        </p>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-stone-900">{job.title}</h3>
          <p className="mt-0.5 text-sm font-medium text-stone-600">{job.company}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeColor}`}>
            {job.job_type}
          </span>
          {expiry && (
            <span className="text-[10px] font-medium text-red-500">{expiry}</span>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-stone-400">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {job.location}
        </span>
        <span className="flex items-center gap-1">
          <Briefcase className="h-3 w-3" />
          {CATEGORY_LABELS[job.category] ?? job.category}
        </span>
        {job.salary_range && (
          <span className="font-medium text-stone-600">{job.salary_range}</span>
        )}
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-stone-600 leading-relaxed">
        {job.description}
      </p>

      <div className="mt-4 flex items-center gap-3">
        {job.apply_url && (
          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
          >
            Apply <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {job.apply_email && !job.apply_url && (
          <a
            href={`mailto:${job.apply_email}`}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
          >
            Apply by email
          </a>
        )}
        <span className="text-xs text-stone-400">
          <Clock className="mr-1 inline h-3 w-3" />
          {new Date(job.created_at).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
        </span>
      </div>
    </div>
  );
}

export default function JobBoardPage() {
  const { data: jobs = [], isLoading } = useQuery<JobListing[]>({
    queryKey: ["jobs"],
    queryFn: () => api.get("/api/jobs/"),
  });

  const featured = jobs.filter((j) => j.is_featured);
  const regular = jobs.filter((j) => !j.is_featured);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400 mb-2">
            Community
          </p>
          <h1 className="font-display text-3xl text-stone-900">Geology Job Board</h1>
          <p className="mt-1.5 text-stone-500">
            Ontario-first geology, mining, and field science positions.
          </p>
        </div>
        <Link href="/community/jobs/post" className="btn-primary shrink-0 self-start">
          Post a job — $75
        </Link>
      </div>

      {isLoading && (
        <div className="flex h-48 items-center justify-center text-stone-400">Loading…</div>
      )}

      {!isLoading && jobs.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
          <Briefcase className="h-10 w-10 text-stone-200" />
          <p className="font-medium text-stone-600">No listings yet.</p>
          <p className="max-w-xs text-sm text-stone-400">
            Be the first to post a geology or mining position in Ontario.
          </p>
          <Link href="/community/jobs/post" className="btn-primary mt-2">
            Post the first listing →
          </Link>
        </div>
      )}

      {featured.length > 0 && (
        <section className="mb-6 space-y-3">
          {featured.map((j) => <JobCard key={j.id} job={j} />)}
        </section>
      )}

      {regular.length > 0 && (
        <section className="space-y-3">
          {regular.map((j) => <JobCard key={j.id} job={j} />)}
        </section>
      )}

      <div className="mt-12 rounded-2xl border border-stone-200 bg-stone-50 px-6 py-8 text-center">
        <h2 className="font-display text-lg text-stone-900">Hiring in geology or mining?</h2>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-stone-500">
          $75 CAD for 30 days. Ontario-focused audience of geologists, prospectors, and field technicians.
        </p>
        <Link href="/community/jobs/post" className="btn-primary mt-4 inline-block">
          Post a listing →
        </Link>
      </div>
    </div>
  );
}
