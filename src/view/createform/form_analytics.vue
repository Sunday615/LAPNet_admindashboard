<template>
  <div class="ana">
    <!-- Header -->
    <header class="anaHead">
      <div class="left">
        <div class="kicker">
          <span class="kDot"></span>
          Analytics • Form Submissions
        </div>
        <h1 class="title">Responses Summary</h1>
        <p class="sub">เลือก templateId → สรุปจำนวนคน submit + กราฟแบบ Google Forms</p>
      </div>

      <div class="right">
        <button class="btn btnGhost" type="button" @click="goBack" @mouseenter="btnHover($event, true)" @mouseleave="btnHover($event, false)">
          <i class="fa-solid fa-arrow-left" />
          Back
        </button>

        <button
          class="btn btnPrimary"
          type="button"
          :disabled="loading || !selectedTemplateId"
          @click="reloadAll"
          @mouseenter="btnHover($event, true)"
          @mouseleave="btnHover($event, false)"
        >
          <i class="fa-solid fa-rotate" />
          {{ loading ? "Loading..." : "Refresh" }}
        </button>
      </div>
    </header>

    <!-- Controls -->
    <section class="card controls" ref="controlsRef">
      <div class="row">
        <div class="field">
          <div class="label">Template</div>
          <select v-model="selectedTemplateId" class="input">
            <option value="">Select template...</option>
            <option v-for="t in templates" :key="String(t.id)" :value="String(t.id)">
              {{ String(t.id) }} — {{ plainTitle(t) || "Untitled" }}
            </option>
          </select>
        </div>

        <div class="field">
          <div class="label">Question</div>
          <select v-model="selectedQuestionId" class="input" :disabled="!questions.length">
            <option value="">(Summary / Overview)</option>
            <option v-for="q in questions" :key="String(q.id)" :value="String(q.id)">
              {{ qIndexLabel(q) }} • {{ (stripHtml(q.title) || "Untitled").slice(0, 70) }}
            </option>
          </select>
        </div>

        <div class="field">
          <div class="label">Limit</div>
          <input v-model.number="limit" class="input" type="number" min="50" step="50" placeholder="e.g. 500" />
        </div>

        <button
          class="btn btnPrimary"
          type="button"
          :disabled="!selectedTemplateId || loading"
          @click="reloadAll"
          @mouseenter="btnHover($event, true)"
          @mouseleave="btnHover($event, false)"
        >
          <i class="fa-solid fa-magnifying-glass" />
          Load
        </button>
      </div>

      <div v-if="error" class="alert alertErr">
        <i class="fa-solid fa-triangle-exclamation" />
        <span>{{ error }}</span>
      </div>
    </section>

    <!-- KPI -->
    <section class="grid2">
      <div class="card kpi" ref="kpiRef">
        <div class="cardHead">
          <div class="headTitle"><i class="fa-solid fa-gauge" /> KPI</div>
          <div class="headSub muted">Current template</div>
        </div>

        <div class="cardBody">
          <div class="kpiGrid">
            <div class="k">
              <div class="kLbl muted">Submissions</div>
              <div class="kVal">{{ kpi.total }}</div>
            </div>
            <div class="k">
              <div class="kLbl muted">Unique emails</div>
              <div class="kVal">{{ kpi.uniqueEmails }}</div>
            </div>
            <div class="k">
              <div class="kLbl muted">Answered rate</div>
              <div class="kVal">{{ kpi.answeredRate }}%</div>
            </div>
            <div class="k">
              <div class="kLbl muted">Total files</div>
              <div class="kVal">{{ kpi.totalFiles }}</div>
            </div>
          </div>

          <div class="kpiFoot muted">
            <span class="pillSoft">Trend window: last {{ trendDays }} days</span>
            <span v-if="templateTitle" class="pill ghostPill">{{ templateTitle }}</span>
          </div>
        </div>
      </div>

      <!-- Trend chart -->
      <div class="card trend" ref="trendRef">
        <div class="cardHead">
          <div class="headTitle"><i class="fa-solid fa-chart-line" /> Submissions Trend</div>
          <div class="headSub muted">Daily submissions</div>
        </div>

        <div class="cardBody">
          <div class="chartWrap">
            <canvas ref="trendCanvasRef"></canvas>
          </div>
          <div class="sparkMeta">
            <span class="pillSoft">max: <b>{{ trendMax }}</b></span>
            <span class="pillSoft">avg: <b>{{ trendAvg }}</b></span>
          </div>
        </div>
      </div>
    </section>

    <!-- Summary/Question Charts -->
    <section class="card charts" ref="chartsRef">
      <div class="cardHead">
        <div class="headLeft">
          <div class="headTitle"><i class="fa-solid fa-chart-column" /> Charts</div>
          <div class="headSub muted">
            <template v-if="selectedQuestion">
              {{ qIndexLabel(selectedQuestion) }} • {{ stripHtml(selectedQuestion.title) || "Untitled" }}
              <span class="dot">•</span>
              <span class="pill ghostPill">{{ selectedQuestion.type }}</span>
            </template>
            <template v-else>
              Summary (Overview) • Answered rate per question
            </template>
          </div>
        </div>
      </div>

      <div class="cardBody">
        <div v-if="loading" class="skeleton">
          <div class="skRow" v-for="i in 8" :key="i" />
        </div>

        <div v-else-if="!selectedTemplateId" class="empty">
          <div class="emptyIcon"><i class="fa-regular fa-hand-pointer" /></div>
          <div class="emptyTitle">Select a template</div>
          <div class="emptySub muted">Choose templateId then Load.</div>
        </div>

        <div v-else class="chartsGrid">
          <!-- Overview chart -->
          <div v-if="!selectedQuestion" class="chartCard">
            <div class="chartTitleRow">
              <div class="chartTitle"><i class="fa-solid fa-list-check" /> Answered rate</div>
              <div class="muted" style="font-size: 12px">เปอร์เซ็นต์การตอบในแต่ละคำถาม</div>
            </div>
            <div class="chartWrap tall">
              <canvas ref="overviewCanvasRef"></canvas>
            </div>
          </div>

          <!-- Question chart -->
          <div v-else class="chartCard">
            <div class="chartTitleRow">
              <div class="chartTitle"><i class="fa-solid fa-square-poll-vertical" /> Distribution</div>
              <div class="muted" style="font-size: 12px">
                <template v-if="isChoiceType(selectedQuestion.type)">เลือก/ติ๊ก (นับจำนวน)</template>
                <template v-else-if="selectedQuestion.type === 'score'">คะแนน (Histogram)</template>
                <template v-else-if="selectedQuestion.type === 'upload'">ไฟล์ที่อัปโหลด (Top mime types)</template>
                <template v-else>Answered vs Not answered</template>
              </div>
            </div>
            <div class="chartWrap tall">
              <canvas ref="questionCanvasRef"></canvas>
            </div>

            <div v-if="selectedQuestion.type === 'upload'" class="kpiGrid miniKpi" style="margin-top: 12px">
              <div class="k">
                <div class="kLbl muted">Answered</div>
                <div class="kVal">{{ questionAnsweredCount(selectedQuestion) }}</div>
              </div>
              <div class="k">
                <div class="kLbl muted">Total files</div>
                <div class="kVal">{{ uploadFileCount }}</div>
              </div>
              <div class="k">
                <div class="kLbl muted">Avg files/submission</div>
                <div class="kVal">{{ uploadAvgFiles }}</div>
              </div>
              <div class="k">
                <div class="kLbl muted">Top type</div>
                <div class="kVal">{{ uploadTopType || "—" }}</div>
              </div>
            </div>
          </div>

          <!-- Heatmap for table type (เหมือนเดิม แต่ยัง modern) -->
          <div v-if="selectedQuestion && (selectedQuestion.type === 'table_option' || selectedQuestion.type === 'table_checkbox')" class="chartCard">
            <div class="chartTitleRow">
              <div class="chartTitle"><i class="fa-solid fa-border-all" /> Table heatmap</div>
              <div class="muted" style="font-size: 12px">ความถี่ (opacity = relative)</div>
            </div>

            <div class="heatWrap">
              <table class="heat">
                <thead>
                  <tr>
                    <th></th>
                    <th v-for="(c, ci) in (selectedQuestion.gridCols || [])" :key="ci">{{ c }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(r, ri) in (selectedQuestion.gridRows || [])" :key="ri">
                    <td class="rowHead">{{ r }}</td>
                    <td v-for="(c, ci) in (selectedQuestion.gridCols || [])" :key="ci">
                      <div class="cellHeat" :style="{ opacity: heatOpacity(ri, ci) }">
                        {{ heatCount(ri, ci) }}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="muted" style="margin-top: 8px; font-size: 12px">
              Opacity = relative frequency (max cell = 1.0)
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- Toast -->
    <transition name="toast">
      <div v-if="toast.msg" class="toastMini" :class="toast.type">
        <i class="fa-regular" :class="toast.type === 'err' ? 'fa-circle-xmark' : 'fa-circle-check'" />
        <span>{{ toast.msg }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import gsap from "gsap";
import Chart from "chart.js/auto";

const router = useRouter();
const route = useRoute();

/* -----------------------------
  API base (from .env only)
----------------------------- */
const API_BASE = String(import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "");
const API_ORIGIN = API_BASE.replace(/\/api$/i, "");
if (!API_BASE) console.warn("[form_analytics] Missing VITE_API_BASE_URL in .env");

function joinBaseAndPath(baseUrl, path) {
  const b = String(baseUrl || "").trim().replace(/\/+$/, "");
  let p = String(path || "").trim();
  if (!p) return b;
  if (!p.startsWith("/")) p = `/${p}`;
  // Avoid duplicate "/api" when base already ends with "/api"
  if (/\/api$/i.test(b) && /^\/api\//i.test(p)) p = p.slice(4);
  return b ? `${b}${p}` : p;
}

const API = (p = "") => {
  const s = String(p || "").trim();
  if (!s) return API_BASE;
  if (/^https?:\/\//i.test(s)) return s;
  if (!API_BASE) return s.startsWith("/") ? s : `/${s}`;
  return joinBaseAndPath(API_BASE, s);
};

const TPL_API = API("/api/form-templates");
const SUB_API = API("/api/form-submissions");

const WITH_CREDS = String(import.meta.env.VITE_FETCH_CREDENTIALS || "").toLowerCase() === "include";
const CREDS = WITH_CREDS ? "include" : "same-origin";

const templates = ref([]);
const template = ref(null);
const submissions = ref([]);

const selectedTemplateId = ref("");
const selectedQuestionId = ref("");

const limit = ref(500);
const loading = ref(false);
const error = ref("");

const trendDays = 30;

const controlsRef = ref(null);
const kpiRef = ref(null);
const trendRef = ref(null);
const chartsRef = ref(null);

// canvas refs
const trendCanvasRef = ref(null);
const overviewCanvasRef = ref(null);
const questionCanvasRef = ref(null);

// chart instances
let trendChart = null;
let overviewChart = null;
let questionChart = null;

// toast
const toast = reactive({ msg: "", type: "ok" });
let toastTimer = null;
function showToast(msg, type = "ok") {
  toast.msg = msg;
  toast.type = type;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.msg = ""), 1600);
}

function btnHover(e, enter) {
  gsap.to(e.currentTarget, { y: enter ? -2 : 0, duration: 0.22, ease: "power2.out" });
}
function goBack() {
  router.back();
}

async function apiGet(url) {
  const r = await fetch(url, { headers: { Accept: "application/json" }, credentials: CREDS });
  const data = await r.json().catch(() => null);
  if (!r.ok || !data?.ok) throw new Error(data?.message || `HTTP ${r.status}`);
  return data;
}

function safeParseAnswers(x) {
  try {
    if (x && typeof x === "object") return x;
    if (typeof x === "string") return JSON.parse(x);
  } catch {}
  return x;
}

/* normalize template payload */
function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}
function normalizeDraftType(t) {
  const ok = new Set([
    "short",
    "long",
    "option",
    "checkbox",
    "dropdown",
    "upload",
    "score",
    "table_option",
    "table_checkbox",
    "date",
    "time",
  ]);
  if (t === "paragraph") return "long";
  if (t === "mc") return "option";
  if (t === "file") return "upload";
  if (ok.has(t)) return t;
  return "short";
}
function needsOptions(type) {
  return type === "option" || type === "checkbox" || type === "dropdown";
}
function normalizePayload(raw) {
  const meta = raw?.meta || {};
  const qs = Array.isArray(raw?.questions) ? raw.questions : [];
  return {
    meta: {
      title: String(meta.title ?? ""),
      description: String(meta.description ?? ""),
      collectEmail: !!meta.collectEmail,
      allowEditAfterSubmit: !!meta.allowEditAfterSubmit,
    },
    questions: qs.map((q, idx) => {
      const base = {
        id: String(q?.id || `q_${idx}_${Date.now()}`),
        type: normalizeDraftType(q?.type),
        title: String(q?.title ?? ""),
        description: String(q?.description ?? ""),
        required: !!q?.required,
        key: q?.key ?? q?.answerKey ?? q?.name ?? null,
        options: Array.isArray(q?.options) ? q.options : [],
        scoreMax: Number(q?.scoreMax ?? (q?.score?.max ?? 5)),
        gridRows: Array.isArray(q?.gridRows) ? q.gridRows : (Array.isArray(q?.table?.rows) ? q.table.rows : []),
        gridCols: Array.isArray(q?.gridCols) ? q.gridCols : (Array.isArray(q?.table?.cols) ? q.table.cols : []),
      };
      if (q?.table && typeof q.table === "object") {
        const mode = q.table.mode === "checkbox" ? "table_checkbox" : "table_option";
        base.type = normalizeDraftType(mode);
      }
      if (needsOptions(base.type) && (!base.options?.length)) base.options = ["Choice 1", "Choice 2"];
      if (base.type === "table_option" || base.type === "table_checkbox") {
        if (!base.gridRows?.length) base.gridRows = ["Row 1", "Row 2"];
        if (!base.gridCols?.length) base.gridCols = ["Col 1", "Col 2"];
      }
      return base;
    }),
  };
}

/* answer mapping keys */
function stripHtml(s) {
  try {
    const div = document.createElement("div");
    div.innerHTML = String(s ?? "");
    return (div.textContent || "").trim();
  } catch {
    return String(s ?? "").replace(/<[^>]*>/g, "").trim();
  }
}
function answerKeysFor(qq, idx) {
  const keys = [];
  const push = (x) => {
    const s = String(x ?? "").trim();
    if (s) keys.push(s);
  };
  push(qq?.id);
  push(qq?.key);
  push(qq?.answerKey);
  push(qq?.name);
  push(String(idx));
  push(String(idx + 1));
  push(`q${idx + 1}`);
  push(`q_${idx + 1}`);
  push(`question_${idx + 1}`);
  push(stripHtml(qq?.title || ""));
  return [...new Set(keys)];
}
function getAnswerFromSubmission(sub, qq, idx) {
  const a = sub?.answers;
  if (!a || typeof a !== "object") return null;
  for (const k of answerKeysFor(qq, idx)) {
    if (Object.prototype.hasOwnProperty.call(a, k)) return a[k];
  }
  return null;
}
function isEmptyAnswer(v) {
  if (v == null) return true;
  if (typeof v === "string") return !v.trim();
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object") return Object.keys(v).length === 0;
  return false;
}

async function loadTemplates() {
  const data = await apiGet(TPL_API);
  const arr = Array.isArray(data.items) ? data.items : [];
  templates.value = arr.map((t) => {
    const payloadRaw = typeof t.payload === "string" ? safeJsonParse(t.payload) : t.payload || {};
    return {
      ...t,
      id: t.id ?? t.templateId ?? t.template_id ?? null,
      payload: normalizePayload(payloadRaw),
    };
  });
}
function plainTitle(t) {
  const ttl = t?.payload?.meta?.title || "";
  return stripHtml(ttl);
}
const templateTitle = computed(() => plainTitle(template.value || null));

async function loadTemplateById(tid) {
  const t = templates.value.find((x) => String(x?.id) === String(tid));
  template.value = t || null;
  if (!template.value) throw new Error("Template not found in /api/form-templates list");
}

async function loadSubmissionsForTemplate(tid) {
  const qs = new URLSearchParams();
  qs.set("templateId", String(tid));
  qs.set("limit", String(limit.value || 500));
  qs.set("offset", "0");

  const data = await apiGet(`${SUB_API}?${qs.toString()}`);
  const arr = Array.isArray(data.items) ? data.items : [];
  submissions.value = arr.map((s) => ({
    ...s,
    answers: safeParseAnswers(s.answers),
    files: Array.isArray(s.files) ? s.files : [],
  }));
}

function animateIn() {
  const els = [controlsRef.value, kpiRef.value, trendRef.value, chartsRef.value].filter(Boolean);
  gsap.killTweensOf(els);
  gsap.fromTo(els, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.06, ease: "power2.out" });

  // chart pop
  const c = [trendCanvasRef.value, overviewCanvasRef.value, questionCanvasRef.value].filter(Boolean);
  gsap.fromTo(c, { opacity: 0, scale: 0.98 }, { opacity: 1, scale: 1, duration: 0.35, ease: "power2.out", delay: 0.05 });
}

