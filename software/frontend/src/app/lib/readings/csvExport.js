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
