<!-- src/views/ViewerDashboard.vue -->
<template>
  <div class="page">
    <div class="topbar">
      <div class="headline">
        <div class="kicker">Viewer</div>
        <h1 class="title">Main Dashboard</h1>
        <p class="subtitle">Get data from API</p>
      </div>

      <div class="actions">
        <button class="btn" type="button" @click="refresh" :disabled="loading">
          <span class="dot" :class="{ spin: loading }">⟲</span>
          Refresh
        </button>
      </div>
    </div>

    <div class="grid stats" ref="statsRef">
      <StatCard
        label="Documents"
        :value="stats.documents"
        :hint="stats.documentsHint"
        :loading="loading"
        to="/documents"
      >
        <template #icon>
          <span class="i">📄</span>
        </template>
      </StatCard>

      <StatCard
        label="Announcements"
        :value="stats.announcements"
        :hint="stats.announcementsHint"
        :loading="loading"
        to="/announcements"
      >
        <template #icon>
          <span class="i">📣</span>
        </template>
      </StatCard>

      <StatCard
        label="Forms"
        :value="stats.forms"
        :hint="stats.formsHint"
        :loading="loading"
        to="/forms"
      >
        <template #icon>
          <span class="i">🧾</span>
        </template>
      </StatCard>
    </div>

    <div class="grid lists" ref="listsRef">
      <ListCard
        title="Latest Documents"
        :items="latestDocuments"
        :loading="loading"
        :getTitle="(x) => x.title || x.name || x.filename || 'Untitled'"
        :getSub="(x) => x.category || x.department || x.description || '—'"
        :getDate="(x) => x.updatedAt || x.createdAt || x.date || x.uploadedAt"
        @viewAll="go('/documents')"
        :onItemClick="(x) => onOpenItem('documents', x)"
      >
        <template #icon><span class="i">📄</span></template>
      </ListCard>

      <ListCard
        title="Latest Announcements"
        :items="latestAnnouncements"
        :loading="loading"
        :getTitle="(x) => x.title || x.subject || 'No title'"
        :getSub="(x) => x.summary || x.content || x.body || '—'"
        :getDate="(x) => x.publishedAt || x.updatedAt || x.createdAt || x.date"
        @viewAll="go('/announcements')"
        :onItemClick="(x) => onOpenItem('announcements', x)"
      >
        <template #icon><span class="i">📣</span></template>
      </ListCard>

      <ListCard
        title="Latest Forms"
        :items="latestForms"
        :loading="loading"
        :getTitle="(x) => x.templateName || x.name || x.title || 'Unnamed form'"
        :getSub="(x) => (x.isActive ?? x.active) ? 'Active' : 'Inactive'"
        :getDate="(x) => x.updatedAt || x.createdAt || x.date"
        @viewAll="go('/forms')"
        :onItemClick="(x) => onOpenItem('forms', x)"
      >
        <template #icon><span class="i">🧾</span></template>
      </ListCard>
    </div>

    <div v-if="error" class="error">
      <div class="error-title">เกิดข้อผิดพลาด</div>
      <div class="error-msg">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import gsap from "gsap";

import StatCard from "../memberdashboard/maindashboardcomponent/StatCard.vue";
import ListCard from "../memberdashboard/maindashboardcomponent/ListCard.vue";
import {
  fetchAnnouncements,
  fetchDocuments,
  fetchForms,
} from "../../service/viewerDashboardApi.js";

const router = useRouter();

const loading = ref(false);
const error = ref("");

const documents = ref([]);
const announcements = ref([]);
const forms = ref([]);

const statsRef = ref(null);
const listsRef = ref(null);

