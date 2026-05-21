"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ShoppingCart, Package } from "lucide-react";
import { api } from "@/lib/api";
import { useCartStore } from "@/lib/cart";
import type { Product } from "@/lib/types";

const CATEGORIES = [
  { slug: "", label: "All Gear" },
  { slug: "get-started", label: "Get Started" },
  { slug: "field-gear", label: "Field Gear" },
  { slug: "identify-display", label: "Identify & Display" },
  { slug: "bancroft-collection", label: "Bancroft Collection" },
];

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const inCart = items.some((i) => i.product_id === product.id);

  return (
    <div className="card group flex flex-col overflow-hidden">
      <Link href={`/shop/${product.slug}`}>
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-48 w-full object-cover transition-transform group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-48 items-center justify-center bg-stone-100">
            <Package className="h-12 w-12 text-stone-300" />
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
            {product.subcategory || product.category}
          </p>
          <Link
            href={`/shop/${product.slug}`}
            className="mt-0.5 font-semibold text-stone-900 hover:text-brand-600 line-clamp-2"
          >
            {product.name}
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-stone-900">{fmt(product.price)}</span>
          {product.stock === 0 && !product.dropship ? (
            <span className="text-xs text-stone-400">Out of stock</span>
          ) : (
            <button
              onClick={() =>
                addItem({
                  product_id: product.id,
                  product_name: product.name,
                  price: product.price,
                  image: product.images[0] ?? "",
                })
              }
              className={inCart ? "btn-secondary text-xs py-1.5" : "btn-primary text-xs py-1.5"}
            >
              {inCart ? "In Cart" : "Add to Cart"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  const [category, setCategory] = useState("");

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products", category],
    queryFn: () =>
      api.get(`/api/products${category ? `?category=${category}` : ""}`),
  });

  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.qty, 0));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-stone-900">Gear Shop</h1>
          <p className="mt-1 text-stone-500">Everything you need for a great dig</p>
        </div>
        <Link href="/shop/cart" className="relative flex items-center gap-2 btn-secondary text-sm">
          <ShoppingCart className="h-4 w-4" />
          Cart
          {cartCount > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
              {cartCount}
            </span>
          )}
        </Link>
      </div>

      {/* Category tabs */}
      <div className="mb-8 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.slug}
            onClick={() => setCategory(c.slug)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              category === c.slug
                ? "bg-brand-600 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-stone-100" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="mx-auto mb-4 h-10 w-10 text-stone-200" />
          <p className="text-stone-500">No products in this category yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
