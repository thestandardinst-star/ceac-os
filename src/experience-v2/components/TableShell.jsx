export function TableShell({
  columns = [],
  rows = [],
  getRowKey = (row, index) => row.id ?? index,
  caption,
  className = "",
}) {
  return (
    <div className={`ev2c-table-wrap ${className}`.trim()}>
      <table className="ev2c-table">
        {caption ? <caption className="ev2c-table-caption">{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className={column.align === "right" ? "is-right" : ""}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={getRowKey(row, rowIndex)}>
              {columns.map((column) => (
                <td key={column.key} className={column.align === "right" ? "is-right" : ""}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