async function reloadAll() {
  if (!selectedTemplateId.value) return;

  loading.value = true;
  error.value = "";
  submissions.value = [];

  try {
    await loadTemplateById(selectedTemplateId.value);
    await loadSubmissionsForTemplate(selectedTemplateId.value);

    await nextTick();
    renderAllCharts();
    animateIn();
    showToast("Loaded", "ok");
  } catch (e) {
    error.value = e?.message || "Load failed";
    showToast(error.value, "err");
  } finally {
    loading.value = false;
  }
}

/* computed: questions */
const questions = computed(() => {
  const qs = template.value?.payload?.questions;
  return Array.isArray(qs) ? qs : [];
});
const selectedQuestion = computed(() => {
  if (!selectedQuestionId.value) return null;
  return questions.value.find((q) => String(q.id) === String(selectedQuestionId.value)) || null;
});
function qIndexLabel(q) {
  const idx = questions.value.findIndex((x) => String(x.id) === String(q.id));
  return idx >= 0 ? `Q${idx + 1}` : "Q?";
}

/* KPI */
const kpi = computed(() => {
  const total = submissions.value.length;
  const emails = new Set(
    submissions.value
      .map((s) => String(s.email || s.answers?.__email || "").trim())
      .filter(Boolean)
  );

  const qs = questions.value;
  let answeredCells = 0;
  let possibleCells = 0;

  submissions.value.forEach((sub) => {
    qs.forEach((qq, idx) => {
      possibleCells += 1;
      const v = getAnswerFromSubmission(sub, qq, idx);
      if (!isEmptyAnswer(v)) answeredCells += 1;
    });
  });

  const answeredRate = possibleCells ? Math.round((answeredCells / possibleCells) * 100) : 0;
  const totalFiles = submissions.value.reduce((sum, s) => sum + (Array.isArray(s.files) ? s.files.length : 0), 0);

  return {
    total,
    uniqueEmails: emails.size,
    answeredRate,
    totalFiles,
  };
});

