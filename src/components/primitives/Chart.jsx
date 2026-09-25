// Inline SVG charts. No charting library: none of them are small, and all
// of them bring a visual opinion that fights this system. The bundle is
// already over 1MB.
//
// Four kinds only — line, bar, pairedBar, donut. Every chart carries a
// chart/table toggle, because some people read shapes and others read
// numbers, and the same data must be available both ways.
import { useState } from "react";
import Table from "./Table";
import Icon from "./Icon";

const SERIES = ["#2A78D6", "#EB6834", "#1BAF7A", "#EDA100", "#E87BA4"];
const fmt = (n) => (Math.round(n * 100) / 100).toLocaleString("en-GH");

function Axis({ w, h, pad, max, ticks = 4 }) {
  const out = [];
  for (let i = 0; i <= ticks; i++) {
    const y = pad.t + (h - pad.t - pad.b) * (i / ticks);
    out.push(
      <g key={i}>
        <line x1={pad.l} x2={w - pad.r} y1={y} y2={y} className="ch-grid" />
        <text x={pad.l - 6} y={y + 3} className="ch-tick" textAnchor="end">
          {fmt(max * (1 - i / ticks))}
        </text>
      </g>);
  }
  return <g>{out}</g>;
}

function Bars({ data, series, w, h, pad, max, paired }) {
  const band = (w - pad.l - pad.r) / data.length;
  const n = paired ? series.length : 1;
  const bw = Math.min(18, (band - 10) / n);
  return (
    <g>
      {data.map((d, i) => {
        const x0 = pad.l + band * i + (band - bw * n - (n - 1) * 3) / 2;
        return (
          <g key={i}>
            {series.map((s, j) => {
              const v = Number(d[s.key]) || 0;
              const hh = Math.max(0, ((h - pad.t - pad.b) * v) / (max || 1));
              const x = x0 + j * (bw + 3);
              return (
                <rect key={s.key} x={x} y={h - pad.b - hh} width={bw} height={hh}
                      rx="3" fill={SERIES[j % SERIES.length]}>
                  <title>{d.label} · {s.label}: {fmt(v)}</title>
                </rect>);
            })}
            <text x={pad.l + band * i + band / 2} y={h - pad.b + 14}
                  className="ch-tick" textAnchor="middle">{d.label}</text>
          </g>);
      })}
    </g>);
}

function Line({ data, series, w, h, pad, max }) {
  const step = (w - pad.l - pad.r) / Math.max(1, data.length - 1);
  return (
    <g>
      {series.map((s, j) => {
        const pts = data.map((d, i) => {
          const v = Number(d[s.key]) || 0;
          return [pad.l + step * i, h - pad.b - ((h - pad.t - pad.b) * v) / (max || 1)];
        });
        return (
          <g key={s.key}>
            <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none"
                      stroke={SERIES[j % SERIES.length]} strokeWidth="2"
                      strokeLinejoin="round" strokeLinecap="round" />
            {pts.map((p, i) => (
              <circle key={i} cx={p[0]} cy={p[1]} r="3.5"
                      fill={SERIES[j % SERIES.length]} stroke="var(--card)" strokeWidth="2">
                <title>{data[i].label} · {s.label}: {fmt(data[i][s.key])}</title>
              </circle>))}
          </g>);
      })}
      {data.map((d, i) => (
        <text key={i} x={pad.l + step * i} y={h - pad.b + 14}
              className="ch-tick" textAnchor="middle">{d.label}</text>))}
    </g>);
}

function Donut({ data, series, size = 150 }) {
  const key = series[0].key;
  const total = data.reduce((t, d) => t + (Number(d[key]) || 0), 0) || 1;
  const r = size / 2 - 12, c = size / 2, circ = 2 * Math.PI * r;
  let off = 0;
  return (
    <svg width={size} height={size} viewBox={"0 0 " + size + " " + size}>
      {data.slice(0, 5).map((d, i) => {
        const v = Number(d[key]) || 0;
        const len = (v / total) * circ;
        const el = (
          <circle key={i} cx={c} cy={c} r={r} fill="none" strokeWidth="18"
                  stroke={SERIES[i % SERIES.length]}
                  strokeDasharray={len + " " + (circ - len)}
                  strokeDashoffset={-off}
                  transform={"rotate(-90 " + c + " " + c + ")"}>
            <title>{d.label}: {fmt(v)}</title>
          </circle>);
        off += len;
        return el;
      })}
    </svg>);
}

export default function Chart({ kind = "bar", data = [], series = [], title,
                                note, height = 230, ariaLabel }) {
  const [asTable, setAsTable] = useState(false);
  if (!data.length) return <div className="card small">Nothing to show yet.</div>;

  const w = 640, pad = { t: 10, r: 10, b: 26, l: 44 };
  const max = Math.max(...data.flatMap((d) => series.map((s) => Number(d[s.key]) || 0)), 0) || 1;
  const columns = [{ key: "label", label: title || "Item" },
    ...series.map((s) => ({ key: s.key, label: s.label, align: "right",
      render: (r) => fmt(r[s.key]), sortValue: (r) => Number(r[s.key]) || 0 }))];

  return (
    <div className="ch">
      <div className="ch-top">
        {series.length > 1 && (
          <div className="ch-legend">
            {series.map((s, j) => (
              <span key={s.key}>
                <i style={{ background: SERIES[j % SERIES.length] }} />{s.label}
              </span>))}
          </div>)}
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAsTable((v) => !v)}>
          <Icon name={asTable ? "chart" : "table"} size={14} />
          {asTable ? " Show as chart" : " Show as table"}
        </button>
      </div>

      {asTable
        ? <Table columns={columns} rows={data} exportName={title || "chart"} />
        : kind === "donut"
          ? <div className="ch-donut"><Donut data={data} series={series} /></div>
          : <svg viewBox={"0 0 " + w + " " + height} width="100%" height={height}
                 role="img" aria-label={ariaLabel || title || "chart"}>
              <Axis w={w} h={height} pad={pad} max={max} />
              {kind === "line"
                ? <Line data={data} series={series} w={w} h={height} pad={pad} max={max} />
                : <Bars data={data} series={series} w={w} h={height} pad={pad} max={max}
                        paired={kind === "pairedBar"} />}
            </svg>}

      {note && <p className="small" style={{ marginTop: 8 }}>{note}</p>}
    </div>);
}
