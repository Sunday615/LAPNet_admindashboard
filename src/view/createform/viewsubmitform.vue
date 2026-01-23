<template>
  <div class="afs">
    <!-- Header -->
    <header class="afsHeader">
      <div class="afsTitle">
        <div class="title">ຟອມທີ່ສົ່ງແລ້ວ (Form Submissions)</div>
        <div class="sub">
          Admin preview answers + uploaded files
          <span class="dot">•</span>
          Showing <b>{{ items.length }}</b> items
        </div>
      </div>

      <div class="afsTools">
        <div class="field">
          <div class="label">Template ID</div>
          <input
            v-model.trim="filters.templateId"
            class="input"
            placeholder="templateId..."
            @keydown.enter="reload(true)"
          />
        </div>

        <div class="field">
          <div class="label">Email</div>
          <input v-model.trim="filters.email" class="input" placeholder="email..." @keydown.enter="reload(true)" />
        </div>

        <button
          class="btn btnPrimary"
          type="button"
          :disabled="loadingList"
          @mouseenter="btnHover($event, true)"
          @mouseleave="btnHover($event, false)"
          @click="reload(true)"
        >
          <i class="fa-solid fa-magnifying-glass" />
          <span>{{ loadingList ? "Loading..." : "Search" }}</span>
        </button>

        <button
          class="btn btnGhost"
          type="button"
          :disabled="loadingList"
          @mouseenter="btnHover($event, true)"
          @mouseleave="btnHover($event, false)"
          @click="resetFilters"
        >
          <i class="fa-solid fa-rotate-left" />
          <span>Reset</span>
        </button>
      </div>
    </header>

    <!-- Body -->
    <main class="afsGrid">
      <!-- Left: list -->
      <section class="card listCard" ref="listRef">
        <div class="cardHead">
          <div class="headLeft">
            <div class="headTitle">
              <i class="fa-solid fa-list-check" />
              <span>Submissions</span>
            </div>
            <div class="headSub muted">Click to preview (loads detail + files + template)</div>
          </div>

          <div class="headRight">
            <button
              class="btn btnGhost"
              type="button"
              :disabled="loadingList || offset === 0"
              @mouseenter="btnHover($event, true)"
              @mouseleave="btnHover($event, false)"
              @click="prevPage"
            >
              <i class="fa-solid fa-chevron-left" />
              Prev
            </button>

            <button
              class="btn btnGhost"
              type="button"
              :disabled="loadingList || items.length < limit"
              @mouseenter="btnHover($event, true)"
              @mouseleave="btnHover($event, false)"
              @click="nextPage"
            >
              Next
              <i class="fa-solid fa-chevron-right" />
            </button>
          </div>
        </div>

        <div class="cardBody">
          <div v-if="errorList" class="alert alertErr">
            <i class="fa-solid fa-triangle-exclamation" />
            <span>{{ errorList }}</span>
          </div>

          <div v-if="loadingList && !items.length" class="skeleton">
            <div class="skRow" v-for="i in 9" :key="i" />
          </div>

          <div v-else class="rows">
            <button
              v-for="s in items"
              :key="s.id"
              class="afsRow"
              :class="{ active: selectedId === s.id }"
              @click="selectRow(s)"
              @mouseenter="rowHover($event, true)"
              @mouseleave="rowHover($event, false)"
            >
              <div class="rowTop">
                <div class="rowTitle">
                  <span class="id">#{{ s.id }}</span>
                  <span class="pill">{{ s.templateId || "—" }}</span>
                </div>
                <div class="rowTime">{{ fmtDate(s.submittedAt || s.createdAt) }}</div>
              </div>

              <div class="rowBottom">
                <div class="rowEmail">
                  <i class="fa-solid fa-envelope" />
                  <span class="ellipsis" :title="s.email || ''">{{ s.email || "— no email —" }}</span>
                </div>

                <div class="rowMeta">
                  <span class="muted">
                    <i class="fa-solid fa-circle-info" />
                    {{ s.sourceFormId ? `source: ${s.sourceFormId}` : "source: —" }}
                  </span>
                </div>
              </div>
            </button>

            <div v-if="!items.length && !loadingList" class="empty">
              <div class="emptyIcon"><i class="fa-regular fa-folder-open" /></div>
              <div class="emptyTitle">No submissions found</div>
              <div class="emptySub muted">Try changing filters.</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Right: preview -->
      <section class="card previewCard" ref="previewRef">
        <div class="cardHead">
          <div class="headLeft">
            <div class="headTitle">
              <i class="fa-solid fa-eye" />
              <span>Preview</span>
            </div>

            <div class="headSub muted">
              <template v-if="selectedId">
                Submission #{{ selectedId }}
                <span class="dot">•</span>
                {{ loadingDetail ? "Loading detail..." : fmtDate(selected?.submittedAt || selected?.createdAt) }}
              </template>
              <template v-else> Select an item from the left </template>
            </div>
          </div>

          <div class="headRight" v-if="selectedId">
            <!-- mode switch -->
            <div class="modeTabs">
              <button
                class="tabBtn"
                type="button"
                :class="{ on: viewMode === 'preview' }"
                @click="viewMode = 'preview'"
                @mouseenter="btnHover($event, true)"
                @mouseleave="btnHover($event, false)"
              >
                <i class="fa-solid fa-eye" />
                Preview
              </button>
              <button
                class="tabBtn"
                type="button"
                :class="{ on: viewMode === 'raw' }"
                @click="viewMode = 'raw'"
                @mouseenter="btnHover($event, true)"
                @mouseleave="btnHover($event, false)"
              >
                <i class="fa-solid fa-code" />
                Raw
              </button>
            </div>

            <button
              class="btn btnGhost"
              type="button"
              :disabled="loadingDetail"
              @mouseenter="btnHover($event, true)"
              @mouseleave="btnHover($event, false)"
              @click="copyJson"
            >
              <i class="fa-regular fa-copy" />
              Copy JSON
            </button>

            <button
              class="btn btnGhost"
              type="button"
              :disabled="loadingDetail"
              @mouseenter="btnHover($event, true)"
              @mouseleave="btnHover($event, false)"
              @click="clearSelection"
            >
              <i class="fa-solid fa-xmark" />
              Clear
            </button>
          </div>
        </div>

        <div class="cardBody">
          <div v-if="!selectedId" class="empty">
            <div class="emptyIcon"><i class="fa-regular fa-hand-pointer" /></div>
            <div class="emptyTitle">Choose a submission</div>
            <div class="emptySub muted">Click any row on the left to load preview.</div>
          </div>

          <div v-else class="previewInner">
            <div v-if="errorDetail" class="alert alertErr">
              <i class="fa-solid fa-triangle-exclamation" />
              <span>{{ errorDetail }}</span>
            </div>

            <!-- Summary -->
            <div class="summary">
              <div class="kv">
                <div class="k muted">Template</div>
                <div class="v">{{ selected?.templateId || "—" }}</div>
              </div>
              <div class="kv">
                <div class="k muted">Email</div>
                <div class="v">{{ selected?.email || selected?.answers?.__email || "—" }}</div>
              </div>
              <div class="kv">
                <div class="k muted">IP</div>
                <div class="v">{{ selected?.ip || "—" }}</div>
              </div>
              <div class="kv wide">
                <div class="k muted">User Agent</div>
                <div class="v ellipsis" :title="selected?.userAgent || ''">{{ selected?.userAgent || "—" }}</div>
              </div>
            </div>

            <!-- =========================
                 PREVIEW MODE (template-based)
            ========================== -->
            <div v-if="viewMode === 'preview'" class="section">
              <div class="secTitle">
                <i class="fa-solid fa-file-lines" />
                <span>Template Preview</span>

                <span class="secHint muted" v-if="templateQuestions.length">
                  {{ templateQuestions.length }} questions
                </span>
              </div>

              <div v-if="loadingDetail || loadingTpl" class="skeleton">
                <div class="skRow" v-for="i in 6" :key="i" />
              </div>

              <div v-else>
                <div v-if="errorTpl" class="alert alertErr" style="margin-bottom: 10px">
                  <i class="fa-solid fa-triangle-exclamation" />
                  <span>{{ errorTpl }}</span>
                </div>

                <!-- header from template meta -->
                <div v-if="template?.payload?.meta" class="previewHeaderCard">
                  <div class="phTop">
                    <div class="phTitle">
                      <i class="fa-solid fa-layer-group" />
                      <span v-html="renderSafeHtml(template?.payload?.meta?.title || 'Untitled form')"></span>
                    </div>
                    <div class="phMeta">
                      <span class="pillSoft">
                        templateId: <b>{{ selected?.templateId || "—" }}</b>
                      </span>
                      <span class="pillSoft" v-if="selected?.sourceFormId">
                        source: <b>{{ selected?.sourceFormId }}</b>
                      </span>
                    </div>
                  </div>

                  <div v-if="template?.payload?.meta?.description" class="phDesc">
                    {{ template.payload.meta.description }}
                  </div>

                  <div class="phFlags">
                    <span class="chipGhost">
                      <i class="fa-solid fa-envelope" />
                      Collect email: {{ template.payload.meta.collectEmail ? "ON" : "OFF" }}
                    </span>
                    <span class="chipGhost">
                      <i class="fa-solid fa-rotate" />
                      Edit after submit: {{ template.payload.meta.allowEditAfterSubmit ? "ON" : "OFF" }}
                    </span>
                  </div>

                  <div v-if="template.payload.meta.collectEmail" class="emailPreviewRead">
                    <div class="emailLabel">
                      <i class="fa-solid fa-envelope" />
                      <span>Email</span>
                    </div>
                    <div class="emailValue">{{ selected?.email || selected?.answers?.__email || "—" }}</div>
                  </div>
                </div>

                <!-- questions -->
                <div v-if="templateQuestions.length" class="previewList">
                  <div v-for="(qq, idx) in templateQuestions" :key="qq.id" class="previewQ">
                    <div class="previewQTop">
                      <div class="previewQTitle">
                        <span class="qNum">{{ idx + 1 }}.</span>
                        <span v-html="renderSafeHtml(qq.title || 'Untitled question')"></span>
                        <span v-if="qq.required" class="req">*</span>
                      </div>

                      <div class="previewQRight">
                        <span class="pill ghostPill">{{ qq.type }}</span>
                        <span class="ansStatus" :class="{ ok: hasAnswer(qq.id), empty: !hasAnswer(qq.id) }">
                          <i class="fa-solid" :class="hasAnswer(qq.id) ? 'fa-circle-check' : 'fa-circle-minus'" />
                          {{ hasAnswer(qq.id) ? "Answered" : "No answer" }}
                        </span>
                      </div>
                    </div>

                    <div v-if="qq.description" class="previewQDesc">{{ qq.description }}</div>

                    <!-- images preview -->
                    <div v-if="(qq.images || []).length" class="previewImgs">
                      <img
                        v-for="(im, ii) in (qq.images || [])"
                        :key="im.id || `${qq.id}_img_${ii}`"
                        class="previewImg"
                        :src="resolveImgSrc(im.src)"
                        loading="lazy"
                        alt=""
                      />
                    </div>

                    <!-- answer renderer -->
                    <div class="ansCard" :class="{ isEmpty: !hasAnswer(qq.id) }">
                      <div class="ansCardHead">
                        <div class="ansLabel">
                          <i class="fa-solid fa-clipboard-check" />
                          <span>Answer</span>
                        </div>

                        <button
                          v-if="isLongText(getAnswer(qq.id))"
                          type="button"
                          class="ansToggle"
                          @click="toggleExpand(qq.id)"
                        >
                          {{ expanded[qq.id] ? "Show less" : "Show more" }}
                          <i class="fa-solid" :class="expanded[qq.id] ? 'fa-chevron-up' : 'fa-chevron-down'" />
                        </button>
                      </div>

                      <div class="ansCardBody">
                        <!-- short -->
                        <template v-if="qq.type === 'short'">
                          <div class="ansText">{{ asDisplay(getAnswer(qq.id)) }}</div>
                        </template>

                        <!-- long -->
                        <template v-else-if="qq.type === 'long'">
                          <div class="ansText preWrap">
                            {{
                              expanded[qq.id]
                                ? asDisplay(getAnswer(qq.id))
                                : truncateText(asDisplay(getAnswer(qq.id)), 260)
                            }}
                          </div>
                        </template>

                        <!-- option / dropdown -->
                        <template v-else-if="qq.type === 'option' || qq.type === 'dropdown'">
                          <div class="ansPillRow">
                            <span class="ansPill">{{ asDisplay(getAnswer(qq.id)) }}</span>
                          </div>
                        </template>

                        <!-- checkbox -->
                        <template v-else-if="qq.type === 'checkbox'">
                          <div class="ansPillRow">
                            <template v-if="asArray(getAnswer(qq.id)).length">
                              <span
                                v-for="(x, i) in asArray(getAnswer(qq.id))"
                                :key="`${qq.id}_cb_${i}`"
                                class="ansPill"
                              >
                                {{ asPlainText(x) || x }}
                              </span>
                            </template>
                            <span v-else class="ansMuted">—</span>
                          </div>
                        </template>

                        <!-- date -->
                        <template v-else-if="qq.type === 'date'">
                          <div class="ansPillRow">
                            <span class="ansPill">{{ asDisplay(getAnswer(qq.id)) }}</span>
                          </div>
                        </template>

                        <!-- time -->
                        <template v-else-if="qq.type === 'time'">
                          <div class="ansPillRow">
                            <span class="ansPill">{{ asDisplay(getAnswer(qq.id)) }}</span>
                          </div>
                        </template>

                        <!-- score -->
                        <template v-else-if="qq.type === 'score'">
                          <div class="scoreRead">
                            <div class="scoreIcons">
                              <span
                                v-for="n in Number(qq.scoreMax || 5)"
                                :key="`${qq.id}_sc_${n}`"
                                class="scoreIcon"
                                :class="{ on: Number(getAnswer(qq.id) || 0) >= n }"
                                :title="String(n)"
                              >
                                <i class="fa-solid" :class="scoreFaIcon(qq.scoreIcon)"></i>
                              </span>
                            </div>
                            <span class="scoreVal">{{ Number(getAnswer(qq.id) || 0) || "—" }}</span>
                          </div>
                        </template>

                        <!-- table -->
                        <template v-else-if="qq.type === 'table_option' || qq.type === 'table_checkbox'">
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
                                  <td
                                    v-for="(c, ci) in (qq.gridCols || [])"
                                    :key="`${qq.id}_${ri}_${ci}`"
                                    class="cell"
                                  >
                                    <i class="fa-solid fa-check" v-if="isTableChecked(qq, ri, ci)" style="opacity: 0.9" />
                                    <span v-else style="opacity: 0.22">•</span>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </template>

                        <!-- upload -->
                        <template v-else-if="qq.type === 'upload'">
                          <div class="fileGrid fileGridCompact" v-if="filesByQuestion(qq.id).length">
                            <a
                              v-for="f in filesByQuestion(qq.id)"
                              :key="f.id"
                              class="fileCard"
                              :href="fileUrl(f.storagePath)"
                              target="_blank"
                              rel="noreferrer"
                              @mouseenter="fileHover($event, true)"
                              @mouseleave="fileHover($event, false)"
                            >
                              <div class="fileTop">
                                <div class="thumb" v-if="isImage(f.mimeType)">
                                  <img :src="fileUrl(f.storagePath)" alt="" />
                                </div>
                                <div class="thumb" v-else>
                                  <i class="fa-regular fa-file" />
                                </div>

                                <div class="fileInfo">
                                  <div class="fileName ellipsis" :title="f.originalName || f.storagePath">
                                    {{ f.originalName || f.storagePath }}
                                  </div>
                                  <div class="fileMeta muted">
                                    <span class="pillSoft">{{ f.mimeType || "file" }}</span>
                                    <span class="dot">•</span>
                                    <span>{{ humanBytes(f.sizeBytes || 0) }}</span>
                                  </div>
                                </div>
                              </div>

                              <div class="fileBottom muted">
                                q: <b>{{ f.questionId }}</b>
                                <span class="dot">•</span>
                                field: {{ f.fieldName }}
                              </div>
                            </a>
                          </div>
                          <div v-else class="ansMuted">No files.</div>
                        </template>

                        <!-- fallback -->
                        <template v-else>
                          <details class="json">
                            <summary>View raw value</summary>
                            <pre class="pre">{{ stringify(getAnswer(qq.id)) }}</pre>
                          </details>
                        </template>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else class="emptySmall muted">
                  Template not found (or has no questions). You can switch to <b>Raw</b> mode.
                </div>

                <!-- extra keys not in template -->
                <div v-if="extraAnswerEntries.length" class="section" style="margin-top: 12px">
                  <div class="secTitle">
                    <i class="fa-solid fa-circle-info" />
                    <span>Other fields (not in template)</span>
                    <span class="secHint muted">{{ extraAnswerEntries.length }}</span>
                  </div>

                  <div class="qaList">
                    <div v-for="[k, v] in extraAnswerEntries" :key="k" class="qa">
                      <div class="q">{{ prettyKey(k) }}</div>
                      <div class="a">
                        <template v-if="isPrimitive(v)">
                          <template v-if="isUrl(String(v))">
                            <a class="link" :href="String(v)" target="_blank" rel="noreferrer">{{ v }}</a>
                          </template>
                          <template v-else>
                            <span class="rawValue">{{ v === "" ? "—" : v }}</span>
                          </template>
                        </template>

                        <template v-else>
                          <details class="json">
                            <summary>View JSON</summary>
                            <pre class="pre">{{ stringify(v) }}</pre>
                          </details>
                        </template>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- =========================
                 RAW MODE (your old Answers UI)
            ========================== -->
            <div v-else class="section">
              <div class="secTitle">
                <i class="fa-solid fa-clipboard-list" />
                <span>Answers (Raw)</span>
              </div>

              <div v-if="loadingDetail" class="skeleton">
                <div class="skRow" v-for="i in 7" :key="i" />
              </div>

              <div v-else-if="answerEntries.length" class="qaList">
                <div v-for="[k, v] in answerEntries" :key="k" class="qa">
                  <div class="q">{{ prettyKey(k) }}</div>

                  <div class="a">
                    <template v-if="isPrimitive(v)">
                      <template v-if="isUrl(String(v))">
                        <a class="link" :href="String(v)" target="_blank" rel="noreferrer">
                          {{ v }}
                        </a>
                      </template>
                      <template v-else>
                        <pre v-if="typeof v === 'string' && v.length > 140" class="rawPre">{{ v }}</pre>
                        <span v-else class="rawValue">{{ v === "" ? "—" : v }}</span>
                      </template>
                    </template>

                    <template v-else>
                      <details class="json">
                        <summary>View JSON</summary>
                        <pre class="pre">{{ stringify(v) }}</pre>
                      </details>
                    </template>
                  </div>
                </div>
              </div>

              <div v-else class="emptySmall muted">No answers.</div>
            </div>

            <!-- Files (always show) -->
            <div class="section">
              <div class="secTitle">
                <i class="fa-solid fa-paperclip" />
                <span>Files</span>
                <span class="secHint muted">{{ files.length }}</span>
              </div>

              <div v-if="loadingDetail" class="skeleton">
                <div class="skRow" v-for="i in 4" :key="i" />
              </div>

              <div v-else-if="files.length" class="fileGrid">
                <a
                  v-for="f in files"
                  :key="f.id"
                  class="fileCard"
                  :href="fileUrl(f.storagePath)"
                  target="_blank"
                  rel="noreferrer"
                  @mouseenter="fileHover($event, true)"
                  @mouseleave="fileHover($event, false)"
                >
                  <div class="fileTop">
                    <div class="thumb" v-if="isImage(f.mimeType)">
                      <img :src="fileUrl(f.storagePath)" alt="" />
                    </div>
                    <div class="thumb" v-else>
                      <i class="fa-regular fa-file" />
                    </div>

                    <div class="fileInfo">
                      <div class="fileName ellipsis" :title="f.originalName || f.storagePath">
                        {{ f.originalName || f.storagePath }}
                      </div>
                      <div class="fileMeta muted">
                        <span class="pillSoft">{{ f.mimeType || "file" }}</span>
                        <span class="dot">•</span>
                        <span>{{ humanBytes(f.sizeBytes || 0) }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="fileBottom muted">
                    q: <b>{{ f.questionId }}</b>
                    <span class="dot">•</span>
                    field: {{ f.fieldName }}
                  </div>
                </a>
              </div>

              <div v-else class="emptySmall muted">No files.</div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <transition name="toast">
      <div v-if="toast" class="toastMini">
        <i class="fa-regular fa-circle-check" />
        <span>{{ toast }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from "vue";
import gsap from "gsap";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const LIST_API = `${API_BASE}/api/form-submissions`;

/**
 * ✅ template API (adjust if your backend differs)
 * tries:
 *  - GET /api/form-templates/:templateId
 *  - GET /api/form-templates/by-source/:sourceFormId
 *  - GET /api/form-templates (list) then find by id / sourceFormId
 */
const TPL_API = `${API_BASE}/api/form-templates`;

const listRef = ref(null);
const previewRef = ref(null);

const items = ref([]);
const loadingList = ref(false);
const errorList = ref("");

const selectedId = ref(null);
const selected = ref(null);
const files = ref([]);
const loadingDetail = ref(false);
const errorDetail = ref("");

const viewMode = ref("preview"); // preview | raw

// template state
const template = ref(null);
const loadingTpl = ref(false);
const errorTpl = ref("");

// ✅ NEW: per-question expand state (for long answers)
const expanded = reactive({}); // { [qid]: boolean }

// small cache for templates (avoid re-fetching same id)
const tplCache = new Map(); // key -> template item
let tplListCache = null;
let tplListCacheAt = 0;

const limit = ref(50);
const offset = ref(0);

const filters = reactive({
  templateId: "",
  email: "",
});

const toast = ref("");
let toastTimer = null;

function showToast(msg) {
  toast.value = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.value = ""), 1400);
}

