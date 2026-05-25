"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Download, Upload } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";

const TEMPLATE_HEADERS = [
  "date", "mineral_name", "notes", "geological_province",
  "host_rock", "formation", "gps_lat", "gps_lng", "specimen_quality",
];

const PROVINCE_OPTIONS = ["Grenville", "Superior", "Southern", "Churchill", "Widespread"];
const QUALITY_OPTIONS = ["Display quality", "Collector grade", "Study specimen", "Rough/matrix"];

function downloadTemplate() {
  const example = [
    TEMPLATE_HEADERS.join(","),
    "1987-07-14,Fluorapatite,Found in marble outcrop,Grenville,marble,,44.8975,-77.2851,Display quality",
    "1992-06-03,Sodalite,Princess Mine visit,Grenville,nepheline syenite,,,",
    "2001-08-20,Amethyst,Thunder Bay trip,Superior,rhyolite,,48.3809,-89.2477,Collector grade",
  ].join("\n");
  const blob = new Blob([example], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "digby-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

interface ParsedRow {
  date: string;
  mineral_name: string;
  notes: string;
  geological_province: string | null;
  host_rock: string | null;
  formation: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  specimen_quality: string | null;
}

function parseCSV(text: string): { rows: ParsedRow[]; errors: string[] } {
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return { rows: [], errors: ["CSV must have a header row and at least one data row"] };

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
  const rows: ParsedRow[] = [];
  const errors: string[] = [];

  const idx = (name: string) => header.indexOf(name);

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const date = idx("date") >= 0 ? cols[idx("date")] : "";
    const mineral = idx("mineral_name") >= 0 ? cols[idx("mineral_name")] : "";

    if (!date || !mineral) {
      errors.push(`Row ${i + 1}: missing date or mineral_name — skipped`);
      continue;
    }

    const lat = idx("gps_lat") >= 0 ? parseFloat(cols[idx("gps_lat")]) : NaN;
    const lng = idx("gps_lng") >= 0 ? parseFloat(cols[idx("gps_lng")]) : NaN;

    rows.push({
      date,
      mineral_name: mineral,
      notes: idx("notes") >= 0 ? cols[idx("notes")] || "" : "",
      geological_province: idx("geological_province") >= 0 ? cols[idx("geological_province")] || null : null,
      host_rock: idx("host_rock") >= 0 ? cols[idx("host_rock")] || null : null,
      formation: idx("formation") >= 0 ? cols[idx("formation")] || null : null,
      gps_lat: isNaN(lat) ? null : lat,
      gps_lng: isNaN(lng) ? null : lng,
      specimen_quality: idx("specimen_quality") >= 0 ? cols[idx("specimen_quality")] || null : null,
    });
  }

  return { rows, errors };
}

export default function ImportFindsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [parsed, setParsed] = useState<ParsedRow[] | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);
  const [importError, setImportError] = useState("");

  if (!user) {
    router.push("/login?redirect=/finds/import");
    return null;
  }

  async function handleFile(file: File) {
    setFileName(file.name);
    setParsed(null);
    setParseErrors([]);
    setResult(null);
    setImportError("");
    const text = await file.text();
    const { rows, errors } = parseCSV(text);
    setParsed(rows);
    setParseErrors(errors);
  }

  async function handleImport() {
    if (!parsed || parsed.length === 0) return;
    setImporting(true);
    setImportError("");
    try {
      const res = await api.post<{ created: number; skipped: number }>(
        "/api/finds/import",
        { finds: parsed },
        { auth: true }
      );
      setResult(res);
      setParsed(null);
    } catch (e) {
      setImportError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-4xl text-stone-900 mb-2">Import Finds</h1>
      <p className="text-stone-500 mb-8">
        Upload a CSV of past finds — notebooks, old spreadsheets, or exports from other apps.
        Up to 500 rows per import.
      </p>

      {/* Template download */}
      <div className="mb-6 rounded-xl border border-stone-200 bg-stone-50 p-4 flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-stone-900 text-sm">Download the template</p>
          <p className="text-xs text-stone-500 mt-0.5">
            Required columns: <code className="font-mono bg-stone-100 px-1 rounded">date</code> (YYYY-MM-DD) and{" "}
            <code className="font-mono bg-stone-100 px-1 rounded">mineral_name</code>. Everything else is optional.
          </p>
        </div>
        <button
          onClick={downloadTemplate}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
        >
          <Download className="h-4 w-4" /> Template
        </button>
      </div>

      {/* File drop zone */}
      {!result && (
        <div
          onClick={() => fileRef.current?.click()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onDragOver={(e) => e.preventDefault()}
          className="mb-4 cursor-pointer rounded-xl border-2 border-dashed border-stone-300 bg-white p-10 text-center hover:border-brand-400 hover:bg-brand-50 transition"
        >
          <Upload className="mx-auto h-8 w-8 text-stone-300 mb-2" />
          <p className="text-sm font-medium text-stone-700">{fileName || "Drop a CSV file here, or click to browse"}</p>
          <p className="text-xs text-stone-400 mt-1">CSV files only</p>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>
      )}

      {/* Parse errors */}
      {parseErrors.length > 0 && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-1">
          <p className="text-sm font-semibold text-amber-800">Some rows were skipped:</p>
          {parseErrors.map((e, i) => (
            <p key={i} className="text-xs text-amber-700">{e}</p>
          ))}
        </div>
      )}

      {/* Preview */}
      {parsed && parsed.length > 0 && !result && (
        <div className="mb-6">
          <p className="text-sm font-semibold text-stone-700 mb-2">
            {parsed.length} row{parsed.length !== 1 ? "s" : ""} ready to import
            {parsed.length > 5 && " — showing first 5"}
          </p>
          <div className="rounded-xl border border-stone-200 overflow-hidden text-xs">
            <table className="w-full">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wide text-[10px]">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Mineral</th>
                  <th className="px-3 py-2 text-left">Province</th>
                  <th className="px-3 py-2 text-left">Host rock</th>
                  <th className="px-3 py-2 text-left">GPS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {parsed.slice(0, 5).map((row, i) => (
                  <tr key={i} className="bg-white">
                    <td className="px-3 py-2 font-mono">{row.date}</td>
                    <td className="px-3 py-2 font-medium">{row.mineral_name}</td>
                    <td className="px-3 py-2 text-stone-500">{row.geological_province || "—"}</td>
                    <td className="px-3 py-2 text-stone-500">{row.host_rock || "—"}</td>
                    <td className="px-3 py-2 text-stone-400">
                      {row.gps_lat && row.gps_lng ? `${row.gps_lat.toFixed(4)}, ${row.gps_lng.toFixed(4)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {importError && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" /> {importError}
            </div>
          )}

          <div className="mt-4 flex gap-3">
            <button onClick={handleImport} disabled={importing} className="btn-primary flex-1">
              {importing ? "Importing…" : `Import ${parsed.length} find${parsed.length !== 1 ? "s" : ""}`}
            </button>
            <button onClick={() => { setParsed(null); setFileName(""); }} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Success */}
      {result && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-green-500 mb-3" />
          <p className="font-bold text-stone-900 text-lg">
            {result.created} find{result.created !== 1 ? "s" : ""} imported
          </p>
          {result.skipped > 0 && (
            <p className="text-sm text-stone-500 mt-1">{result.skipped} rows skipped due to errors</p>
          )}
          <div className="mt-5 flex gap-3 justify-center">
            <button onClick={() => router.push("/finds/my")} className="btn-primary">
              View my finds
            </button>
            <button onClick={() => setResult(null)} className="btn-secondary">
              Import more
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
