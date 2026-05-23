"use client";

import { useState, useEffect } from "react";
import { strataAdminApi, type StrataBoxSummary, type StrataBoxDetail, type StrataBoxFormData } from "@/lib/admin";
import { Plus, Pencil, X, Check } from "lucide-react";

const EMPTY_FORM: StrataBoxFormData = {
  month_number: 1,
  theme: "",
  subtitle: "",
  field_card_text: "",
  formation_map_url: "",
  cover_image_url: "",
  contents: [],
  site_links: [],
  is_published: false,
};

export default function AdminStrataBoxesPage() {
  const [boxes, setBoxes] = useState<StrataBoxSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<StrataBoxDetail | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<StrataBoxFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      setBoxes(await strataAdminApi.listBoxes());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function openEdit(month: number) {
    const detail = await strataAdminApi.getBox(month);
    setEditing(detail);
    setForm({
      month_number: detail.month_number,
      theme: detail.theme,
      subtitle: detail.subtitle,
      field_card_text: detail.field_card_text,
      formation_map_url: detail.formation_map_url,
      cover_image_url: detail.cover_image_url,
      contents: detail.contents,
      site_links: detail.site_links,
      is_published: detail.is_published,
    });
    setCreating(false);
    setError("");
  }

  function openCreate() {
    const nextMonth = boxes.length > 0 ? Math.max(...boxes.map((b) => b.month_number)) + 1 : 1;
    setForm({ ...EMPTY_FORM, month_number: nextMonth });
    setEditing(null);
    setCreating(true);
    setError("");
  }

  function closePanel() {
    setEditing(null);
    setCreating(false);
    setError("");
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      if (creating) {
        await strataAdminApi.createBox(form);
      } else if (editing) {
        await strataAdminApi.updateBox(editing.month_number, form);
      }
      closePanel();
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function updateContents(raw: string) {
    setForm((f) => ({ ...f, contents: raw.split("\n").map((s) => s.trim()).filter(Boolean) }));
  }

  const panelOpen = creating || editing !== null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Strata Boxes</h1>
          <p className="mt-0.5 text-sm text-stone-400">{boxes.length} boxes configured</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-1.5 text-sm">
          <Plus className="h-4 w-4" /> New Box
        </button>
      </div>

      <div className="flex gap-6">
        {/* Table */}
        <div className={`flex-1 rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden ${panelOpen ? "max-w-lg" : ""}`}>
          {loading ? (
            <p className="p-4 text-sm text-stone-400">Loading…</p>
          ) : boxes.length === 0 ? (
            <p className="p-4 text-sm text-stone-400">No boxes yet. Create the first one.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-left text-[11px] font-semibold uppercase tracking-widest text-stone-400">
                  <th className="px-4 py-2.5">Month</th>
                  <th className="px-4 py-2.5">Theme</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Shipped</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {boxes.map((b, i) => (
                  <tr
                    key={b.month_number}
                    className={`border-b border-stone-50 last:border-0 transition-colors ${i % 2 === 1 ? "bg-stone-50/40" : ""} ${editing?.month_number === b.month_number ? "bg-amber-400/5" : "hover:bg-stone-50/60"}`}
                  >
                    <td className="px-4 py-2.5 font-mono text-[11px] text-stone-500">#{b.month_number}</td>
                    <td className="px-4 py-2.5 font-medium text-stone-900">{b.theme}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-semibold tracking-wide ${b.is_published ? "bg-emerald-400/10 text-emerald-600" : "bg-stone-100 text-stone-400"}`}>
                        {b.is_published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-stone-400">
                      {b.shipped_at ? new Date(b.shipped_at).toLocaleDateString("en-CA") : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => openEdit(b.month_number)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-amber-500 hover:text-amber-600"
                      >
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Edit/create panel */}
        {panelOpen && (
          <div className="w-96 shrink-0 rounded-xl border border-stone-200 bg-white shadow-sm p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-stone-900">{creating ? "New Box" : `Edit Box #${editing?.month_number}`}</h2>
              <button onClick={closePanel} className="text-stone-400 hover:text-stone-700"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-3">
              {creating && (
                <div>
                  <label className="label">Month number</label>
                  <input type="number" className="input" value={form.month_number} onChange={(e) => setForm((f) => ({ ...f, month_number: Number(e.target.value) }))} />
                </div>
              )}
              <div>
                <label className="label">Theme</label>
                <input className="input" value={form.theme} onChange={(e) => setForm((f) => ({ ...f, theme: e.target.value }))} placeholder="e.g. The Grenville Orogeny" />
              </div>
              <div>
                <label className="label">Subtitle</label>
                <input className="input" value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} placeholder="e.g. 1 billion years ago" />
              </div>
              <div>
                <label className="label">Field card text</label>
                <textarea rows={4} className="input resize-none" value={form.field_card_text} onChange={(e) => setForm((f) => ({ ...f, field_card_text: e.target.value }))} />
              </div>
              <div>
                <label className="label">Contents (one per line)</label>
                <textarea
                  rows={3}
                  className="input resize-none font-mono text-xs"
                  value={form.contents.join("\n")}
                  onChange={(e) => updateContents(e.target.value)}
                  placeholder={"sodalite\ncalcite\nphlogopite mica"}
                />
              </div>
              <div>
                <label className="label">Formation map URL</label>
                <input className="input" value={form.formation_map_url} onChange={(e) => setForm((f) => ({ ...f, formation_map_url: e.target.value }))} />
              </div>
              <div>
                <label className="label">Cover image URL</label>
                <input className="input" value={form.cover_image_url} onChange={(e) => setForm((f) => ({ ...f, cover_image_url: e.target.value }))} />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={form.is_published}
                  onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
                  className="h-4 w-4 accent-amber-500"
                />
                <label htmlFor="published" className="text-sm text-stone-700">Published (visible to subscribers)</label>
              </div>
            </div>

            {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

            <button
              onClick={handleSave}
              disabled={saving || !form.theme}
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-amber-300 disabled:opacity-50 transition-colors"
            >
              <Check className="h-4 w-4" />
              {saving ? "Saving…" : creating ? "Create Box" : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
