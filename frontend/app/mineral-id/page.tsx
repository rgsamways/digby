"use client";

import { useRef, useState } from "react";
import { Camera, Upload, Loader, Sparkles, AlertCircle } from "lucide-react";
import type { MineralIdResult } from "@/lib/types";

const CONFIDENCE_COLORS = {
  high: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-stone-100 text-stone-600",
};

export default function MineralIdPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [siteContext, setSiteContext] = useState("");
  const [result, setResult] = useState<MineralIdResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleFile(f: File) {
    setFile(f);
    setResult(null);
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) handleFile(f);
  }

  async function handleIdentify() {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      if (siteContext) form.append("site_context", siteContext);

      const base = process.env.NEXT_PUBLIC_API_URL ?? "";
      const resp = await fetch(`${base}/api/mineral-id/`, {
        method: "POST",
        body: form,
      });
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
          Photograph a specimen you dug up and get an instant identification.
        </p>
      </div>

      {/* Upload zone */}
      <div
        className="mb-4 cursor-pointer rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 p-8 text-center transition hover:border-brand-300 hover:bg-brand-50"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {preview ? (
          <img src={preview} alt="Specimen" className="mx-auto max-h-64 rounded-lg object-contain" />
        ) : (
          <>
            <Upload className="mx-auto mb-3 h-10 w-10 text-stone-300" />
            <p className="text-sm font-medium text-stone-600">Drop an image or click to upload</p>
            <p className="mt-1 text-xs text-stone-400">JPG, PNG, WebP · max 5 MB</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-stone-700">
          Site context <span className="font-normal text-stone-400">(optional — improves accuracy)</span>
        </label>
        <input
          type="text"
          value={siteContext}
          onChange={(e) => setSiteContext(e.target.value)}
          className="input"
          placeholder="e.g. Thunder Bay amethyst site, basalt host rock"
        />
      </div>

      <button
        onClick={handleIdentify}
        disabled={!file || loading}
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

      {result && (
        <div className="mt-6 rounded-xl border border-brand-200 bg-brand-50 p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 className="text-xl font-extrabold text-stone-900">{result.identified_mineral}</h2>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${CONFIDENCE_COLORS[result.confidence]}`}>
              {result.confidence} confidence
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold text-stone-700">How it forms</p>
              <p className="text-stone-600">{result.formation_notes}</p>
            </div>
            <div>
              <p className="font-semibold text-stone-700">Rarity at Ontario sites</p>
              <p className="text-stone-600">{result.rarity_notes}</p>
            </div>
            <div>
              <p className="font-semibold text-stone-700">Care tip</p>
              <p className="text-stone-600">{result.care_tips}</p>
            </div>
            {result.alternative_minerals.length > 0 && (
              <div>
                <p className="font-semibold text-stone-700">Could also be</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {result.alternative_minerals.map((m) => (
                    <span key={m} className="rounded-full bg-white border border-stone-200 px-3 py-1 text-xs text-stone-600">{m}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
