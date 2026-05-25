import Link from "next/link";

const FIELD_GUIDE = ["FIELD", "GUIDE", "TO THE", "GEOLOGIC", "UNDER-", "GROUND"];

export default function HomePage() {
  return (
    <div className="flex min-h-screen bg-[#1A1F2E]">

      {/* Left — field guide label */}
      <div className="hidden sm:flex w-[30%] flex-col justify-start px-10 pt-14" style={{ backgroundColor: "#3D4F5C" }}>
        <div className="space-y-0.5">
          {FIELD_GUIDE.map((word) => (
            <p key={word} className="text-[10px] font-semibold uppercase tracking-[0.35em]" style={{ color: "#8A9BAE" }}>
              {word}
            </p>
          ))}
        </div>
      </div>

      {/* Right — wordmark + CTAs */}
      <div className="flex flex-1 flex-col justify-between px-8 py-12 sm:px-14 sm:py-14">

        {/* Wordmark */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="mb-10">
            <div className="font-display text-[5rem] sm:text-[7.5rem] font-bold leading-none tracking-tight text-white select-none">
              digby
            </div>
            <div className="relative inline-block">
              <div className="font-display text-[5rem] sm:text-[7.5rem] font-bold leading-none tracking-tight italic select-none" style={{ color: "#E8A84A" }}>
                .rocks
              </div>
              <div className="absolute bottom-1 left-0 right-0 h-[3px]" style={{ backgroundColor: "#C97B3A" }} />
            </div>
          </div>

          {/* Tagline */}
          <p className="mb-8 text-xs font-semibold uppercase tracking-[0.25em] text-white/50 sm:text-sm">
            Ontario&apos;s Rockhound Booking Platform
          </p>

          {/* Auth buttons */}
          <div className="flex gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center border border-white/30 px-6 py-2.5 text-sm font-semibold text-white hover:border-white/60 hover:bg-white/5 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center bg-[#C97B3A] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#a8622e] transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>

        {/* URL footer */}
        <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/25">
          www.digby.rocks
        </p>
      </div>
    </div>
  );
}
