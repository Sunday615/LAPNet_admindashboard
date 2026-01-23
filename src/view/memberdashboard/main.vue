<!-- src/views/ViewerDashboard.vue  (single-file, bento layout, tech modern style + GSAP + Document Overlay Viewer) -->
<template>
  <div class="vdash">
    <!-- header -->
    <header ref="topbarEl" class="topbar js-reveal">
      <div class="headline">
        <div class="kicker">
          <span class="kDot"></span>
          Viewer Console
        </div>
        <h1 class="title">Main Dashboard</h1>
        <p class="subtitle">Overview: Documents • Announcements • Forms</p>
      </div>

      <div class="actions">
        <button
          class="btn"
          type="button"
          @click="refresh"
          :disabled="loading"
          @mouseenter="btnHover($event, true)"
          @mouseleave="btnHover($event, false)"
        >
          <span class="btnIcon" :class="{ spin: loading }">⟲</span>
          Refresh
        </button>
      </div>
    </header>

    <!-- stats -->
    <section ref="statsEl" class="stats js-reveal">
      <div
        class="statCard"
        @click="go('/v/documentviewer')"
        @mouseenter="cardHover($event, true)"
        @mouseleave="cardHover($event, false)"
      >
        <div class="statIcon"><i class="fa-solid fa-file"></i></div>
        <div class="statMeta">
          <div class="statLabel">Documents</div>
          <div class="statValue">
            <span v-if="loading" class="sk sk-w80"></span>
            <span v-else>{{ docs.length }}</span>
          </div>
        </div>
        <div class="statHint">
          <span class="pill">View</span>
          <span class="muted">latest {{ latestDocs[0] ? formatDate(getAnyDate(latestDocs[0])) : "-" }}</span>
        </div>
      </div>

      <div
        class="statCard"
        @click="go('/v/announcement_member')"
        @mouseenter="cardHover($event, true)"
        @mouseleave="cardHover($event, false)"
      >
        <div class="statIcon"><i class="fa-solid fa-bullhorn"></i></div>
        <div class="statMeta">
          <div class="statLabel">Announcements</div>
          <div class="statValue">
            <span v-if="loading" class="sk sk-w80"></span>
            <span v-else>{{ anns.length }}</span>
          </div>
        </div>
        <div class="statHint">
          <span class="pill">View</span>
          <span class="muted">latest {{ latestAnns[0] ? formatDate(getAnyDate(latestAnns[0])) : "-" }}</span>
        </div>
      </div>

      <div
        class="statCard"
        @click="go('/v/formmemberview')"
        @mouseenter="cardHover($event, true)"
        @mouseleave="cardHover($event, false)"
      >
        <div class="statIcon"><i class="fa-solid fa-list-check"></i></div>
        <div class="statMeta">
          <div class="statLabel">Forms</div>
          <div class="statValue">
            <span v-if="loading" class="sk sk-w80"></span>
            <span v-else>{{ forms.length }}</span>
          </div>
        </div>
        <div class="statHint">
          <span class="pill">View</span>
          <span class="muted">active {{ activeForms }} / {{ forms.length }}</span>
        </div>
      </div>
    </section>

    <!-- bento (fills remaining height; each card scrolls inside) -->
    <section ref="bentoEl" class="bento js-reveal">
      <!-- BIG: Documents -->
      <article class="card card--docs">
        <div class="cardTop">
          <div class="cardTitle">
            <span class="cardIcon"><i class="fa-solid fa-file"></i></span>
            <div>
              <div class="t1">Documents</div>
              <div class="t2">Click a row to preview (overlay)</div>
            </div>
          </div>

          <div class="cardActions">
            <div class="search">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input v-model.trim="docQuery" type="text" placeholder="Search documents..." spellcheck="false" />
              <button class="x" type="button" v-if="docQuery" @click="docQuery = ''" aria-label="Clear">✕</button>
            </div>

            <button class="ghost" type="button" @click="go('/v/documentviewer')">
              View all
              <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>

        <div class="cardBody">
          <div class="tableHead">
            <div>Title</div>
            <div class="hideSm">Category</div>
            <div class="right">Updated</div>
          </div>

          <div v-if="loading" class="rows scroll">
            <div v-for="i in 12" :key="i" class="row skRow">
              <span class="sk sk-w60"></span>
              <span class="sk sk-w30 hideSm"></span>
              <span class="sk sk-w20 right"></span>
            </div>
          </div>

          <div v-else class="rows scroll">
            <button
              v-for="(d, idx) in filteredDocs.slice(0, 80)"
              :key="d?.id ?? d?._id ?? idx"
              class="row rowBtn"
              type="button"
              @mouseenter="rowHover($event, true)"
              @mouseleave="rowHover($event, false)"
              @click="viewDocument(d)"
              :title="getDocTitle(d)"
            >
              <div class="cell titleCell">
                <span class="dot" :class="typeDot(inferDocType(d))"></span>
                <span class="ellipsis">{{ getDocTitle(d) }}</span>
              </div>
              <div class="cell hideSm ellipsis muted">
                {{ d?.category || d?.department || d?.typeGroup || d?.group || "—" }}
              </div>
              <div class="cell right muted">{{ formatDate(getAnyDate(d)) }}</div>
            </button>

            <div v-if="filteredDocs.length === 0" class="empty">
              <div class="emptyTitle">No documents found</div>
              <div class="emptySub">Try another keyword.</div>
            </div>
          </div>
        </div>
      </article>

      <!-- Announcements -->
      <article class="card card--ann">
        <div class="cardTop">
          <div class="cardTitle">
            <span class="cardIcon"><i class="fa-solid fa-bullhorn"></i></span>
            <div>
              <div class="t1">Announcements</div>
              <div class="t2">Latest updates</div>
            </div>
          </div>
          <button class="ghost" type="button" @click="go('/v/announcement_member')">
            View all <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>

        <div class="cardBody">
          <div v-if="loading" class="miniList scroll">
            <div v-for="i in 8" :key="i" class="miniItem">
              <span class="sk sk-w70"></span>
              <span class="sk sk-w35"></span>
            </div>
          </div>

          <div v-else class="miniList scroll">
            <button
              v-for="(a, idx) in latestAnns.slice(0, 30)"
              :key="a?.id ?? a?._id ?? idx"
              class="miniBtn"
              type="button"
              @mouseenter="rowHover($event, true)"
              @mouseleave="rowHover($event, false)"
              @click="openItem('announcements', a)"
            >
              <div class="miniTitle ellipsis">{{ getAnnTitle(a) }}</div>
              <div class="miniSub">
                <span class="chip">{{ formatDate(getAnyDate(a)) }}</span>
                <span class="ellipsis muted">{{ getAnnSub(a) }}</span>
              </div>
            </button>

            <div v-if="latestAnns.length === 0" class="empty small">
              <div class="emptyTitle">No announcements</div>
              <div class="emptySub">Nothing to show.</div>
            </div>
          </div>
        </div>
      </article>

      <!-- Forms -->
      <article class="card card--forms">
        <div class="cardTop">
          <div class="cardTitle">
            <span class="cardIcon"><i class="fa-solid fa-list-check"></i></span>
            <div>
              <div class="t1">Forms</div>
              <div class="t2">Templates</div>
            </div>
          </div>
          <button class="ghost" type="button" @click="go('/v/formmemberview')">
            View all <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>

        <div class="cardBody">
          <div v-if="loading" class="miniGrid scroll">
            <div v-for="i in 10" :key="i" class="formTile">
              <span class="sk sk-w70"></span>
              <span class="sk sk-w45"></span>
            </div>
          </div>

          <div v-else class="miniGrid scroll">
            <button
              v-for="(f, idx) in latestForms.slice(0, 40)"
              :key="f?.id ?? f?._id ?? f?.templateId ?? idx"
              class="formTile tileBtn"
              type="button"
              @mouseenter="rowHover($event, true)"
              @mouseleave="rowHover($event, false)"
              @click="openItem('forms', f)"
            >
              <div class="tileTop">
                <div class="tileName ellipsis">{{ getFormTitle(f) }}</div>
                <span class="badge" :class="{ on: isActive(f) }">{{ isActive(f) ? "Active" : "Inactive" }}</span>
              </div>
              <div class="tileSub muted">updated {{ formatDate(getAnyDate(f)) }}</div>
            </button>

            <div v-if="latestForms.length === 0" class="empty small">
              <div class="emptyTitle">No forms</div>
              <div class="emptySub">No templates available.</div>
            </div>
          </div>
        </div>
      </article>
    </section>

    <!-- error -->
    <transition name="toast">
      <div v-if="error" class="toastErr">
        <div class="toastErrTitle">
          <i class="fa-solid fa-triangle-exclamation"></i>
          Error
        </div>
        <div class="toastErrMsg">{{ error }}</div>
        <button class="toastErrBtn" type="button" @click="error = ''">Dismiss</button>
      </div>
    </transition>

    <!-- ✅ Document Overlay Viewer (like your DocumentViewer modal design) -->
    <div v-if="docModal.open" class="modalOverlay" @mousedown.self="closeDocModal()">
      <div ref="docModalRef" class="modal docModal" role="dialog" aria-modal="true">
        <div class="modalHead">
          <div class="modalTitle">
            <i class="fa-regular fa-eye"></i>
            <span class="ellipsis">{{ docModal.title || "Document Preview" }}</span>
          </div>

          <div class="modalHeadActions">
            <button class="iconBtn" type="button" title="Open in new tab" :disabled="!docModal.url" @click="openDocInNewTab()">
              <i class="fa-solid fa-up-right-from-square"></i>
            </button>
            <button class="iconBtn" type="button" title="Download" :disabled="!docModal.downloadUrl && !docModal.url" @click="downloadDocFromModal()">
              <i class="fa-solid fa-download"></i>
            </button>
            <button class="iconBtn" type="button" title="Close" @click="closeDocModal()">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <div class="modalBody">
          <div class="docMetaRow">
            <span class="pill2" :class="typePill(inferDocType(docModal.doc))">
              {{ (inferDocType(docModal.doc) || "unknown").toUpperCase() }}
            </span>
            <span class="muted ellipsis">
              Updated: {{ formatDate(getAnyDate(docModal.doc)) }}
            </span>
          </div>

          <div class="previewWrap" role="region" aria-label="Document preview">
            <div v-if="!docModal.url" class="previewEmpty">
              <i class="fa-regular fa-folder-open"></i>
              No preview URL for this document
            </div>

            <!-- images -->
            <img
              v-else-if="docModal.kind === 'image'"
              class="previewImg"
              :src="docModal.url"
              :alt="docModal.title || 'Preview'"
            />

            <!-- everything else: iframe (pdf, txt, etc.) -->
            <iframe
              v-else
              class="previewFrame"
              :src="docModal.url"
              title="Document preview"
              loading="lazy"
            ></iframe>
          </div>

          <div class="modalFoot">
            <button class="btn ghost" type="button" @click="closeDocModal()">Close</button>
            <button class="btn primary" type="button" :disabled="!docModal.url" @click="openDocInNewTab()">
              <i class="fa-regular fa-eye"></i>
              <span>View</span>
            </button>
          </div>

          <div v-if="docModal.note" class="note">
            <i class="fa-solid fa-circle-info"></i>
            <span>{{ docModal.note }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import gsap from "gsap";

const router = useRouter();

const API_BASE = (import.meta?.env?.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const DOC_URL = `${API_BASE}/api/documents`;
const ANN_URL = `${API_BASE}/api/announcements`;
const FORM_URL = `${API_BASE}/api/form-templates`;

const topbarEl = ref(null);
const statsEl = ref(null);
const bentoEl = ref(null);

const loading = ref(false);
const error = ref("");

const docs = ref([]);
const anns = ref([]);
const forms = ref([]);

const docQuery = ref("");

/** ✅ Modal viewer state */
const docModalRef = ref(null);
const docModal = ref({
  open: false,
  doc: null,
  title: "",
  url: "",
  downloadUrl: "",
  kind: "iframe", // iframe | image
  note: "",
});

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

function toTime(x) {
  const t = new Date(x).getTime();
  return Number.isFinite(t) ? t : 0;
}

function getAnyDate(x) {
  return (
    x?.updatedAt ||
    x?.updated_at ||
    x?.modifiedAt ||
    x?.createdAt ||
    x?.created_at ||
    x?.publishedAt ||
    x?.date ||
    x?.uploadedAt ||
    x?.upload_date ||
    null
  );
}

function sortLatest(arr) {
  return [...arr].sort((a, b) => toTime(getAnyDate(b)) - toTime(getAnyDate(a)));
}

const latestDocs = computed(() => sortLatest(docs.value));
const latestAnns = computed(() => sortLatest(anns.value));
const latestForms = computed(() => sortLatest(forms.value));

function getDocTitle(d) {
  return d?.title || d?.name || d?.filename || d?.file_name || "Untitled";
}
function getAnnTitle(a) {
  return a?.title || a?.subject || a?.name || "No title";
}
function getAnnSub(a) {
  return (a?.summary || a?.content || a?.body || a?.detail || "—").toString().replace(/\s+/g, " ").slice(0, 70);
}
function getFormTitle(f) {
  return f?.templateName || f?.name || f?.title || "Unnamed form";
}
function isActive(f) {
  return (f?.isActive ?? f?.active) === true;
}

const activeForms = computed(() => forms.value.filter((x) => isActive(x)).length);

const filteredDocs = computed(() => {
  const q = docQuery.value.trim().toLowerCase();
  if (!q) return latestDocs.value;
  return latestDocs.value.filter((d) => {
    const s = `${getDocTitle(d)} ${d?.category || ""} ${d?.department || ""} ${d?.type || ""} ${d?.group || ""}`.toLowerCase();
    return s.includes(q);
  });
});

function formatDate(v) {
  if (!v) return "-";
  const dt = new Date(v);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString();
}

function go(path) {
  router.push(path);
}

/**
 * Keep list routing for announcements/forms
 */
function openItem(type, item) {
  const id = item?.id ?? item?._id ?? item?.documentId ?? item?.templateId;
  if (type === "announcements") return go(id ? `/v/announcement_member/${id}` : "/v/announcement_member");
  if (type === "forms") return go(id ? `/v/formmemberview/${id}` : "/v/formmemberview");
}

/* -------------------------
 * ✅ Document overlay viewer
 * ------------------------- */
function resolveUrl(u) {
  if (!u) return "";
  const s = String(u).trim();
  if (!s) return "";
  if (/^(https?:)?\/\//i.test(s) || s.startsWith("blob:") || s.startsWith("data:")) return s;
  if (s.startsWith("/")) return `${API_BASE}${s}`;
  return `${API_BASE}/${s.replace(/^\.?\//, "")}`;
}

function pickDocUrl(d) {
  // try common fields (viewer url first)
  return (
    d?.viewUrl ||
    d?.view_url ||
    d?.previewUrl ||
    d?.preview_url ||
    d?.url ||
    d?.fileUrl ||
    d?.file_url ||
    d?.pathUrl ||
    d?.path_url ||
    d?.publicUrl ||
    d?.public_url ||
    ""
  );
}

function pickDownloadUrl(d) {
  return d?.downloadUrl || d?.download_url || d?.dlUrl || d?.dl_url || "";
}

function inferDocType(d) {
  const raw = (d?.type || d?.ext || d?.fileType || "").toString().toLowerCase();
  if (raw) {
    if (raw.includes("pdf")) return "pdf";
    if (raw.includes("doc")) return "docs";
    if (raw.includes("xls")) return "excel";
    if (raw.includes("ppt")) return "ppt";
    if (raw.includes("txt")) return "txt";
    if (raw.includes("png") || raw.includes("jpg") || raw.includes("jpeg") || raw.includes("webp") || raw.includes("gif"))
      return "image";
  }

  const name = getDocTitle(d).toLowerCase();
  const m = name.match(/\.([a-z0-9]+)$/i);
  const ext = m?.[1] || "";
  if (ext === "pdf") return "pdf";
  if (ext === "doc" || ext === "docx") return "docs";
  if (ext === "xls" || ext === "xlsx" || ext === "csv") return "excel";
  if (ext === "ppt" || ext === "pptx") return "ppt";
  if (ext === "txt") return "txt";
  if (["png", "jpg", "jpeg", "webp", "gif", "bmp", "svg"].includes(ext)) return "image";
  return raw || "other";
}

function viewDocument(d) {
  const title = getDocTitle(d);
  const url = resolveUrl(pickDocUrl(d) || pickDownloadUrl(d));
  const dl = resolveUrl(pickDownloadUrl(d) || pickDocUrl(d));
  const type = inferDocType(d);

  docModal.value = {
    open: true,
    doc: d,
    title,
    url,
    downloadUrl: dl,
    kind: type === "image" ? "image" : "iframe",
    note:
      !url
        ? "Your API did not return viewUrl/downloadUrl for this document."
        : type === "docs" || type === "excel" || type === "ppt"
        ? "If the preview does not render in iframe, use View (new tab) or Download."
        : "",
  };

  nextTick(() => {
    const el = docModalRef.value;
    if (!el) return;

    gsap.killTweensOf(el);
    gsap.fromTo(el, { y: 10, opacity: 0, scale: 0.985 }, { y: 0, opacity: 1, scale: 1, duration: 0.18, ease: "power3.out" });
  });
}

function closeDocModal(immediate = false) {
  const el = docModalRef.value;
  if (!el || immediate) {
    docModal.value.open = false;
    docModal.value.doc = null;
    docModal.value.url = "";
    docModal.value.downloadUrl = "";
    docModal.value.note = "";
    return;
  }

  gsap.killTweensOf(el);
  gsap.to(el, {
    y: 10,
    opacity: 0,
    scale: 0.985,
    duration: 0.14,
    ease: "power2.inOut",
    onComplete: () => {
      docModal.value.open = false;
      docModal.value.doc = null;
      docModal.value.url = "";
      docModal.value.downloadUrl = "";
      docModal.value.note = "";
    },
  });
}

function openDocInNewTab() {
  const url = docModal.value.url;
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

function downloadDocFromModal() {
  const url = docModal.value.downloadUrl || docModal.value.url;
  if (!url) return;

  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.download = docModal.value.title || "document";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/* Card/Row dot helpers (matching your DocumentViewer look) */
function typeDot(type) {
  const t = (type || "").toLowerCase();
  if (t === "pdf") return "dPdf";
  if (t === "docs") return "dDocs";
  if (t === "excel") return "dXls";
  if (t === "ppt") return "dPpt";
  if (t === "txt") return "dTxt";
  if (t === "image") return "dImg";
  return "dOther";
}

function typePill(type) {
  const t = (type || "").toLowerCase();
  if (t === "pdf") return "pPdf";
  if (t === "docs") return "pDocs";
  if (t === "excel") return "pXls";
  if (t === "ppt") return "pPpt";
  if (t === "txt") return "pTxt";
  if (t === "image") return "pImg";
  return "pOther";
}

/* Loading */
async function load() {
  loading.value = true;
  error.value = "";
  try {
    const [d, a, f] = await Promise.all([getJson(DOC_URL), getJson(ANN_URL), getJson(FORM_URL)]);

    const docList = normalizeList(d);
    const annList = normalizeList(a);
    const formList = normalizeList(f);

    // keep raw but ensure stable id/title fields exist for UI + modal
    docs.value = docList.map((x, i) => ({
      ...x,
      id: x?.id ?? x?._id ?? x?.documentId ?? i,
      title: x?.title ?? x?.name ?? x?.filename ?? x?.file_name,
    }));
    anns.value = annList;
    forms.value = formList;
  } catch (e) {
    error.value = e?.message || String(e);
  } finally {
    loading.value = false;
  }

  await nextTick();
  animateIn();
}

function refresh() {
  load();
}

/* GSAP animations */
function animateIn() {
  const root = bentoEl.value?.closest(".vdash") || document;
  const items = root.querySelectorAll(".js-reveal");

  gsap.killTweensOf(items);
  gsap.set(items, { opacity: 0, y: 14, filter: "blur(6px)" });

  gsap.to(items, {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.55,
    stagger: 0.06,
    ease: "power3.out",
  });
}

function btnHover(e, enter) {
  gsap.to(e.currentTarget, { y: enter ? -2 : 0, duration: 0.22, ease: "power2.out" });
}
function cardHover(e, enter) {
  gsap.to(e.currentTarget, { y: enter ? -2 : 0, duration: 0.18, ease: "power2.out" });
}
function rowHover(e, enter) {
  gsap.to(e.currentTarget, { x: enter ? 3 : 0, duration: 0.18, ease: "power2.out" });
}

/* ESC close modal */
function onKey(e) {
  if (e.key === "Escape") {
    if (docModal.value.open) closeDocModal();
  }
}

onMounted(() => {
  document.addEventListener("keydown", onKey);
  load();
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKey);
});
</script>

<style scoped>
/* ====== Base / Layout (full height + scroll INSIDE cards) ====== */
.vdash {
  --bg0: var(--bg0, #050914);
  --bg1: var(--bg1, #070e23);
  --txt: var(--txt, rgba(255, 255, 255, 0.92));
  --muted: var(--muted, rgba(255, 255, 255, 0.55));
  --glass: var(--glass, rgba(255, 255, 255, 0.035));
  --glass2: var(--glass2, rgba(255, 255, 255, 0.02));

  color: var(--txt);
  padding: 14px 10px 18px;
  position: relative;

  /* ✅ fill viewport and allow grid to take remaining height */
  min-height: calc(100vh - 36px);
  display: flex;
  flex-direction: column;
  gap: 0;
}

.vdash::before {
  content: "";
  position: absolute;
  inset: -14px -10px -18px;
  pointer-events: none;
  opacity: 0.18;
  background: linear-gradient(to right, rgba(255, 255, 255, 0.06) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
  background-size: 46px 46px;
  mask-image: radial-gradient(circle at 30% 10%, black 0%, transparent 62%);
}

.topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
}

.headline .kicker {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  opacity: 0.85;
}
.kDot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.95);
  box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.12);
}
.title {
  margin: 8px 0 4px;
  font-size: 28px;
  line-height: 1.12;
  letter-spacing: -0.02em;
  font-weight: 950;
}
.subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}

.actions {
  display: inline-flex;
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
  font-weight: 900;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: background 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
  position: relative;
  z-index: 1;
}
.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(56, 189, 248, 0.22);
  box-shadow: 0 12px 30px rgba(56, 189, 248, 0.1);
}
.btn.primary {
  background: rgba(56, 189, 248, 0.16);
  border-color: rgba(56, 189, 248, 0.22);
}
.btnIcon {
  display: inline-block;
  opacity: 0.95;
}
.spin {
  animation: spin 0.9s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ====== Stats ====== */
.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
}

.statCard {
  border-radius: 18px;
  background: linear-gradient(180deg, var(--glass), var(--glass2));
  border: 1px solid rgba(255, 255, 255, 0.10);
  box-shadow: 0 16px 38px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(14px);
  padding: 14px;
  display: grid;
  grid-template-columns: 46px 1fr;
  gap: 12px;
  cursor: pointer;
  transition: border-color 180ms ease, box-shadow 180ms ease;
}
.statCard:hover {
  border-color: rgba(56, 189, 248, 0.20);
  box-shadow: 0 18px 42px rgba(56, 189, 248, 0.10);
}
.statIcon {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.statLabel {
  font-size: 13px;
  color: var(--muted);
  font-weight: 800;
}
.statValue {
  margin-top: 4px;
  font-size: 26px;
  font-weight: 950;
  letter-spacing: -0.02em;
}
.statHint {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 8px;
}
.pill {
  font-size: 12px;
  font-weight: 950;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(56, 189, 248, 0.22);
  background: rgba(56, 189, 248, 0.10);
  box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.06);
}
.muted {
  color: var(--muted);
}

/* ====== Bento grid (fills remaining height) ====== */
.bento {
  position: relative;
  z-index: 1;
  flex: 1 1 auto;
  min-height: 0;

  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-template-rows: repeat(6, minmax(0, 1fr)); /* ✅ fit perfectly */
  gap: 12px;
}

/* ====== Card base (flex column so body can scroll) ====== */
.card {
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.03));
  border: 1px solid rgba(255, 255, 255, 0.10);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.30);
  backdrop-filter: blur(14px);
  overflow: hidden;
  position: relative;

  display: flex;
  flex-direction: column;
  min-height: 0; /* ✅ important for internal scroll */
}
.card::before {
  content: "";
  position: absolute;
  inset: -1px;
  pointer-events: none;
  border-radius: 20px;
  background: radial-gradient(520px 260px at 20% 20%, rgba(56, 189, 248, 0.12), transparent 60%),
    radial-gradient(520px 260px at 80% 55%, rgba(99, 102, 241, 0.10), transparent 62%);
  opacity: 0.9;
}

