# Reference builds

`manager-overview.html` is an **approved visual target**, not
documentation. Gabriel approved it on 25 September 2026.

Open it in a browser beside what you build. Match its density, hierarchy
and behaviour.

Four things in it are mandatory everywhere:

1. **Every stat is a link.** Four figures, four doors. A figure with no
   rows behind it must not render at all.
2. **Age is the first column** of any decision queue, coloured by how
   long it has waited, oldest first, actions inline. Three decisions fit
   where the old card layout gave one.
3. **Every chart carries a chart/table toggle.** Some people read shapes,
   others read numbers.
4. **The chart shows the gap, not the score.** Media at 0.72 on Sunday
   against 0.07 midweek is the finding; a single number hides it.

The numbers in the file are illustrative. The build reads live Supabase
data — a primitive proved with invented numbers is not proved.

Production uses inline SVG, as the file does. No charting library: none
are small, all bring a visual opinion that fights this system, and the
bundle is already over 1MB.

The working components are in `src/components/primitives/`, and
`System → Primitives` in the app shows each one against live CEAC data.
