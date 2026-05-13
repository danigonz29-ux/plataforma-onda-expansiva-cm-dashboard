
export function IconBase({ children, className = "h-5 w-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function IconPlus({ className }) {
  return (
    <IconBase className={className}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </IconBase>
  );
}

export function IconUsers({ className }) {
  return (
    <IconBase className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </IconBase>
  );
}

export function IconRadio({ className }) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="2" />
      <path d="M16.24 7.76a6 6 0 0 1 0 8.48" />
      <path d="M7.76 16.24a6 6 0 0 1 0-8.48" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M4.93 19.07a10 10 0 0 1 0-14.14" />
    </IconBase>
  );
}

export function IconMegaphone({ className }) {
  return (
    <IconBase className={className}>
      <path d="M3 11v2" />
      <path d="M6 10v4" />
      <path d="M11 8l8-4v16l-8-4H6a3 3 0 0 1-3-3v-2a3 3 0 0 1 3-3h5z" />
      <path d="M11 16l1.5 4" />
    </IconBase>
  );
}

export function IconNetwork({ className }) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="5" r="2" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="19" cy="19" r="2" />
      <path d="M12 7v4" />
      <path d="M12 11L6.5 17" />
      <path d="M12 11l5.5 6" />
    </IconBase>
  );
}

export function IconDownload({ className }) {
  return (
    <IconBase className={className}>
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M5 21h14" />
    </IconBase>
  );
}

export function IconSearch({ className }) {
  return (
    <IconBase className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </IconBase>
  );
}

export function IconCalendar({ className }) {
  return (
    <IconBase className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
    </IconBase>
  );
}

export function IconTrash({ className }) {
  return (
    <IconBase className={className}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </IconBase>
  );
}

export function IconBarChart({ className }) {
  return (
    <IconBase className={className}>
      <path d="M3 3v18h18" />
      <path d="M8 17V9" />
      <path d="M13 17V5" />
      <path d="M18 17v-7" />
    </IconBase>
  );
}

export function IconClipboard({ className }) {
  return (
    <IconBase className={className}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4.5h6" />
      <path d="M8 10h8" />
      <path d="M8 14h8" />
      <path d="M8 18h5" />
    </IconBase>
  );
}

export function IconActivity({ className }) {
  return (
    <IconBase className={className}>
      <path d="M22 12h-4l-3 7-4-14-3 7H2" />
    </IconBase>
  );
}

export function IconZap({ className }) {
  return (
    <IconBase className={className}>
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
    </IconBase>
  );
}

export function IconShare({ className }) {
  return (
    <IconBase className={className}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51l6.83 3.98" />
      <path d="M15.41 6.51L8.59 10.49" />
    </IconBase>
  );
}

export function IconComment({ className }) {
  return (
    <IconBase className={className}>
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </IconBase>
  );
}

export function IconUserPlus({ className }) {
  return (
    <IconBase className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6" />
      <path d="M22 11h-6" />
    </IconBase>
  );
}

export function IconMessage({ className }) {
  return (
    <IconBase className={className}>
      <path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </IconBase>
  );
}

export function IconPhone({ className }) {
  return (
    <IconBase className={className}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72l.38 2.57a2 2 0 0 1-.57 1.72l-1.27 1.27a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 1.72-.57l2.57.38A2 2 0 0 1 22 16.92z" />
    </IconBase>
  );
}

export function IconLink({ className }) {
  return (
    <IconBase className={className}>
      <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 1 0-7.07-7.07L11 4" />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 1 0 7.07 7.07L13 20" />
    </IconBase>
  );
}

export function IconFileText({ className }) {
  return (
    <IconBase className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </IconBase>
  );
}

export function IconEye({ className }) {
  return (
    <IconBase className={className}>
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </IconBase>
  );
}

export function IconMousePointer({ className }) {
  return (
    <IconBase className={className}>
      <path d="M3 3l7 17 2-7 7-2L3 3z" />
    </IconBase>
  );
}

export function IconSettings({ className }) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6V20a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-.6 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1H4a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 .6-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 7.13 4.3l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6V4a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 .6 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.31.33.59.6 1H20a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-.51 1z" />
    </IconBase>
  );
}

export function IconX({ className }) {
  return (
    <IconBase className={className}>
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </IconBase>
  );
}

export function IconForNetwork({ red }) {
  const className = "inline-flex h-4 w-4 shrink-0 items-center justify-center font-black";

  if (red === "Facebook") return <span className={className}>f</span>;
  if (red === "Instagram") return <span className={className}>◎</span>;
  if (red === "TikTok") return <span className={className}>♪</span>;
  if (red === "X" || red === "Twitter/X") return <span className={className}>𝕏</span>;

  return <IconRadio className="h-4 w-4 shrink-0" />;
}