.cardTop {
  position: relative;
  padding: 14px 14px 10px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  z-index: 1;
  flex: 0 0 auto;
}

.cardBody {
  position: relative;
  z-index: 1;
  flex: 1 1 auto;
  min-height: 0;
  padding: 0 12px 14px;

  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cardTitle {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.cardIcon {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.t1 {
  font-weight: 950;
  letter-spacing: -0.01em;
}
.t2 {
  margin-top: 2px;
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 56ch;
}
.cardActions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.ghost {
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.88);
  padding: 10px 10px;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 950;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: background 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}
.ghost:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(56, 189, 248, 0.18);
  box-shadow: 0 12px 28px rgba(56, 189, 248, 0.08);
}

/* Search */
.search {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 10px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(0, 0, 0, 0.14);
  min-width: min(360px, 48vw);
}
.search i {
  opacity: 0.85;
}
.search input {
  flex: 1;
  outline: none;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.92);
  font-size: 13px;
}
.search input::placeholder {
  color: rgba(255, 255, 255, 0.45);
}
.search .x {
  border: none;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.82);
  width: 28px;
  height: 28px;
  border-radius: 10px;
  cursor: pointer;
}

/* placements */
.card--docs {
  grid-column: 1 / span 8;
  grid-row: 1 / span 6;
}
.card--ann {
  grid-column: 9 / span 4;
  grid-row: 1 / span 3;
}
.card--forms {
  grid-column: 9 / span 4;
  grid-row: 4 / span 3;
}

