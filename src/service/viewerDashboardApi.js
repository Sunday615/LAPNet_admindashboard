// src/services/viewerDashboardApi.js

// ✅ Use .env API BASE only (Vite)
// VITE_API_BASE_URL=http://175.0.198.10:3000

const DEFAULT_BASE = "http://175.0.198.10:3000";

// Base host (no /api here)
export const API_BASE = (import.meta.env?.VITE_API_BASE_URL || DEFAULT_BASE).replace(/\/+$/, "");

// API root
const API_API = `${API_BASE}/api`;

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  if (payload && Array.isArray(payload.rows)) return payload.rows;
  if (payload && Array.isArray(payload.items)) return payload.items;
  return [];
}

async function getJson(url, { signal } = {}) {
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed (${res.status}) ${url}${text ? `\n${text}` : ""}`);
  }
  return res.json();
}

export async function fetchDocuments(opts) {
  const json = await getJson(`${API_API}/documents`, opts);
  return normalizeList(json);
}

export async function fetchAnnouncements(opts) {
  const json = await getJson(`${API_API}/announcements`, opts);
  return normalizeList(json);
}

export async function fetchForms(opts) {
  const json = await getJson(`${API_API}/form-templates`, opts);
  return normalizeList(json);
}