function safeDate(v) {
  if (!v) return 0;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function sortLatest(arr) {
  return [...arr].sort((a, b) => {
    const da =
      safeDate(a.updatedAt) ||
      safeDate(a.createdAt) ||
      safeDate(a.date) ||
      safeDate(a.publishedAt) ||
      safeDate(a.uploadedAt);
    const db =
      safeDate(b.updatedAt) ||
      safeDate(b.createdAt) ||
      safeDate(b.date) ||
      safeDate(b.publishedAt) ||
      safeDate(b.uploadedAt);
    return db - da;
  });
}

const latestDocuments = computed(() => sortLatest(documents.value).slice(0, 6));
const latestAnnouncements = computed(() =>
  sortLatest(announcements.value).slice(0, 6)
);
const latestForms = computed(() => sortLatest(forms.value).slice(0, 6));

const stats = computed(() => {
  const docs = documents.value.length;
  const anns = announcements.value.length;
  const fs = forms.value.length;

  const activeForms = forms.value.filter((x) => (x.isActive ?? x.active) === true)
    .length;

  return {
    documents: docs,
    announcements: anns,
    forms: fs,
    documentsHint: docs ? `มีเอกสารทั้งหมด ${docs} รายการ` : "ยังไม่มีเอกสาร",
    announcementsHint: anns ? `มีประกาศทั้งหมด ${anns} รายการ` : "ยังไม่มีประกาศ",
    formsHint: fs ? `Active ${activeForms} / ${fs}` : "ยังไม่มีฟอร์ม",
  };
});

function go(to) {
  router.push(to);
}

function animateIn() {
  const statEls = statsRef.value?.querySelectorAll(".stat-card") || [];
  const listEls = listsRef.value?.querySelectorAll(".list-card") || [];

  gsap.killTweensOf([...statEls, ...listEls]);

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  tl.fromTo(
    statEls,
    { opacity: 0, y: 14, filter: "blur(6px)" },
    { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.55, stagger: 0.08 }
  ).fromTo(
    listEls,
    { opacity: 0, y: 16, filter: "blur(6px)" },
    { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6, stagger: 0.08 },
    "-=0.25"
  );
}

async function load() {
  loading.value = true;
  error.value = "";

  try {
    const [docs, anns, fs] = await Promise.all([
      fetchDocuments(),
      fetchAnnouncements(),
      fetchForms(),
    ]);

    documents.value = Array.isArray(docs) ? docs : [];
    announcements.value = Array.isArray(anns) ? anns : [];
    forms.value = Array.isArray(fs) ? fs : [];
  } catch (e) {
    error.value = e?.message || String(e);
  } finally {
    loading.value = false;
  }

  await nextTick();
  animateIn();
}

function refresh() {
  // small gsap micro-animation on refresh button icon can be done via CSS spin
  load();
}

/**
 * Viewer click behavior:
 * - If you have detail routes, update this mapping.
 * - For now it will try /{type}/{id} if id exists, otherwise just go list route.
 */
function onOpenItem(type, item) {
  const id = item?.id ?? item?._id ?? item?.documentId ?? item?.templateId;
  if (!id) {
    if (type === "documents") return go("/documents");
    if (type === "announcements") return go("/announcements");
    if (type === "forms") return go("/forms");
    return;
  }
  if (type === "documents") return go(`/documents/${id}`);
  if (type === "announcements") return go(`/announcements/${id}`);
  if (type === "forms") return go(`/forms/${id}`);
}

onMounted(load);
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 22px 22px 34px;
  color: rgba(255, 255, 255, 0.92);

}

.topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 18px;
}
.headline .kicker {
  font-size: 12px;
  opacity: 0.8;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}
.title {
  margin: 6px 0 4px;
  font-size: 28px;
  line-height: 1.15;
  letter-spacing: -0.02em;
}
.subtitle {
  margin: 0;
  opacity: 0.72;
  font-size: 13px;
}
.actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.btn {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.92);
  padding: 10px 12px;
  border-radius: 14px;
  font-size: 13px;
  cursor: pointer;
  transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.18);
}
.dot {
  display: inline-block;
  opacity: 0.9;
}
.spin {
  animation: spin 0.9s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.grid {
  display: grid;
  gap: 14px;
}
.stats {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-bottom: 14px;
}
.lists {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.i {
  font-size: 18px;
}

.error {
  margin-top: 16px;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid rgba(239, 68, 68, 0.25);
  background: rgba(239, 68, 68, 0.08);
}
.error-title {
  font-weight: 800;
  margin-bottom: 6px;
}
.error-msg {
  opacity: 0.85;
  white-space: pre-wrap;
}

@media (max-width: 1100px) {
  .stats,
  .lists {
    grid-template-columns: 1fr;
  }
}
</style>
