"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import Link from "next/link";

const CREDENTIAL_TYPES = [
  "P.Geo",
  "P.Eng",
  "MSc/PhD",
  "OGS/GSC Staff",
  "University Faculty",
  "GIS Professional",
  "Other Geoscience Professional",
];

const SPECIALISATION_OPTIONS = [
  "Structural geology",
  "Economic mineralogy",
  "GIS & remote sensing",
  "Geochemistry",
  "Igneous petrology",
  "Metamorphic petrology",
  "Sedimentary geology",
  "Hydrogeology",
  "Mining exploration",
  "Environmental geology",
  "Paleontology",
  "Economic geology",
  "Mineralogy",
  "Geophysics",
];

export default function ExpertApplyPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [credentialType, setCredentialType] = useState("");
  const [credentialReference, setCredentialReference] = useState("");
  const [specialisations, setSpecialisations] = useState<string[]>([]);
  const [institutionalAffiliation, setInstitutionalAffiliation] = useState("");
  const [publicationsUrl, setPublicationsUrl] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [bio, setBio] = useState(user?.name ? "" : "");

  const mutation = useMutation({
    mutationFn: () =>
      api.post("/api/experts/apply", {
        credential_type: credentialType,
        credential_reference: credentialReference,
        expert_specialisations: specialisations,
        institutional_affiliation: institutionalAffiliation,
        publications_url: publicationsUrl,
        years_experience: yearsExperience ? parseInt(yearsExperience) : 0,
      }, { auth: true }),
    onSuccess: () => {},
  });

  if (!user) {
    router.push("/login?redirect=/expert/apply");
    return null;
  }

  if (mutation.isSuccess) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
        <h1 className="font-display text-3xl text-stone-900 mb-3">Application submitted</h1>
        <p className="text-stone-500 mb-6">
          We&apos;ll review your credentials and get back to you shortly. Once approved,
          your expert tier and credential badge will appear on your profile.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/experts" className="btn-secondary">View expert network</Link>
          <Link href="/finds" className="btn-primary">Browse finds</Link>
        </div>
      </div>
    );
  }

  function toggleSpec(s: string) {
    setSpecialisations((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl text-stone-900 mb-2">Apply for Expert Tier</h1>
        <p className="text-stone-500">
          Verified geoscience professionals can review and verify community mineral finds,
          improving data quality across the Digby citizen science dataset.
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm font-medium text-blue-800 mb-1">Credential verification</p>
        <p className="text-xs text-blue-700">
          Your credential reference (licence number, institution, employer) is stored privately
          and used only for verification. It is never displayed publicly on your profile.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="form-label">Credential type *</label>
          <select
            className="input"
            value={credentialType}
            onChange={(e) => setCredentialType(e.target.value)}
            required
          >
            <option value="">Select…</option>
            {CREDENTIAL_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label">
            Credential reference
            <span className="ml-1 text-xs text-stone-400 font-normal">(private, for verification)</span>
          </label>
          <input
            className="input"
            value={credentialReference}
            onChange={(e) => setCredentialReference(e.target.value)}
            placeholder="Licence number, institution name, or employer"
          />
        </div>

        <div>
          <label className="form-label">Years of experience</label>
          <input
            className="input"
            type="number"
            min={0}
            value={yearsExperience}
            onChange={(e) => setYearsExperience(e.target.value)}
            placeholder="e.g. 12"
          />
        </div>

        <div>
          <label className="form-label">Institutional affiliation (optional)</label>
          <input
            className="input"
            value={institutionalAffiliation}
            onChange={(e) => setInstitutionalAffiliation(e.target.value)}
            placeholder="University, government agency, employer"
          />
        </div>

        <div>
          <label className="form-label">Specialisations</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {SPECIALISATION_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSpec(s)}
                className={`rounded-full border px-3 py-1 text-sm transition ${
                  specialisations.includes(s)
                    ? "border-brand-400 bg-brand-50 text-brand-700"
                    : "border-stone-200 text-stone-600 hover:border-stone-400"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="form-label">Publications or professional links (optional)</label>
          <input
            className="input"
            type="url"
            value={publicationsUrl}
            onChange={(e) => setPublicationsUrl(e.target.value)}
            placeholder="https://orcid.org/… or ResearchGate profile"
          />
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-600">
            {mutation.error instanceof Error ? mutation.error.message : "Submission failed"}
          </p>
        )}

        <button
          onClick={() => mutation.mutate()}
          disabled={!credentialType || mutation.isPending}
          className="btn-primary w-full"
        >
          {mutation.isPending ? "Submitting…" : "Submit application"}
        </button>

        <p className="text-xs text-stone-400 text-center">
          Applications are reviewed within 5 business days. We may reach out to confirm
          credentials before approving.
        </p>
      </div>
    </div>
  );
}