/* Trend helpers */
function dayKey(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
const trendMap = computed(() => {
  const m = new Map();
  const now = new Date();
  for (let i = trendDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    m.set(dayKey(d), 0);
  }

  submissions.value.forEach((s) => {
    const t = s.submittedAt || s.createdAt;
    if (!t) return;
    const d = new Date(t);
    const k = dayKey(d);
    if (m.has(k)) m.set(k, (m.get(k) || 0) + 1);
  });
  return m;
});
const trendArr = computed(() => Array.from(trendMap.value.entries()).map(([day, count]) => ({ day, count })));
const trendMax = computed(() => Math.max(0, ...trendArr.value.map((x) => x.count)));
const trendAvg = computed(() => {
  if (!trendArr.value.length) return 0;
  const sum = trendArr.value.reduce((a, b) => a + b.count, 0);
  return Math.round((sum / trendArr.value.length) * 10) / 10;
});

/* answered helpers */
function questionAnsweredCount(q) {
  const idx = questions.value.findIndex((x) => String(x.id) === String(q.id));
  if (idx < 0) return 0;
  let c = 0;
  submissions.value.forEach((s) => {
    const v = getAnswerFromSubmission(s, q, idx);
    if (!isEmptyAnswer(v)) c++;
  });
  return c;
}
function questionAnsweredRate(q) {
  if (!submissions.value.length) return 0;
  return Math.round((questionAnsweredCount(q) / submissions.value.length) * 100);
}

/* chart logic */
function isChoiceType(t) {
  return t === "option" || t === "dropdown" || t === "checkbox";
}

const choiceDist = computed(() => {
  const q = selectedQuestion.value;
  if (!q) return [];
  const idx = questions.value.findIndex((x) => String(x.id) === String(q.id));
  if (idx < 0) return [];

  const counts = new Map();
  const options = Array.isArray(q.options) ? q.options.map((x) => stripHtml(String(x))) : [];
  options.forEach((o) => counts.set(o, 0));

  const isCb = q.type === "checkbox";

  submissions.value.forEach((s) => {
    const v = getAnswerFromSubmission(s, q, idx);
    if (isEmptyAnswer(v)) return;

    if (isCb) {
      const arr = Array.isArray(v) ? v : String(v).split(",").map((x) => x.trim()).filter(Boolean);
      arr.forEach((x) => {
        const k = stripHtml(String(x));
        counts.set(k, (counts.get(k) || 0) + 1);
      });
    } else {
      const k = stripHtml(String(v));
      counts.set(k, (counts.get(k) || 0) + 1);
    }
  });

  const arr = Array.from(counts.entries()).map(([label, count]) => ({ label: label || "—", count }));
  arr.sort((a, b) => b.count - a.count);
  return arr;
});

const scoreHist = computed(() => {
  const q = selectedQuestion.value;
  if (!q || q.type !== "score") return [];
  const idx = questions.value.findIndex((x) => String(x.id) === String(q.id));
  const maxScore = Math.max(1, Number(q.scoreMax || 5));

  const counts = Array.from({ length: maxScore }, (_, i) => ({ label: String(i + 1), count: 0 }));
  submissions.value.forEach((s) => {
    const v = getAnswerFromSubmission(s, q, idx);
    const num = Number(v);
    if (Number.isFinite(num) && num >= 1 && num <= maxScore) counts[num - 1].count += 1;
  });

  return counts;
});

/* table heatmap (เดิม) */
const heat = computed(() => {
  const q = selectedQuestion.value;
  if (!q || !(q.type === "table_option" || q.type === "table_checkbox")) return { grid: [], max: 0 };

  const idx = questions.value.findIndex((x) => String(x.id) === String(q.id));
  const rows = q.gridRows || [];
  const cols = q.gridCols || [];
  const grid = Array.from({ length: rows.length }, () => Array.from({ length: cols.length }, () => 0));

  submissions.value.forEach((s) => {
    const v = getAnswerFromSubmission(s, q, idx);
    if (!v || typeof v !== "object") return;

    for (let ri = 0; ri < rows.length; ri++) {
      const rowKeyA = String(ri);
      const rowKeyB = String(rows[ri] ?? "");
      const val = v[rowKeyA] ?? v[rowKeyB];

      if (q.type === "table_checkbox") {
        const arr = Array.isArray(val) ? val.map(String) : [];
        for (let ci = 0; ci < cols.length; ci++) {
          if (arr.includes(String(ci))) grid[ri][ci] += 1;
        }
      } else {
        const chosen = typeof val === "number" ? val : Number(val);
        if (Number.isFinite(chosen) && chosen >= 0 && chosen < cols.length) {
          grid[ri][chosen] += 1;
        }
      }
    }
  });

  const max = Math.max(0, ...grid.flat());
  return { grid, max };
});
function heatCount(ri, ci) {
  return heat.value.grid?.[ri]?.[ci] || 0;
}
function heatOpacity(ri, ci) {
  const max = Math.max(1, heat.value.max || 1);
  const v = heatCount(ri, ci);
  return 0.2 + (v / max) * 0.8;
}

/* upload stats (จริงจาก files[]) */
function fileMatchesQuestion(file, q, idx) {
  const keys = answerKeysFor(q, idx).map((x) => String(x));
  const qid = String(file?.questionId ?? "");
  const fname = String(file?.fieldName ?? "");
  const stripped = fname.startsWith("file_") ? fname.slice(5) : fname;
  return keys.includes(qid) || keys.includes(stripped) || fname === `file_${String(q.id)}`;
}
const uploadFileCount = computed(() => {
  const q = selectedQuestion.value;
  if (!q || q.type !== "upload") return 0;
  const idx = questions.value.findIndex((x) => String(x.id) === String(q.id));
  if (idx < 0) return 0;

  let c = 0;
  submissions.value.forEach((s) => {
    const arr = Array.isArray(s.files) ? s.files : [];
    c += arr.filter((f) => fileMatchesQuestion(f, q, idx)).length;
  });
  return c;
});
const uploadAvgFiles = computed(() => {
  const total = Math.max(1, submissions.value.length);
  return Math.round((uploadFileCount.value / total) * 10) / 10;
});
const uploadTopType = computed(() => {
  const q = selectedQuestion.value;
  if (!q || q.type !== "upload") return "";
  const idx = questions.value.findIndex((x) => String(x.id) === String(q.id));
  if (idx < 0) return "";

  const m = new Map();
  submissions.value.forEach((s) => {
    (s.files || []).forEach((f) => {
      if (!fileMatchesQuestion(f, q, idx)) return;
      const mt = String(f.mimeType || "").split(";")[0] || "unknown";
      const key = mt.includes("/") ? mt.split("/")[0] : mt;
      m.set(key, (m.get(key) || 0) + 1);
    });
  });
  const arr = Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  return arr[0]?.[0] || "";
});

/* ---------- Chart.js rendering ---------- */
function destroyChart(ch) {
  try {
    if (ch) ch.destroy();
  } catch {}
}
function baseOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 700, easing: "easeOutQuart" },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        ticks: { color: "rgba(255,255,255,0.78)" },
        grid: { color: "rgba(255,255,255,0.06)" },
      },
      y: {
        ticks: { color: "rgba(255,255,255,0.78)" },
        grid: { color: "rgba(255,255,255,0.06)" },
        beginAtZero: true,
      },
    },
  };
}

