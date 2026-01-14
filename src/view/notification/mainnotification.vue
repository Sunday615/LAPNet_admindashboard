<!-- AdminNotifications.vue
  ✅ หน้า "ແຈ້ງເຕືອນ" สำหรับ Admin Dashboard (ใช้งานกับตาราง notifications + /api/notifications)
  - ดึงรายการจาก DB: notifications (จาก trigger ที่คุณสร้างไว้)
  - ฟีเจอร์:
    - ค้นหา (q)
    - filter entity / action
    - unread only
    - mark read / mark all read
    - delete
    - กด "Open" เพื่อไปหน้า linkpath (ถ้ามี)
  - ใช้ GSAP สำหรับ animation
  - ใช้ Global theme จาก App.vue (CSS vars)
-->
<template>
  <section class="page" ref="pageEl">
    <!-- Header -->
    <header class="page__header">
      <div class="page__titleWrap">
        <h1 class="page__title">ແຈ້ງເຕືອນ (Admin Dashboard)</h1>
        <p class="page__subtitle">
          ລາຍການແຈ້ງເຕືອນຈາກ Events (insert / edit / delete / active_on / active_off)
        </p>
      </div>

      <div class="page__actions">
        <div class="search">
          <span class="search__icon" aria-hidden="true">⌕</span>
          <input
            v-model="q"
            class="input"
            type="text"
            placeholder="Search: title / message / entity / action..."
            @input="onSearchInput"
          />
        </div>

        <select v-model="entity" class="select">
          <option value="">All entity</option>
          <option v-for="e in ENTITIES" :key="e" :value="e">{{ e }}</option>
        </select>

        <select v-model="action" class="select">
          <option value="">All action</option>
          <option v-for="a in ACTIONS" :key="a" :value="a">{{ a }}</option>
        </select>

        <label class="switch">
          <input type="checkbox" v-model="unreadOnly" />
          <span class="switch__ui"></span>
          <span class="switch__label">Unread only</span>
        </label>

        <button class="btn btn--primary" type="button" @click="markAllRead" :disabled="loading">
          Mark all read
        </button>

        <button class="btn" type="button" @click="reloadAll" :disabled="loading">
          Refresh
        </button>
      </div>
    </header>

    <!-- Toast -->
    <transition name="toast">
      <div v-if="toast.show" class="toast" role="status" aria-live="polite">
        <div class="toast__dot" aria-hidden="true"></div>
        <div class="toast__body">
          <div class="toast__title">{{ toast.title }}</div>
          <div class="toast__msg">{{ toast.message }}</div>
        </div>
        <button class="toast__close" type="button" @click="toast.show = false">✕</button>
      </div>
    </transition>

    <!-- Main Card -->
    <div class="card" ref="cardEl">
      <div class="card__head">
        <div class="card__headLeft">
          <h2 class="card__headTitle">Notifications</h2>
          <div class="pill">
            Unread: <b>{{ unreadCount }}</b> · Showing: <b>{{ items.length }}</b>
          </div>
        </div>

        <div class="card__headRight">
          <div class="pill pill--soft">
            limit <b>{{ limit }}</b>
          </div>
        </div>
      </div>

      <!-- Loading / Error -->
      <div v-if="loading" class="state">
        <div class="spinner" aria-hidden="true"></div>
        <div>Loading notifications...</div>
      </div>

      <div v-else-if="error" class="state state--error">
        <div class="state__title">Load failed</div>
        <div class="state__msg">{{ error }}</div>
        <button class="btn btn--primary" @click="loadNotifications(true)">Try again</button>
      </div>

      <!-- Table -->
      <div v-else class="tableWrap">
        <table class="table">
          <thead>
            <tr>
              <th style="width: 90px;">Status</th>
              <th style="width: 150px;">Entity</th>
              <th style="width: 150px;">Action</th>
              <th style="width: 260px;">Title</th>
              <th>Message</th>
              <th style="width: 190px;">Time</th>
              <th style="width: 220px; text-align: right;">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="items.length === 0">
              <td colspan="7" class="empty">No notifications</td>
            </tr>

            <tr
              v-for="n in items"
              :key="n.id"
              :data-row-id="n.id"
              :class="[{ 'row--unread': !n.isRead }, { 'row--flash': n.id === flashRowId }]"
            >
              <td>
                <div class="status">
                  <span class="dot" :class="n.isRead ? 'dot--read' : 'dot--unread'"></span>
                  <span class="muted">{{ n.isRead ? "read" : "unread" }}</span>
                </div>
              </td>

              <td>
                <div class="mono">{{ n.entity }}</div>
                <div v-if="n.refId" class="muted mono">#{{ n.refId }}</div>
              </td>

              <td>
                <div class="tag">{{ n.action }}</div>
              </td>

              <td>
                <div class="titleCell">{{ n.title || "-" }}</div>
                <div v-if="n.linkpath" class="muted mono">{{ n.linkpath }}</div>
              </td>

              <td>
                <div class="msgCell">{{ n.message || "-" }}</div>
              </td>

              <td>
                <div class="muted">{{ formatDateTime(n.time) }}</div>
                <div v-if="n.readTime" class="muted">read: {{ formatDateTime(n.readTime) }}</div>
              </td>

              <td class="actions">
                <button class="btn btn--ghost" :disabled="!n.linkpath" @click="openLink(n)">
                  Open
                </button>
                <button class="btn btn--ghost" :disabled="n.isRead" @click="markRead(n)">
                  Mark read
                </button>
                <button class="btn btn--danger" @click="removeItem(n)">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Load more -->
        <div class="loadMore">
          <button class="btn" type="button" @click="loadMore" :disabled="loading || !hasMore">
            {{ hasMore ? "Load more" : "No more" }}
          </button>
        </div>
      </div>

      <div class="card__foot">
        <div class="hint">
          <b>Note:</b> ຂໍ້ມູນຈາກ <span class="mono">notifications</span> table (trigger) ·
          Filter/ຄົ້ນຫາ query params ຂອງ API
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { nextTick, onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import gsap from "gsap";

const router = useRouter();

/**
 * ✅ API ตาม backend ที่เราทำไว้:
 * - GET    /api/notifications?limit=50&offset=0&unread=1&entity=member&action=insert&q=...
 * - GET    /api/notifications/unread-count
 * - PATCH  /api/notifications/:id/read
 * - PATCH  /api/notifications/read-all
 * - DELETE /api/notifications/:id
 */
const API = {
  list: (params) => {
    const qs = new URLSearchParams(params).toString();
    return `/api/notifications${qs ? `?${qs}` : ""}`;
  },
  unreadCount: "/api/notifications/unread-count",
  read: (id) => `/api/notifications/${id}/read`,
  readAll: "/api/notifications/read-all",
  remove: (id) => `/api/notifications/${id}`,
};

const ENTITIES = ["member", "announcement", "news", "jobs", "boarddirector", "emp_lapnet"];
const ACTIONS = ["insert", "edit", "delete", "active_on", "active_off"];

// ---------- Refs ----------
const pageEl = ref(null);
const cardEl = ref(null);

// ---------- State ----------
const items = ref([]);
const loading = ref(false);
const error = ref("");

const unreadCount = ref(0);

const q = ref("");
const entity = ref("");
const action = ref("");
const unreadOnly = ref(false);

const limit = ref(50);
const offset = ref(0);
const hasMore = ref(true);

let searchTimer = null;

const toast = reactive({
  show: false,
  title: "",
  message: "",
  type: "info",
  _t: null,
});

const flashRowId = ref(null);
let flashTimer = null;

// ---------- Helpers ----------
function showToast(type, title, message) {
  toast.type = type;
  toast.title = title;
  toast.message = message;
  toast.show = true;

  gsap.fromTo(".toast", { y: -8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: "power2.out" });

  window.clearTimeout(toast._t);
  toast._t = window.setTimeout(() => (toast.show = false), 3000);
}

function formatDateTime(d) {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleString();
}

function flashRow(id) {
  flashRowId.value = id;
  window.clearTimeout(flashTimer);

  nextTick(() => {
    const el = document.querySelector(`[data-row-id="${CSS.escape(String(id))}"]`);
    if (!el) return;

    gsap.fromTo(
      el,
      { backgroundColor: "rgba(255, 210, 77, 0.25)" },
      { backgroundColor: "rgba(255, 210, 77, 0)", duration: 1.1, ease: "power2.out" }
    );
  });

  flashTimer = window.setTimeout(() => (flashRowId.value = null), 1400);
}

async function apiFetch(url, opts = {}) {
  const res = await fetch(url, {
    method: opts.method || "GET",
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: "include",
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

function normalizeRow(r) {
  return {
    id: r.idnotification ?? r.id ?? r._id,
    entity: r.entity ?? "-",
    action: r.action ?? "-",
    refId: r.ref_id ?? null,
    title: r.title ?? "",
    message: r.message ?? "",
    payload: r.payload ?? null,
    linkpath: r.linkpath ?? "",
    isRead: !!(r.is_read ?? r.isRead),
    time: r.time ?? null,
    readTime: r.read_time ?? r.readTime ?? null,
  };
}

function buildParams(extra = {}) {
  const params = {
    limit: String(limit.value),
    offset: String(offset.value),
    ...(q.value?.trim() ? { q: q.value.trim() } : {}),
    ...(entity.value ? { entity: entity.value } : {}),
    ...(action.value ? { action: action.value } : {}),
    ...(unreadOnly.value ? { unread: "1" } : {}),
    ...extra,
  };
  return params;
}

// ---------- API calls ----------
async function loadUnreadCount() {
  try {
    const data = await apiFetch(API.unreadCount);
    unreadCount.value = data?.unread ?? 0;
  } catch {
    // ไม่ต้อง throw เพื่อไม่ให้หน้า fail ทั้งหมด
  }
}

async function loadNotifications(reset = false) {
  if (loading.value) return;

  if (reset) {
    offset.value = 0;
    hasMore.value = true;
  }

  loading.value = true;
  error.value = "";

  try {
    const data = await apiFetch(API.list(buildParams()));
    const rows = Array.isArray(data) ? data : data?.items || [];
    const normalized = rows.map(normalizeRow);

    if (reset) items.value = normalized;
    else items.value = [...items.value, ...normalized];

    // heuristic: ถ้าได้น้อยกว่า limit -> ไม่มีต่อ
    hasMore.value = normalized.length === limit.value;

    await nextTick();
    const trs = document.querySelectorAll("tbody tr");
    gsap.fromTo(trs, { opacity: 0.86, y: 4 }, { opacity: 1, y: 0, duration: 0.18, stagger: 0.01 });

    loadUnreadCount();
  } catch (e) {
    error.value = e?.message || String(e);
  } finally {
    loading.value = false;
  }
}

async function loadMore() {
  if (!hasMore.value) return;
  offset.value += limit.value;
  await loadNotifications(false);
}

async function markRead(item) {
  try {
    await apiFetch(API.read(item.id), { method: "PATCH" });
    item.isRead = true;
    item.readTime = new Date().toISOString();

    showToast("success", "Updated", "Marked as read");
    flashRow(item.id);
    loadUnreadCount();
  } catch (e) {
    showToast("error", "Failed", e?.message || String(e));
  }
}

async function markAllRead() {
  const ok = window.confirm("Mark all notifications as read?");
  if (!ok) return;

  try {
    await apiFetch(API.readAll, { method: "PATCH" });
    items.value = items.value.map((x) => ({ ...x, isRead: true, readTime: x.readTime || new Date().toISOString() }));
    showToast("success", "Done", "All notifications marked as read");
    loadUnreadCount();
  } catch (e) {
    showToast("error", "Failed", e?.message || String(e));
  }
}

async function removeItem(item) {
  const ok = window.confirm(`Delete this notification?\n${item.entity}.${item.action} (#${item.refId || "-"})`);
  if (!ok) return;

  try {
    await apiFetch(API.remove(item.id), { method: "DELETE" });
    items.value = items.value.filter((x) => x.id !== item.id);
    showToast("success", "Deleted", "Notification removed");
    loadUnreadCount();
  } catch (e) {
    showToast("error", "Failed", e?.message || String(e));
  }
}

function openLink(item) {
  if (!item.linkpath) return;
  router.push(item.linkpath);
}

async function reloadAll() {
  await loadNotifications(true);
  await loadUnreadCount();
  showToast("success", "Refreshed", "Loaded latest notifications");
}

// ---------- Search debounce ----------
function onSearchInput() {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => {
    loadNotifications(true);
  }, 220);
}

// ---------- Watch filters ----------
watch([entity, action, unreadOnly], () => loadNotifications(true));

// ---------- Lifecycle ----------
onMounted(async () => {
  if (pageEl.value) gsap.fromTo(pageEl.value, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" });
  if (cardEl.value) gsap.fromTo(cardEl.value, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.28 });

  await loadUnreadCount();
  await loadNotifications(true);
});
</script>

<style scoped>
/* ✅ ใช้ CSS variables จาก App.vue เป็นหลัก (global theme) */
.page {
  padding: 18px;
  color: var(--text, #eaeaea);
}

.page__header {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.page__titleWrap {
  min-width: 280px;
}
.page__title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.2px;
}
.page__subtitle {
  margin: 6px 0 0;
  opacity: 0.75;
  font-size: 13px;
}

.page__actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 10px;
  border-radius: 12px;
  background: var(--surface-2, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
}
.search__icon {
  opacity: 0.7;
}

.input {
  width: 100%;
  min-width: 240px;
  color: inherit;
  background: transparent;
  border: none;
  outline: none;
  font-size: 13px;
}

.select {
  min-width: 160px;
  padding: 10px 10px;
  border-radius: 12px;
  border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
  background: var(--surface-2, rgba(255, 255, 255, 0.06));
  color: inherit;
  outline: none;
  font-size: 13px;
}

/* Buttons */
.btn {
  appearance: none;
  border: 1px solid var(--border, rgba(255, 255, 255, 0.14));
  background: var(--surface-2, rgba(255, 255, 255, 0.06));
  color: inherit;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: transform 0.08s ease, opacity 0.2s ease;
}
.btn:hover {
  opacity: 0.95;
}
.btn:active {
  transform: scale(0.99);
}
.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn--primary {
  border-color: rgba(255, 255, 255, 0.18);
  background: var(--primary, rgba(120, 92, 255, 0.35));
}
.btn--ghost {
  background: transparent;
}
.btn--danger {
  background: rgba(255, 80, 80, 0.18);
  border-color: rgba(255, 80, 80, 0.25);
}

/* Card */
.card {
  border-radius: 16px;
  border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
  background: var(--surface, rgba(255, 255, 255, 0.04));
  overflow: hidden;
  box-shadow: var(--shadow, 0 10px 30px rgba(0, 0, 0, 0.25));
}

.card__head {
  padding: 14px 14px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--border, rgba(255, 255, 255, 0.1));
}
.card__headLeft {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.card__headTitle {
  margin: 0;
  font-size: 15px;
}
.card__headRight {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card__foot {
  padding: 12px 14px;
  border-top: 1px solid var(--border, rgba(255, 255, 255, 0.1));
}
.hint {
  font-size: 12px;
  opacity: 0.8;
}

/* Table */
.tableWrap {
  overflow: auto;
}
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
th,
td {
  padding: 12px 12px;
  border-bottom: 1px solid var(--border, rgba(255, 255, 255, 0.08));
  vertical-align: top;
}
th {
  text-align: left;
  opacity: 0.75;
  font-weight: 600;
}
.actions {
  text-align: right;
  white-space: nowrap;
}
.actions .btn {
  margin-left: 6px;
}

.empty {
  padding: 18px;
  text-align: center;
  opacity: 0.7;
}

.row--unread {
  background: rgba(255, 255, 255, 0.02);
}
.row--flash {
  outline: 2px solid rgba(255, 210, 77, 0.25);
  outline-offset: -2px;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 12px;
}
.muted {
  opacity: 0.7;
}
.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--border, rgba(255, 255, 255, 0.14));
  background: var(--surface-2, rgba(255, 255, 255, 0.06));
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
  background: rgba(255, 255, 255, 0.04);
  font-size: 12px;
}
.pill--soft {
  background: rgba(255, 255, 255, 0.06);
}

.titleCell {
  font-weight: 700;
}
.msgCell {
  opacity: 0.92;
}

/* Status dot */
.status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.06);
}
.dot--unread {
  background: rgba(255, 210, 77, 0.95);
}
.dot--read {
  background: rgba(120, 92, 255, 0.7);
  box-shadow: 0 0 0 6px rgba(120, 92, 255, 0.12);
}

/* Switch */
.switch {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.switch input {
  display: none;
}
.switch__ui {
  width: 44px;
  height: 24px;
  border-radius: 999px;
  border: 1px solid var(--border, rgba(255, 255, 255, 0.18));
  background: rgba(255, 255, 255, 0.06);
  position: relative;
  cursor: pointer;
}
.switch__ui::after {
  content: "";
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  top: 2px;
  left: 2px;
  background: rgba(255, 255, 255, 0.75);
  transition: transform 0.18s ease;
}
.switch input:checked + .switch__ui {
  background: var(--primary, rgba(120, 92, 255, 0.35));
}
.switch input:checked + .switch__ui::after {
  transform: translateX(20px);
}
.switch__label {
  font-size: 13px;
  opacity: 0.9;
}

/* States */
.state {
  padding: 20px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  opacity: 0.85;
}
.state--error {
  color: var(--danger-text, #ffb3b3);
}
.state__title {
  font-weight: 700;
}
.state__msg {
  opacity: 0.85;
}

.spinner {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: rgba(255, 255, 255, 0.8);
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Load more */
.loadMore {
  padding: 12px 14px;
  display: flex;
  justify-content: center;
}

/* Toast */
.toast {
  position: fixed;
  top: 14px;
  right: 14px;
  width: min(420px, calc(100vw - 28px));
  border-radius: 14px;
  border: 1px solid var(--border, rgba(255, 255, 255, 0.14));
  background: var(--surface, rgba(20, 20, 25, 0.92));
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
  padding: 12px 12px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  z-index: 80;
}
.toast__dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--primary, rgba(120, 92, 255, 0.8));
  margin-top: 6px;
}
.toast__body {
  flex: 1;
}
.toast__title {
  font-weight: 800;
  font-size: 13px;
}
.toast__msg {
  opacity: 0.8;
  font-size: 12px;
  margin-top: 3px;
}
.toast__close {
  border: none;
  background: transparent;
  color: inherit;
  opacity: 0.7;
  cursor: pointer;
  font-size: 14px;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 980px) {
  .input {
    min-width: 200px;
  }
  th:nth-child(5),
  td:nth-child(5) {
    min-width: 320px;
  }
}
</style>
