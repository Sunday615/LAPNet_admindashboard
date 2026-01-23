// src/services/viewerDashboardApi.js
const DEFAULT_BASE = "http://localhost:3000";

export const API_BASE =
  (import.meta?.env?.VITE_API_BASE_URL || DEFAULT_BASE).replace(/\/$/, "");

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  if (payload && Array.isArray(payload.rows)) return payload.rows;
  if (payload && Array.isArray(payload.items)) return payload.items;
  return [];
}

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed (${res.status}) ${url}${text ? `\n${text}` : ""}`);
  }
  return res.json();
}

export async function fetchDocuments() {
  const json = await getJson(`${API_BASE}/api/documents`);
  return normalizeList(json);
}

export async function fetchAnnouncements() {
  const json = await getJson(`${API_BASE}/api/announcements`);
  return normalizeList(json);
}

export async function fetchForms() {
  const json = await getJson(`${API_BASE}/api/form-templates`);
  return normalizeList(json);
}
