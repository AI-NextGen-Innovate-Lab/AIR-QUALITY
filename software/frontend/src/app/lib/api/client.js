/**
 * HTTP helpers for the Express backend (see software/backend/server.js).
 * Dev: Vite proxies /backend → http://localhost:3000
 * Prod: set VITE_API_URL (e.g. https://api.example.com) — no /backend prefix.
 */

export function buildUrl(pathWithLeadingSlash, searchParams) {
  const qs =
    searchParams && [...searchParams.entries()].length > 0
      ? `?${searchParams.toString()}`
      : "";
  const base = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
  if (base) return `${base}${pathWithLeadingSlash}${qs}`;
  return `/backend${pathWithLeadingSlash}${qs}`;
}

export async function apiGet(pathWithLeadingSlash, params = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  });
  const url = buildUrl(pathWithLeadingSlash, sp);
  const res = await fetch(url);
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.json();
}
