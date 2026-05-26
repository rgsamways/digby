"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { X, MapPin, Lightbulb, Tag } from "lucide-react";
import { api } from "@/lib/api";

const SITE_CATEGORIES = [
  { value: "mineral", label: "Mineral site", desc: "Crystals, gemstones, ore minerals" },
  { value: "fossil", label: "Fossil site", desc: "Trilobites, crinoids, coral, marine invertebrates" },
] as const;

const SITE_TYPES = [
  { value: "pay-to-dig", label: "Pay-to-dig", desc: "Visitors dig independently on your land" },
  { value: "guided-tour", label: "Guided tour", desc: "You lead visitors through the site" },
  { value: "collecting-walk", label: "Collecting walk", desc: "Guided surface collecting, no digging" },
] as const;

const ONTARIO_MINERALS = [
  "Amethyst", "Sodalite", "Calcite", "Feldspar", "Apatite", "Mica", "Hornblende",
  "Pyrite", "Magnetite", "Fluorite", "Garnet", "Tourmaline", "Labradorite",
  "Hematite", "Galena", "Rhodonite", "Quartz", "Sphalerite",
];

const PRICE_TIERS = [
  { range: "$15–30", desc: "Collecting walks, surface finds, smaller sites" },
  { range: "$30–55", desc: "Established dig sites with known mineral deposits" },
  { range: "$55–90", desc: "Guided tours, premium finds, longer sessions" },
];