function renderTrendChart() {
  const el = trendCanvasRef.value;
  if (!el) return;

  const labels = trendArr.value.map((x) => x.day.slice(5));
  const data = trendArr.value.map((x) => x.count);

  destroyChart(trendChart);
  trendChart = new Chart(el, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Submissions",
          data,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 4,
          borderColor: "rgba(56, 189, 248, 0.95)",
          backgroundColor: "rgba(56, 189, 248, 0.10)",
          fill: true,
        },
      ],
    },
    options: {
      ...baseOptions(),
      scales: {
        ...baseOptions().scales,
        y: { ...baseOptions().scales.y, suggestedMax: Math.max(3, trendMax.value + 1) },
      },
    },
  });
}

function renderOverviewChart() {
  const el = overviewCanvasRef.value;
  if (!el) return;

  const labels = questions.value.map((q) => qIndexLabel(q));
  const data = questions.value.map((q) => questionAnsweredRate(q));

  destroyChart(overviewChart);
  overviewChart = new Chart(el, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Answered %",
          data,
          borderWidth: 1,
          backgroundColor: "rgba(99, 102, 241, 0.18)",
          borderColor: "rgba(99, 102, 241, 0.45)",
        },
      ],
    },
    options: {
      ...baseOptions(),
      scales: {
        x: { ...baseOptions().scales.x },
        y: { ...baseOptions().scales.y, max: 100 },
      },
    },
  });
}