/* shared scroll area */
.scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding-right: 2px;
}
.scroll::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
.scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.10);
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-radius: 999px;
}
.scroll::-webkit-scrollbar-track {
  background: transparent;
}

/* Documents list */
.tableHead {
  display: grid;
  grid-template-columns: 1fr 0.7fr 0.55fr;
  gap: 10px;
  padding: 10px 10px;
  margin: 0 2px 0;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.12);
  font-size: 12px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.72);
  flex: 0 0 auto;
}

.rows {
  display: grid;
  gap: 8px;
}

.row {
  display: grid;
  grid-template-columns: 1fr 0.7fr 0.55fr;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(0, 0, 0, 0.10);
}
.rowBtn {
  text-align: left;
  cursor: pointer;
  transition: background 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}
.rowBtn:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(56, 189, 248, 0.16);
  box-shadow: 0 14px 34px rgba(56, 189, 248, 0.07);
}
.cell {
  min-width: 0;
}
.titleCell {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.10);
}

/* dot colors like DocumentViewer */
.dPdf { background: rgba(255, 15, 55, 0.9); }
.dDocs { background: rgba(0, 123, 255, 0.95); }
.dXls { background: rgba(34, 197, 94, 0.95); }
.dPpt { background: rgba(255, 165, 0, 0.95); }
.dTxt { background: rgba(56, 189, 248, 0.95); }
.dImg { background: rgba(168, 85, 247, 0.9); }
.dOther { background: rgba(148, 163, 184, 0.85); }

