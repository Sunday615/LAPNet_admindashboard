<template>
  <div class="viewerDash">
    <div class="card">
      <h1 class="title">Viewer Dashboard</h1>
      <p class="sub">Welcome, {{ displayName }}</p>

      <div class="grid">
        <div class="box">
          <div class="k">View Only</div>
          <div class="v">Members / News / Jobs / Announcements</div>
        </div>
        <div class="box">
          <div class="k">Role</div>
          <div class="v">{{ role }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

function safeJsonParse(x) {
  try {
    return JSON.parse(String(x));
  } catch {
    return null;
  }
}

function getUser() {
  const u1 = localStorage.getItem("user");
  if (u1) return safeJsonParse(u1);
  const u2 = sessionStorage.getItem("user");
  if (u2) return safeJsonParse(u2);
  return null;
}

function normalizeRole(r) {
  return String(r || "").trim().toLowerCase();
}

const user = computed(() => getUser());
const role = computed(() => normalizeRole(user.value?.role) || "viewer");
const displayName = computed(() => user.value?.name || user.value?.username || "User");
</script>

<style scoped>
.viewerDash {
  padding: 18px;
}
.card {
  max-width: 880px;
  margin: 0 auto;
  border-radius: 18px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.title {
  margin: 0 0 6px;
  font-weight: 900;
}
.sub {
  margin: 0 0 14px;
  opacity: 0.7;
  font-weight: 700;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.box {
  border-radius: 16px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.k {
  font-weight: 900;
  opacity: 0.75;
  margin-bottom: 6px;
}
.v {
  font-weight: 800;
}
@media (max-width: 720px) {
  .grid { grid-template-columns: 1fr; }
}
</style>
