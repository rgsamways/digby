"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, CheckCircle, ExternalLink, Shield, Star } from "lucide-react";
import { api } from "@/lib/api";
import type { Expert } from "@/lib/types";

const TIER_CONFIG: Record<string, { label: string; description: string; icon: React.ElementType; cls: string }> = {
  ogs_endorsed: {
    label: "OGS-Endorsed Reviewer",
    description: "Designated by the Ontario Geological Survey as a trusted verification authority.",
    icon: Shield,
    cls: "border-amber-200 bg-amber-50 text-amber-700",
  },
  community_reviewer: {
    label: "Community Reviewer",
    description: "Earned through 50+ verified finds with ≥90% community agreement rate.",
    icon: CheckCircle,
    cls: "border-violet-200 bg-violet-50 text-violet-700",
  },
  verified_expert: {
    label: "Verified Expert",
    description: "Credentialed geoscience professional with verified qualifications.",
    icon: Star,
    cls: "border-blue-200 bg-blue-50 text-blue-700",
  },
};

export default function ExpertProfilePage() {
  const { id } = useParams<{ id: string }>();

  const { data: expert, isLoading } = useQuery<Expert>({
    queryKey: ["expert", id],
    queryFn: () => api.get(`/api/experts/${id}`),
  });

  if (isLoading) return (
    <div className="flex flex-1 items-center justify-center text-stone-400">Loading…</div>
  );

  if (!expert) return (
    <div className="flex flex-1 items-center justify-center text-stone-400">Expert not found.</div>
  );

  const tier = expert.expert_tier ? TIER_CONFIG[expert.expert_tier] : null;
  const TierIcon = tier?.icon;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/experts" className="mb-6 inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800">
        <ArrowLeft className="h-4 w-4" /> Expert network
      </Link>

      {/* Profile header */}
      <div className="flex items-start gap-6 mb-6">
        <div className="shrink-0 h-20 w-20 rounded-full bg-stone-100 overflow-hidden ring-2 ring-stone-200">
          {expert.avatar_url ? (
            <img src={expert.avatar_url} alt={expert.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center font-bold text-3xl text-stone-400">
              {expert.name[0]}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-3xl text-stone-900">{expert.name}</h1>
          {expert.credential_type && (
            <p className="text-stone-600 mt-0.5">{expert.credential_type}</p>
          )}
          {expert.institutional_affiliation && (
            <p className="text-stone-400 text-sm mt-0.5">{expert.institutional_affiliation}</p>
          )}
          {expert.guide_location && (
            <p className="text-stone-400 text-sm mt-0.5">{expert.guide_location}</p>
          )}
        </div>
      </div>

      {/* Tier badge */}
      {tier && TierIcon && (
        <div className={`inline-flex items-start gap-3 rounded-xl border p-4 mb-6 ${tier.cls}`}>
          <TierIcon className="h-5 w-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">{tier.label}</p>
            <p className="text-xs mt-0.5 opacity-80">{tier.description}</p>
          </div>
        </div>
      )}

      {/* Bio */}
      {expert.bio && (
        <div className="mb-6">
          <p className="text-stone-600 leading-relaxed">{expert.bio}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
        {expert.years_experience > 0 && (
          <div className="rounded-xl bg-stone-50 border border-stone-200 p-4 text-center">
            <p className="font-bold text-2xl text-stone-900">{expert.years_experience}</p>
            <p className="text-xs text-stone-400 mt-0.5">Years experience</p>
          </div>
        )}
        {expert.expert_review_count > 0 && (
          <div className="rounded-xl bg-stone-50 border border-stone-200 p-4 text-center">
            <p className="font-bold text-2xl text-stone-900">{expert.expert_review_count}</p>
            <p className="text-xs text-stone-400 mt-0.5">Verifications</p>
          </div>
        )}
        {expert.expert_agreement_rate > 0 && (
          <div className="rounded-xl bg-stone-50 border border-stone-200 p-4 text-center">
            <p className="font-bold text-2xl text-stone-900">{Math.round(expert.expert_agreement_rate)}%</p>
            <p className="text-xs text-stone-400 mt-0.5">Agreement rate</p>
          </div>
        )}
      </div>

      {/* Specialisations */}
      {expert.expert_specialisations.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">Specialisations</h2>
          <div className="flex flex-wrap gap-2">
            {expert.expert_specialisations.map((s) => (
              <span key={s} className="rounded-full bg-stone-100 border border-stone-200 px-3 py-1 text-sm text-stone-700">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Publications */}
      {expert.publications_url && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">Publications & Links</h2>
          <a
            href={expert.publications_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            {expert.publications_url.replace(/^https?:\/\//, "").split("/")[0]}
          </a>
        </div>
      )}
    </div>
  );
}
