"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";

const SITE_TYPES = ["pay-to-dig", "guided-tour", "collecting-walk"] as const;

export default function NewSitePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    description: "",
    address: "",
    province: "Ontario",
    latitude: "",
    longitude: "",
    price_per_person: "",
    max_group_size: "10",
    duration_hours: "3",
    site_type: "pay-to-dig",
    minerals: "",
    rules: "",
  });

  const set = (k: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const mutation = useMutation({
    mutationFn: () =>
      api.post(
        "/api/sites",
        {
          ...form,
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
          price_per_person: parseFloat(form.price_per_person),
          max_group_size: parseInt(form.max_group_size),
          duration_hours: parseFloat(form.duration_hours),
          minerals: form.minerals
            .split(",")
            .map((m) => m.trim())
            .filter(Boolean),
        },
        { auth: true }
      ),
    onSuccess: () => router.push("/dashboard/sites"),
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold text-stone-900">List a new site</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-5"
      >
        {[
          { label: "Site name", key: "name", type: "text" },
          { label: "Address", key: "address", type: "text" },
          { label: "Province", key: "province", type: "text" },
          { label: "Latitude", key: "latitude", type: "number" },
          { label: "Longitude", key: "longitude", type: "number" },
          { label: "Price per person (CAD)", key: "price_per_person", type: "number" },
          { label: "Max group size", key: "max_group_size", type: "number" },
          { label: "Duration (hours)", key: "duration_hours", type: "number" },
          {
            label: "Minerals found (comma-separated)",
            key: "minerals",
            type: "text",
            placeholder: "sodalite, feldspar, apatite",
          },
        ].map(({ label, key, type, placeholder }) => (
          <div key={key}>
            <label className="mb-1 block text-sm font-medium text-stone-700">{label}</label>
            <input
              type={type}
              value={form[key as keyof typeof form]}
              onChange={set(key)}
              required={!["minerals"].includes(key)}
              className="input"
              placeholder={placeholder}
              step={type === "number" ? "any" : undefined}
            />
          </div>
        ))}

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Site type</label>
          <select value={form.site_type} onChange={set("site_type")} className="input">
            {SITE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/-/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Description</label>
          <textarea
            value={form.description}
            onChange={set("description")}
            required
            rows={4}
            className="input"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Site rules</label>
          <textarea value={form.rules} onChange={set("rules")} rows={3} className="input" />
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>
        )}

        <button type="submit" disabled={mutation.isPending} className="btn-primary w-full">
          {mutation.isPending ? "Listing site…" : "List site"}
        </button>
      </form>
    </div>
  );
}
