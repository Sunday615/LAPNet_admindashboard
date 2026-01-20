<!-- src/views/FormPreviewSubmit.vue -->
<template>
  <div class="page">
    <!-- topbar -->
    <header ref="topbarRef" class="topbar">
      <div class="left">
        <button class="btn ghost mini" type="button" @click="goBack">
          <i class="fa-solid fa-arrow-left"></i>
          <span>Back</span>
        </button>

        <div class="headText">
          <div class="titleRow">
            <i class="fa-solid fa-file-lines"></i>
            <div class="title">Preview & Submit</div>
          </div>
          <div class="sub">
            Template ID: <span class="mono">{{ id }}</span>
          </div>
        </div>
      </div>

      <div class="right">
        <span class="badge" :class="tpl.active ? 'ok' : 'off'">
          <i class="fa-solid" :class="tpl.active ? 'fa-circle-check' : 'fa-circle-xmark'"></i>
          Active: {{ tpl.active ? "ON" : "OFF" }}
        </span>
      </div>
    </header>

    <section class="grid">
      <!-- main -->
      <div class="leftCol">
        <div v-if="loading" ref="loadingRef" class="card section">
          <div class="loadingRow">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Loading template...</span>
          </div>
        </div>

        <div v-else-if="error" ref="errorRef" class="card section danger">
          <div class="sectionTitle">
            <i class="fa-solid fa-triangle-exclamation"></i>
            Cannot load template
          </div>
          <div class="subText">{{ error }}</div>

          <div class="actions">
            <button class="btn" type="button" @click="load">
              <i class="fa-solid fa-rotate"></i>
              <span>Retry</span>
            </button>
          </div>
        </div>

        <!-- ✅ success state (form disappear) -->
        <div v-else-if="submittedDone" ref="successCardRef" class="card section successCard">
          <div class="successHead">
            <div class="successIcon">
              <i class="fa-solid fa-circle-check"></i>
            </div>
            <div class="successText">
              <div class="successTitle">Submit successful</div>
              <div class="successSub">
                Your response has been recorded.
              </div>
            </div>
          </div>

          <div class="actions">
            <button class="btn" type="button" @click="goBack">
              <i class="fa-solid fa-arrow-left"></i>
              <span>Back to list</span>
            </button>

            <button class="btn ghost" type="button" @click="submittedDone = false; resetAnswers();">
              <i class="fa-solid fa-rotate"></i>
              <span>Submit again</span>
            </button>
          </div>
        </div>

        <!-- ✅ form -->
        <div v-else ref="formRef" class="card section">
          <div class="formHead">
            <div class="formTitle">
              <span v-html="renderSafeHtml(tpl.title || 'Untitled form')"></span>
            </div>
            <div class="chips">
              <span class="chip ghost">
                <i class="fa-solid fa-list-check"></i>
                {{ tpl.questions.length }} questions
              </span>
              <span class="chip ghost">
                <i class="fa-solid fa-envelope"></i>
                Collect email: {{ tpl.collectEmail ? "ON" : "OFF" }}
              </span>
            </div>
          </div>

          <div v-if="tpl.description" class="desc">{{ tpl.description }}</div>

          <!-- Email required -->
          <div v-if="tpl.collectEmail" class="emailBox">
            <div class="emailLabel">
              <i class="fa-solid fa-envelope"></i>
              <span>Email</span>
              <span class="req">*</span>
            </div>

            <input
              v-model.trim="answers.__email"
              class="input"
              :class="{ dangerInput: submittedTry && !emailOk }"
              type="email"
              placeholder="name@example.com"
              @blur="emailTouched = true"
            />
            <div v-if="submittedTry && !emailOk" class="errText">Email is required (must be valid).</div>
          </div>

          <!-- Questions -->
          <div class="qList">
            <div v-for="(qq, idx) in tpl.questions" :key="qq.id" class="qCard">
              <div class="qTop">
                <div class="qTitle">
                  <span class="qNum">{{ idx + 1 }}.</span>
                  <span v-html="renderSafeHtml(qq.title || 'Untitled question')"></span>
                  <span v-if="qq.required" class="req">*</span>
                </div>
                <span class="pill ghostPill">{{ qq.type }}</span>
              </div>

              <div v-if="qq.description" class="qDesc">{{ qq.description }}</div>

              <!-- images -->
              <div v-if="(qq.images || []).length" class="imgs">
                <img
                  v-for="(im, ii) in (qq.images || [])"
                  :key="im.id || `${qq.id}_im_${ii}`"
                  class="img"
                  :src="resolveImgSrc(im.src ?? im, tpl.updatedAt || tpl.id)"
                  loading="lazy"
                />
              </div>

              <!-- short -->
              <div v-if="qq.type === 'short'" class="field">
                <input v-model="answers[qq.id]" class="input" type="text" placeholder="Your answer..." />
              </div>

              <!-- long -->
              <div v-else-if="qq.type === 'long'" class="field">
                <textarea v-model="answers[qq.id]" class="textarea" rows="3" placeholder="Your answer..."></textarea>
              </div>

              <!-- option -->
              <div v-else-if="qq.type === 'option'" class="field">
                <div class="choices">
                  <label v-for="(op, oi) in (qq.options || [])" :key="`${qq.id}_op_${oi}`" class="choiceRow">
                    <input type="radio" :name="`r_${qq.id}`" :value="op" v-model="answers[qq.id]" />
                    <span v-html="renderSafeHtml(op)"></span>
                  </label>
                </div>
              </div>

              <!-- checkbox -->
              <div v-else-if="qq.type === 'checkbox'" class="field">
                <div class="choices">
                  <label v-for="(op, oi) in (qq.options || [])" :key="`${qq.id}_cb_${oi}`" class="choiceRow">
                    <input
                      type="checkbox"
                      :value="op"
                      :checked="Array.isArray(answers[qq.id]) && answers[qq.id].includes(op)"
                      @change="toggleCheckbox(qq.id, op, $event.target.checked)"
                    />
                    <span v-html="renderSafeHtml(op)"></span>
                  </label>
                </div>
              </div>

              <!-- dropdown -->
              <div v-else-if="qq.type === 'dropdown'" class="field">
                <select v-model="answers[qq.id]" class="select">
                  <option value="" disabled>Select…</option>
                  <option v-for="(op, oi) in (qq.options || [])" :key="`${qq.id}_dd_${oi}`" :value="op">
                    {{ asPlainText(op) }}
                  </option>
                </select>
              </div>

              <!-- date -->
              <div v-else-if="qq.type === 'date'" class="field">
                <div class="pickerWrap" @click="openNativePicker($event)">
                  <input v-model="answers[qq.id]" class="input pickerInput" type="date" @click.stop="openNativePicker($event)" />
                </div>
              </div>

              <!-- time -->
              <div v-else-if="qq.type === 'time'" class="field">
                <div class="pickerWrap" @click="openNativePicker($event)">
                  <input v-model="answers[qq.id]" class="input pickerInput" type="time" @click.stop="openNativePicker($event)" />
                </div>
              </div>

              <!-- ✅ upload -->
              <div v-else-if="qq.type === 'upload'" class="field">
                <div class="uploadRow">
                  <input
                    class="fileInput"
                    :class="{ dangerInput: submittedTry && qq.required && !uploadFiles[String(qq.id)] }"
                    type="file"
                    :id="`up_${qq.id}`"
                    @change="onFileChange(qq.id, $event)"
                  />

                  <div class="fileMeta">
                    <div class="fileName">
                      {{ uploadFiles[String(qq.id)]?.name || "No file selected" }}
                    </div>
                    <div v-if="uploadFiles[String(qq.id)]" class="fileSub">
                      {{ formatBytes(uploadFiles[String(qq.id)]?.size || 0) }}
                      <span class="dot">•</span>
                      {{ uploadFiles[String(qq.id)]?.type || "unknown" }}
                    </div>
                  </div>

                  <button
                    v-if="uploadFiles[String(qq.id)]"
                    class="btn mini ghost"
                    type="button"
                    @click="clearFile(qq.id)"
                  >
                    <i class="fa-solid fa-trash"></i>
                    <span>Remove</span>
                  </button>
                </div>

                <div class="hint">
                  Max {{ MAX_UPLOAD_MB }}MB (client limit). File will be sent with submission.
                </div>
              </div>

              <!-- score -->
              <div v-else-if="qq.type === 'score'" class="field">
                <div class="scorePicker">
                  <button
                    v-for="n in Number(qq.scoreMax || 5)"
                    :key="`${qq.id}_sc_${n}`"
                    type="button"
                    class="scoreBtn"
                    :class="{ on: Number(answers[qq.id] || 0) >= n }"
                    @click="answers[qq.id] = n"
                  >
                    <i class="fa-solid" :class="scoreFaIcon(qq.scoreIcon)"></i>
                  </button>
                  <span class="scoreVal">{{ Number(answers[qq.id] || 0) || "" }}</span>
                </div>
              </div>

              <!-- table -->
              <div v-else-if="qq.type === 'table_option' || qq.type === 'table_checkbox'" class="field">
                <div class="tableWrap">
                  <table class="gridTable">
                    <thead>
                      <tr>
                        <th></th>
                        <th v-for="(c, ci) in (qq.gridCols || [])" :key="`${qq.id}_c_${ci}`">{{ c }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(r, ri) in (qq.gridRows || [])" :key="`${qq.id}_r_${ri}`">
                        <td class="rowHead">{{ r }}</td>
                        <td v-for="(c, ci) in (qq.gridCols || [])" :key="`${qq.id}_${ri}_${ci}`" class="cell">
                          <input
                            v-if="qq.type === 'table_checkbox'"
                            type="checkbox"
                            :checked="isTableChecked(qq.id, ri, ci)"
                            @change="toggleTableCell(qq.id, ri, ci, $event.target.checked, true)"
                          />
                          <input
                            v-else
                            type="radio"
                            :name="`tbl_${qq.id}_${ri}`"
                            :checked="isTableChecked(qq.id, ri, ci)"
                            @change="toggleTableCell(qq.id, ri, ci, true, false)"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- fallback -->
              <div v-else class="field">
                <input class="input" type="text" placeholder="Viewer not defined for this type" disabled />
              </div>

              <div v-if="submittedTry && !isQuestionOk(qq)" class="errText">This question is required.</div>
            </div>
          </div>

          <!-- submit -->
          <div class="submitRow">
            <!-- ✅ change: click -> preSubmit (show confirm modal) -->
            <button class="btn" type="button" @click="preSubmit" :disabled="submitting || !tpl.active">
              <i class="fa-solid" :class="submitting ? 'fa-spinner fa-spin' : 'fa-paper-plane'"></i>
              <span>{{ submitting ? "Submitting..." : "Submit" }}</span>
            </button>

            <button class="btn ghost" type="button" @click="resetAnswers" :disabled="submitting">
              <i class="fa-solid fa-rotate-left"></i>
              <span>Reset</span>
            </button>
          </div>

          <div v-if="!tpl.active" class="warnText">
            Template (Active: OFF) — Submit disabled
          </div>
        </div>
      </div>

      <!-- right info -->
      <aside class="rightCol">
        <div ref="sideRef" class="card section">
          <div class="sectionTitle">Info</div>

          <div class="kv">
            <div class="k">Template ID</div>
            <div class="v mono">{{ tpl.id }}</div>

            <div class="k">sourceFormId</div>
            <div class="v mono">{{ tpl.sourceFormId || "—" }}</div>

            <div class="k">Updated</div>
            <div class="v">{{ fmtDate(tpl.updatedAt) }}</div>
          </div>

          <div class="miniHint">
            Submit (DB) by <b>/api/form-submissions</b>
          </div>
        </div>
      </aside>
    </section>

    <!-- ✅ Confirm overlay -->
    <div v-if="confirmOpen" ref="confirmOverlayRef" class="overlay" @click.self="closeConfirm" aria-modal="true" role="dialog">
      <div ref="confirmCardRef" class="modalCard">
        <div class="modalHead">
          <div class="modalIcon">
            <i class="fa-solid fa-circle-question"></i>
          </div>
          <div class="modalText">
            <div class="modalTitle">Confirm submit</div>
            <div class="modalSub">Do you want to submit this form now?</div>
          </div>
        </div>

        <div class="modalActions">
          <button class="btn ghost" type="button" @click="closeConfirm" :disabled="submitting">
            <i class="fa-solid fa-xmark"></i>
            <span>Cancel</span>
          </button>

          <button class="btn" type="button" @click="confirmSubmit" :disabled="submitting">
            <i class="fa-solid" :class="submitting ? 'fa-spinner fa-spin' : 'fa-paper-plane'"></i>
            <span>{{ submitting ? "Submitting..." : "Yes, submit" }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ✅ Success alert (GSAP) -->
    <div v-if="successOpen" ref="successOverlayRef" class="overlay successOverlay" @click.self="closeSuccess" aria-modal="true" role="alertdialog">
      <div ref="successModalRef" class="modalCard successModal">
        <div class="modalHead">
          <div class="modalIcon successIconBig">
            <i class="fa-solid fa-circle-check"></i>
          </div>
          <div class="modalText">
            <div class="modalTitle">Submit successful</div>
            <div class="modalSub">Thank you! Your response was submitted.</div>
          </div>
        </div>

        <div class="modalActions">
          <button class="btn" type="button" @click="closeSuccess">
            <i class="fa-solid fa-check"></i>
            <span>OK</span>
          </button>

          <button class="btn ghost" type="button" @click="goBack">
            <i class="fa-solid fa-arrow-left"></i>
            <span>Back</span>
          </button>
        </div>
      </div>
    </div>

    <!-- toast -->
    <div class="toast" :class="{ show: toast.show, danger: toast.type === 'danger' }" aria-live="polite">
      <i class="fa-solid" :class="toast.type === 'danger' ? 'fa-triangle-exclamation' : 'fa-circle-check'"></i>
      <span>{{ toast.text }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import gsap from "gsap";

const route = useRoute();
const router = useRouter();

const id = computed(() => String(route.params?.id || "").trim());

// ✅ endpoints
const LIST_API = "http://localhost:3000/api/form-templates";
const DETAIL_API = "http://localhost:3000/api/form-templates"; // ใช้ /:id
const SUBMIT_API = "http://localhost:3000/api/form-submissions";

const loading = ref(false);
const submitting = ref(false);
const error = ref("");

const topbarRef = ref(null);
const loadingRef = ref(null);
const errorRef = ref(null);
const formRef = ref(null);
const sideRef = ref(null);
const successCardRef = ref(null);

// ✅ confirm/success overlay refs + states
const confirmOpen = ref(false);
const successOpen = ref(false);
const submittedDone = ref(false);

const confirmOverlayRef = ref(null);
const confirmCardRef = ref(null);
const successOverlayRef = ref(null);
const successModalRef = ref(null);

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

function lockScroll(on) {
  try {
    document.body.style.overflow = on ? "hidden" : "";
  } catch {}
}

watch([confirmOpen, successOpen], ([c, s]) => {
  lockScroll(!!(c || s));
});

function animateModalIn(overlayEl, cardEl) {
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reduce) return;

  gsap.killTweensOf([overlayEl, cardEl]);

  gsap.fromTo(
    overlayEl,
    { opacity: 0 },
    { opacity: 1, duration: 0.18, ease: "power2.out" }
  );
  gsap.fromTo(
    cardEl,
    { y: 14, opacity: 0, scale: 0.98 },
    { y: 0, opacity: 1, scale: 1, duration: 0.28, ease: "power3.out" }
  );
}

function animateModalOut(overlayEl, cardEl, done) {
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reduce) return done?.();

  gsap.killTweensOf([overlayEl, cardEl]);

  const t = gsap.timeline({ defaults: { ease: "power2.inOut" } });
  t.to(cardEl, { y: 10, opacity: 0, scale: 0.985, duration: 0.2 }, 0);
  t.to(overlayEl, { opacity: 0, duration: 0.18 }, 0.02);
  t.add(() => done?.());
}

function openConfirm() {
  if (confirmOpen.value) return;
  confirmOpen.value = true;
  nextTick(() => animateModalIn(confirmOverlayRef.value, confirmCardRef.value));
}

function closeConfirm() {
  if (!confirmOpen.value) return;
  const overlayEl = confirmOverlayRef.value;
  const cardEl = confirmCardRef.value;
  animateModalOut(overlayEl, cardEl, () => {
    confirmOpen.value = false;
  });
}

function openSuccess() {
  if (successOpen.value) return;
  successOpen.value = true;
  nextTick(() => animateModalIn(successOverlayRef.value, successModalRef.value));
}

function closeSuccess() {
  if (!successOpen.value) return;
  const overlayEl = successOverlayRef.value;
  const cardEl = successModalRef.value;
  animateModalOut(overlayEl, cardEl, () => {
    successOpen.value = false;
  });
}

function safeJsonParse(x) {
  try {
    if (x == null) return null;
    if (typeof x === "object") return x;
    return JSON.parse(String(x));
  } catch {
    return null;
  }
}

function normalizeDraftType(t) {
  const ok = new Set(["short","long","option","checkbox","dropdown","upload","score","table_option","table_checkbox","date","time"]);
  if (t === "paragraph") return "long";
  if (t === "mc") return "option";
  if (t === "file") return "upload";
  return ok.has(t) ? t : "short";
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
    questions: qs.map((q, idx) => ({
      id: String(q?.id || `q_${idx}_${Date.now()}`),
      type: normalizeDraftType(q?.type),
      title: String(q?.title ?? ""),
      description: String(q?.description ?? ""),
      required: !!q?.required,
      options: Array.isArray(q?.options) ? q.options : [],
      images: Array.isArray(q?.images) ? q.images : [],
      scoreMax: Number(q?.scoreMax ?? q?.score?.max ?? 5),
      scoreIcon: String(q?.scoreIcon ?? q?.score?.icon ?? "star"),
      gridRows: Array.isArray(q?.gridRows) ? q.gridRows : (Array.isArray(q?.table?.rows) ? q.table.rows : []),
      gridCols: Array.isArray(q?.gridCols) ? q.gridCols : (Array.isArray(q?.table?.cols) ? q.table.cols : []),
    })),
  };
}