.right {
  text-align: right;
}
.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Ann list */
.miniList {
  display: grid;
  gap: 8px;
}
.miniBtn {
  text-align: left;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(0, 0, 0, 0.10);
  border-radius: 14px;
  padding: 10px 10px;
  cursor: pointer;
  transition: background 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}
.miniBtn:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(56, 189, 248, 0.16);
  box-shadow: 0 14px 34px rgba(56, 189, 248, 0.07);
}
.miniTitle {
  font-weight: 950;
  font-size: 13px;
  margin-bottom: 6px;
}
.miniSub {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 12px;
}
.chip {
  font-size: 11px;
  font-weight: 950;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.80);
}

/* Forms tiles */
.miniGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.formTile {
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(0, 0, 0, 0.10);
  border-radius: 16px;
  padding: 12px;
}
.tileBtn {
  text-align: left;
  cursor: pointer;
  transition: background 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}
.tileBtn:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(56, 189, 248, 0.16);
  box-shadow: 0 14px 34px rgba(56, 189, 248, 0.07);
}
.tileTop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}
.tileName {
  font-weight: 950;
  font-size: 13px;
  min-width: 0;
}
.badge {
  font-size: 11px;
  font-weight: 950;
  padding: 5px 8px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.78);
  white-space: nowrap;
}
.badge.on {
  border-color: rgba(56, 189, 248, 0.20);
  background: rgba(56, 189, 248, 0.10);
  color: rgba(255, 255, 255, 0.90);
  box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.06);
}
.tileSub {
  font-size: 12px;
}

