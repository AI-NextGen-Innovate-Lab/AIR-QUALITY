import { apiGet } from "./client.js";

/** GET /api/health */
export function fetchHealth() {
  return apiGet("/api/health");
}
