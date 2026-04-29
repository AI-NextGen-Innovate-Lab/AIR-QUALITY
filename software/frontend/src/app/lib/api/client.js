
export function buildUrl(pathWithLeadingSlash, searchParams) {
  const qs =
    searchParams && [...searchParams.entries()].length > 0
      ? `?${searchParams.toString()}`
      : "";
  const base = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
  if (base) return `${base}${pathWithLeadingSlash}${qs}`;
  return `/backend${pathWithLeadingSlash}${qs}`;
}

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function apiGet(pathWithLeadingSlash, params = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  });
  const url = buildUrl(pathWithLeadingSlash, sp);
  const res = await fetch(url, {
    headers: getAuthHeaders(),
  });
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

export async function apiPost(pathWithLeadingSlash, body) {
  const url = buildUrl(pathWithLeadingSlash);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data.error) message = data.error;
      if (data.message) message = data.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.json();
}

export async function apiPut(pathWithLeadingSlash, body) {
  const url = buildUrl(pathWithLeadingSlash);
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data.error) message = data.error;
      if (data.message) message = data.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.json();
}

export async function apiDelete(pathWithLeadingSlash) {
  const url = buildUrl(pathWithLeadingSlash);
  const res = await fetch(url, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data.error) message = data.error;
      if (data.message) message = data.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.json();
}
