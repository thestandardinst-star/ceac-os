// Real tabular data. Ledgers, registers, attendance and finance.
//
// Sortable, dense, sticky header and CSV export. Numeric source values are
// right-aligned by default. The table owns horizontal scrolling so the page
// itself never has to.
import { useMemo, useState } from "react";
import Icon from "./Icon";
import EmptyState from "./EmptyState";

export default function Table({
  columns,
  rows,
  empty = "Nothing here yet.",
  caption,
  exportName,
  onRowClick,
}) {
  const [sort, setSort] = useState(null);

  const columnAlign = (column) => {
    if (column.align) return column.align;
    const sample = rows.find((row) => {
      const value = column.sortValue ? column.sortValue(row) : row[column.key];
      return value !== null && value !== undefined && value !== "";
    });
    if (!sample) return "left";
    const value = column.sortValue ? column.sortValue(sample) : sample[column.key];
    return typeof value === "number" ? "right" : "left";
  };

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const val = (r) => {
      const v = col.sortValue ? col.sortValue(r) : r[col.key];
      return v === null || v === undefined ? "" : v;
    };
    return [...rows].sort((a, b) => {
      const x = val(a);
      const y = val(b);
      const n = typeof x === "number" && typeof y === "number"
        ? x - y
        : String(x).localeCompare(String(y), "en", { numeric: true });
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
    a.href = url;
    a.download = (exportName || "ceac-export") + ".csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  if (!rows.length) {
    return <EmptyState icon="table" title={empty} compact />;
  }

  return (
    <div className="tbl-wrap">
      {(caption || exportName) && (
        <div className="tbl-top">
          {caption && <span className="small">{caption}</span>}
          {exportName && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={exportCsv}>
              <Icon name="table" size={14} /> Export
            </button>
          )}
        </div>
      )}
      <div className="tbl-scroll">
        <table className="tbl">
          <thead>
            <tr>
              {columns.map((c) => {
                const align = columnAlign(c);
                return (
                  <th key={c.key} style={{ width: c.width, textAlign: align }}
                    className={sort && sort.key === c.key ? "sorted" : ""}>
                    <button type="button" onClick={() => toggle(c.key)}>
                      {c.label}
                      {sort && sort.key === c.key && (sort.dir === "asc" ? " ↑" : " ↓")}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr key={r.id || i}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
                className={onRowClick ? "clickable" : ""}>
                {columns.map((c) => {
                  const align = columnAlign(c);
                  return (
                    <td key={c.key} style={{ textAlign: align }}
                      className={align === "right" ? "num" : ""}>
                      {c.render ? c.render(r) : r[c.key]}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