function renderQuestionChart() {
  const el = questionCanvasRef.value;
  if (!el) return;

  const q = selectedQuestion.value;
  if (!q) return;

  destroyChart(questionChart);

  // choice types → bar
  if (isChoiceType(q.type)) {
    const labels = choiceDist.value.map((x) => x.label);
    const data = choiceDist.value.map((x) => x.count);

    questionChart = new Chart(el, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Count",
            data,
            borderWidth: 1,
            backgroundColor: "rgba(56, 189, 248, 0.18)",
            borderColor: "rgba(56, 189, 248, 0.45)",
          },
        ],
      },
      options: baseOptions(),
    });
    return;
  }

  // score → bar histogram
  if (q.type === "score") {
    const labels = scoreHist.value.map((x) => x.label);
    const data = scoreHist.value.map((x) => x.count);

    questionChart = new Chart(el, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Count",
            data,
            borderWidth: 1,
            backgroundColor: "rgba(34, 197, 94, 0.18)",
            borderColor: "rgba(34, 197, 94, 0.45)",
          },
        ],
      },
      options: baseOptions(),
    });
    return;
  }

  // upload → top mime types bar
  if (q.type === "upload") {
    const idx = questions.value.findIndex((x) => String(x.id) === String(q.id));
    const m = new Map();
    submissions.value.forEach((s) => {
      (s.files || []).forEach((f) => {
        if (!fileMatchesQuestion(f, q, idx)) return;
        const mt = String(f.mimeType || "").split(";")[0] || "unknown";
        const key = mt.includes("/") ? mt.split("/")[0] : mt;
        m.set(key, (m.get(key) || 0) + 1);
      });
    });
    const arr = Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const labels = arr.map((x) => x[0]);
    const data = arr.map((x) => x[1]);

    questionChart = new Chart(el, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Files",
            data,
            borderWidth: 1,
            backgroundColor: "rgba(255, 255, 255, 0.10)",
            borderColor: "rgba(255, 255, 255, 0.22)",
          },
        ],
      },
      options: baseOptions(),
    });
    return;
  }

  // default → doughnut answered vs not answered
  const answered = questionAnsweredCount(q);
  const notAnswered = Math.max(0, submissions.value.length - answered);

  questionChart = new Chart(el, {
    type: "doughnut",
    data: {
      labels: ["Answered", "Not answered"],
      datasets: [
        {
          data: [answered, notAnswered],
          backgroundColor: ["rgba(56, 189, 248, 0.22)", "rgba(255, 255, 255, 0.07)"],
          borderColor: ["rgba(56, 189, 248, 0.35)", "rgba(255, 255, 255, 0.14)"],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true, labels: { color: "rgba(255,255,255,0.8)" } } },
      animation: { duration: 700, easing: "easeOutQuart" },
      cutout: "62%",
    },
  });
}