// template state
const tpl = reactive({
  id: "",
  sourceFormId: null,
  updatedAt: null,
  active: false,
  title: "",
  description: "",
  collectEmail: false,
  questions: [],
});

// answers
const answers = reactive({});
const tableAnswers = reactive({});

// ✅ upload files map (qid -> File)
const uploadFiles = reactive({});
const MAX_UPLOAD_MB = 10;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

function formatBytes(bytes) {
  const n = Number(bytes || 0);
  if (!n) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(n) / Math.log(k)), sizes.length - 1);
  const v = n / Math.pow(k, i);
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
}

function onFileChange(qid, e) {
  const key = String(qid);
  const file = e?.target?.files?.[0] || null;

  if (!file) {
    clearFile(key);
    return;
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    showToast(`File too large (max ${MAX_UPLOAD_MB}MB)`, "danger");
    try { e.target.value = ""; } catch {}
    return;
  }

  uploadFiles[key] = file;

  // keep some meta in answers (so backend can store even if it ignores multipart)
  answers[key] = { name: file.name, type: file.type, size: file.size };
}

function clearFile(qid) {
  const key = String(qid);
  if (uploadFiles[key]) delete uploadFiles[key];
  answers[key] = null;
}

const submittedTry = ref(false);
const emailTouched = ref(false);

