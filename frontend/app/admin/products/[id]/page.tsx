"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import ProductForm from "../_form";
import { adminApi, type AdminProduct } from "@/lib/admin";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.listProducts().then((products) => {
      setProduct(products.find((p) => p.id === id) ?? null);
      setLoading(false);
    });
  }, [id]);

  return (
    <div>
      <Link href="/admin/products" className="mb-6 flex items-center gap-1 text-sm text-stone-500 hover:text-brand-600">
        <ChevronLeft className="h-4 w-4" /> Products
      </Link>
      <h1 className="mb-8 text-2xl font-bold text-stone-900">
        {loading ? "Loading…" : product ? `Edit: ${product.name}` : "Product not found"}
      </h1>
      {!loading && product && <ProductForm product={product} />}
    </div>
  );
}