function renderAllCharts() {
  // set some defaults (nice dark)
  Chart.defaults.color = "rgba(255,255,255,0.85)";
  Chart.defaults.font.family = "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";

  renderTrendChart();
  if (!selectedQuestion.value) renderOverviewChart();
  else renderQuestionChart();
}

/* watches: re-render when data/question changes */
watch([submissions, selectedQuestionId], async () => {
  if (!selectedTemplateId.value) return;
  await nextTick();
  renderAllCharts();
});

watch(selectedTemplateId, async (tid) => {
  selectedQuestionId.value = "";
  if (!tid) {
    template.value = null;
    submissions.value = [];
    destroyChart(trendChart); trendChart = null;
    destroyChart(overviewChart); overviewChart = null;
    destroyChart(questionChart); questionChart = null;
    return;
  }
  await reloadAll();
});

onMounted(async () => {
  try {
    await loadTemplates();
    const qTid = String(route.query?.templateId || "").trim();
    if (qTid) selectedTemplateId.value = qTid;
  } catch (e) {
    error.value = e?.message || "Load templates failed";
    showToast(error.value, "err");
  }
});

onBeforeUnmount(() => {
  destroyChart(trendChart);
  destroyChart(overviewChart);
  destroyChart(questionChart);
  trendChart = overviewChart = questionChart = null;
});
</script>

