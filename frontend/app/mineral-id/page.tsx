"use client";

import { useCallback, useRef, useState } from "react";
import { AlertCircle, Camera, FlaskConical, Loader, Sparkles, X, Zap } from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import type { MineralIdResult } from "@/lib/types";

const CONFIDENCE_COLORS = {
  high: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-stone-100 text-stone-600",
};

const PROVINCES = ["Unknown", "Grenville", "Superior", "Southern", "Churchill", "Widespread"];

const UV_OPTIONS = [
  { value: "not-tested", label: "Not tested" },
  { value: "fluoresces-sw", label: "Fluoresces under shortwave UV" },
  { value: "fluoresces-lw", label: "Fluoresces under longwave UV" },
  { value: "fluoresces-both", label: "Fluoresces under both SW + LW UV" },
  { value: "no-fluorescence", label: "No fluorescence" },
];

const MAX_IMAGES = 4;
const MAX_PX = 1200;

// Resize + re-encode to JPEG 85 in-browser
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

interface ImageEntry {
  preview: string;
  blob: Blob;
}

export default function MineralIdPage() {
  const { user } = useAuthStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [siteContext, setSiteContext] = useState("");
  const [province, setProvince] = useState("Unknown");
  const [hostRock, setHostRock] = useState("");
  const [uvBehavior, setUvBehavior] = useState("not-tested");
  const [result, setResult] = useState<MineralIdResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addFiles = useCallback(async (rawFiles: FileList | null) => {
    if (!rawFiles) return;
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) return;
    const toProcess = Array.from(rawFiles).slice(0, remaining);
    try {
      const compressed = await Promise.all(toProcess.map(compressImage));
      setImages((prev) => [...prev, ...compressed]);
      setResult(null);
      setError("");
    } catch {
      setError("Could not process one or more images");
    }
  }, [images.length]);

  function removeImage(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setResult(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  }

  async function handleIdentify() {
    if (images.length === 0) return;
    setLoading(true);
    setError("");
    try {
      const form = new FormData();
      images.forEach((img) => form.append("files", img.blob, "specimen.jpg"));
      if (siteContext) form.append("site_context", siteContext);
      form.append("province", province);
      if (hostRock) form.append("host_rock", hostRock);
      form.append("uv_behavior", uvBehavior);

      const base = process.env.NEXT_PUBLIC_API_URL ?? "";
      const headers: Record<string, string> = {};
      const token = typeof window !== "undefined" ? localStorage.getItem("digby-token") : null;
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const resp = await fetch(`${base}/api/mineral-id/`, { method: "POST", body: form, headers });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail ?? `Error ${resp.status}`);
      }
      setResult(await resp.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Identification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
          <Camera className="h-6 w-6 text-brand-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-stone-900">AI Mineral ID</h1>
        <p className="mt-1 text-stone-500">
          Upload up to 4 photos of your specimen for the most accurate identification.
        </p>
        {!user && (
          <p className="mt-1 text-xs text-stone-400">Guest limit: 10 identifications per day</p>
        )}
      </div>

      {/* Photo grid */}
      <div className="mb-4">
        <div className="grid grid-cols-4 gap-2 mb-2">
          {images.map((img, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-stone-200 bg-stone-50">
              <img src={img.preview} alt={`Specimen ${i + 1}`} className="h-full w-full object-cover" />
              <button
                onClick={() => removeImage(i)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {images.length < MAX_IMAGES && (
            <button
              onClick={() => inputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="aspect-square rounded-lg border-2 border-dashed border-stone-200 bg-stone-50 flex flex-col items-center justify-center gap-1 text-stone-400 hover:border-brand-300 hover:bg-brand-50 transition cursor-pointer"
            >
              <Camera className="h-5 w-5" />
              <span className="text-xs">{images.length === 0 ? "Add photo" : "Add more"}</span>
            </button>
          )}
        </div>
        <p className="text-xs text-stone-400">
          {images.length}/{MAX_IMAGES} photos — multiple angles improve accuracy. Images are resized to 1200px before upload.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />

      {/* Context fields */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Site / location <span className="font-normal text-stone-400">(optional)</span>
          </label>
          <input
            type="text"
            value={siteContext}
            onChange={(e) => setSiteContext(e.target.value)}
            className="input"
            placeholder="e.g. Bancroft apatite quarry"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Geological province</label>
          <select value={province} onChange={(e) => setProvince(e.target.value)} className="input">
            {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Host rock <span className="font-normal text-stone-400">(optional)</span>
          </label>
          <input
            type="text"
            value={hostRock}
            onChange={(e) => setHostRock(e.target.value)}
            className="input"
            placeholder="e.g. marble, pegmatite, greenstone"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">UV fluorescence</label>
          <select value={uvBehavior} onChange={(e) => setUvBehavior(e.target.value)} className="input">
            {UV_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <button
        onClick={handleIdentify}
        disabled={images.length === 0 || loading}
        className="btn-primary w-full gap-2"
      >
        {loading ? (
          <><Loader className="h-4 w-4 animate-spin" /> Identifying…</>
        ) : (
          <><Sparkles className="h-4 w-4" /> Identify Specimen</>
        )}
      </button>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {result && <ResultCard result={result} />}
    </div>
  );
}

function ResultCard({ result }: { result: MineralIdResult }) {
  const [showPhysical, setShowPhysical] = useState(false);

  return (
    <div className="mt-6 space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-brand-200 bg-brand-50 p-5">
        <div className="flex items-start justify-between gap-4 mb-1">
          <h2 className="text-2xl font-extrabold text-stone-900">{result.identified_mineral}</h2>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${CONFIDENCE_COLORS[result.confidence]}`}>
            {result.confidence} confidence
          </span>
        </div>
        <p className="text-sm text-stone-600">{result.confidence_reason}</p>
      </div>

      {/* Visual clues */}
      <div className="card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Why we think so</p>
        <ul className="space-y-1">
          {result.visual_clues.map((clue, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
              {clue}
            </li>
          ))}
        </ul>
      </div>

      {/* Ontario context */}
      <div className="card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-3">Ontario geological context</p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
              {result.ontario_context.province} Province
            </span>
          </div>
          {result.ontario_context.typical_formations.length > 0 && (
            <div>
              <span className="text-stone-500">Formations: </span>
              <span className="text-stone-700">{result.ontario_context.typical_formations.join(", ")}</span>
            </div>
          )}
          {result.ontario_context.typical_localities.length > 0 && (
            <div>
              <span className="text-stone-500">Known localities: </span>
              <span className="text-stone-700">{result.ontario_context.typical_localities.join(", ")}</span>
            </div>
          )}
        </div>
      </div>

      {/* Formation + rarity */}
      <div className="card p-4 space-y-3 text-sm">
        <div>
          <p className="font-semibold text-stone-700 mb-1">How it forms</p>
          <p className="text-stone-600">{result.formation_notes}</p>
        </div>
        <div>
          <p className="font-semibold text-stone-700 mb-1">Rarity at Ontario sites</p>
          <p className="text-stone-600">{result.rarity_notes}</p>
        </div>
        <div>
          <p className="font-semibold text-stone-700 mb-1">Specimen quality</p>
          <p className="text-stone-600">{result.specimen_quality}</p>
        </div>
      </div>

      {/* UV + care */}
      <div className="card p-4 space-y-3 text-sm">
        <div className="flex items-start gap-2">
          <Zap className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
          <div>
            <p className="font-semibold text-stone-700 mb-0.5">UV fluorescence</p>
            <p className="text-stone-600">{result.uv_fluorescence}</p>
          </div>
        </div>
        <div>
          <p className="font-semibold text-stone-700 mb-1">Care tip</p>
          <p className="text-stone-600">{result.care_tips}</p>
        </div>
      </div>

      {/* Physical properties (collapsible) */}
      <div className="card p-4">
        <button
          onClick={() => setShowPhysical(!showPhysical)}
          className="flex w-full items-center justify-between text-sm font-semibold text-stone-700"
        >
          <span className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-stone-400" />
            Physical properties
          </span>
          <span className="text-stone-400">{showPhysical ? "▲" : "▼"}</span>
        </button>
        {showPhysical && (
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {Object.entries(result.physical_properties).map(([k, v]) => (
              <div key={k}>
                <dt className="text-stone-500 capitalize">{k.replace("_", " ")}</dt>
                <dd className="text-stone-800 font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {/* Differential diagnosis */}
      {result.alternatives.length > 0 && (
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-3">Could also be</p>
          <div className="space-y-4">
            {result.alternatives.map((alt) => (
              <div key={alt.mineral}>
                <p className="font-semibold text-stone-800 text-sm">{alt.mineral}</p>
                <p className="text-sm text-stone-500 mt-0.5">{alt.reason}</p>
                <div className="mt-1.5 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-800">
                  <span className="font-semibold">Field test: </span>{alt.field_test}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
