"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { BookOpen, CheckCircle, ExternalLink, Shield, Star } from "lucide-react";
import { api } from "@/lib/api";
import type { Expert } from "@/lib/types";

const TIER_CONFIG: Record<string, { label: string; icon: React.ElementType; cls: string; ringCls: string }> = {
  ogs_endorsed: {
    label: "OGS-Endorsed Reviewer",
    icon: Shield,
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    ringCls: "ring-amber-200",
  },
  community_reviewer: {
    label: "Community Reviewer",
    icon: CheckCircle,
    cls: "bg-violet-50 text-violet-700 border-violet-200",
    ringCls: "ring-violet-200",
  },
  verified_expert: {
    label: "Verified Expert",
    icon: Star,
    cls: "bg-blue-50 text-blue-700 border-blue-200",
    ringCls: "ring-blue-200",
  },
};

function ExpertCard({ expert }: { expert: Expert }) {
  const tier = expert.expert_tier ? TIER_CONFIG[expert.expert_tier] : null;
  const TierIcon = tier?.icon;

  return (
    <Link
      href={`/experts/${expert.id}`}
      className="group block rounded-2xl border border-stone-200 bg-white p-5 hover:shadow-md transition"
    >
      <div className="flex items-start gap-4 mb-3">
        <div className={`shrink-0 h-14 w-14 rounded-full bg-stone-100 overflow-hidden ring-2 ${tier?.ringCls ?? "ring-transparent"}`}>
          {expert.avatar_url ? (
            <img src={expert.avatar_url} alt={expert.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center font-bold text-xl text-stone-400">
              {expert.name[0]}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-stone-900 group-hover:text-brand-600 transition">{expert.name}</h3>
          {expert.credential_type && (
            <p className="text-xs text-stone-500 mt-0.5">{expert.credential_type}</p>
          )}
          {expert.institutional_affiliation && (
            <p className="text-xs text-stone-400 mt-0.5">{expert.institutional_affiliation}</p>
          )}
        </div>
      </div>

      {tier && TierIcon && (
        <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold mb-3 ${tier.cls}`}>
          <TierIcon className="h-3 w-3" />
          {tier.label}
        </div>
      )}

      {expert.bio && (
        <p className="text-sm text-stone-600 line-clamp-2 mb-3">{expert.bio}</p>
      )}

      {expert.expert_specialisations.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {expert.expert_specialisations.slice(0, 3).map((s) => (
            <span key={s} className="rounded-full bg-stone-50 border border-stone-200 px-2 py-0.5 text-[11px] text-stone-600">
              {s}
            </span>
          ))}
          {expert.expert_specialisations.length > 3 && (
            <span className="text-[11px] text-stone-400 self-center">
              +{expert.expert_specialisations.length - 3}
            </span>
          )}
        </div>
      )}

      {expert.expert_review_count > 0 && (
        <p className="mt-3 text-[11px] text-stone-400">
          {expert.expert_review_count} verifications
          {expert.expert_agreement_rate > 0 && ` · ${Math.round(expert.expert_agreement_rate)}% agreement`}
        </p>
      )}
    </Link>
  );
}

export default function ExpertsPage() {
  const { data: experts = [], isLoading } = useQuery<Expert[]>({
    queryKey: ["experts"],
    queryFn: () => api.get("/api/experts/"),
  });

  const ogs = experts.filter((e) => e.expert_tier === "ogs_endorsed");
  const reviewers = experts.filter((e) => e.expert_tier === "community_reviewer");
  const verified = experts.filter((e) => e.expert_tier === "verified_expert");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400 mb-2">Expert Network</p>
          <h1 className="font-display text-4xl text-stone-900">Verified Geologists</h1>
          <p className="mt-2 text-stone-500 max-w-xl">
            P.Geo and P.Eng professionals, university geoscientists, and GIS specialists who verify
            community finds and maintain data quality across the Digby citizen science dataset.
          </p>
        </div>
        <Link href="/expert/apply" className="btn-primary shrink-0 text-sm">
          Apply for expert tier
        </Link>
      </div>

      {isLoading && (
        <div className="flex h-48 items-center justify-center text-stone-400">Loading…</div>
      )}

      {!isLoading && experts.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <BookOpen className="h-10 w-10 text-stone-200" />
          <p className="text-stone-500 font-medium">Expert network launching soon.</p>
          <p className="text-sm text-stone-400 max-w-sm">
            Are you a P.Geo, P.Eng, or geoscience professional? Apply for a verified expert tier
            and help build Ontario&apos;s most accurate community mineral dataset.
          </p>
          <Link href="/expert/apply" className="btn-primary text-sm">Apply now</Link>
        </div>
      )}

      {ogs.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-600 mb-3">OGS-Endorsed Reviewers</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ogs.map((e) => <ExpertCard key={e.id} expert={e} />)}
          </div>
        </section>
      )}

      {reviewers.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-violet-600 mb-3">Community Reviewers</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviewers.map((e) => <ExpertCard key={e.id} expert={e} />)}
          </div>
        </section>
      )}

      {verified.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-3">Verified Experts</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {verified.map((e) => <ExpertCard key={e.id} expert={e} />)}
          </div>
        </section>
      )}
    </div>
  );
}
