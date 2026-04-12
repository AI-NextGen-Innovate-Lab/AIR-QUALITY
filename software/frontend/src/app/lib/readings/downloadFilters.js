/** Filter raw API rows by pollutant toggles (measurement name heuristics). */
export function rowMatchesPollutantSelection(row, pollutants) {
  const anyOn = Object.values(pollutants).some(Boolean);
  if (!anyOn) return false;
  const n = (row.measurement || "").toLowerCase();
  if (pollutants.pm25 && (n.includes("pm2.5") || n.includes("pm2_5"))) return true;
  if (pollutants.pm10 && n.includes("pm10") && !n.includes("pm100")) return true;
  if (pollutants.co2 && n.includes("co2")) return true;
  if (pollutants.no2 && n.includes("no2")) return true;
  if (pollutants.o3 && (n.includes("o3") || n.includes("ozone"))) return true;
  if (pollutants.co && (/\bco\b/.test(n) || n.includes("carbon monoxide"))) return true;
  if (pollutants.so2 && n.includes("so2")) return true;
  return false;
}

export function hoursForDownloadRange(rangeKey) {
  switch (rangeKey) {
    case "day":
      return 24;
    case "week":
      return 168;
    case "month":
      return 720;
    case "year":
      return 720;
    default:
      return 168;
  }
}
