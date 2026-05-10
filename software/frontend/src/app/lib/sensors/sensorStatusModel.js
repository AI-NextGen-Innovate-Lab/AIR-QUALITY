/**
 * Infer connectivity from last reading time (hardware fields are not in Influx API).
 */
export function connectionStatusFromLastMs(lastTimeMs) {
  if (!lastTimeMs) {
    return { key: "offline", label: "No data", dotClass: "bg-gray-400" };
  }
  const ageMin = (Date.now() - lastTimeMs) / 60000;
  if (ageMin < 60) {
    return { key: "live", label: "Live", dotClass: "bg-green-500" };
  }
  if (ageMin < 24 * 60) {
    return { key: "stale", label: "Stale", dotClass: "bg-yellow-500" };
  }
  return { key: "offline", label: "Silent", dotClass: "bg-red-500" };
}

export function formatRelativeMinutes(lastTimeMs) {
  if (!lastTimeMs) return "never";
  const diff = Date.now() - lastTimeMs;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
