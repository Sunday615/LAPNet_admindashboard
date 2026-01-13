<!-- src/pages/admin/Notifications.vue -->
<template>
  <div class="notif-page">
    <header class="notif-header">
      <div class="title-wrap">
        <h1 class="notif-title">Notifications</h1>
        <p class="notif-subtitle">
          Track admin panel activity (insert / edit / delete / set active).
        </p>
      </div>

      <div class="stats-wrap">
        <div class="stat-card">
          <div class="stat-label">Total</div>
          <div class="stat-value">{{ notifications.length }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Unread</div>
          <div class="stat-value">{{ unreadCount }}</div>
        </div>

        <div class="header-actions">
          <button class="btn" type="button" @click="refresh" :disabled="loading">
            {{ loading ? "Loading..." : "Refresh" }}
          </button>
          <button class="btn" type="button" @click="markAllRead" :disabled="notifications.length === 0">
            Mark all read
          </button>
          <button class="btn danger" type="button" @click="clearAll" :disabled="notifications.length === 0">
            Clear
          </button>
        </div>
      </div>
    </header>

    <section class="notif-controls">
      <div class="control">
        <label class="control-label">Entity</label>
        <select class="control-input" v-model="filters.entity">
          <option value="">All</option>
          <option v-for="e in entityOptions" :key="e.value" :value="e.value">
            {{ e.label }}
          </option>
        </select>
      </div>

      <div class="control">
        <label class="control-label">Action</label>
        <select class="control-input" v-model="filters.action">
          <option value="">All</option>
          <option v-for="a in actionOptions" :key="a.value" :value="a.value">
            {{ a.label }}
          </option>
        </select>
      </div>

      <div class="control grow">
        <label class="control-label">Search</label>
        <input
          class="control-input"
          v-model="filters.search"
          placeholder="Search message / target / actor..."
          type="text"
        />
      </div>

      <label class="control check">
        <input type="checkbox" v-model="filters.unreadOnly" />
        <span>Unread only</span>
      </label>
    </section>

    <section class="notif-content">
      <div v-if="filtered.length === 0" class="empty">
        <div class="empty-title">No notifications</div>
        <div class="empty-subtitle">
          When you insert / edit / delete in your admin modules, they’ll show here.
        </div>

        <div class="empty-actions">
          <button class="btn" type="button" @click="seedExamples">Add example items</button>
        </div>
      </div>

      <TransitionGroup
        v-else
        name="noop"
        tag="div"
        class="notif-list"
        @before-enter="onBeforeEnter"
        @enter="onEnter"
        @leave="onLeave"
      >
        <article
          v-for="(n, idx) in filtered"
          :key="n.id"
          class="notif-item"
          :data-index="idx"
          :class="{ unread: !n.readAt }"
          @click="markOneRead(n)"
        >
          <div class="item-left">
            <div class="badges">
              <span class="badge entity">{{ entityLabel(n.entity) }}</span>
              <span class="badge" :class="actionClass(n.action)">{{ actionLabel(n.action) }}</span>
              <span v-if="!n.readAt" class="badge unread-badge">Unread</span>
            </div>

            <div class="message">
              {{ n.message }}
            </div>

            <div class="meta">
              <span class="meta-time">{{ formatTime(n.createdAt) }}</span>
              <span v-if="n.actor?.name" class="meta-dot">•</span>
              <span v-if="n.actor?.name" class="meta-actor">By {{ n.actor.name }}</span>
              <span v-if="n.targetLabel" class="meta-dot">•</span>
              <span v-if="n.targetLabel" class="meta-target">Target: {{ n.targetLabel }}</span>
            </div>
          </div>

          <div class="item-right">
            <button class="icon-btn" type="button" title="Mark read" @click.stop="markOneRead(n)">
              ✓
            </button>
          </div>
        </article>
      </TransitionGroup>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import gsap from "gsap";



const loading = ref(false);
const notifications = ref([]);

/**
 * Filters
 */
const filters = reactive({
  entity: "",
  action: "",
  search: "",
  unreadOnly: false,
});

/**
 * Options (match your admin panel structure)
 */
const entityOptions = [
  { value: "member", label: "Member" },
  { value: "announcement", label: "Announcement" },
  { value: "news", label: "News" },
  { value: "jobs", label: "Jobs" },
  { value: "boarddirector", label: "BoardDirector" },
  { value: "emp_company", label: "Emp_company" },
];

const actionOptions = [
  { value: "insert", label: "Insert" },
  { value: "edit", label: "Edit" },
  { value: "delete", label: "Delete" },
  { value: "set_active", label: "Set active" },
  { value: "set_inactive", label: "Set inactive" },
];

/**
 * Derived
 */
const unreadCount = computed(() => notifications.value.filter((n) => !n.readAt).length);

const filtered = computed(() => {
  const q = filters.search.trim().toLowerCase();

  return notifications.value
    .filter((n) => (filters.entity ? String(n.entity).toLowerCase() === filters.entity : true))
    .filter((n) => (filters.action ? normalizeAction(n.action) === filters.action : true))
    .filter((n) => (filters.unreadOnly ? !n.readAt : true))
    .filter((n) => {
      if (!q) return true;
      const hay = [
        n.message,
        n.entity,
        n.action,
        n.targetLabel,
        n.actor?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
});

function normalizeAction(action) {
  const a = String(action || "").toLowerCase();
  if (a === "activate") return "set_active";
  if (a === "deactivate") return "set_inactive";
  return a;
}

/**
 * Labels
 */
function entityLabel(entity) {
  return getEntityLabel(entity);
}
function actionLabel(action) {
  return getActionLabel(action);
}
function actionClass(action) {
  const a = normalizeAction(action);
  if (a === "insert") return "good";
  if (a === "edit") return "warn";
  if (a === "delete") return "danger";
  if (a === "set_active") return "active";
  if (a === "set_inactive") return "inactive";
  return "neutral";
}

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return String(iso || "");
  }
}

/**
 * Load from backend (if configured)
 */
async function refresh() {
  loading.value = true;
  try {
    const { ok, items } = await listNotifications({ limit: 200 });
    if (ok && Array.isArray(items)) {
      // newest on top
      notifications.value = items
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  } finally {
    loading.value = false;
  }
}

/**
 * Mark read
 */
async function markOneRead(n) {
  if (!n || n.readAt) return;

  // optimistic
  n.readAt = new Date().toISOString();

  try {
    await markNotificationRead(n.id);
  } catch {
    // keep optimistic
  }
}

async function markAllRead() {
  const now = new Date().toISOString();
  notifications.value.forEach((n) => {
    if (!n.readAt) n.readAt = now;
  });

  try {
    await apiMarkAllRead();
  } catch {}
}

async function clearAll() {
  // optimistic
  notifications.value = [];
  try {
    await clearAllNotifications();
  } catch {}
}

/**
 * Realtime in-app events (from other pages)
 */
let unsub = null;

onMounted(async () => {
  // page intro animation
  gsap.from(".notif-title", { opacity: 0, y: 8, duration: 0.35, ease: "power2.out" });
  gsap.from(".notif-subtitle", { opacity: 0, y: 8, duration: 0.35, delay: 0.05, ease: "power2.out" });

  await refresh();

  // subscribe to realtime events
  unsub = onAdminNotification((n) => {
    // add to top
    notifications.value = [n, ...notifications.value];
  });
});

onBeforeUnmount(() => {
  if (typeof unsub === "function") unsub();
});

/**
 * GSAP list animations (TransitionGroup hooks)
 */
function onBeforeEnter(el) {
  el.style.opacity = "0";
  el.style.transform = "translateY(10px)";
}

function onEnter(el, done) {
  const idx = Number(el.dataset.index || 0);
  gsap.to(el, {
    opacity: 1,
    y: 0,
    duration: 0.25,
    ease: "power2.out",
    delay: Math.min(idx * 0.02, 0.2),
    onComplete: done,
  });
}

function onLeave(el, done) {
  gsap.to(el, {
    opacity: 0,
    y: -8,
    duration: 0.2,
    ease: "power2.in",
    onComplete: done,
  });
}

/**
 * Demo seed (optional)
 */
async function seedExamples() {
  await notifyAdmin({ entity: "member", action: "insert", targetLabel: "John Doe" });
  await notifyAdmin({ entity: "announcement", action: "edit", targetLabel: "Holiday schedule" });
  await notifyAdmin({ entity: "news", action: "delete", targetLabel: "Old post #12" });
}
</script>

<style scoped>
/* Global-theme friendly: uses CSS variables with safe fallbacks */
.notif-page {
  padding: 18px;
  color: var(--text-1, #111);
}

.notif-header {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 14px;
  align-items: start;
  margin-bottom: 14px;
}

.title-wrap {
  min-width: 240px;
}

.notif-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
}

.notif-subtitle {
  margin: 6px 0 0;
  color: var(--text-2, #555);
  font-size: 13px;
}

.stats-wrap {
  display: flex;
  gap: 10px;
  align-items: stretch;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.stat-card {
  border: 1px solid var(--border, rgba(0,0,0,0.12));
  background: var(--surface-1, #fff);
  border-radius: 12px;
  padding: 10px 12px;
  min-width: 110px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-2, #555);
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  margin-top: 4px;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn {
  border: 1px solid var(--border, rgba(0,0,0,0.14));
  background: var(--surface-1, #fff);
  color: var(--text-1, #111);
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 13px;
  cursor: pointer;
  transition: transform 0.12s ease;
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn.danger {
  border-color: var(--danger-border, rgba(220, 38, 38, 0.35));
}

.notif-controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: end;
  border: 1px solid var(--border, rgba(0,0,0,0.12));
  background: var(--surface-1, #fff);
  border-radius: 14px;
  padding: 12px;
  margin-bottom: 14px;
}

.control {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 160px;
}

.control.grow {
  flex: 1;
  min-width: 220px;
}

.control-label {
  font-size: 12px;
  color: var(--text-2, #555);
}

.control-input {
  border: 1px solid var(--border, rgba(0,0,0,0.14));
  background: var(--surface-0, #fff);
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 13px;
  outline: none;
}

.control.check {
  flex-direction: row;
  align-items: center;
  gap: 8px;
  min-width: auto;
  padding: 6px 6px 2px;
  user-select: none;
  font-size: 13px;
  color: var(--text-2, #555);
}

.notif-content {
  border-radius: 14px;
}

.empty {
  border: 1px dashed var(--border, rgba(0,0,0,0.22));
  background: var(--surface-1, #fff);
  border-radius: 14px;
  padding: 18px;
}

.empty-title {
  font-size: 14px;
  font-weight: 700;
}

.empty-subtitle {
  margin-top: 6px;
  font-size: 13px;
  color: var(--text-2, #555);
}

.empty-actions {
  margin-top: 12px;
}

.notif-list {
  display: grid;
  gap: 10px;
}

.notif-item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: start;
  border: 1px solid var(--border, rgba(0,0,0,0.12));
  background: var(--surface-1, #fff);
  border-radius: 14px;
  padding: 12px;
  cursor: pointer;
}

.notif-item.unread {
  border-color: var(--focus-border, rgba(59, 130, 246, 0.35));
  box-shadow: 0 1px 0 rgba(0,0,0,0.03);
}

.badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.badge {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid var(--border, rgba(0,0,0,0.14));
  background: var(--surface-0, rgba(0,0,0,0.03));
}

.badge.entity {
  font-weight: 700;
}

.badge.unread-badge {
  border-color: var(--focus-border, rgba(59, 130, 246, 0.35));
}

.badge.good { border-color: rgba(34,197,94,0.35); }
.badge.warn { border-color: rgba(245,158,11,0.35); }
.badge.danger { border-color: rgba(239,68,68,0.35); }
.badge.active { border-color: rgba(59,130,246,0.35); }
.badge.inactive { border-color: rgba(100,116,139,0.35); }
.badge.neutral { border-color: rgba(0,0,0,0.14); }

.message {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
}

.meta {
  font-size: 12px;
  color: var(--text-2, #555);
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
}

.meta-dot {
  opacity: 0.7;
}

.item-right {
  display: flex;
  align-items: start;
}

.icon-btn {
  border: 1px solid var(--border, rgba(0,0,0,0.14));
  background: var(--surface-0, rgba(0,0,0,0.03));
  border-radius: 10px;
  padding: 6px 9px;
  cursor: pointer;
}
</style>