function buildQuery() {
  const qs = new URLSearchParams();
  if (filters.templateId) qs.set("templateId", filters.templateId);
  if (filters.email) qs.set("email", filters.email);
  qs.set("limit", String(limit.value));
  qs.set("offset", String(offset.value));
  return qs.toString();
}

function safeParseAnswers(x) {
  try {
    if (x && typeof x === "object") return x;
    if (typeof x === "string") return JSON.parse(x);
  } catch {}
  return x;
}

/* =========================
   ✅ Template normalize
========================= */
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

  const payload = {
    meta: {
      title: String(meta.title ?? ""),
      description: String(meta.description ?? ""),
      collectEmail: !!meta.collectEmail,
      allowEditAfterSubmit: !!meta.allowEditAfterSubmit,
    },
    questions: qs.map((q, idx) => {
      const type = normalizeDraftType(q?.type);

      const base = {
        id: String(q?.id || `q_${idx}_${Date.now()}`),
        type,
        title: String(q?.title ?? ""),
        description: String(q?.description ?? ""),
        required: !!q?.required,

        images: Array.isArray(q?.images) ? q.images.map((im) => (typeof im === "string" ? { src: im } : im)) : [],
        options: Array.isArray(q?.options) ? q.options : [],

        scoreMax: Number(q?.scoreMax ?? (q?.score?.max ?? 5)),
        scoreIcon: String(q?.scoreIcon ?? (q?.score?.icon ?? "star")),

        gridRows: Array.isArray(q?.gridRows) ? q.gridRows : (Array.isArray(q?.table?.rows) ? q.table.rows : []),
        gridCols: Array.isArray(q?.gridCols) ? q.gridCols : (Array.isArray(q?.table?.cols) ? q.table.cols : []),
      };

      // support builder "table" shape
      if (q?.table && typeof q.table === "object") {
        const mode = q.table.mode === "checkbox" ? "table_checkbox" : "table_option";
        base.type = normalizeDraftType(mode);
      }

      if (needsOptions(base.type) && (!Array.isArray(base.options) || !base.options.length)) {
        base.options = ["Choice 1", "Choice 2"];
      }
      if (base.type === "table_option" || base.type === "table_checkbox") {
        if (!base.gridRows?.length) base.gridRows = ["Row 1", "Row 2"];
        if (!base.gridCols?.length) base.gridCols = ["Col 1", "Col 2"];
      }

      return base;
    }),
  };

  return payload;
}

