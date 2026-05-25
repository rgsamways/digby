"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { api } from "@/lib/api";

interface Props {
  href: string;
  label: string;
  track: string;
  lesson: string;
  colourClass: string;
}

export default function LessonNavButton({ href, label, track, lesson, colourClass }: Props) {
  const router = useRouter();

  async function handleClick() {
    try {
      // Award completion to all junior profiles for this parent account
      const profiles = await api.get<{ id: string }[]>("/api/junior/profiles", { auth: true });
      await Promise.all(
        profiles.map((p) =>
          api.post(`/api/junior/${p.id}/lesson-complete`, { track, lesson }, { auth: true })
        )
      );
    } catch {
      // non-fatal
    }
    router.push(href);
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold ${colourClass}`}
    >
      {label}
      <ChevronRight className="h-4 w-4" />
    </button>
  );
}
