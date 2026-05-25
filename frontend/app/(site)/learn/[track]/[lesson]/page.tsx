import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Clock, Lightbulb } from "lucide-react";
import { TRACKS, getLesson } from "@/lib/learn-content";
import LessonNavButton from "@/components/LessonNavButton";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ track: string; lesson: string }>;
}

export async function generateStaticParams() {
  return TRACKS.flatMap((track) =>
    track.lessons.map((lesson) => ({ track: track.id, lesson: lesson.slug }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { track, lesson: lessonSlug } = await params;
  const lesson = getLesson(track as "field" | "gis" | "prospector", lessonSlug);
  if (!lesson) return {};
  return { title: `${lesson.title} — Digby Learn` };
}

export default async function LessonPage({ params }: Props) {
  const { track, lesson: lessonSlug } = await params;

  const trackData = TRACKS.find((t) => t.id === track);
  if (!trackData) notFound();

  const lesson = getLesson(track as "field" | "gis" | "prospector", lessonSlug);
  if (!lesson) notFound();

  const lessonIndex = trackData.lessons.findIndex((l) => l.slug === lessonSlug);
  const trackColour = trackData.colour === "brand" ? "brand" : trackData.colour === "amber" ? "amber" : "violet";

  const headerBg =
    trackColour === "brand"
      ? "bg-gradient-to-br from-brand-50 to-stone-50 border-brand-100"
      : trackColour === "amber"
      ? "bg-gradient-to-br from-amber-50 to-stone-50 border-amber-100"
      : "bg-gradient-to-br from-violet-50 to-stone-50 border-violet-100";
  const badgeCls =
    trackColour === "brand"
      ? "bg-brand-100 text-brand-700"
      : trackColour === "amber"
      ? "bg-amber-100 text-amber-700"
      : "bg-violet-100 text-violet-700";
  const tryItBg =
    trackColour === "brand"
      ? "bg-brand-50 border-brand-200"
      : trackColour === "amber"
      ? "bg-amber-50 border-amber-200"
      : "bg-violet-50 border-violet-200";
  const tryItIcon =
    trackColour === "brand" ? "text-brand-600" : trackColour === "amber" ? "text-amber-600" : "text-violet-600";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-stone-400">
        <Link href="/learn" className="hover:text-stone-600">
          Learn
        </Link>
        <span>/</span>
        <Link href="/learn" className={`hover:text-stone-600 ${trackColour === "brand" ? "text-brand-600" : trackColour === "amber" ? "text-amber-600" : "text-violet-600"}`}>
          {trackData.title}
        </Link>
        <span>/</span>
        <span className="text-stone-600">Lesson {lessonIndex + 1}</span>
      </nav>

      {/* Header card */}
      <div className={`rounded-2xl border p-6 mb-8 ${headerBg}`}>
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${badgeCls}`}>
            {trackData.title}
          </span>
          <span className="flex items-center gap-1 text-xs text-stone-400">
            <Clock className="h-3 w-3" /> {lesson.duration}
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-stone-900 mb-3">
          {lesson.title}
        </h1>
        <p className="text-stone-600 leading-relaxed">{lesson.intro}</p>
      </div>

      {/* Lesson content */}
      <div className="space-y-8">
        {lesson.sections.map((section) => (
          <div key={section.heading}>
            <h2 className="text-lg font-bold text-stone-900 mb-3">{section.heading}</h2>
            <div className="prose prose-stone prose-sm max-w-none">
              {section.body.split("\n\n").map((para, i) => {
                // Render bold (**text**) inline
                const parts = para.split(/(\*\*[^*]+\*\*)/g);
                return (
                  <p key={i} className="text-stone-700 leading-relaxed mb-3 last:mb-0">
                    {parts.map((part, j) =>
                      part.startsWith("**") && part.endsWith("**") ? (
                        <strong key={j}>{part.slice(2, -2)}</strong>
                      ) : (
                        part
                      )
                    )}
                  </p>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Try it */}
      {lesson.tryIt && (
        <div className={`mt-10 rounded-xl border p-5 ${tryItBg}`}>
          <div className="flex items-start gap-3">
            <Lightbulb className={`mt-0.5 h-5 w-5 shrink-0 ${tryItIcon}`} />
            <div>
              <p className="font-semibold text-stone-900 mb-1.5">Try it</p>
              <p className="text-sm text-stone-700 leading-relaxed">{lesson.tryIt}</p>
              {lesson.linkHref && lesson.linkLabel && (
                <Link
                  href={lesson.linkHref}
                  className={`mt-3 inline-block text-sm font-semibold ${trackColour === "brand" ? "text-brand-600 hover:text-brand-700" : trackColour === "amber" ? "text-amber-600 hover:text-amber-700" : "text-violet-600 hover:text-violet-700"}`}
                >
                  {lesson.linkLabel} →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Prev / Next navigation */}
      <div className="mt-10 flex items-center justify-between gap-4 border-t border-stone-100 pt-6">
        {lesson.prevSlug ? (
          <Link
            href={`/learn/${track}/${lesson.prevSlug}`}
            className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-800"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Link>
        ) : (
          <Link
            href="/learn"
            className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-800"
          >
            <ChevronLeft className="h-4 w-4" />
            All tracks
          </Link>
        )}

        {lesson.nextSlug ? (
          <LessonNavButton
            href={`/learn/${track}/${lesson.nextSlug}`}
            label="Next lesson"
            track={track}
            lesson={lessonSlug}
            colourClass={
              trackColour === "brand"
                ? "bg-brand-600 text-white hover:bg-brand-700"
                : trackColour === "amber"
                ? "bg-amber-600 text-white hover:bg-amber-700"
                : "bg-violet-600 text-white hover:bg-violet-700"
            }
          />
        ) : (
          <LessonNavButton
            href="/learn"
            label="Track complete"
            track={track}
            lesson={lessonSlug}
            colourClass={
              trackColour === "brand"
                ? "bg-brand-600 text-white hover:bg-brand-700"
                : trackColour === "amber"
                ? "bg-amber-600 text-white hover:bg-amber-700"
                : "bg-violet-600 text-white hover:bg-violet-700"
            }
          />
        )}
      </div>

      {/* Track lesson list sidebar-like nav at bottom */}
      <div className="mt-8 rounded-xl border border-stone-100 bg-stone-50 p-4">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">
          {trackData.title} — All Lessons
        </p>
        <ol className="space-y-1">
          {trackData.lessons.map((l, i) => (
            <li key={l.slug}>
              <Link
                href={`/learn/${track}/${l.slug}`}
                className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition ${
                  l.slug === lessonSlug
                    ? trackColour === "brand"
                      ? "bg-brand-50 text-brand-800 font-semibold"
                      : trackColour === "amber"
                      ? "bg-amber-50 text-amber-800 font-semibold"
                      : "bg-violet-50 text-violet-800 font-semibold"
                    : "text-stone-600 hover:text-stone-900 hover:bg-white"
                }`}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-xs text-stone-500">
                  {i + 1}
                </span>
                <span className="leading-snug">{l.title}</span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