const emailOk = computed(() => {
  if (!tpl.collectEmail) return true;
  const v = String(answers.__email || "").trim();
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
});

function initAnswers() {
  for (const k of Object.keys(answers)) delete answers[k];
  for (const k of Object.keys(tableAnswers)) delete tableAnswers[k];
  for (const k of Object.keys(uploadFiles)) delete uploadFiles[k];
  emailTouched.value = false;

  if (tpl.collectEmail) answers.__email = "";

  for (const qq of tpl.questions) {
    const qid = String(qq.id);
    if (qq.type === "checkbox") answers[qid] = [];
    else if (qq.type === "score") answers[qid] = 0;
    else if (qq.type === "table_option" || qq.type === "table_checkbox") tableAnswers[qid] = {};
    else if (qq.type === "upload") answers[qid] = null;
    else answers[qid] = "";
  }
}

function resetAnswers() {
  submittedTry.value = false;
  initAnswers();
  showToast("Reset");
}

// ===== table answers helpers =====
function ensureTable(qid) {
  const k = String(qid);
  if (!tableAnswers[k]) tableAnswers[k] = {};
  return tableAnswers[k];
}
function isTableChecked(qid, ri, ci) {
  const tbl = tableAnswers[String(qid)];
  if (!tbl) return false;
  const rowKey = String(ri);
  const val = tbl[rowKey];
  if (Array.isArray(val)) return val.includes(ci);
  if (typeof val === "number") return val === ci;
  return false;
}
function toggleTableCell(qid, ri, ci, checked, isCheckbox) {
  const tbl = ensureTable(qid);
  const rowKey = String(ri);

  if (isCheckbox) {
    const cur = Array.isArray(tbl[rowKey]) ? tbl[rowKey] : [];
    const set = new Set(cur);
    if (checked) set.add(ci);
    else set.delete(ci);
    tbl[rowKey] = Array.from(set);
  } else {
    if (checked) tbl[rowKey] = ci;
  }
}
function toggleCheckbox(qid, value, checked) {
  const k = String(qid);
  const cur = Array.isArray(answers[k]) ? answers[k] : [];
  const set = new Set(cur);
  if (checked) set.add(value);
  else set.delete(value);
  answers[k] = Array.from(set);
}