/* Skeleton */
.sk {
  display: inline-block;
  height: 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.10);
  position: relative;
  overflow: hidden;
}
.sk::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.14), transparent);
  animation: shimmer 1.1s infinite;
}
.sk-w80 { width: 90px; height: 18px; }
.sk-w70 { width: 70%; }
.sk-w60 { width: 60%; }
.sk-w45 { width: 45%; }
.sk-w35 { width: 35%; }
.sk-w30 { width: 30%; }
.sk-w20 { width: 20%; }
.skRow { border-color: rgba(255, 255, 255, 0.05); }
@keyframes shimmer { 100% { transform: translateX(100%); } }

/* Empty */
.empty {
  margin-top: 10px;
  padding: 14px;
  border-radius: 16px;
  border: 1px dashed rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.02);
  text-align: center;
}
.empty.small { margin-top: 8px; }
.emptyTitle { font-weight: 950; margin-bottom: 4px; }
.emptySub { color: var(--muted); font-size: 12px; }

/* Error toast */
.toastErr {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 9999;
  padding: 12px 12px;
  border-radius: 16px;
  background: rgba(8, 12, 28, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.10);
  backdrop-filter: blur(14px);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.38);
  max-width: min(520px, 92vw);
}
.toastErrTitle {
  font-weight: 950;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}
