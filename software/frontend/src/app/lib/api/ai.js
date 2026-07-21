import { apiGet } from "./client.js";

export function fetchAiPredictions() {
  return apiGet("/ai/predict");
}

export function fetchAiRecommendation() {
  return apiGet("/ai/recommend");
}

export function fetchAiHistory({ hours = 24 } = {}) {
  return apiGet("/ai/history", { hours });
}
