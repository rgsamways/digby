"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Package, ShoppingCart, Truck, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useCartStore } from "@/lib/cart";
import type { Product } from "@/lib/types";

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [imageIdx, setImageIdx] = useState(0);

  const addItem = useCartStore((s) => s.addItem);

  const { data: product, isLoading, isError } = useQuery<Product & { related: Product[] }>({
    queryKey: ["product", slug],
    queryFn: () => api.get(`/api/products/${slug}`),
    enabled: !!slug,
    retry: false,
  });

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-stone-500">Loading…</div>;
  }
  if (isError || !product) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <Package className="h-10 w-10 text-stone-200" />
        <p className="text-stone-500">Product not found.</p>
        <Link href="/shop" className="btn-secondary text-sm">Back to Shop</Link>
      </div>
    );
  }

  const outOfStock = product.stock === 0 && !product.dropship;

  function handleAddToCart() {
    addItem({
      product_id: product!.id,
      product_name: product!.name,
      price: product!.price,
      image: product!.images[0] ?? "",
      qty,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/shop" className="mb-6 flex items-center gap-1 text-sm text-stone-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back to Shop
      </Link>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Images */}
        <div>
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
            {product.images[imageIdx] ? (
              <img
                src={product.images[imageIdx]}
                alt={product.name}
                className="h-80 w-full object-cover"
              />
            ) : (
              <div className="flex h-80 items-center justify-center">
                <Package className="h-20 w-20 text-stone-200" />
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImageIdx(i)}
                  className={`h-16 w-16 overflow-hidden rounded-lg border-2 transition-colors ${
                    i === imageIdx ? "border-brand-600" : "border-stone-200"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
              {product.subcategory || product.category}
            </p>
            <h1 className="mt-1 font-display text-4xl text-stone-900">{product.name}</h1>
          </div>

          <p className="text-3xl font-bold text-stone-900">{fmt(product.price)}</p>

          {/* Stock / shipping */}
          <div className="flex items-center gap-2 text-sm">
            {outOfStock ? (
              <span className="text-stone-400">Out of stock</span>
            ) : product.dropship ? (
              <>
                <Truck className="h-4 w-4 text-stone-400" />
                <span className="text-stone-600">Ships in 3–5 business days</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-green-700">{product.stock} in stock</span>
              </>
            )}
          </div>

          {product.description && (
            <p className="text-stone-600 leading-relaxed">{product.description}</p>
          )}

          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.tags.map((t) => (
                <span key={t} className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600">
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Qty + Add to cart */}
          {!outOfStock && (
            <div className="flex items-center gap-3">
              <div className="flex items-center overflow-hidden rounded-lg border border-stone-200">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-stone-600 hover:bg-stone-50"
                >
                  −
                </button>
                <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                <button
                  onClick={() =>
                    setQty((q) => (!product.dropship ? Math.min(product.stock, q + 1) : q + 1))
                  }
                  className="px-3 py-2 text-stone-600 hover:bg-stone-50"
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                className="flex flex-1 items-center justify-center gap-2 btn-primary"
              >
                <ShoppingCart className="h-4 w-4" />
                {added ? "Added!" : "Add to Cart"}
              </button>
            </div>
          )}

          <div className="rounded-xl border border-stone-100 bg-stone-50 p-3 text-xs text-stone-500">
            Free shipping on orders over $100 CAD · Standard $12.99
          </div>

          {/* View cart */}
          <Link href="/shop/cart" className="text-center text-sm text-brand-600 hover:underline">
            View cart →
          </Link>
        </div>
      </div>

      {/* Related products */}
      {product.related && product.related.length > 0 && (
        <div className="mt-14">
          <h2 className="mb-4 text-lg font-bold text-stone-900">You might also like</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {product.related.map((r) => (
              <Link
                key={r.id}
                href={`/shop/${r.slug}`}
                className="card overflow-hidden group"
              >
                {r.images[0] ? (
                  <img
                    src={r.images[0]}
                    alt={r.name}
                    className="h-36 w-full object-cover transition-transform group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-36 items-center justify-center bg-stone-50">
                    <Package className="h-8 w-8 text-stone-200" />
                  </div>
                )}
                <div className="p-3">
                  <p className="text-sm font-medium text-stone-900 line-clamp-2">{r.name}</p>
                  <p className="mt-1 text-sm font-bold text-stone-700">{fmt(r.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
