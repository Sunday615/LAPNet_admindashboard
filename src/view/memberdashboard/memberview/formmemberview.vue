<!-- src/views/FormsTable.vue -->
<template>
  <div class="page">
    <!-- topbar -->
    <header ref="topbarRef" class="topbar">
      <div class="leftTitle">
        <div class="titleRow">
          <i class="fa-solid fa-table-list"></i>
          <div class="title">Forms</div>
        </div>
        <div class="sub">
          Total <b>{{ filtered.length }}</b> / {{ templates.length }} • Active <b>{{ activeCount }}</b>
        </div>
      </div>

      <div class="rightTools">
        <div class="searchWrap">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input v-model.trim="q" type="text" placeholder="Search forms..." />
        </div>

        <button class="btn ghost" type="button" @click="load" :disabled="loading">
          <i class="fa-solid" :class="loading ? 'fa-spinner fa-spin' : 'fa-rotate'"></i>
          <span>Refresh</span>
        </button>
      </div>
    </header>

    <!-- content -->
    <section ref="cardRef" class="card">
      <div class="cardHead">
        <div class="cardTitle">
          <i class="fa-solid fa-layer-group"></i>
          <span>Template List</span>
        </div>

        <div class="pill">{{ filtered.length }} items</div>
      </div>

      <div v-if="loading" class="loadingRow">
        <i class="fa-solid fa-spinner fa-spin"></i>
        <span>Loading templates...</span>
      </div>

      <div v-else-if="error" class="errorRow">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <span>{{ error }}</span>
      </div>

      <!-- ✅ Card View (1 row = 1 column) -->
      <div v-else class="cardsWrap">
        <div v-if="filtered.length" class="cardsGrid oneCol">
          <article
            v-for="(t, i) in filtered"
            :key="t.id"
            class="itemCard"
            ref="rowEls"
            @click="open(t.id)"
            tabindex="0"
            @keydown.enter.prevent="open(t.id)"
          >
            <div class="itemHead">
              <div class="idx">#{{ i + 1 }}</div>
              <span class="badge">
                <i class="fa-solid fa-circle-question"></i>
                {{ t.questionsCount }}
              </span>
            </div>

            <div class="tTitle">{{ t.title || t.name || "Untitled" }}</div>

            <div class="tSub">
              ID: <span class="mono">{{ t.id }}</span>
              <span v-if="t.sourceFormId" class="dot">•</span>
              <span v-if="t.sourceFormId" class="mono">source: {{ t.sourceFormId }}</span>
            </div>

            <div class="itemFoot">
              <div class="muted">
                <i class="fa-solid fa-clock"></i>
                {{ fmtDate(t.updatedAt) }}
              </div>

              <button class="btn mini" type="button" @click.stop="open(t.id)">
                <i class="fa-solid fa-arrow-right"></i>
                <span>Preview</span>
              </button>
            </div>
          </article>
        </div>

        <div v-else class="empty">
          No templates found.
        </div>
      </div>
    </section>

    <!-- toast -->
    <div class="toast" :class="{ show: toast.show, danger: toast.type === 'danger' }" aria-live="polite">
      <i class="fa-solid" :class="toast.type === 'danger' ? 'fa-triangle-exclamation' : 'fa-circle-check'"></i>
      <span>{{ toast.text }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import gsap from "gsap";

const router = useRouter();

// ✅ API list endpoint (ตามที่คุณให้มา)
const LIST_API = "http://localhost:3000/api/form-templates";

const q = ref("");
const loading = ref(false);
const error = ref("");

const templates = ref([]);

// gsap refs
const topbarRef = ref(null);
const cardRef = ref(null);
const rowEls = ref([]); // Vue จะเก็บ array ของ itemCard ให้อัตโนมัติ

let tl = null;

// toast
const toast = reactive({ show: false, text: "", type: "ok" });
let toastTimer = null;
function showToast(text, type = "ok") {
  toast.text = String(text || "");
  toast.type = type;
  toast.show = true;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.show = false), 2200);
}