<style scoped>
.ana {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: calc(100vh - 40px);
  color: var(--txt);
}

.anaHead {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  padding: 6px 2px 0;
}

.kicker {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.75);
}
.kDot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.9);
  box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.12);
}

.title {
  margin: 8px 0 0;
  font-weight: 900;
  letter-spacing: 0.2px;
  font-size: 20px;
}
.sub {
  margin-top: 6px;
  font-size: 12px;
  color: var(--muted);
}

.right {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.card {
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid var(--stroke);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.36);
  backdrop-filter: blur(14px);
  overflow: hidden;
  position: relative;
}
.card::before {
  content: "";
  position: absolute;
  inset: -1px;
  pointer-events: none;
  background: radial-gradient(520px 260px at 18% 20%, rgba(56, 189, 248, 0.1), transparent 62%),
    radial-gradient(520px 260px at 78% 55%, rgba(99, 102, 241, 0.08), transparent 64%);
  opacity: 0.95;
}
.cardHead {
  position: relative;
  z-index: 1;
  padding: 14px 14px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.cardBody {
  position: relative;
  z-index: 1;
  padding: 14px;
}

.headTitle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 900;
  letter-spacing: 0.2px;
}
.headSub {
  font-size: 12px;
}
.headLeft {
  display: grid;
  gap: 6px;
}

