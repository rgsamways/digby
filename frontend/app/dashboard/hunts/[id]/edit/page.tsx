"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Trash2, Plus } from "lucide-react";
import { api } from "@/lib/api";
import type { ScavengerHunt } from "@/lib/types";

interface ItemDraft { label: string; hint: string; points: number; }

export default function EditHuntPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<ItemDraft[]>([]);
  const [error, setError] = useState("");

  const { data: hunt } = useQuery<ScavengerHunt>({
    queryKey: ["hunt", id],
    queryFn: () => api.get(`/api/hunts/${id}`, { auth: true }),
    enabled: !!id,
  });

  useEffect(() => {
    if (hunt) {
      setTitle(hunt.title);
      setDescription(hunt.description);
      setItems(hunt.items.map((i) => ({ label: i.label, hint: i.hint, points: i.points })));
    }
  }, [hunt]);

  const save = useMutation({
    mutationFn: () =>
      api.patch(`/api/hunts/${id}`, {
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

  if (!hunt) return <div className="flex h-64 items-center justify-center text-stone-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-stone-900">Edit hunt</h1>

      <div className="card p-6 space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            rows={2} className="input resize-none" />
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
                    placeholder="What to find" className="input flex-1 text-sm" />
                  <input type="number" value={item.points} onChange={(e) => updateItem(idx, "points", parseInt(e.target.value) || 0)}
                    min={1} className="input w-20 text-sm" title="Points" />
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="text-stone-400 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <input value={item.hint} onChange={(e) => updateItem(idx, "hint", e.target.value)}
                  placeholder="Hint (optional)" className="input text-sm" />
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button onClick={() => save.mutate()} disabled={!title || save.isPending} className="btn-primary">
            {save.isPending ? "Saving…" : "Save changes"}
          </button>
          <button onClick={() => router.push("/dashboard")} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}
