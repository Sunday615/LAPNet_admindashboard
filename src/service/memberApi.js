// src/services/membersService.js
// ✅ Use Vite .env
// VITE_API_URL=http://175.0.198.10:3000/api
// VITE_API_BASE_URL=http://175.0.198.10:3000

// Prefer API_URL (includes /api). Fallback to API_BASE_URL + "/api".
const API_URL =
  (import.meta.env?.VITE_API_URL || "").replace(/\/+$/, "") ||
  ((import.meta.env?.VITE_API_BASE_URL || "").replace(/\/+$/, "") + "/api");

const API_MEMBERS = `${API_URL}/members`;

function normalizeMember(x) {
  // พยายาม map field ให้ “ทน” ต่อชื่อคอลัมน์ต่างๆ
  return {
    id: x.id ?? x._id ?? x.member_id ?? crypto.randomUUID(),
    name:
      x.name ??
      x.bank_name ??
      x.memberbank_name ??
      x.member_name ??
      x.title ??
      "Unnamed",
    code: x.code ?? x.bank_code ?? x.swift ?? x.short_name ?? "",
    logoUrl: x.logoUrl ?? x.logo_url ?? x.logo ?? x.image ?? x.avatar ?? "",
    phone: x.phone ?? x.tel ?? x.mobile ?? "",
    email: x.email ?? "",
    address: x.address ?? x.location ?? "",
    website: x.website ?? x.web ?? "",
    raw: x, // เก็บไว้เผื่อแสดงเพิ่ม
  };
}

export async function fetchMembers({ signal } = {}) {
  const res = await fetch(API_MEMBERS, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });

  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);

  const data = await res.json();

  // รองรับทั้งแบบ array และ {data:[...]}
  const arr = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : [];

  return arr.map(normalizeMember);
}