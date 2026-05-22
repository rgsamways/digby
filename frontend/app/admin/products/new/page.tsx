"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import ProductForm from "../_form";

export default function NewProductPage() {
  return (
    <div>
      <Link href="/admin/products" className="mb-6 flex items-center gap-1 text-sm text-stone-500 hover:text-brand-600">
        <ChevronLeft className="h-4 w-4" /> Products
      </Link>
      <h1 className="mb-8 text-2xl font-bold text-stone-900">New Product</h1>
      <ProductForm />
    </div>
  );
}