const RULE_SUGGESTIONS = [
  "Bring your own tools",
  "No power equipment",
  "Pack out all waste",
  "Stay within marked boundaries",
  "No selling finds commercially",
  "Helmets required in excavated areas",
];

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
    site_type: "pay-to-dig" as "pay-to-dig" | "guided-tour" | "collecting-walk",
    site_category: "mineral" as "mineral" | "fossil",
    rules: "",
  });
  const [minerals, setMinerals] = useState<string[]>([]);
  const [mineralInput, setMineralInput] = useState("");
  const [geocoding, setGeocoding] = useState<"idle" | "loading" | "done" | "error">("idle");

  const setField =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  function addMineral(m: string) {
    const clean = m.trim();
    if (!clean || minerals.includes(clean)) return;
    setMinerals((prev) => [...prev, clean]);
  }

  function removeMineral(m: string) {
    setMinerals((prev) => prev.filter((x) => x !== m));
  }

  async function geocodeAddress() {
    if (!form.address) return;
    setGeocoding("loading");
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const query = encodeURIComponent(`${form.address}, ${form.province}, Canada`);
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${token}&country=CA&limit=1`
      );
      const data = await res.json();
      if (data.features?.length > 0) {
        const [lng, lat] = data.features[0].center as [number, number];
        setForm((f) => ({ ...f, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));
        setGeocoding("done");
      } else {
        setGeocoding("error");
      }
    } catch {
      setGeocoding("error");
    }
  }

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
          minerals,
          site_category: form.site_category,
        },
        { auth: true }
      ),
    onSuccess: () => router.push("/dashboard/sites"),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-2xl text-stone-900">Describe your site</h1>
        <p className="mt-1 text-stone-500">Tell visitors what they&rsquo;ll find, where it is, and what it costs.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* ── Form ── */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-6"
        >
          {/* Site name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Site name</label>
            <input
              type="text"
              value={form.name}
              onChange={setField("name")}
              required
              className="input"
              placeholder="e.g. Miller Creek Amethyst Site"
            />
          </div>

          {/* Site category */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">What does your site offer?</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {SITE_CATEGORIES.map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, site_category: value }))}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    form.site_category === value
                      ? value === "fossil"
                        ? "border-lime-400 bg-lime-50 ring-1 ring-lime-300"
                        : "border-brand-400 bg-brand-50 ring-1 ring-brand-300"
                      : "border-stone-200 bg-white hover:border-stone-300"
                  }`}
                >
                  <p className="text-sm font-semibold text-stone-900">{label}</p>
                  <p className="mt-0.5 text-xs text-stone-500">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Site type */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">Site type</label>
            <div className="grid gap-2 sm:grid-cols-3">
              {SITE_TYPES.map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, site_type: value }))}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    form.site_type === value
                      ? "border-brand-400 bg-brand-50 ring-1 ring-brand-300"
                      : "border-stone-200 bg-white hover:border-stone-300"
                  }`}
                >
                  <p className="text-sm font-semibold text-stone-900">{label}</p>
                  <p className="mt-0.5 text-xs text-stone-500">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-stone-700">Location</label>
            <input
              type="text"
              value={form.address}
              onChange={setField("address")}
              required
              className="input"
              placeholder="Street address or nearest town"
            />
            <input
              type="text"
              value={form.province}
              onChange={setField("province")}
              className="input"
              placeholder="Province"
            />
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  value={form.latitude}
                  onChange={setField("latitude")}
                  required
                  step="any"
                  className={`input ${geocoding === "done" ? "border-green-400 bg-green-50" : ""}`}
                  placeholder="Latitude (e.g. 45.2)"
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  value={form.longitude}
                  onChange={setField("longitude")}
                  required
                  step="any"
                  className={`input ${geocoding === "done" ? "border-green-400 bg-green-50" : ""}`}
                  placeholder="Longitude (e.g. -79.1)"
                />
              </div>
              <button
                type="button"
                onClick={geocodeAddress}
                disabled={!form.address || geocoding === "loading"}
                className="shrink-0 flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40"
              >
                {geocoding === "loading" ? (
                  "Finding…"
                ) : geocoding === "done" ? (
                  "✓ Found"
                ) : (
                  <>
                    <MapPin className="h-3.5 w-3.5" /> Geocode
                  </>
                )}
              </button>
            </div>
            {geocoding === "error" && (
              <p className="text-xs text-red-600">
                Could not geocode this address. Enter coordinates manually.
              </p>
            )}
            {geocoding !== "done" && (
              <p className="text-xs text-stone-400">
                Enter your address above then click Geocode to fill coordinates automatically.
              </p>
            )}
          </div>

          {/* Pricing & logistics */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">
                Price / person (CAD)
              </label>
              <input
                type="number"
                value={form.price_per_person}
                onChange={setField("price_per_person")}
                required
                step="any"
                min="0"
                className="input"
                placeholder="35"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Max group size</label>
              <input
                type="number"
                value={form.max_group_size}
                onChange={setField("max_group_size")}
                required
                min="1"
                className="input"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Duration (hours)</label>
              <input
                type="number"
                value={form.duration_hours}
                onChange={setField("duration_hours")}
                required
                step="0.5"
                min="0.5"
                className="input"
              />
            </div>
          </div>

          {/* Minerals */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">
              Minerals found here
            </label>
            {minerals.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {minerals.map((m) => (
                  <span
                    key={m}
                    className="flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700"
                  >
                    {m}
                    <button
                      type="button"
                      onClick={() => removeMineral(m)}
                      className="text-stone-400 hover:text-stone-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={mineralInput}
                onChange={(e) => setMineralInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addMineral(mineralInput);
                    setMineralInput("");
                  }
                }}
                className="input flex-1"
                placeholder="Type a mineral and press Enter, or pick from the list →"
              />
              <button
                type="button"
                onClick={() => {
                  addMineral(mineralInput);
                  setMineralInput("");
                }}
                className="shrink-0 rounded-lg border border-stone-300 px-3 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Add
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Description</label>
            <textarea
              value={form.description}
              onChange={setField("description")}
              required
              rows={4}
              className="input"
              placeholder="What will visitors find? What's the terrain like? What makes your site worth visiting?"
            />
          </div>

          {/* Rules */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">Site rules</label>
            <textarea
              value={form.rules}
              onChange={setField("rules")}
              rows={3}
              className="input"
              placeholder="Tools allowed, safety requirements, restricted areas…"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {RULE_SUGGESTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, rules: f.rules ? `${f.rules}\n${r}` : r }))
                  }
                  className="rounded-full border border-stone-200 px-2.5 py-1 text-xs text-stone-600 hover:bg-stone-50"
                >
                  + {r}
                </button>
              ))}
            </div>
          </div>

          {mutation.isError && (
            <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>
          )}

          <button type="submit" disabled={mutation.isPending} className="btn-primary w-full">
            {mutation.isPending ? "Saving…" : "Save and continue →"}
          </button>
        </form>

        {/* ── Guidance panel ── */}
        <aside className="space-y-4">
          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-stone-900">What makes a great site</h3>
            </div>
            <ul className="space-y-3 text-sm text-stone-600">
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-300" />
                <span>
                  <strong className="text-stone-800">Known deposits.</strong> Visitors want a
                  reasonable chance of finding something. Even common minerals are fine.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-300" />
                <span>
                  <strong className="text-stone-800">Accessible terrain.</strong> Clear parking,
                  safe walking conditions, defined access routes.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-300" />
                <span>
                  <strong className="text-stone-800">Clear rules.</strong> Visitors book with more
                  confidence when they know exactly what&rsquo;s permitted.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-300" />
                <span>
                  <strong className="text-stone-800">A fair price.</strong> Most Ontario sites land
                  between $20–60/person. Higher is fine for guided or rare-find sites.
                </span>
              </li>
            </ul>
          </div>

          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold text-stone-900">Pricing guide</h3>
            <div className="space-y-2.5">
              {PRICE_TIERS.map(({ range, desc }) => (
                <div key={range} className="flex gap-2.5">
                  <span className="shrink-0 text-sm font-semibold text-brand-700">{range}</span>
                  <span className="text-sm text-stone-500">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4 text-stone-400" />
              <h3 className="text-sm font-semibold text-stone-900">Common Ontario minerals</h3>
            </div>
            <p className="mb-3 text-xs text-stone-400">Click to add to your listing</p>
            <div className="flex flex-wrap gap-1.5">
              {ONTARIO_MINERALS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => addMineral(m)}
                  disabled={minerals.includes(m)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                    minerals.includes(m)
                      ? "bg-brand-100 text-brand-700 cursor-default"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
