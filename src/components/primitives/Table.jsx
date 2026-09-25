// Real tabular data. Ledgers, registers, attendance, finance.
//
// Sortable, dense, right-aligned numerics, sticky header, CSV export.
// Scrolls horizontally inside its own container so the page body never
// scrolls sideways on a phone.
//
// columns: [{ key, label, align, width, render, sortValue, csv }]
import { useMemo, useState } from "react";
import Icon from "./Icon";

export default function Table({ columns, rows, empty = "Nothing here yet.",
                                caption, exportName, onRowClick }) {
  const [sort, setSort] = useState(null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const val = (r) => {
      const v = col.sortValue ? col.sortValue(r) : r[col.key];
      return v === null || v === undefined ? "" : v;
    };
    return [...rows].sort((a, b) => {
      const x = val(a), y = val(b);
      const n = typeof x === "number" && typeof y === "number"
        ? x - y : String(x).localeCompare(String(y), "en", { numeric: true });
      return sort.dir === "asc" ? n : -n;
    });
  }, [rows, sort, columns]);

  function toggle(key) {
    setSort((s) => s && s.key === key
      ? (s.dir === "asc" ? { key, dir: "desc" } : null)
      : { key, dir: "asc" });
  }

  function exportCsv() {
    const head = columns.map((c) => '"' + String(c.label).replace(/"/g, '""') + '"').join(",");
    const body = sorted.map((r) => columns.map((c) => {
      const v = c.csv ? c.csv(r) : r[c.key];
      return '"' + String(v === null || v === undefined ? "" : v).replace(/"/g, '""') + '"';
    }).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([head + "\n" + body], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = (exportName || "ceac-export") + ".csv";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  if (!rows.length) return <div className="card small">{empty}</div>;

  return (
    <div className="tbl-wrap">
      {(caption || exportName) && (
        <div className="tbl-top">
          {caption && <span className="small">{caption}</span>}
          {exportName && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={exportCsv}>
              <Icon name="table" size={14} /> Export
            </button>)}
        </div>)}
      <div className="tbl-scroll">
        <table className="tbl">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} style={{ width: c.width, textAlign: c.align || "left" }}
                    className={sort && sort.key === c.key ? "sorted" : ""}>
                  <button type="button" onClick={() => toggle(c.key)}>
                    {c.label}
                    {sort && sort.key === c.key && (sort.dir === "asc" ? " \u2191" : " \u2193")}
                  </button>
                </th>))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr key={r.id || i} onClick={onRowClick ? () => onRowClick(r) : undefined}
                  className={onRowClick ? "clickable" : ""}>
                {columns.map((c) => (
                  <td key={c.key} style={{ textAlign: c.align || "left" }}
                      className={c.align === "right" ? "num" : ""}>
                    {c.render ? c.render(r) : r[c.key]}
                  </td>))}
              </tr>))}
          </tbody>
        </table>
      </div>
    </div>);
}
