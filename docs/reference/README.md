# Reference builds

`manager-overview.html` is an approved visual target, not documentation.

Gabriel approved it on 25 September 2026. Open it in a browser beside
what you build. The rebuilt Manager Overview must match it in density,
hierarchy and behaviour.

What it demonstrates, all of which is required:

- Every stat is a link. Four figures, four doors.
- Age is the first column of the decision queue, coloured by wait, oldest
  first, actions inline. Three rows fit where the current design fits one
  card.
- Every chart carries a chart/table toggle. Same data, both ways.
- The chart shows the gap, not the score: Media 0.72 Sunday against 0.07
  midweek is the finding, and paired bars make it unmissable.
- Single-weight line icons carrying meaning, never decoration.

One deliberate difference: the reference uses Chart.js for speed. The
production build uses inline SVG — no library with its own visual
opinion, and the bundle is already 1.17 MB.