onBeforeUnmount(() => {
  if (toastTimer) clearTimeout(toastTimer);
  if (tl) tl.kill();
  tl = null;
});

function safeJsonParse(x) {
  try {
    if (x == null) return null;
    if (typeof x === "object") return x;
    return JSON.parse(String(x));
  } catch {
    return null;
  }
}

function normalizeListResponse(raw) {
  // รองรับหลายรูปแบบ: {ok:true, items:[...]}, {items:[...]}, {data:[...]}, [...]
  const arr =
    Array.isArray(raw) ? raw :
    Array.isArray(raw?.items) ? raw.items :
    Array.isArray(raw?.data) ? raw.data :
    Array.isArray(raw?.rows) ? raw.rows :
    [];

  return arr.map((it) => {
    const id = String(it?.id ?? it?.template_id ?? it?.templateId ?? "").trim();
    const sourceFormId = it?.sourceFormId ?? it?.source_form_id ?? null;

    // payload อาจเป็น string หรือ object หรือไม่มีใน list
    const payloadObj =
      typeof it?.payload === "string" ? safeJsonParse(it.payload) :
      (typeof it?.payload === "object" ? it.payload : null);

    const title = payloadObj?.meta?.title ?? it?.title ?? it?.name ?? "";
    const questionsCount = Array.isArray(payloadObj?.questions)
      ? payloadObj.questions.length
      : (it?.questionsCount ?? it?.questions_count ?? 0);

    // ✅ ใช้ activetoggle เป็นหลัก (1 = แสดง, 0 = ไม่แสดง)
    const active = Number(it?.activetoggle ?? it?.active ?? 0) === 1;

    const updatedAt = it?.updatedAt ?? it?.updated_at ?? it?.updated ?? it?.modifiedAt ?? null;

    return {
      id,
      sourceFormId,
      title: String(title || "").trim(),
      name: String(it?.name || "").trim(),
      questionsCount: Number(questionsCount || 0),
      active,
      updatedAt,
    };
  }).filter((x) => x.id);
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const res = await fetch(LIST_API, { headers: { Accept: "application/json" } });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || "Failed to load templates");
    if (data && data.ok === false) throw new Error(data?.message || "Failed to load templates");

    templates.value = normalizeListResponse(data);

    await nextTick();
    animateIn();
  } catch (e) {
    error.value = e?.message || "Failed to load templates";
    showToast(error.value, "danger");
  } finally {
    loading.value = false;
  }
}

function animateIn() {
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reduce) return;

  if (tl) tl.kill();
  tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  tl.from(topbarRef.value, { y: -10, opacity: 0, duration: 0.45 }, 0);
  tl.from(cardRef.value, { y: 14, opacity: 0, duration: 0.55 }, 0.06);

  const items = Array.isArray(rowEls.value) ? rowEls.value : [];
  if (items.length) {
    tl.from(items, { y: 10, opacity: 0, duration: 0.25, stagger: 0.04 }, 0.14);
  }
}

function open(id) {
  router.push(`/v/formsubmit/${encodeURIComponent(id)}`);
}

const filtered = computed(() => {
  // ✅ แสดงเฉพาะ activetoggle = 1
  const base = templates.value.filter((t) => t.active);

  const s = q.value.trim().toLowerCase();
  if (!s) return base;

  return base.filter((t) => {
    return (
      String(t.title || "").toLowerCase().includes(s) ||
      String(t.name || "").toLowerCase().includes(s) ||
      String(t.id || "").toLowerCase().includes(s) ||
      String(t.sourceFormId || "").toLowerCase().includes(s)
    );
  });
});

// ✅ นับ active ทั้งหมดจาก templates (ไม่ขึ้นกับ search)
const activeCount = computed(() => templates.value.filter((x) => x.active).length);

function fmtDate(iso) {
  try {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";

    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = String(d.getFullYear());
    const time = d.toLocaleTimeString();

    return `${dd}/${mm}/${yyyy}, ${time}`;
  } catch {
    return "—";
  }
}

