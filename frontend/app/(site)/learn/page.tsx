import Link from "next/link";
import { BookOpen, Map } from "lucide-react";
import { TRACKS } from "@/lib/learn-content";

export const metadata = { title: "Learn — Digby" };

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-10">
        <h1 className="font-display text-4xl text-stone-900">GIS Education</h1>
        <p className="mt-2 text-stone-400">
          Two tracks. One goal: understand Ontario&apos;s geology well enough to find your own minerals.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {TRACKS.map((track) => {
          const Icon = track.id === "field" ? Map : BookOpen;
          const colourMap = {
            brand: {
              bg: "bg-brand-50",
              border: "border-brand-100",
              icon: "bg-brand-100 text-brand-700",
              badge: "bg-brand-100 text-brand-700",
              btn: "bg-brand-600 text-white hover:bg-brand-700",
            },
            violet: {
              bg: "bg-violet-50",
              border: "border-violet-100",
              icon: "bg-violet-100 text-violet-700",
              badge: "bg-violet-100 text-violet-700",
              btn: "bg-violet-600 text-white hover:bg-violet-700",
            },
          };
          const c = colourMap[track.colour as keyof typeof colourMap];

          return (
            <div
              key={track.id}
              className={`rounded-2xl border ${c.border} ${c.bg} p-6 flex flex-col`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${c.icon}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold text-stone-900">{track.title}</h2>
                  <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${c.badge}`}>
                    {track.badge}
                  </span>
                </div>
              </div>

              <p className="text-sm text-stone-600 mb-5 flex-1">{track.tagline}</p>

              <ol className="space-y-2 mb-6">
                {track.lessons.map((lesson, i) => (
                  <li key={lesson.slug}>
                    <Link
                      href={`/learn/${track.id}/${lesson.slug}`}
                      className="flex items-start gap-2.5 rounded-lg p-2 hover:bg-white/60 transition group"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-stone-500 border border-stone-200">
                        {i + 1}
                      </span>
                      <span className="text-sm text-stone-700 group-hover:text-stone-900 leading-snug">
                        {lesson.title}
                        <span className="ml-2 text-xs text-stone-400">{lesson.duration}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>

              <Link
                href={`/learn/${track.id}/1`}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-center transition ${c.btn}`}
              >
                Start Lesson 1 →
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
