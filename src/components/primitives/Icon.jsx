// One icon set, one weight. Icons carry meaning — unit, person, money,
// service, project, warning — never decoration. Inline SVG so nothing is
// downloaded and nothing depends on a font loading.
//
// Sized by token, inherits colour from its parent.
const P = {
  unit:      "M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5",
  person:    "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1",
  people:    "M9 11a3 3 0 100-6 3 3 0 000 6zM2 20v-1a5 5 0 015-5h4a5 5 0 015 5v1M17 11a3 3 0 100-6M18 14a5 5 0 014 5v1",
  money:     "M12 2v20M17 6.5C17 4.6 14.8 3.5 12 3.5S7 4.6 7 6.5s2 2.8 5 3.5 5 1.6 5 3.5-2.2 3-5 3-5-1.1-5-3",
  project:   "M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  service:   "M12 3v18M5 9h14M7 21h10M9 3h6",
  work:      "M4 7h16v13H4zM9 7V5a2 2 0 012-2h2a2 2 0 012 2v2",
  clock:     "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2",
  warning:   "M12 4l9 16H3zM12 10v4M12 17.5v.5",
  gavel:     "M14 4l6 6-3 3-6-6zM10 9l5 5-6 6-5-5zM3 21h8",
  hand:      "M8 11V6a1.5 1.5 0 013 0v5m0-1V4.5a1.5 1.5 0 013 0V11m0-1V6a1.5 1.5 0 013 0v7a7 7 0 01-7 7h-1a6 6 0 01-6-6v-4a1.5 1.5 0 013 0",
  chart:     "M4 20V10M10 20V4M16 20v-7M22 20H2",
  table:     "M3 5h18v14H3zM3 10h18M9 10v9",
  calendar:  "M4 6h16v15H4zM4 10h16M8 3v4M16 3v4",
  check:     "M4 12l5 5L20 6",
  arrow:     "M5 12h14M13 6l6 6-6 6",
  location:  "M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5",
};
export default function Icon({ name, size = 16, className = "", label }) {
  const d = P[name];
  if (!d) return null;
  return (
    <svg className={"icon " + className} width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden={label ? undefined : "true"}
      role={label ? "img" : undefined} focusable="false">
      {label && <title>{label}</title>}
      <path d={d} />
    </svg>);
}
