export function escapeCsvCell(value) {
  if (value == null) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(rows, columnKeys) {
  const header = columnKeys.map(escapeCsvCell).join(",");
  const lines = rows.map((row) =>
    columnKeys.map((key) => escapeCsvCell(row[key])).join(",")
  );
  return [header, ...lines].join("\n");
}

const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])
  );

/**
 * Render rows as a printable HTML table and open the browser print dialog,
 * where the user can choose "Save as PDF". No external dependency required.
 */
export function printRowsAsPdf(title, columnKeys, rows, subtitle = "") {
  const head = columnKeys.map((c) => `<th>${escapeHtml(c)}</th>`).join("");
  const body = rows
    .map(
      (row) =>
        `<tr>${columnKeys
          .map((key) => `<td>${escapeHtml(row[key])}</td>`)
          .join("")}</tr>`
    )
    .join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(
    title
  )}</title><style>
    body{font-family:system-ui,-apple-system,sans-serif;margin:24px;color:#111}
    h1{font-size:18px;margin:0 0 4px}
    p{color:#555;font-size:12px;margin:0 0 12px}
    table{border-collapse:collapse;width:100%;font-size:11px}
    th,td{border:1px solid #ccc;padding:4px 6px;text-align:left}
    th{background:#f3f4f6}
    @media print{@page{margin:12mm}}
  </style></head><body>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(subtitle || `${rows.length} row(s)`)}</p>
    <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
    <script>window.onload=function(){window.print();}</script>
  </body></html>`;
  const win = window.open("", "_blank");
  if (!win) throw new Error("Popup blocked — allow popups to export as PDF.");
  win.document.write(html);
  win.document.close();
}

export function downloadTextFile(filename, content, mime = "text/csv;charset=utf-8;") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