function scoreFaIcon(icon) {
  const s = String(icon || "star");
  if (s === "heart") return "fa-heart";
  if (s === "like") return "fa-thumbs-up";
  return "fa-star";
}

// ===== validation =====
function isQuestionOk(qq) {
  if (!qq?.required) return true;
  const qid = String(qq.id);

  if (qq.type === "checkbox") return Array.isArray(answers[qid]) && answers[qid].length > 0;
  if (qq.type === "score") return Number(answers[qid] || 0) > 0;
  if (qq.type === "upload") return !!uploadFiles[qid];

  if (qq.type === "table_option" || qq.type === "table_checkbox") {
    const tbl = tableAnswers[qid];
    if (!tbl) return false;
    return Object.values(tbl).some((v) => (Array.isArray(v) ? v.length > 0 : typeof v === "number"));
  }

  return String(answers[qid] ?? "").trim().length > 0;
}

// ===== safe html helpers =====
function escapeHtmlText(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function hasAnchor(s) {
  return /<a\b[^>]*href\s*=\s*['"][^'"]+['"][^>]*>/i.test(String(s ?? ""));
}
function safeHref(href) {
  const h = String(href ?? "").trim();
  if (!h) return "#";
  if (/^(https?:\/\/|mailto:|tel:)/i.test(h)) return h;
  if (/^[\w.-]+\.[A-Za-z]{2,}(\/|$)/.test(h)) return "https://" + h;
  return "#";
}
function stripHtmlText(s) {
  try {
    const div = document.createElement("div");
    div.innerHTML = String(s ?? "");
    return (div.textContent || "").trim();
  } catch {
    return String(s ?? "").replace(/<[^>]*>/g, "").trim();
  }
}
function asPlainText(s) {
  return stripHtmlText(s);
}
function renderSafeHtml(s) {
  const raw = String(s ?? "");
  if (hasAnchor(raw)) {
    try {
      const div = document.createElement("div");
      div.innerHTML = raw;
      const a = div.querySelector("a");
      if (a) {
        const href = safeHref(a.getAttribute("href"));
        const txt = (a.textContent || "").trim() || stripHtmlText(raw) || "Link";
        return `<a href="${escapeHtmlText(href)}" target="_blank" rel="noopener noreferrer">${escapeHtmlText(txt)}</a>`;
      }
    } catch {}
  }
  return escapeHtmlText(raw);
}

// ===== images =====
const SERVER_ORIGIN = (() => {
  try { return new URL(LIST_API).origin; } catch { return window.location.origin; }
})();
function appendCacheBust(url, bust) {
  const b = bust == null ? "" : String(bust).trim();
  if (!b) return url;
  const u = String(url || "");
  if (!u) return u;
  if (/^data:/i.test(u) || /^blob:/i.test(u)) return u;
  const sep = u.includes("?") ? "&" : "?";
  return `${u}${sep}v=${encodeURIComponent(b)}`;
}
function resolveImgSrc(src, bust) {
  const s = String(src || "").trim();
  if (!s) return "";
  if (/^data:/i.test(s) || /^blob:/i.test(s)) return s;
  if (/^https?:\/\//i.test(s)) return appendCacheBust(s, bust);
  if (s.startsWith("/")) return appendCacheBust(`${SERVER_ORIGIN}${s}`, bust);
  return appendCacheBust(s, bust);
}

function openNativePicker(e) {
  try {
    const target = e?.currentTarget;
    let input = null;
    if (target && target.tagName === "INPUT") input = target;
    else input = target?.querySelector?.("input");
    if (!input) return;
    input.focus({ preventScroll: true });
    if (typeof input.showPicker === "function") {
      try { input.showPicker(); } catch {}
    }
  } catch {}
}

function fmtDate(iso) {
  try {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  } catch {
    return "—";
  }
}

// ===== API calls =====
async function apiGetDetail(templateId) {
  // 1) try /api/form-templates/:id
  const r = await fetch(`${DETAIL_API}/${encodeURIComponent(templateId)}`, { headers: { Accept: "application/json" } });
  const data = await r.json().catch(() => null);
  if (r.ok && data && data.ok !== false) {
    return data?.item || data;
  }

  // 2) fallback: fetch list แล้วหา id
  const r2 = await fetch(LIST_API, { headers: { Accept: "application/json" } });
  const data2 = await r2.json().catch(() => null);
  if (!r2.ok) throw new Error(data?.message || "Load template failed");

  const arr = Array.isArray(data2) ? data2 : (data2?.items || data2?.data || data2?.rows || []);
  const found = arr.find((x) => String(x?.id ?? x?.template_id ?? x?.templateId ?? "") === String(templateId));
  if (!found) throw new Error("Template not found");
  return found;
}

async function apiSubmitJson(payload) {
  const r = await fetch(SUBMIT_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await r.json().catch(() => null);
  if (!r.ok || data?.ok === false) throw new Error(data?.message || "Submit failed");
  return data;
}

async function apiSubmitFormData(fd) {
  const r = await fetch(SUBMIT_API, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: fd,
  });
  const data = await r.json().catch(() => null);
  if (!r.ok || data?.ok === false) throw new Error(data?.message || "Submit failed");
  return data;
}

async function load() {
  if (!id.value) return;

  loading.value = true;
  error.value = "";
  try {
    const item = await apiGetDetail(id.value);

    const templateId = String(item?.id ?? item?.template_id ?? id.value).trim();
    const sourceFormId = item?.sourceFormId ?? item?.source_form_id ?? null;
    const updatedAt = item?.updatedAt ?? item?.updated_at ?? null;
    const active = !!Number(item?.activetoggle ?? item?.active ?? 0);

    const payloadObj =
      typeof item?.payload === "string" ? safeJsonParse(item.payload) :
      (typeof item?.payload === "object" ? item.payload : {});

    const payload = normalizePayload(payloadObj || {});
    const meta = payload.meta;

    tpl.id = templateId;
    tpl.sourceFormId = sourceFormId;
    tpl.updatedAt = updatedAt;
    tpl.active = active;

    tpl.title = meta.title || item?.title || item?.name || "";
    tpl.description = meta.description || "";
    tpl.collectEmail = !!meta.collectEmail;

    tpl.questions = payload.questions;

    submittedDone.value = false;
    initAnswers();

    await nextTick();
    animateIn();
  } catch (e) {
    error.value = e?.message || "Load template failed";
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

  if (!loading.value && !error.value) {
    const mainEl = submittedDone.value ? successCardRef.value : formRef.value;
    if (mainEl) tl.from(mainEl, { y: 14, opacity: 0, duration: 0.55 }, 0.08);

    if (sideRef.value) tl.from(sideRef.value, { y: 14, opacity: 0, duration: 0.55 }, 0.12);

    if (!submittedDone.value) {
      tl.from(".qCard", { y: 10, opacity: 0, duration: 0.32, stagger: 0.05 }, 0.16);
    }
  } else if (loading.value) {
    tl.from(loadingRef.value, { y: 14, opacity: 0, duration: 0.55 }, 0.08);
  } else if (error.value) {
    tl.from(errorRef.value, { y: 14, opacity: 0, duration: 0.55 }, 0.08);
  }
}

function validateBeforeSubmit() {
  submittedTry.value = true;
  emailTouched.value = true;

  if (tpl.collectEmail && !emailOk.value) {
    showToast("Email is required", "danger");
    return false;
  }

  const bad = tpl.questions.find((qq) => !isQuestionOk(qq));
  if (bad) {
    showToast("Please fill required fields", "danger");
    return false;
  }

  if (!tpl.active) {
    showToast("Template is inactive", "danger");
    return false;
  }

  return true;
}

// ✅ click submit => validate then open confirm overlay
function preSubmit() {
  if (submitting.value) return;
  if (!validateBeforeSubmit()) return;
  openConfirm();
}

// ✅ user confirms
async function confirmSubmit() {
  if (submitting.value) return;
  await doSubmit();
}

// ✅ actual submit (called only after confirm)
async function doSubmit() {
  if (submitting.value) return;

  // re-check quickly
  if (!validateBeforeSubmit()) {
    closeConfirm();
    return;
  }

  // build answers payload
  const out = {};
  for (const qq of tpl.questions) {
    const qid = String(qq.id);

    if (qq.type === "table_option" || qq.type === "table_checkbox") {
      out[qid] = tableAnswers[qid] || {};
      continue;
    }

    if (qq.type === "upload") {
      const f = uploadFiles[qid];
      out[qid] = f ? { name: f.name, type: f.type, size: f.size, field: `file_${qid}` } : null;
      continue;
    }

    out[qid] = answers[qid];
  }
  if (tpl.collectEmail) out.__email = String(answers.__email || "").trim();

  submitting.value = true;
  try {
    const hasFiles = Object.keys(uploadFiles).some((k) => uploadFiles[k] instanceof File);

    if (hasFiles) {
      const fd = new FormData();
      fd.append("templateId", tpl.id);
      fd.append("sourceFormId", tpl.sourceFormId || "");
      fd.append("submittedAt", new Date().toISOString());
      fd.append("answers", JSON.stringify(out));

      for (const [qid, file] of Object.entries(uploadFiles)) {
        if (file instanceof File) {
          fd.append(`file_${qid}`, file, file.name);
        }
      }

      await apiSubmitFormData(fd);
    } else {
      await apiSubmitJson({
        templateId: tpl.id,
        sourceFormId: tpl.sourceFormId,
        answers: out,
        submittedAt: new Date().toISOString(),
      });
    }

    // ✅ success: close confirm, show success alert, and make form disappear
    closeConfirm();
    submittedDone.value = true;
    openSuccess();

    // optional: clear form data after success (still hidden anyway)
    initAnswers();

    await nextTick();
    animateIn();
  } catch (e) {
    showToast(e?.message || "Submit failed", "danger");
    closeConfirm();
  } finally {
    submitting.value = false;
  }
}

function goBack() {
  router.push("/v/formmemberview");
}

function onKeydown(e) {
  if (e.key === "Escape") {
    if (confirmOpen.value) closeConfirm();
    else if (successOpen.value) closeSuccess();
  }
}

onMounted(() => {
  load();
  window.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
  if (toastTimer) clearTimeout(toastTimer);
  if (tl) tl.kill();
  tl = null;
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
.left { display: inline-flex; gap: 12px; align-items: center; }
.headText { display: grid; gap: 6px; }
.titleRow { display: inline-flex; align-items: center; gap: 10px; font-weight: 950; font-size: 16px; }
.sub { color: rgba(255,255,255,0.65); font-weight: 850; font-size: 12px; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New"; }

/* grid */
.grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 18px;
}
.leftCol, .rightCol { display: grid; gap: 18px; }

/* card */
.card {
  border-radius: 18px;
  background: rgba(0, 0, 0, 0.24);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 16px 44px rgba(0, 0, 0, 0.30);
}
.section { padding: 18px 18px 16px; }

.sectionTitle {
  font-size: 15px;
  font-weight: 950;
  margin-bottom: 10px;
  color: rgba(120, 210, 200, 0.9);
  display: inline-flex;
  gap: 10px;
  align-items: center;
}
.subText { font-size: 12px; color: rgba(255,255,255,0.65); line-height: 1.5; font-weight: 800; }

/* success card */
.successCard {
  border-color: rgba(56, 189, 248, 0.18);
  background: rgba(6, 20, 36, 0.32);
}
.successHead {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}
.successIcon {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: rgba(56, 189, 248, 0.10);
  border: 1px solid rgba(56, 189, 248, 0.18);
  color: rgba(56, 189, 248, 0.95);
  font-size: 22px;
}
.successTitle {
  font-weight: 950;
  font-size: 16px;
}
.successSub {
  margin-top: 3px;
  font-weight: 850;
  font-size: 12px;
  color: rgba(255,255,255,0.65);
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
.badge.ok { border-color: rgba(56, 189, 248, 0.20); background: rgba(56, 189, 248, 0.08); }
.badge.off { border-color: rgba(248, 113, 113, 0.18); background: rgba(248, 113, 113, 0.08); }

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

/* form */
.formHead { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.formTitle { font-weight: 950; font-size: 16px; }
.formTitle a { color: rgba(120, 170, 255, 0.95); text-decoration: none; font-weight: 950; }
.chips { display: inline-flex; gap: 8px; flex-wrap: wrap; }
.chip {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 10px; border-radius: 999px;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.78); font-size: 12px; font-weight: 900;
}
.desc { color: rgba(255,255,255,0.74); line-height: 1.5; font-size: 12px; margin: 8px 0 12px; }

.req { color: rgba(248, 113, 113, 1); font-weight: 950; }
.errText { font-size: 12px; color: rgba(248, 113, 113, 0.95); font-weight: 900; }
.warnText { margin-top: 10px; font-weight: 900; color: rgba(248, 113, 113, 0.95); }

.emailBox { display: grid; gap: 8px; margin-bottom: 12px; }
.emailLabel { display: inline-flex; gap: 10px; align-items: center; font-weight: 950; }

.input, .textarea, .select, .fileInput {
  width: 100%;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(0, 0, 0, 0.18);
  color: rgba(255, 255, 255, 0.92);
  padding: 10px 12px;
  outline: none;
  font-weight: 850;
}
.textarea { resize: vertical; }
.dangerInput { border-color: rgba(248, 113, 113, 0.45) !important; box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.12) !important; }

.qList { display: grid; gap: 12px; margin-top: 10px; }
.qCard {
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.14);
  padding: 12px;
  display: grid;
  gap: 10px;
}
.qTop { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.qTitle { font-weight: 950; display: inline-flex; gap: 8px; align-items: center; }
.qTitle a { color: rgba(120, 170, 255, 0.95); text-decoration: none; font-weight: 950; }
.qNum { color: rgba(255, 255, 255, 0.78); }
.qDesc { color: rgba(255, 255, 255, 0.7); font-size: 12px; line-height: 1.5; }

.pill {
  font-size: 11px;
  font-weight: 900;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.10);
  color: rgba(255,255,255,0.78);
}

.field { display: grid; gap: 8px; }
.choices { display: grid; gap: 8px; }
.choiceRow { display: inline-flex; gap: 10px; align-items: center; color: rgba(255, 255, 255, 0.84); font-weight: 800; }
.hint { font-size: 12px; color: rgba(255,255,255,0.65); font-weight: 800; }

.imgs { display: grid; grid-template-columns: 1fr; gap: 10px; }
.img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 14px;
  object-fit: contain;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
}

/* upload row */
.uploadRow {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.fileMeta {
  display: grid;
  gap: 4px;
  flex: 1;
  min-width: 220px;
}
.fileName {
  font-weight: 950;
  color: rgba(255,255,255,0.88);
  word-break: break-word;
}
.fileSub {
  font-size: 12px;
  font-weight: 850;
  color: rgba(255,255,255,0.6);
  display: inline-flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.dot { opacity: 0.7; }

/* score */
.scorePicker { display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.scoreBtn {
  width: 38px; height: 38px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  display: grid; place-items: center;
  transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
}
.scoreBtn:hover { transform: translateY(-1px); background: rgba(255,255,255,0.06); border-color: rgba(56, 189, 248, 0.18); }
.scoreBtn.on { border-color: rgba(56, 189, 248, 0.28); background: rgba(56, 189, 248, 0.10); }
.scoreVal { font-weight: 950; color: rgba(255, 255, 255, 0.85); padding-left: 6px; }

/* table */
.tableWrap { overflow: auto; }
.gridTable { width: 100%; border-collapse: collapse; min-width: 520px; }
.gridTable th, .gridTable td { border: 1px solid rgba(255, 255, 255, 0.1); padding: 10px; text-align: center; }
.gridTable th { background: rgba(255, 255, 255, 0.03); color: rgba(255, 255, 255, 0.9); font-weight: 950; }
.rowHead { text-align: left !important; font-weight: 900; color: rgba(255, 255, 255, 0.85); }
.cell input { transform: scale(1.05); }

.pickerWrap { border-radius: 14px; cursor: pointer; }
.pickerInput { cursor: pointer; }

.submitRow { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 14px; }

.loadingRow { display: inline-flex; gap: 10px; align-items: center; font-weight: 900; color: rgba(255,255,255,0.8); }
.danger { border-color: rgba(248, 113, 113, 0.22); }

/* info */
.kv { display: grid; grid-template-columns: 120px 1fr; gap: 8px 10px; }
.k { color: rgba(255,255,255,0.65); font-weight: 900; font-size: 12px; }
.v { color: rgba(255,255,255,0.88); font-weight: 900; font-size: 12px; word-break: break-word; }
.miniHint { margin-top: 10px; font-size: 12px; color: rgba(255,255,255,0.65); font-weight: 800; }

/* ✅ overlay + modal */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 100000;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(10px);
  display: grid;
  place-items: center;
  padding: 18px;
}
.modalCard {
  width: min(520px, 100%);
  border-radius: 18px;
  background: rgba(8, 12, 28, 0.80);
  border: 1px solid rgba(255, 255, 255, 0.10);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.55);
  padding: 16px;
}
.modalHead {
  display: flex;
  align-items: center;
  gap: 12px;
}
.modalIcon {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.10);
  color: rgba(120, 210, 200, 0.95);
  font-size: 20px;
}
.modalText { display: grid; gap: 3px; }
.modalTitle { font-weight: 950; font-size: 16px; }
.modalSub { font-weight: 850; font-size: 12px; color: rgba(255,255,255,0.65); }

.modalActions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 14px;
}

.successOverlay {
  background: rgba(0, 0, 0, 0.60);
}
.successModal {
  border-color: rgba(56, 189, 248, 0.18);
}
.successIconBig {
  background: rgba(56, 189, 248, 0.10);
  border-color: rgba(56, 189, 248, 0.18);
  color: rgba(56, 189, 248, 0.95);
}

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

/* responsive */
@media (max-width: 1100px) {
  .grid { grid-template-columns: 1fr; }
}
</style>