.toastErrMsg {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
  white-space: pre-wrap;
  margin-bottom: 10px;
}
.toastErrBtn {
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.90);
  padding: 9px 10px;
  border-radius: 12px;
  font-weight: 900;
  cursor: pointer;
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

/* ====== ✅ Modal Overlay (DocumentViewer style) ====== */
.modalOverlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  z-index: 9998;
  display: grid;
  place-items: center;
  padding: 16px;
}

.modal {
  width: min(980px, 100%);
  border-radius: 18px;
  background: rgba(10, 12, 22, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
  overflow: hidden;
  max-height: min(86vh, 940px);
  display: flex;
  flex-direction: column;
}

.modalHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 14px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  gap: 12px;
}

.modalTitle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 950;
  min-width: 0;
}

.modalHeadActions {
  display: inline-flex;
  gap: 10px;
  flex-shrink: 0;
}

.iconBtn {
  width: 34px;
  height: 34px;
  border: none;
  cursor: pointer;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.86);
  transition: transform 160ms ease, filter 160ms ease, background 160ms ease;
}
.iconBtn:hover {
  transform: translateY(-1px);
  filter: brightness(1.06);
  background: rgba(255, 255, 255, 0.07);
}
.iconBtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.modalBody {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  flex: 1 1 auto;
}

.docMetaRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.pill2 {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 7px 10px;
  border-radius: 999px;
  font-weight: 950;
  font-size: 11px;
  letter-spacing: 0.4px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
}
.pPdf { background: rgba(255, 165, 0, 0.14); border-color: rgba(255, 165, 0, 0.22); }
.pDocs { background: rgba(56, 189, 248, 0.14); border-color: rgba(56, 189, 248, 0.22); }
.pXls { background: rgba(34, 197, 94, 0.14); border-color: rgba(34, 197, 94, 0.22); }
.pPpt { background: rgba(244, 63, 94, 0.12); border-color: rgba(244, 63, 94, 0.2); }
.pTxt { background: rgba(148, 163, 184, 0.12); border-color: rgba(148, 163, 184, 0.2); }
.pImg { background: rgba(168, 85, 247, 0.12); border-color: rgba(168, 85, 247, 0.2); }
.pOther { background: rgba(168, 85, 247, 0.12); border-color: rgba(168, 85, 247, 0.2); }

.previewWrap {
  flex: 1 1 auto;
  min-height: 0;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

.previewFrame {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.previewImg {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  background: rgba(0, 0, 0, 0.2);
}

.previewEmpty {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  gap: 10px;
  padding: 18px;
  font-weight: 900;
  opacity: 0.78;
}

.modalFoot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.note {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  font-weight: 850;
  background: rgba(56, 189, 248, 0.10);
  border: 1px solid rgba(56, 189, 248, 0.16);
  color: rgba(255, 255, 255, 0.86);
}

/* ====== Responsive ====== */
@media (max-width: 1200px) {
  .search { min-width: min(280px, 42vw); }
  .bento {
    grid-template-columns: repeat(12, minmax(0, 1fr));
    grid-template-rows: repeat(8, minmax(0, 1fr));
  }
  .card--docs { grid-column: 1 / span 12; grid-row: 1 / span 4; }
  .card--ann { grid-column: 1 / span 6; grid-row: 5 / span 2; }
  .card--forms { grid-column: 7 / span 6; grid-row: 5 / span 2; }
}

@media (max-width: 880px) {
  .stats { grid-template-columns: 1fr; }

  .bento {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    gap: 12px;
  }
  .card--docs, .card--ann, .card--forms { grid-column: auto; grid-row: auto; }

  .tableHead, .row { grid-template-columns: 1fr 0.55fr; }
  .hideSm { display: none; }

  .search { min-width: 52vw; }
}
</style>
