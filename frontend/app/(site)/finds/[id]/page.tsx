import { notFound } from "next/navigation";
import type { Metadata } from "next";
import FindDetailClient from "./_client";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";
  try {
    const res = await fetch(`${base}/api/finds/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return {};
    const find = await res.json();
    return {
      title: `${find.mineral_name} found by ${find.author_name} — Digby`,
      description: find.notes
        ? find.notes.slice(0, 160)
        : `${find.mineral_name} found at ${find.site_name ?? "an Ontario site"}`,
      openGraph: {
        title: `${find.mineral_name} — Digby Find`,
        description: find.notes?.slice(0, 160) ?? "",
        images: find.photo_urls.length > 0 ? [{ url: find.photo_urls[0] }] : [],
      },
    };
  } catch {
    return {};
  }
}

export default async function FindDetailPage({ params }: Props) {
  const { id } = await params;
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

  try {
    const res = await fetch(`${base}/api/finds/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) notFound();
    const find = await res.json();
    return <FindDetailClient find={find} />;
  } catch {
    notFound();
  }
}
