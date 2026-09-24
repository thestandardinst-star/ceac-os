// One icon set, one weight. Icons carry meaning — unit, person, money,
// service, project, warning — never decoration. Inline SVG so nothing is
// downloaded and nothing depends on a font loading.
//
// Sized by token, inherits colour from its parent.
const P = {
  home:      "M3 11.5 12 4l9 7.5M5 10v10h14V10M9 20v-6h6v6",
  unit:      "M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5",
  person:    "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1",
  people:    "M9 11a3 3 0 100-6 3 3 0 000 6zM2 20v-1a5 5 0 015-5h4a5 5 0 015 5v1M17 11a3 3 0 100-6M18 14a5 5 0 014 5v1",
  team:      "M9 11a3 3 0 100-6 3 3 0 000 6zM2 20v-1a5 5 0 015-5h4a5 5 0 015 5v1M17 11a3 3 0 100-6M18 14a5 5 0 014 5v1",
  hub:       "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1",
  money:     "M12 2v20M17 6.5C17 4.6 14.8 3.5 12 3.5S7 4.6 7 6.5s2 2.8 5 3.5 5 1.6 5 3.5-2.2 3-5 3-5-1.1-5-3",
  project:   "M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  projects:  "M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  portfolio: "M4 7h16v12H4zM8 7V5h8v2M4 11h16M10 14h4",
  service:   "M12 3v18M5 9h14M7 21h10M9 3h6",
  ministry:  "M12 3l8 4v5.5c0 4-2.7 6.8-8 8-5.3-1.2-8-4-8-8V7zM8.5 12l2.3 2.3 4.7-5",
  work:      "M4 7h16v13H4zM9 7V5a2 2 0 012-2h2a2 2 0 012 2v2",
  record:    "M5 4h14v16H5zM8 9h8M8 13h8M8 17h5",
  organisation:"M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  control:   "M4 7h10M18 7h2M10 12h10M4 12h2M4 17h6M14 17h6M16 5v4M8 10v4M12 15v4",
  clock:     "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2",
  warning:   "M12 4l9 16H3zM12 10v4M12 17.5v.5",
  gavel:     "M14 4l6 6-3 3-6-6zM10 9l5 5-6 6-5-5zM3 21h8",
  hand:      "M8 11V6a1.5 1.5 0 013 0v5m0-1V4.5a1.5 1.5 0 013 0V11m0-1V6a1.5 1.5 0 013 0v7a7 7 0 01-7 7h-1a6 6 0 01-6-6v-4a1.5 1.5 0 013 0",
  chart:     "M4 20V10M10 20V4M16 20v-7M22 20H2",
  finance:   "M4 20V10M9.3 20V5.5M14.7 20v-7M20 20V8M2.5 20.5h19",
  reports:   "M5 3h14v18H5zM8 16v-4M12 16V8M16 16v-6",
  messages:  "M4 5h16v11H9l-5 4zM8 10h8M8 13.5h5",
  search:    "M10.5 17a6.5 6.5 0 100-13 6.5 6.5 0 000 13zM15.5 15.5L20 20",
  plus:      "M12 5v14M5 12h14",
  bell:      "M6.5 9a5.5 5.5 0 0111 0c0 6 2 6 2 7.5h-15C4.5 15 6.5 15 6.5 9zM10 20h4",
  chevron:   "M9 6l6 6-6 6",
  more:      "M5 12h.01M12 12h.01M19 12h.01",
  close:     "M6 6l12 12M18 6L6 18",
  time:      "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2",
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
