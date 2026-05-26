// Custom geology SVG icons — no equivalent exists in Lucide or Phosphor.
// Stroke style matches Lucide: 1.5px, round caps/joins, currentColor.

type IconProps = { className?: string; size?: number };

const base = {
  fill: "none" as const,
  stroke: "currentColor" as const,
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// Hexagonal prismatic crystal with pyramidal terminations (quartz habit).
export function CrystalIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 2L17 7v10L12 22 7 17V7z" />
      <path d="M7 7h10" />
      <path d="M12 2v5" />
      <path d="M7 17h10" />
      <path d="M12 17v5" />
    </svg>
  );
}

// Ammonite coiled shell — two nested arcs with solid umbilicus.
export function FossilIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M19 12a7 7 0 1 0-3.13 5.83" />
      <path d="M15.5 12a3.5 3.5 0 1 0-1.56 2.92" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Geological cross-section showing horizontal strata layers.
export function StrataIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <path d="M3 9q4.5-1.5 9 0t9 0" />
      <path d="M3 13.5q4.5-1.5 9 0t9 0" />
      <path d="M3 18q4.5-1.5 9 0t9 0" />
    </svg>
  );
}

// OGS/OMI mineral occurrence crosshair marker.
export function OccurrenceIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="M6.34 6.34l2.12 2.12M15.54 15.54l2.12 2.12M6.34 17.66l2.12-2.12M15.54 8.46l2.12-2.12" />
    </svg>
  );
}

// Geological rock hammer with square-faced head and pick end.
export function RockHammerIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M14 10L4 20" />
      <path d="M9.5 4.5l4 4-2 2-4-4a3 3 0 0 1 2-2z" />
      <path d="M13.5 4.5l2-2 4 4-2 2" />
      <path d="M13.5 8.5l2 2" />
    </svg>
  );
}
