"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Trash2, Plus } from "lucide-react";
import { api } from "@/lib/api";
import type { Site } from "@/lib/types";

interface ItemDraft { label: string; hint: string; points: number; }

export default function NewHuntPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [siteId, setSiteId] = useState("");
  const [items, setItems] = useState<ItemDraft[]>([{ label: "", hint: "", points: 10 }]);
  const [error, setError] = useState("");

  const { data: sites = [] } = useQuery<Site[]>({
    queryKey: ["my-sites"],
    queryFn: () => api.get("/api/sites/my", { auth: true }),
  });

  const create = useMutation({
    mutationFn: () =>
      api.post("/api/hunts/", {
        site_id: siteId,
        title,
        description,
        items: items.filter((i) => i.label.trim()),
      }, { auth: true }),
    onSuccess: () => router.push("/dashboard"),
    onError: (e: Error) => setError(e.message),
  });

  function addItem() {
    setItems((prev) => [...prev, { label: "", hint: "", points: 10 }]);
  }

  function updateItem(idx: number, field: keyof ItemDraft, value: string | number) {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-stone-900">Create scavenger hunt</h1>

      <div className="card p-6 space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Site</label>
          <select value={siteId} onChange={(e) => setSiteId(e.target.value)} required className="input">
            <option value="">Select a site…</option>
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. The Purple Trail" className="input" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            rows={2} placeholder="Optional intro for visitors" className="input resize-none" />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-stone-700">Items to find</label>
            <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
              <Plus className="h-3 w-3" /> Add item
            </button>
          </div>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="rounded-lg border border-stone-200 p-3 space-y-2">
                <div className="flex gap-2">
                  <input value={item.label} onChange={(e) => updateItem(idx, "label", e.target.value)}
                    placeholder="What to find (e.g. Purple amethyst cluster)" className="input flex-1 text-sm" />
                  <input type="number" value={item.points} onChange={(e) => updateItem(idx, "points", parseInt(e.target.value) || 0)}
                    min={1} className="input w-20 text-sm" title="Points" />
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="text-stone-400 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <input value={item.hint} onChange={(e) => updateItem(idx, "hint", e.target.value)}
                  placeholder="Hint (optional, e.g. Check near the creek bed)" className="input text-sm" />
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button onClick={() => create.mutate()} disabled={!title || !siteId || create.isPending} className="btn-primary">
            {create.isPending ? "Creating…" : "Create hunt"}
          </button>
          <button onClick={() => router.push("/dashboard")} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}