/* =========================
   ✅ API calls
========================= */
async function fetchList() {
  loadingList.value = true;
  errorList.value = "";
  try {
    if (listAbort) listAbort.abort();
    listAbort = new AbortController();

    const res = await fetch(`${LIST_API}?${buildQuery()}`, {
      signal: listAbort.signal,
      headers: { Accept: "application/json" },
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) throw new Error(data?.message || `HTTP ${res.status}`);

    const arr = Array.isArray(data.items) ? data.items : [];
    items.value = arr.map((x) => ({
      ...x,
      answers: safeParseAnswers(x.answers),
    }));

    await nextTick();
    animateListIn();
  } catch (e) {
    if (e?.name === "AbortError") return;
    errorList.value = e?.message || "Fetch error";
  } finally {
    loadingList.value = false;
  }
}

async function fetchDetail(id) {
  loadingDetail.value = true;
  errorDetail.value = "";
  selected.value = null;
  files.value = [];

  // reset template state
  template.value = null;
  errorTpl.value = "";
  loadingTpl.value = false;

  try {
    if (detailAbort) detailAbort.abort();
    detailAbort = new AbortController();

    const res = await fetch(`${LIST_API}/${id}`, {
      signal: detailAbort.signal,
      headers: { Accept: "application/json" },
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) throw new Error(data?.message || `HTTP ${res.status}`);

    selected.value = {
      ...data.item,
      answers: safeParseAnswers(data.item?.answers),
    };
    files.value = Array.isArray(data.files) ? data.files : [];

    // ✅ reset expand map when change submission (avoid mixing)
    Object.keys(expanded).forEach((k) => delete expanded[k]);

    // ✅ load template for preview mode
    if (viewMode.value === "preview") {
      await fetchTemplateForSubmission(selected.value);
    } else {
      fetchTemplateForSubmission(selected.value).catch(() => {});
    }

    await nextTick();
    animatePreviewIn();
  } catch (e) {
    if (e?.name === "AbortError") return;
    errorDetail.value = e?.message || "Fetch detail error";
  } finally {
    loadingDetail.value = false;
  }
}

/* =========================
   ✅ Template fetch with fallback
========================= */
function tplKeyFromSubmission(s) {
  const tid = String(s?.templateId || "").trim();
  const sid = String(s?.sourceFormId || "").trim();
  if (tid) return `id:${tid}`;
  if (sid) return `src:${sid}`;
  return "";
}

async function apiGetJson(url) {
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  const data = await r.json().catch(() => null);
  if (!r.ok || !data?.ok) throw new Error(data?.message || `HTTP ${r.status}`);
  return data;
}

async function fetchTemplateForSubmission(s) {
  const tid = String(s?.templateId || "").trim();
  const sid = String(s?.sourceFormId || "").trim();
  const key = tplKeyFromSubmission(s);

  if (!key) {
    template.value = null;
    errorTpl.value = "Missing templateId/sourceFormId in submission.";
    return;
  }

  if (tplCache.has(key)) {
    template.value = tplCache.get(key);
    errorTpl.value = "";
    return;
  }

  loadingTpl.value = true;
  errorTpl.value = "";

  try {
    let item = null;

    // 1) try by templateId
    if (tid) {
      try {
        const data = await apiGetJson(`${TPL_API}/${encodeURIComponent(tid)}`);
        item = data?.item || null;
      } catch {}
    }

    // 2) try by sourceFormId
    if (!item && sid) {
      try {
        const data = await apiGetJson(`${TPL_API}/by-source/${encodeURIComponent(sid)}`);
        item = data?.item || null;
      } catch {}
    }

    // 3) fallback: list all then find client-side (cached 2 minutes)
    if (!item) {
      const now = Date.now();
      if (!tplListCache || now - tplListCacheAt > 120000) {
        const data = await apiGetJson(`${TPL_API}`);
        tplListCache = Array.isArray(data.items) ? data.items : [];
        tplListCacheAt = now;
      }

      item =
        tplListCache.find((t) => String(t?.id ?? "") === tid) ||
        tplListCache.find((t) => String(t?.sourceFormId ?? t?.source_form_id ?? "") === sid) ||
        null;
    }

    if (!item) throw new Error("Template not found for this submission.");

    const payloadRaw = typeof item.payload === "string" ? safeJsonParse(item.payload) : item.payload || {};
    const payload = normalizePayload(payloadRaw);

    const normalized = {
      ...item,
      sourceFormId: item.sourceFormId ?? item.source_form_id ?? null,
      payload,
    };

    template.value = normalized;
    tplCache.set(key, normalized);
    errorTpl.value = "";
  } catch (e) {
    template.value = null;
    errorTpl.value = e?.message || "Load template failed";
  } finally {
    loadingTpl.value = false;
  }
}

/* =========================
   ✅ Paging / selection
========================= */
function reload(resetPage = false) {
  if (resetPage) offset.value = 0;
  fetchList();
}

function resetFilters() {
  filters.templateId = "";
  filters.email = "";
  offset.value = 0;
  fetchList();
}

function nextPage() {
  offset.value += limit.value;
  fetchList();
}

function prevPage() {
  offset.value = Math.max(0, offset.value - limit.value);
  fetchList();
}

function selectRow(s) {
  selectedId.value = s.id;
  viewMode.value = "preview";
  fetchDetail(s.id);
}

function clearSelection() {
  selectedId.value = null;
  selected.value = null;
  files.value = [];
  errorDetail.value = "";
  template.value = null;
  errorTpl.value = "";
  loadingTpl.value = false;
  Object.keys(expanded).forEach((k) => delete expanded[k]);
}

// ------- computed -------
const answerEntries = computed(() => {
  const a = selected.value?.answers;
  if (!a || typeof a !== "object") return [];
  return Object.entries(a).filter(([k]) => k !== "__email");
});

const templateQuestions = computed(() => {
  const qs = template.value?.payload?.questions;
  return Array.isArray(qs) ? qs : [];
});

const extraAnswerEntries = computed(() => {
  const a = selected.value?.answers;
  if (!a || typeof a !== "object") return [];
  const known = new Set(templateQuestions.value.map((q) => String(q?.id ?? "")));
  return Object.entries(a)
    .filter(([k]) => k !== "__email")
    .filter(([k]) => !known.has(String(k)));
});

// ------- answer helpers -------
function getAnswer(qid) {
  const a = selected.value?.answers;
  if (!a || typeof a !== "object") return null;
  const k = String(qid ?? "");
  return a[k];
}

function asArray(v) {
  if (Array.isArray(v)) return v;
  if (v == null) return [];
  if (typeof v === "string" && v.includes(",")) {
    return v
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [v];
}

function asDisplay(v) {
  if (v == null) return "—";
  if (typeof v === "string") return v.trim() ? v : "—";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function filesByQuestion(qid) {
  const k = String(qid ?? "");
  return (files.value || []).filter((f) => String(f?.questionId ?? "") === k);
}

/* ✅ NEW: answer status + long text helpers */
function isEmptyAnswer(v) {
  if (v == null) return true;
  if (typeof v === "string") return !v.trim();
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object") return Object.keys(v).length === 0;
  return false;
}
function hasAnswer(qid) {
  return !isEmptyAnswer(getAnswer(qid));
}
function isLongText(v, n = 260) {
  return typeof v === "string" && v.length > n;
}
function truncateText(s, n = 260) {
  const txt = String(s ?? "");
  if (txt.length <= n) return txt;
  return txt.slice(0, n).trimEnd() + "…";
}
function toggleExpand(qid) {
  const k = String(qid ?? "");
  expanded[k] = !expanded[k];
}

/* table answers support */
function isTableChecked(qq, ri, ci) {
  const v = getAnswer(qq.id);
  if (!v || typeof v !== "object") return false;

  const rowKeyA = String(ri);
  const rowName = String((qq.gridRows || [])[ri] ?? "");
  const rowKeyB = rowName;

  const val = v[rowKeyA] ?? v[rowKeyB];
  if (qq.type === "table_checkbox") {
    if (Array.isArray(val)) return val.map(String).includes(String(ci));
    return false;
  }
  if (typeof val === "number") return val === ci;
  if (typeof val === "string") return String(val) === String(ci);
  return false;
}

/* =========================
   ✅ HTML/link helpers (safe-ish render)
========================= */
function escapeHtmlText(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

function hasAnchor(s) {
  return /<a\b[^>]*href\s*=\s*['"][^'"]+['"][^>]*>/i.test(String(s ?? ""));
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

function scoreFaIcon(icon) {
  const s = String(icon || "star");
  if (s === "heart") return "fa-heart";
  if (s === "like") return "fa-thumbs-up";
  return "fa-star";
}

// ------- helpers -------
function stringify(v) {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function isPrimitive(v) {
  return v == null || ["string", "number", "boolean"].includes(typeof v);
}

function prettyKey(k) {
  return String(k).replace(/^file_/, "File: ").replace(/_/g, " ").trim();
}

function isUrl(s) {
  return /^https?:\/\/\S+/i.test(s);
}

function fmtDate(x) {
  if (!x) return "—";
  const d = new Date(x);
  const n = d.getTime();
  if (!Number.isFinite(n)) return String(x);
  return d.toLocaleString();
}

function humanBytes(n) {
  const num = Number(n || 0);
  if (!Number.isFinite(num) || num <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = num;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function fileUrl(storagePath) {
  if (!storagePath) return "#";
  return `${API_BASE}/${String(storagePath).replace(/^\/+/, "")}`;
}

function resolveImgSrc(src) {
  const s = String(src || "").trim();
  if (!s) return "";
  if (/^data:/i.test(s) || /^blob:/i.test(s) || /^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/")) return `${API_BASE}${s}`;
  return s;
}

function isImage(mime) {
  return /^image\//i.test(String(mime || ""));
}

async function copyJson() {
  try {
    const payload = { item: selected.value, files: files.value, template: template.value };
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    showToast("Copied!");
  } catch {
    showToast("Copy failed");
  }
}

// ------- GSAP -------
function btnHover(e, enter) {
  gsap.to(e.currentTarget, { y: enter ? -2 : 0, duration: 0.22, ease: "power2.out" });
}

function rowHover(e, enter) {
  const el = e.currentTarget;
  if (el.classList?.contains("active")) return;
  gsap.to(el, { x: enter ? 3 : 0, duration: 0.18, ease: "power2.out" });
}

function fileHover(e, enter) {
  gsap.to(e.currentTarget, { y: enter ? -2 : 0, duration: 0.18, ease: "power2.out" });
}

function animateListIn() {
  const root = listRef.value;
  if (!root) return;
  const rows = root.querySelectorAll(".afsRow");
  gsap.killTweensOf(rows);
  gsap.fromTo(rows, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.02, ease: "power2.out" });
}

function animatePreviewIn() {
  const root = previewRef.value;
  if (!root) return;
  const el = root.querySelector(".previewInner");
  if (!el) return;
  gsap.killTweensOf(el);
  gsap.fromTo(el, { x: 18, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: "power2.out" });
}

let listAbort = null;
let detailAbort = null;

onMounted(() => {
  fetchList();
});
</script>

<style scoped>
/* base from your original component */
.afs {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: calc(100vh - 40px);
  color: var(--txt);
}

.afsHeader {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  padding: 6px 2px 0;
}

.afsTitle .title {
  font-weight: 900;
  letter-spacing: 0.2px;
  font-size: 18px;
}
.afsTitle .sub {
  margin-top: 6px;
  font-size: 12px;
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 10px;
}
.dot {
  opacity: 0.7;
}

.afsTools {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.field {
  display: grid;
  gap: 6px;
  min-width: 220px;
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
.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.btn:hover {
  border-color: rgba(56, 189, 248, 0.18);
  box-shadow: 0 12px 26px rgba(56, 189, 248, 0.08);
  background: rgba(255, 255, 255, 0.05);
}
.btnPrimary {
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.16), rgba(99, 102, 241, 0.1));
  border-color: rgba(56, 189, 248, 0.2);
  color: rgba(255, 255, 255, 0.92);
}
.btnGhost {
  background: rgba(255, 255, 255, 0.02);
}

.afsGrid {
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 14px;
  align-items: start;
  min-height: 520px;
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

.headLeft {
  display: grid;
  gap: 6px;
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
.headRight {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.muted {
  color: var(--muted);
}

.listCard {
  min-height: 560px;
}

.rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.afsRow {
  text-align: left;
  width: 100%;
  border-radius: 14px;
  padding: 12px;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
  color: rgba(255, 255, 255, 0.82);
  transition: background 180ms ease, border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
}
.afsRow:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(56, 189, 248, 0.16);
  box-shadow: 0 12px 26px rgba(56, 189, 248, 0.06);
}
.afsRow.active {
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.18), rgba(99, 102, 241, 0.1));
  border-color: rgba(56, 189, 248, 0.22);
  color: rgba(255, 255, 255, 0.94);
  box-shadow: 0 18px 36px rgba(56, 189, 248, 0.1);
}

.rowTop {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}
.rowTitle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 900;
}
.id {
  letter-spacing: 0.2px;
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
.pillSoft {
  font-size: 11px;
  font-weight: 900;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid rgba(56, 189, 248, 0.18);
  background: rgba(56, 189, 248, 0.08);
  color: rgba(255, 255, 255, 0.88);
}
.ghostPill {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.1);
}

.rowTime {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.62);
}

.rowBottom {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 8px;
  align-items: center;
}
.rowEmail {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
}
.rowMeta {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
}

.ellipsis {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.alert {
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
  0% {
    background-position: 0% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.previewInner {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.summary {
  border-radius: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.kv .k {
  font-size: 12px;
  font-weight: 800;
}
.kv .v {
  margin-top: 6px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.88);
  font-weight: 700;
}
.kv.wide {
  grid-column: 1 / -1;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.secTitle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 900;
  letter-spacing: 0.2px;
}
.secHint {
  margin-left: 8px;
  font-weight: 900;
}

.qaList {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.qa {
  border-radius: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.q {
  font-weight: 900;
  color: rgba(255, 255, 255, 0.92);
}
.a {
  margin-top: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.84);
}

.json summary {
  cursor: pointer;
  color: rgba(255, 255, 255, 0.82);
  font-weight: 900;
}
.pre {
  margin: 10px 0 0;
  padding: 10px;
  background: rgba(0, 0, 0, 0.22);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  overflow: auto;
  font-size: 12px;
  line-height: 1.45;
}

/* ✅ IMPROVE: file grid more breathable */
.fileGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 10px;
}
.fileGridCompact {
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.fileCard {
  text-decoration: none;
  border-radius: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: background 180ms ease, border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
  color: rgba(255, 255, 255, 0.88);
}
.fileCard:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(56, 189, 248, 0.16);
  box-shadow: 0 12px 26px rgba(56, 189, 248, 0.06);
}
.fileTop {
  display: flex;
  gap: 12px;
  align-items: center;
}
.thumb {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
  flex: 0 0 auto;
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.fileInfo {
  min-width: 0;
  flex: 1;
}
.fileName {
  font-weight: 900;
}
.fileMeta {
  margin-top: 6px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.fileBottom {
  margin-top: 10px;
  font-size: 12px;
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
.emptySmall {
  padding: 10px 2px;
  font-size: 12px;
}

.link {
  color: rgba(170, 200, 255, 0.95);
  text-decoration: none;
}
.link:hover {
  text-decoration: underline;
}

/* toast mini */
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

.toast-enter-active,
.toast-leave-active {
  transition: transform 180ms ease, opacity 180ms ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* responsive */
@media (max-width: 1100px) {
  .afsGrid {
    grid-template-columns: 1fr;
  }
  .field {
    min-width: 180px;
  }
}

/* =========================
   ✅ preview mode UI (clear Q/A)
========================= */
.modeTabs {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}

.tabBtn {
  height: 40px;
  padding: 0 10px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
  color: rgba(255, 255, 255, 0.78);
  cursor: pointer;
  display: inline-flex;
  gap: 8px;
  align-items: center;
  font-weight: 900;
  transition: transform 180ms ease, background 180ms ease, border-color 180ms ease;
}
.tabBtn:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(56, 189, 248, 0.18);
}
.tabBtn.on {
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.18), rgba(99, 102, 241, 0.1));
  border-color: rgba(56, 189, 248, 0.22);
  color: rgba(255, 255, 255, 0.92);
}

.previewHeaderCard {
  border-radius: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  display: grid;
  gap: 10px;
}

.phTop {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
.phTitle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.92);
  font-size: 15px;
}
.phTitle :deep(a) {
  color: rgba(170, 200, 255, 0.95);
  text-decoration: none;
}
.phTitle :deep(a:hover) {
  text-decoration: underline;
}
.phMeta {
  display: inline-flex;
  gap: 8px;
  flex-wrap: wrap;
}
.phDesc {
  color: rgba(255, 255, 255, 0.74);
  line-height: 1.6;
  font-size: 12px;
}
.phFlags {
  display: inline-flex;
  gap: 8px;
  flex-wrap: wrap;
}
.chipGhost {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.78);
  font-size: 12px;
  font-weight: 900;
}

.emailPreviewRead {
  display: grid;
  gap: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.emailLabel {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.86);
}
.emailValue {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.88);
  font-weight: 800;
}

.previewList {
  display: grid;
  gap: 12px;
}
.previewQ {
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.12);
  padding: 14px;
  display: grid;
  gap: 10px;
}
.previewQTop {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
.previewQTitle {
  font-weight: 900;
  color: rgba(255, 255, 255, 0.94);
  display: inline-flex;
  gap: 8px;
  align-items: center;
  font-size: 14px;
  line-height: 1.35;
}
.previewQTitle :deep(a) {
  color: rgba(170, 200, 255, 0.95);
  text-decoration: none;
}
.previewQTitle :deep(a:hover) {
  text-decoration: underline;
}
.previewQRight {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.qNum {
  color: rgba(255, 255, 255, 0.78);
}
.req {
  color: rgba(248, 113, 113, 1);
  font-weight: 900;
}
.previewQDesc {
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
  line-height: 1.6;
}

.previewImgs {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}
.previewImg {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 14px;
  object-fit: contain;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
}

/* ✅ NEW: Answer card (readable) */
.ansCard {
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.018);
  overflow: hidden;
}
.ansCard.isEmpty {
  border-color: rgba(255, 120, 120, 0.18);
  background: rgba(255, 120, 120, 0.035);
}
.ansCardHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.ansCardBody {
  padding: 10px 12px;
  display: grid;
  gap: 8px;
}

.ansLabel {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.86);
  font-size: 12px;
}

.ansText {
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.92);
  line-height: 1.75;
  white-space: pre-line;
}
.preWrap {
  white-space: pre-wrap;
}

.ansMuted {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.62);
  font-weight: 800;
}

.ansToggle {
  border: 0;
  background: transparent;
  color: rgba(170, 200, 255, 0.95);
  cursor: pointer;
  font-weight: 900;
  font-size: 12px;
  display: inline-flex;
  gap: 8px;
  align-items: center;
  padding: 6px 8px;
  border-radius: 12px;
}
.ansToggle:hover {
  background: rgba(170, 200, 255, 0.08);
}

.ansPillRow {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.ansPill {
  font-size: 12px;
  font-weight: 900;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(56, 189, 248, 0.18);
  background: rgba(56, 189, 248, 0.08);
  color: rgba(255, 255, 255, 0.9);
}

/* ✅ NEW: answered badge */
.ansStatus {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 900;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.78);
}
.ansStatus.ok {
  border-color: rgba(34, 197, 94, 0.22);
  background: rgba(34, 197, 94, 0.08);
  color: rgba(220, 255, 230, 0.95);
}
.ansStatus.empty {
  border-color: rgba(248, 113, 113, 0.22);
  background: rgba(248, 113, 113, 0.08);
  color: rgba(255, 235, 235, 0.95);
}

.scoreRead {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.scoreIcons {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}
.scoreIcon {
  width: 34px;
  height: 34px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.03);
  opacity: 0.45;
}
.scoreIcon.on {
  opacity: 1;
  border-color: rgba(56, 189, 248, 0.22);
  background: rgba(56, 189, 248, 0.1);
}
.scoreVal {
  font-weight: 900;
  color: rgba(255, 255, 255, 0.86);
}

.tableWrap {
  overflow: auto;
}
.gridTable {
  width: 100%;
  border-collapse: collapse;
  min-width: 520px;
}
.gridTable th,
.gridTable td {
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 10px;
  text-align: center;
}
.gridTable th {
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.9);
  font-weight: 900;
}
.gridTable tbody tr:nth-child(even) td {
  background: rgba(255, 255, 255, 0.012);
}
.rowHead {
  text-align: left !important;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.85);
}

/* :deep anchor in preview safe html */
:deep(a) {
  color: rgba(170, 200, 255, 0.95);
}

/* raw mode nicer */
.rawPre {
  margin: 0;
  padding: 10px;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.07);
  overflow: auto;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  color: rgba(255, 255, 255, 0.9);
}
.rawValue {
  font-weight: 700;
  line-height: 1.65;
}
</style>