onMounted(() => {
  load();
});
</script>

<style scoped>
.page {
  width: 100%;
  min-height: calc(100vh - 36px);
  padding: 10px 10px 14px;
  color: var(--txt, rgba(255, 255, 255, 0.92));
}

/* topbar */
.topbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  padding: 8px 6px 16px;
  flex-wrap: wrap;
}
.leftTitle { display: grid; gap: 6px; }
.titleRow { display: inline-flex; align-items: center; gap: 10px; font-weight: 950; font-size: 16px; }
.sub { color: rgba(255,255,255,0.65); font-weight: 850; font-size: 12px; }
.rightTools { display: inline-flex; gap: 10px; align-items: center; flex-wrap: wrap; }

.searchWrap {
  width: min(420px, 100%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.10);
}
.searchWrap input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: rgba(255,255,255,0.92);
  font-weight: 800;
}
.searchWrap input::placeholder { color: rgba(255,255,255,0.35); }

/* card container */
.card {
  border-radius: 18px;
  background: rgba(0, 0, 0, 0.24);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 16px 44px rgba(0, 0, 0, 0.30);
  padding: 14px;
}
.cardHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 4px 6px 12px;
}
.cardTitle { display: inline-flex; align-items: center; gap: 10px; font-weight: 950; }
.pill {
  font-weight: 950;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.10);
  border: 1px solid rgba(56, 189, 248, 0.16);
}

.loadingRow, .errorRow {
  padding: 14px 10px;
  display: inline-flex;
  gap: 10px;
  align-items: center;
  font-weight: 900;
}
.errorRow { color: rgba(248, 113, 113, 0.95); }

/* ✅ card view (1 column) */
.cardsWrap { padding: 6px; }
.cardsGrid.oneCol {
  display: grid;
  grid-template-columns: 1fr; /* ✅ 1 column */
  gap: 12px;
}

.itemCard {
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.10);
  padding: 12px 12px 12px;
  cursor: pointer;
  outline: none;
  transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
}
.itemCard:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.04);
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.28);
}
.itemCard:focus {
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.14) inset, 0 16px 34px rgba(0, 0, 0, 0.28);
}

.itemHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.idx { color: rgba(255,255,255,0.6); font-weight: 950; }

.tTitle { font-weight: 950; color: rgba(255,255,255,0.92); }
.tSub {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(255,255,255,0.6);
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New"; }
.dot { opacity: 0.7; }

.itemFoot {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.muted {
  color: rgba(255,255,255,0.6);
  font-weight: 850;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.empty {
  padding: 18px;
  text-align: center;
  color: rgba(255,255,255,0.65);
  font-weight: 900;
}

/* badges */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 950;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(255,255,255,0.03);
  color: rgba(255,255,255,0.86);
}

/* buttons */
.btn {
  border: 1px solid rgba(56, 189, 248, 0.22);
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.18), rgba(99, 102, 241, 0.10));
  color: rgba(255,255,255,0.92);
  border-radius: 14px;
  padding: 10px 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 950;
  transition: transform 160ms ease, box-shadow 160ms ease;
}
.btn:hover { transform: translateY(-1px); box-shadow: 0 14px 28px rgba(56, 189, 248, 0.10); }
.btn.ghost { border-color: rgba(255,255,255,0.10); background: rgba(255,255,255,0.03); }
.btn.mini { padding: 8px 10px; border-radius: 12px; font-size: 12px; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

/* toast */
.toast {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 99999;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(56, 189, 248, 0.22);
  background: rgba(8, 12, 28, 0.72);
  backdrop-filter: blur(12px);
  color: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
  opacity: 0;
  pointer-events: none;
  transform: translateY(6px);
  transition: opacity 160ms ease, transform 160ms ease;
}
.toast.show { opacity: 1; pointer-events: auto; transform: translateY(0); }
.toast.danger { border-color: rgba(248, 113, 113, 0.28); }
</style>