.muted {
  color: var(--muted);
}
.dot {
  opacity: 0.7;
}
.ellipsis {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.controls .row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
}

.field {
  display: grid;
  gap: 6px;
  min-width: 240px;
}
.label {
  font-size: 12px;
  color: var(--muted);
  font-weight: 800;
  letter-spacing: 0.2px;
}
.input {
  height: 40px;
  border-radius: 14px;
  padding: 0 12px;
  outline: none;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;
}
.input:focus {
  border-color: rgba(56, 189, 248, 0.22);
  box-shadow: 0 12px 30px rgba(56, 189, 248, 0.08);
  background: rgba(255, 255, 255, 0.04);
}

.btn {
  height: 40px;
  padding: 0 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.82);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 900;
  transition: background 180ms ease, border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
}
.btn:hover {
  border-color: rgba(56, 189, 248, 0.18);
  box-shadow: 0 12px 26px rgba(56, 189, 248, 0.08);
  background: rgba(255, 255, 255, 0.05);
}
.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.btnPrimary {
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.16), rgba(99, 102, 241, 0.1));
  border-color: rgba(56, 189, 248, 0.2);
  color: rgba(255, 255, 255, 0.92);
}
.btnGhost {
  background: rgba(255, 255, 255, 0.02);
}

.alert {
  margin-top: 12px;
  border-radius: 14px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.alertErr {
  border-color: rgba(255, 120, 120, 0.25);
  background: rgba(255, 120, 120, 0.06);
  color: rgba(255, 230, 230, 0.95);
}

.grid2 {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 14px;
  align-items: start;
}

.kpiGrid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.kpiGrid.miniKpi {
  grid-template-columns: repeat(4, 1fr);
}
.k {
  border-radius: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.kLbl {
  font-size: 12px;
  font-weight: 800;
}
.kVal {
  margin-top: 6px;
  font-size: 20px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.92);
}
.kpiFoot {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pillSoft {
  font-size: 11px;
  font-weight: 900;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid rgba(56, 189, 248, 0.18);
  background: rgba(56, 189, 248, 0.08);
  color: rgba(255, 255, 255, 0.88);
}
.pill {
  font-size: 11px;
  font-weight: 900;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.85);
}
.ghostPill {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.1);
}

.chartWrap {
  height: 220px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
  padding: 10px;
}
.chartWrap.tall {
  height: 340px;
}

.sparkMeta {
  margin-top: 12px;
  display: inline-flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chartsGrid {
  display: grid;
  gap: 12px;
}

.chartCard {
  border-radius: 16px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
}

.chartTitleRow {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.chartTitle {
  font-weight: 900;
  letter-spacing: 0.2px;
  display: inline-flex;
  gap: 10px;
  align-items: center;
}

/* heatmap */
.heatWrap {
  overflow: auto;
}
.heat {
  border-collapse: collapse;
  min-width: 680px;
  width: 100%;
}
.heat th,
.heat td {
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 10px;
  text-align: center;
}
.heat th {
  background: rgba(255, 255, 255, 0.03);
  font-weight: 900;
}
.rowHead {
  text-align: left !important;
  font-weight: 900;
}
.cellHeat {
  border-radius: 12px;
  padding: 8px 6px;
  background: rgba(56, 189, 248, 0.22);
  border: 1px solid rgba(56, 189, 248, 0.22);
  font-weight: 900;
  color: rgba(255, 255, 255, 0.92);
}

/* skeleton + empty */
.skeleton {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.skRow {
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.03));
  background-size: 200% 100%;
  animation: sk 1.05s infinite linear;
}
@keyframes sk {
  0% { background-position: 0% 0; }
  100% { background-position: 200% 0; }
}
.empty {
  padding: 22px;
  border-radius: 16px;
  border: 1px dashed rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.015);
  display: grid;
  justify-items: center;
  text-align: center;
  gap: 6px;
}
.emptyIcon {
  font-size: 20px;
  opacity: 0.9;
}
.emptyTitle {
  font-weight: 900;
}
.emptySub {
  font-size: 12px;
}

/* toast */
.toastMini {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 9999;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(8, 12, 28, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(14px);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.38);
  max-width: min(420px, 92vw);
  color: rgba(255, 255, 255, 0.92);
  font-weight: 900;
}
.toastMini.err {
  border-color: rgba(255, 80, 80, 0.22);
  background: rgba(40, 10, 14, 0.78);
}
.toast-enter-active,
.toast-leave-active {
  transition: transform 180ms ease, opacity 180ms ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (max-width: 1100px) {
  .grid2 { grid-template-columns: 1fr; }
  .kpiGrid { grid-template-columns: repeat(2, 1fr); }
  .kpiGrid.miniKpi { grid-template-columns: repeat(2, 1fr); }
  .field { min-width: 180px; }
}
</style>
