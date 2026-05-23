"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader, Plus, X } from "lucide-react";
import { adminApi, getAdminToken, type AdminProduct, type ProductFormData } from "@/lib/admin";

const CATEGORIES = [
  { value: "get-started", label: "Get Started" },
  { value: "field-gear", label: "Field Gear" },
  { value: "identify-display", label: "Identify & Display" },
  { value: "bancroft-collection", label: "Bancroft Collection" },
];

const ORDER_STATUSES = ["pending", "confirmed", "fulfilled", "shipped", "cancelled"];

function centsToDisplay(cents: number): string {
  return (cents / 100).toFixed(2);
}

function displayToCents(s: string): number {
  return Math.round(parseFloat(s || "0") * 100);
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

interface Props {
  product?: AdminProduct;
}

export default function ProductForm({ product }: Props) {
  const router = useRouter();
  const isEdit = !!product;

  const [form, setForm] = useState<ProductFormData>({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    category: product?.category ?? "get-started",
    subcategory: product?.subcategory ?? "",
    description: product?.description ?? "",
    price: product?.price ?? 0,
    cost: product?.cost ?? 0,
    images: product?.images ?? [],
    sku: product?.sku ?? "",
    supplier: product?.supplier ?? "",
    stock: product?.stock ?? 0,
    dropship: product?.dropship ?? false,
    active: product?.active ?? true,
    tags: product?.tags ?? [],
    related_products: product?.related_products ?? [],
    site_recommendations: product?.site_recommendations ?? [],
  });

  const [priceDisplay, setPriceDisplay] = useState(centsToDisplay(form.price));
  const [costDisplay, setCostDisplay] = useState(centsToDisplay(form.cost));
  const [tagInput, setTagInput] = useState("");
  const [relInput, setRelInput] = useState("");
  const [siteInput, setSiteInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const imgInputRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleNameChange(name: string) {
    setForm((f) => ({ ...f, name, slug: isEdit ? f.slug : slugify(name) }));
  }

  function addTag(input: string, setter: React.Dispatch<React.SetStateAction<string>>, field: "tags" | "related_products" | "site_recommendations") {
    const val = input.trim();
    if (!val) return;
    setForm((f) => ({ ...f, [field]: [...f[field], val] }));
    setter("");
  }

  function removeItem(field: "tags" | "related_products" | "site_recommendations", index: number) {
    setForm((f) => ({ ...f, [field]: f[field].filter((_, i) => i !== index) }));
  }

  async function handleImageFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    const currentImages = form.images;
    try {
      const fd = new FormData();
      Array.from(files).slice(0, 8).forEach((f) => fd.append("files", f));
      const token = getAdminToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/uploads/images`,
        { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd }
      );
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json() as { urls: string[] };
      set("images", [...currentImages, ...data.urls]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (isEdit && product) {
        await adminApi.updateProduct(product.id, form);
      } else {
        await adminApi.createProduct(form);
      }
      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      {/* Core fields */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-stone-800">Product Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Name</label>
            <input
              required
              className="input"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Slug</label>
            <input
              required
              className="input font-mono text-sm"
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={(e) => set("category", e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Subcategory</label>
            <input
              className="input"
              value={form.subcategory}
              onChange={(e) => set("subcategory", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <textarea
              className="input min-h-[100px] resize-y"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Pricing & inventory */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-stone-800">Pricing & Inventory</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Price (CAD)</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={priceDisplay}
              onChange={(e) => { setPriceDisplay(e.target.value); set("price", displayToCents(e.target.value)); }}
            />
          </div>
          <div>
            <label className="label">Cost (CAD)</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={costDisplay}
              onChange={(e) => { setCostDisplay(e.target.value); set("cost", displayToCents(e.target.value)); }}
            />
          </div>
          <div>
            <label className="label">Stock</label>
            <input
              className="input"
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => set("stock", parseInt(e.target.value) || 0)}
              disabled={form.dropship}
            />
          </div>
          <div>
            <label className="label">SKU</label>
            <input className="input" value={form.sku} onChange={(e) => set("sku", e.target.value)} />
          </div>
          <div>
            <label className="label">Supplier</label>
            <input className="input" value={form.supplier} onChange={(e) => set("supplier", e.target.value)} />
          </div>
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-stone-300 text-brand-600"
              checked={form.dropship}
              onChange={(e) => set("dropship", e.target.checked)}
            />
            <span className="text-sm font-medium text-stone-700">Dropship</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-stone-300 text-brand-600"
              checked={form.active}
              onChange={(e) => set("active", e.target.checked)}
            />
            <span className="text-sm font-medium text-stone-700">Active</span>
          </label>
        </div>
      </div>

      {/* Images */}
      <div className="card p-6 space-y-3">
        <h2 className="font-semibold text-stone-800">Images</h2>

        {/* Thumbnail previews */}
        {form.images.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {form.images.map((url, i) => (
              <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-stone-200 bg-stone-50">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => set("images", form.images.filter((_, j) => j !== i))}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => imgInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-lg border border-dashed border-stone-300 px-4 py-2 text-sm text-stone-600 hover:border-brand-400 hover:text-brand-600 transition disabled:opacity-50"
          >
            {uploading ? <Loader className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {uploading ? "Uploading…" : "Upload images"}
          </button>
          <span className="text-xs text-stone-400">or paste URLs below</span>
        </div>
        <input
          ref={imgInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleImageFiles(e.target.files)}
        />

        {/* Manual URL inputs */}
        {form.images.map((url, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className="input flex-1 font-mono text-xs"
              value={url}
              onChange={(e) => {
                const imgs = [...form.images];
                imgs[i] = e.target.value;
                set("images", imgs);
              }}
            />
            <button type="button" onClick={() => set("images", form.images.filter((_, j) => j !== i))}>
              <X className="h-4 w-4 text-stone-400 hover:text-red-500" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => set("images", [...form.images, ""])}
          className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700"
        >
          <Plus className="h-3.5 w-3.5" /> Add URL manually
        </button>
      </div>

      {/* Tags & relations */}
      <div className="card p-6 space-y-6">
        <h2 className="font-semibold text-stone-800">Tags & Relations</h2>

        {(
          [
            { field: "tags" as const, label: "Tags", input: tagInput, setInput: setTagInput, placeholder: "e.g. uv-reactive" },
            { field: "related_products" as const, label: "Related Product IDs", input: relInput, setInput: setRelInput, placeholder: "product ObjectId" },
            { field: "site_recommendations" as const, label: "Site Slugs (recommendations)", input: siteInput, setInput: setSiteInput, placeholder: "site-slug" },
          ] as const
        ).map(({ field, label, input, setInput, placeholder }) => (
          <div key={field}>
            <label className="label">{label}</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form[field].map((v, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">
                  {v}
                  <button type="button" onClick={() => removeItem(field, i)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder={placeholder}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(input, setInput, field); } }}
              />
              <button
                type="button"
                onClick={() => addTag(input, setInput, field)}
                className="btn-secondary shrink-0"
              >
                Add
              </button>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
        </button>
      </div>
    </form>
  );
}

export { ORDER_STATUSES };
