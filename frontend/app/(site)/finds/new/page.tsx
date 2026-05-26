"use client";

import { Suspense, useCallback, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Camera, X, Layers } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";

const PROVINCES = ["", "Grenville", "Superior", "Southern", "Churchill", "Widespread"];
const QUALITY_OPTIONS = ["", "Display quality", "Collector grade", "Study specimen", "Rough/matrix"];
const VERIFICATION_OPTIONS = [
  { value: "unverified", label: "Unverified" },
  { value: "ai_likely", label: "AI-identified (used Digby AI ID)" },
];

const MAX_PX = 1200;

function compressImage(file: File): Promise<{ blob: Blob; preview: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_PX / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas unavailable"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Compression failed"));
          const reader = new FileReader();
          reader.onload = (e) => resolve({ blob, preview: e.target?.result as string });
          reader.readAsDataURL(blob);
        },
        "image/jpeg",
        0.85
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}

interface ImageEntry { preview: string; blob: Blob }

export default function NewFindPage() {
  return (
    <Suspense>
      <NewFindForm />
    </Suspense>
  );
}

function NewFindForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, updateRoles } = useAuthStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const [mineralName, setMineralName] = useState(params.get("mineral") ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState(params.get("notes") ?? "");
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [hostRock, setHostRock] = useState(params.get("host_rock") ?? "");
  const [province, setProvince] = useState(params.get("province") ?? "");
  const [formation, setFormation] = useState(params.get("formation") ?? "");
  const [quality, setQuality] = useState("");
  const [verification, setVerification] = useState(params.get("verification") ?? "unverified");
  const [siteName, setSiteName] = useState("");
  const [gpsLat, setGpsLat] = useState("");
  const [gpsLng, setGpsLng] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [csOptIn, setCsOptIn] = useState(false);
  const [uvFluorescence, setUvFluorescence] = useState("");
  const [isHaul, setIsHaul] = useState(false);
  const [imageError, setImageError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pendingFindId, setPendingFindId] = useState<string | null>(null);
  const [pendingUv, setPendingUv] = useState("");
  const [savingUv, setSavingUv] = useState(false);
  const [showCsOptIn, setShowCsOptIn] = useState(false);
  const [joiningCs, setJoiningCs] = useState(false);

  const addFiles = useCallback(async (rawFiles: FileList | null) => {
    if (!rawFiles) return;
    const remaining = 4 - images.length;
    if (remaining <= 0) return;
    try {
      const compressed = await Promise.all(
        Array.from(rawFiles).slice(0, remaining).map(compressImage)
      );
      setImages((prev) => [...prev, ...compressed]);
      setImageError("");
    } catch {
      setImageError("Could not process image");
    }
  }, [images.length]);

  const mutation = useMutation({
    mutationFn: async () => {
      let photoUrls: string[] = [];

      if (images.length > 0) {
        setUploading(true);
        const form = new FormData();
        images.forEach((img) => form.append("files", img.blob, "photo.jpg"));
        const token = localStorage.getItem("digby_token");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/uploads/images`,
          { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form }
        );
        setUploading(false);
        if (!res.ok) throw new Error("Photo upload failed");
        const data = await res.json() as { urls: string[] };
        photoUrls = data.urls;
      }

      return api.post("/api/finds/", {
        mineral_name: mineralName,
        date,
        notes,
        photo_urls: photoUrls,
        host_rock: hostRock || null,
        geological_province: province || null,
        formation: formation || null,
        specimen_quality: quality || null,
        verification_status: verification,
        citizen_science_opted_in: csOptIn,
        visibility,
        uv_fluorescence: uvFluorescence || null,
        is_haul: isHaul,
        gps_lat: gpsLat ? parseFloat(gpsLat) : null,
        gps_lng: gpsLng ? parseFloat(gpsLng) : null,
        site_name: siteName || null,
      }, { auth: true });
    },
    onSuccess: (data: unknown) => {
      const findId = (data as { id: string }).id;
      const hasCsRole = user?.roles?.includes("citizen_scientist");
      if (!hasCsRole) {
        setPendingFindId(findId);
        setShowCsOptIn(true);
      } else if (!uvFluorescence) {
        setPendingFindId(findId);
      } else {
        router.push(`/finds/${findId}`);
      }
    },
  });

  if (!user) {
    router.push("/login?redirect=/finds/new");
    return null;
  }

  async function saveUvAndNavigate() {
    if (!pendingFindId) return;
    setSavingUv(true);
    try {
      await api.patch(`/api/finds/${pendingFindId}`, { uv_fluorescence: pendingUv || null }, { auth: true });
    } catch { /* non-fatal */ }
    router.push(`/finds/${pendingFindId}`);
  }

  async function joinCitizenScience() {
    setJoiningCs(true);
    try {
      const result = await api.post<{ roles: string[] }>("/api/auth/me/roles", { role: "citizen_scientist" }, { auth: true });
      updateRoles(result.roles);
    } catch { /* non-fatal — still proceed */ }
    setJoiningCs(false);
    setShowCsOptIn(false);
    if (uvFluorescence) router.push(`/finds/${pendingFindId}`);
  }

  function skipCitizenScience() {
    setShowCsOptIn(false);
    if (uvFluorescence) router.push(`/finds/${pendingFindId}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-4xl text-stone-900 mb-2">Log a Find</h1>
      {params.get("mineral") && (
        <p className="mb-6 text-sm text-brand-700 bg-brand-50 rounded-lg px-3 py-2 border border-brand-100">
          Pre-filled from AI Mineral ID — review and add any missing details before saving.
        </p>
      )}

      <div className="space-y-5">
        {/* Mineral + date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Mineral name *</label>
            <input
              className="input"
              value={mineralName}
              onChange={(e) => setMineralName(e.target.value)}
              placeholder="e.g. Fluorapatite"
              required
            />
          </div>
          <div>
            <label className="form-label">Date found *</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Photos */}
        <div>
          <label className="form-label">Photos (up to 4)</label>
          <div className="grid grid-cols-4 gap-2 mb-1">
            {images.map((img, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-stone-200">
                <img src={img.preview} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {images.length < 4 && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-400 hover:border-brand-300 hover:bg-brand-50 transition cursor-pointer"
              >
                <Camera className="h-5 w-5" />
                <span className="text-xs mt-1">Add</span>
              </button>
            )}
          </div>
          {imageError && <p className="text-xs text-red-600">{imageError}</p>}
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => addFiles(e.target.files)} />
        </div>

        {/* Notes */}
        <div>
          <label className="form-label">Notes</label>
          <textarea
            className="input min-h-24 resize-none"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What did you find? Any interesting details about the outcrop, crystal form, or conditions?"
          />
        </div>

        {/* Geology context */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Geological province</label>
            <select className="input" value={province} onChange={(e) => setProvince(e.target.value)}>
              {PROVINCES.map((p) => <option key={p} value={p}>{p || "Unknown"}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Host rock</label>
            <input className="input" value={hostRock} onChange={(e) => setHostRock(e.target.value)}
              placeholder="e.g. marble, pegmatite" />
          </div>
          <div>
            <label className="form-label">Formation</label>
            <input className="input" value={formation} onChange={(e) => setFormation(e.target.value)}
              placeholder="e.g. Bancroft pegmatite" />
          </div>
          <div>
            <label className="form-label">Specimen quality</label>
            <select className="input" value={quality} onChange={(e) => setQuality(e.target.value)}>
              {QUALITY_OPTIONS.map((q) => <option key={q} value={q}>{q || "Not assessed"}</option>)}
            </select>
          </div>
        </div>

        {/* Site + GPS */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="form-label">Dig site name</label>
            <input className="input" value={siteName} onChange={(e) => setSiteName(e.target.value)}
              placeholder="Digby site name or general area" />
          </div>
          <div>
            <label className="form-label">Latitude</label>
            <input className="input" type="number" step="any" value={gpsLat}
              onChange={(e) => setGpsLat(e.target.value)} placeholder="44.123" />
          </div>
          <div>
            <label className="form-label">Longitude</label>
            <input className="input" type="number" step="any" value={gpsLng}
              onChange={(e) => setGpsLng(e.target.value)} placeholder="-77.456" />
          </div>
        </div>

        {/* Verification + visibility */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Identification status</label>
            <select className="input" value={verification} onChange={(e) => setVerification(e.target.value)}>
              {VERIFICATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Visibility</label>
            <select className="input" value={visibility}
              onChange={(e) => setVisibility(e.target.value as "public" | "private")}>
              <option value="public">Public — visible in feed</option>
              <option value="private">Private — only me</option>
            </select>
          </div>
        </div>

        {/* UV + haul */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">UV fluorescence</label>
            <select className="input" value={uvFluorescence} onChange={(e) => setUvFluorescence(e.target.value)}>
              <option value="">None / not tested</option>
              <option value="green">Green</option>
              <option value="blue">Blue</option>
              <option value="red">Red / orange-red</option>
              <option value="orange">Orange / yellow</option>
              <option value="white">White / cream</option>
              <option value="multi">Multi-colour</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={isHaul}
                onChange={(e) => setIsHaul(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300 text-brand-600"
              />
              <span className="text-sm font-medium text-stone-900">This is a haul</span>
            </label>
            {isHaul && (
              <p className="text-xs text-stone-500 rounded-lg bg-stone-50 border border-stone-200 px-3 py-2 leading-relaxed">
                <span className="font-medium text-stone-700">What&apos;s in your bag?</span>{" "}
                Lay everything out on a flat surface before separating the specimens and photograph
                it from above — full-bleed, neutral background, good light. That flat-lay is the
                most shareable thing you can post. Log individual specimens as separate finds
                once you&apos;re back home.
              </p>
            )}
          </div>
        </div>

        {/* Citizen science opt-in */}
        <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={csOptIn}
              onChange={(e) => setCsOptIn(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-stone-300 text-brand-600"
            />
            <div>
              <p className="font-medium text-stone-900 text-sm">
                Contribute to OGS citizen science dataset
              </p>
              <p className="text-xs text-stone-500 mt-0.5">
                Eligible finds (with GPS, photo, host rock, and AI identification) will be included
                in data shared with the Ontario Geological Survey. Your name is never published —
                only location, mineral, formation, and verification status.
              </p>
            </div>
          </label>
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-600">
            {mutation.error instanceof Error ? mutation.error.message : "Failed to save find"}
          </p>
        )}

        {/* Stage 1 — Citizen Scientist opt-in (first time only) */}
        {showCsOptIn && pendingFindId && (
          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100">
                <Layers className="h-5 w-5 text-brand-700" />
              </div>
              <div>
                <p className="font-semibold text-stone-900">Your find is saved.</p>
                <p className="text-sm text-stone-500">One more thing — your data could matter.</p>
              </div>
            </div>
            <p className="mb-4 text-sm text-stone-700 leading-relaxed">
              Ontario geology researchers rely on field observations from collectors. Your mineral name,
              GPS location, and host rock are exactly what the OGS works with. As a Citizen Scientist,
              your future finds (with GPS and photo) contribute to the provincial dataset.
              Your name is never published — only location and mineral data.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={joinCitizenScience}
                disabled={joiningCs}
                className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {joiningCs ? "Joining…" : "Join as Citizen Scientist"}
              </button>
              <button
                onClick={skipCitizenScience}
                className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-500 hover:bg-stone-50"
              >
                Not right now
              </button>
            </div>
          </div>
        )}

        {/* Stage 2 — UV fluorescence prompt */}
        {!showCsOptIn && pendingFindId && (
          <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
            <p className="font-bold text-stone-900 mb-1">Find saved! One more thing —</p>
            <p className="text-sm text-stone-600 mb-3">
              Got a UV lamp? Minerals like calcite, sodalite, and fluorapatite often glow — and
              fluorescence data helps OGS researchers. Takes 30 seconds to test.
            </p>
            <select
              className="input mb-3"
              value={pendingUv}
              onChange={(e) => setPendingUv(e.target.value)}
            >
              <option value="">No fluorescence / not tested</option>
              <option value="green">Green</option>
              <option value="blue">Blue</option>
              <option value="red">Red / orange-red</option>
              <option value="orange">Orange / yellow</option>
              <option value="white">White / cream</option>
              <option value="multi">Multi-colour</option>
            </select>
            <div className="flex gap-3">
              <button
                onClick={saveUvAndNavigate}
                disabled={savingUv}
                className="flex-1 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {pendingUv ? "Save & view find" : "Save without UV"}
              </button>
              <button
                onClick={() => router.push(`/finds/${pendingFindId}`)}
                className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* Stage 0 — Submit button */}
        {!pendingFindId && (
          <button
            onClick={() => mutation.mutate()}
            disabled={!mineralName || !date || mutation.isPending || uploading}
            className="btn-primary w-full"
          >
            {uploading ? "Uploading photos…" : mutation.isPending ? "Saving…" : "Save find"}
          </button>
        )}
      </div>
    </div>
  );
}
