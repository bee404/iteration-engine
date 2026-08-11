/**
 * Inline brand + UI marks for the Coquí shell. The licensed brand SVGs
 * (coqui-wordmark.svg, coqui-illustration.svg — DESIGN.md §Assets) are not committed to the
 * repo, so these are faithful stand-ins drawn to the frames' proportions. Swap them for the
 * exported assets when they are available; every consumer references these by name only.
 */

export function CoquiMark({ size = 22 }: { size?: number }) {
  // A small coquí silhouette: rounded body with two raised eyes.
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 15.5c0-3.6 3.6-6 8-6s8 2.4 8 6c0 2.2-1.8 3.5-4 3.5H8c-2.2 0-4-1.3-4-3.5Z"
        fill="#8a6a1a"
      />
      <circle cx="8.5" cy="8" r="3" fill="#a8811f" />
      <circle cx="15.5" cy="8" r="3" fill="#a8811f" />
      <circle cx="8.5" cy="7.6" r="1.1" fill="#372606" />
      <circle cx="15.5" cy="7.6" r="1.1" fill="#372606" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="wordmark">
      <CoquiMark size={22} />
      Coquí
    </span>
  );
}

export function SoundOnIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M19 6a8 8 0 0 1 0 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function SoundOffIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" />
      <path d="m16 9 5 6M21 9l-5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function AddImageIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="6" y="9" width="30" height="24" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="14" cy="17" r="2.4" fill="currentColor" />
      <path d="m9 31 8-8 6 5 5-4 8 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M37 30v10M32 35h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function ExpandIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 6V2h4M14 10v4h-4M14 6V2h-4M2 10v4h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

