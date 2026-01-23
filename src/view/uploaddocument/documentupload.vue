<!-- DocumentViewer.vue (Document Management) -->
<template>
  <div class="docViewer">
    <!-- Top bar -->
    <header ref="topbarRef" class="topbar">
      <div class="topLeft">
        <div class="searchWrap">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input v-model.trim="q" type="text" placeholder="Search files (name, tags, owner)..." />
        </div>

        <div class="topActions">
          <button class="btn ghost" type="button" @click="loadDocuments()" :disabled="loading">
            <i class="fa-solid" :class="loading ? 'fa-spinner fa-spin' : 'fa-rotate'"></i>
            <span>Refresh</span>
          </button>

          <button class="btn primary" type="button" @click="openUpload()">
            <i class="fa-solid fa-file-circle-plus"></i>
            <span>Add Document</span>
          </button>
        </div>
      </div>

      <!-- ✅ Profile dropdown -->
     
    </header>

    <!-- ✅ Modern Toast Alert -->
    <div class="toastWrap" aria-live="polite" aria-atomic="true">
      <div v-if="toast.open" ref="toastRef" class="toast" :class="`t-${toast.type}`" role="status">
        <div class="tIcon">
          <i v-if="toast.type === 'success'" class="fa-solid fa-circle-check"></i>
          <i v-else-if="toast.type === 'error'" class="fa-solid fa-circle-xmark"></i>
          <i v-else class="fa-solid fa-circle-info"></i>
        </div>
        <div class="tBody">
          <div class="tTitle">{{ toast.title }}</div>
          <div class="tMsg">{{ toast.message }}</div>
        </div>
        <button class="tClose" type="button" @click="hideToast()" aria-label="Close alert">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <div class="tBar" :style="{ transform: `scaleX(${toast.progress})` }" aria-hidden="true"></div>
      </div>
    </div>

    <div class="layout">
      <!-- FULL WIDTH -->
      <section class="leftCol">
        <!-- Document Type -->
        <div ref="docTypeCardRef" class="card section">
          <div class="sectionHead">
            <div class="sectionTitle">Document Type</div>
            <div class="miniHint">Click to filter</div>
          </div>

          <div class="docTypes">
            <button
              v-for="(t, i) in docTypes"
              :key="t.key"
              class="docTypeTile"
              type="button"
              :class="{ active: activeType === t.key }"
              :ref="(el) => setRef(docTypeTileRefs, el, i)"
              @click="setTypeFilter(t.key)"
              :title="`Filter: ${t.label}`"
            >
              <div class="docIcon">
                <img v-if="t.icon" :src="t.icon" alt="" />
                <div v-else class="docIconPh"></div>
              </div>
              <div class="docLabel">{{ t.label }}</div>
            </button>
          </div>
        </div>

        <!-- ✅ Document Management Table -->
        <div ref="docsCardRef" class="card section docsCard">
          <div class="docsTop">
            <div class="docsTitle">
              <div class="hTitle">Documents</div>
              <div class="hSub">
                Showing <b>{{ pagedDocs.length }}</b> of <b>{{ filteredSortedDocs.length }}</b> (total <b>{{ documents.length }}</b
                >)
              </div>
            </div>

            <div class="docsTools">
              <div class="chip" title="Selected rows">
                <i class="fa-solid fa-check-double"></i>
                <span>{{ selectedIds.size }}</span>
              </div>

              <button class="btn danger ghost" type="button" @click="bulkDeleteAsk()" :disabled="selectedIds.size === 0 || loading">
                <i class="fa-solid fa-trash"></i>
                <span>Delete Selected</span>
              </button>

              <div class="select">
                <i class="fa-solid fa-arrow-down-a-z"></i>
                <select v-model="sortKey">
                  <option value="updatedAt">Sort: Updated</option>
                  <option value="name">Sort: Name</option>
                  <option value="type">Sort: Type</option>
                  <option value="size">Sort: Size</option>
                </select>
              </div>

              <div class="select">
                <i class="fa-solid fa-sort"></i>
                <select v-model="sortDir">
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>

              <div class="select">
                <i class="fa-solid fa-list-ol"></i>
                <select v-model.number="pageSize">
                  <option :value="10">10 / page</option>
                  <option :value="20">20 / page</option>
                  <option :value="50">50 / page</option>
                </select>
              </div>
            </div>
          </div>

          <div v-if="error" class="notice danger">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>{{ error }}</span>
          </div>

          <div class="tableWrap" role="region" aria-label="Documents table">
            <table class="table">
              <thead>
                <tr>
                  <th class="colCheck">
                    <label class="check">
                      <input
                        type="checkbox"
                        :checked="isAllPageSelected"
                        :indeterminate.prop="isSomePageSelected && !isAllPageSelected"
                        @change="toggleSelectAllPage($event)"
                      />
                      <span></span>
                    </label>
                  </th>
                  <th class="colName">Name</th>
                  <th class="colType">Type</th>
                  <th class="colTags">Tags</th>
                  <th class="colOwner">Owner</th>
                  <th class="colSize">Size</th>
                  <th class="colUpdated">Updated</th>
                  <th class="colActions">Actions</th>
                </tr>
              </thead>

              <tbody>
                <tr v-if="loading">
                  <td colspan="8" class="empty">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Loading documents...
                  </td>
                </tr>

                <tr v-else-if="pagedDocs.length === 0">
                  <td colspan="8" class="empty">
                    <i class="fa-regular fa-folder-open"></i>
                    No documents found
                  </td>
                </tr>

                <tr v-else v-for="(doc, i) in pagedDocs" :key="doc.id" class="row" :ref="(el) => setRef(rowRefs, el, i)">
                  <td class="colCheck">
                    <label class="check">
                      <input type="checkbox" :checked="selectedIds.has(doc.id)" @change="toggleSelect(doc.id, $event)" />
                      <span></span>
                    </label>
                  </td>

                  <td class="colName">
                    <div class="nameCell">
                      <div class="fileDot" :class="typeDot(doc.type)"></div>
                      <div class="nameText">
                        <div class="nm" :title="doc.name">{{ doc.name }}</div>
                        <div class="subLine">
                          <span class="muted">#{{ doc.id }}</span>
                          <span class="dotSep">•</span>
                          <span class="muted">{{ doc.path || "—" }}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td class="colType">
                    <span class="pill" :class="typePill(doc.type)">{{ (doc.type || "unknown").toUpperCase() }}</span>
                  </td>

                  <td class="colTags">
                    <div class="tags">
                      <span v-if="!doc.tags || doc.tags.length === 0" class="muted">—</span>
                      <span v-else v-for="(tg, ti) in doc.tags.slice(0, 3)" :key="`${doc.id}-${ti}`" class="tag">{{ tg }}</span>
                      <span v-if="doc.tags && doc.tags.length > 3" class="tag more">+{{ doc.tags.length - 3 }}</span>
                    </div>
                  </td>

                  <td class="colOwner">
                    <span class="muted">{{ doc.owner || "—" }}</span>
                  </td>

                  <td class="colSize">
                    <span class="muted">{{ formatBytes(doc.size) }}</span>
                  </td>

                  <td class="colUpdated">
                    <span class="muted">{{ formatDate(doc.updatedAt) }}</span>
                  </td>

                  <td class="colActions">
                    <div class="rowActions">
                      <button class="iconBtn" type="button" title="View" @click="viewDocument(doc)">
                        <i class="fa-regular fa-eye"></i>
                      </button>
                      <button class="iconBtn" type="button" title="Download" @click="downloadDocument(doc)">
                        <i class="fa-solid fa-download"></i>
                      </button>
                      <button class="iconBtn" type="button" title="Edit" @click="openEdit(doc)">
                        <i class="fa-regular fa-pen-to-square"></i>
                      </button>
                      <button class="iconBtn danger" type="button" title="Delete" @click="deleteAsk(doc)">
                        <i class="fa-regular fa-trash-can"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="pager">
            <button class="miniBtn" type="button" @click="prevPage" :disabled="page <= 1">
              <i class="fa-solid fa-chevron-left"></i>
              Prev
            </button>

            <div class="pageInfo">
              Page <b>{{ page }}</b> / <b>{{ totalPages }}</b>
            </div>

            <button class="miniBtn" type="button" @click="nextPage" :disabled="page >= totalPages">
              Next
              <i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </section>
    </div>

    <!-- =========================
         Upload Modal
         ========================= -->
    <div v-if="uploadOpen" class="modalOverlay" @mousedown.self="closeUpload()">
      <div class="modal" ref="uploadModalRef">
        <div class="modalHead">
          <div class="modalTitle">
            <i class="fa-solid fa-file-circle-plus"></i>
            <span>Add Document</span>
          </div>
          <button class="iconBtn" type="button" @click="closeUpload()" title="Close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="modalBody">
          <div class="dropzone" :class="{ dragging: isDragging }" @dragover.prevent="onDragOver" @dragleave.prevent="onDragLeave" @drop.prevent="onDrop">
            <div class="dzIcon"><i class="fa-solid fa-cloud-arrow-up"></i></div>
            <div class="dzText">
              <div class="dzTitle">Drop file here</div>
              <div class="dzSub">or click to choose file</div>
            </div>
            <input class="fileInput" type="file" @change="onPickFile" />
          </div>

          <div class="grid2">
            <label class="field">
              <span class="label">Title</span>
              <input v-model.trim="uploadForm.title" type="text" placeholder="e.g. Q1 Financial Report" />
            </label>

            <label class="field">
              <span class="label">Type</span>
              <select v-model="uploadForm.type">
                <option value="docs">DOCS</option>
                <option value="excel">EXCEL</option>
                <option value="ppt">PRESENTATION</option>
                <option value="pdf">PDF</option>
                <option value="txt">TXT</option>
              </select>
            </label>

            <label class="field span2">
              <span class="label">Tags (comma separated)</span>
              <input v-model.trim="uploadForm.tagsText" type="text" placeholder="finance, q1, report" />
            </label>

            <label class="field span2">
              <span class="label">Description</span>
              <textarea v-model.trim="uploadForm.description" rows="3" placeholder="Optional description..."></textarea>
            </label>
          </div>

          <div v-if="uploadFile" class="pickedFile">
            <i class="fa-regular fa-file"></i>
            <span class="pfName">{{ uploadFile.name }}</span>
            <span class="pfSize">{{ formatBytes(uploadFile.size) }}</span>
            <button class="iconBtn danger" type="button" title="Remove file" @click="clearPickedFile">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </div>

          <div v-if="uploadError" class="notice danger">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>{{ uploadError }}</span>
          </div>

          <div class="modalFoot">
            <button class="btn ghost" type="button" @click="closeUpload()" :disabled="uploading">Cancel</button>
            <button class="btn primary" type="button" @click="submitUpload()" :disabled="uploading || !uploadFile">
              <i class="fa-solid" :class="uploading ? 'fa-spinner fa-spin' : 'fa-upload'"></i>
              <span>{{ uploading ? "Uploading..." : "Upload" }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- =========================
         Edit Modal
         ========================= -->
    <div v-if="editOpen" class="modalOverlay" @mousedown.self="closeEdit()">
      <div class="modal" ref="editModalRef">
        <div class="modalHead">
          <div class="modalTitle">
            <i class="fa-regular fa-pen-to-square"></i>
            <span>Edit Document</span>
          </div>
          <button class="iconBtn" type="button" @click="closeEdit()" title="Close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="modalBody">
          <div class="grid2">
            <label class="field span2">
              <span class="label">Name</span>
              <input v-model.trim="editForm.name" type="text" placeholder="Document name" />
            </label>

            <label class="field">
              <span class="label">Type</span>
              <select v-model="editForm.type">
                <option value="docs">DOCS</option>
                <option value="excel">EXCEL</option>
                <option value="ppt">PRESENTATION</option>
                <option value="pdf">PDF</option>
                <option value="txt">TXT</option>
              </select>
            </label>

            <label class="field">
              <span class="label">Owner</span>
              <input v-model.trim="editForm.owner" type="text" placeholder="Owner name" />
            </label>

            <label class="field span2">
              <span class="label">Tags (comma separated)</span>
              <input v-model.trim="editForm.tagsText" type="text" placeholder="finance, q1, report" />
            </label>

            <label class="field span2">
              <span class="label">Description</span>
              <textarea v-model.trim="editForm.description" rows="3" placeholder="Optional description..."></textarea>
            </label>
          </div>

          <div v-if="editError" class="notice danger">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>{{ editError }}</span>
          </div>

          <div class="modalFoot">
            <button class="btn ghost" type="button" @click="closeEdit()" :disabled="savingEdit">Cancel</button>
            <button class="btn primary" type="button" @click="saveEdit()" :disabled="savingEdit || !editDocId">
              <i class="fa-solid" :class="savingEdit ? 'fa-spinner fa-spin' : 'fa-floppy-disk'"></i>
              <span>{{ savingEdit ? "Saving..." : "Save" }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- =========================
         Confirm Modal
         ========================= -->
    <div v-if="confirmState.open" class="modalOverlay" @mousedown.self="confirmNo()">
      <div class="modal small" ref="confirmModalRef">
        <div class="modalHead">
          <div class="modalTitle">
            <i class="fa-solid fa-circle-question"></i>
            <span>{{ confirmState.title }}</span>
          </div>
          <button class="iconBtn" type="button" @click="confirmNo()" title="Close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="modalBody">
          <div class="confirmMsg">{{ confirmState.message }}</div>

          <div class="modalFoot">
            <button class="btn ghost" type="button" @click="confirmNo()">Cancel</button>
            <button class="btn danger" type="button" @click="confirmYes()">
              <i class="fa-solid fa-trash"></i>
              <span>Yes, delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import gsap from "gsap";



/**
 * ✅ FIX: setRef safe (prevent undefined)
 */
function setRef(arrRef, el, idx) {
  if (!el) return;
  if (!arrRef.value) arrRef.value = [];
  arrRef.value[idx] = el;
}

const router = useRouter();
const route = useRoute();

/**
 * =========================
 * API (adjust endpoints in your backend)
 * =========================
 * Expected endpoints (suggested):
 * GET    /api/documents?query=&type=&sortKey=&sortDir=&page=&limit=
 * POST   /api/documents (multipart/form-data: file, title, type, tags[], description)
 * PATCH  /api/documents/:id (json metadata)
 * DELETE /api/documents/:id
 * POST   /api/documents/bulk-delete (json: { ids: [] })
 */
const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:3000/api";

// demo state
const q = ref("");

const userAvatar = ref("");

// refs for animation
const topbarRef = ref(null);
const docTypeCardRef = ref(null);
const docsCardRef = ref(null);

const docTypeTileRefs = ref([]);
const rowRefs = ref([]); // ✅ animate table rows

let tl = null;

/**
 * =========================
 * ✅ Toast alert (GSAP)
 * =========================
 */
const toastRef = ref(null);
const toast = ref({
  open: false,
  type: "success", // success | info | error
  title: "",
  message: "",
  progress: 1,
});

let toastTimer = null;
let toastProgressTween = null;

function showToast({ type = "success", title = "Success", message = "", duration = 2600 } = {}) {
  toast.value = { open: true, type, title, message, progress: 1 };

  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = null;

  if (toastProgressTween) toastProgressTween.kill();
  toastProgressTween = null;

  nextTick(() => {
    const el = toastRef.value;
    if (!el) return;

    gsap.killTweensOf(el);
    gsap.fromTo(el, { y: -10, opacity: 0, scale: 0.98 }, { y: 0, opacity: 1, scale: 1, duration: 0.22, ease: "power3.out" });

    // progress bar
    toast.value.progress = 1;
    toastProgressTween = gsap.to(toast.value, {
      progress: 0,
      duration: Math.max(0.6, duration / 1000),
      ease: "none",
    });

    toastTimer = window.setTimeout(() => hideToast(), duration);
  });
}

function hideToast(immediate = false) {
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = null;

  if (toastProgressTween) toastProgressTween.kill();
  toastProgressTween = null;

  const el = toastRef.value;
  if (!el || immediate) {
    toast.value.open = false;
    return;
  }

  gsap.killTweensOf(el);
  gsap.to(el, {
    y: -10,
    opacity: 0,
    scale: 0.98,
    duration: 0.18,
    ease: "power2.inOut",
    onComplete: () => {
      toast.value.open = false;
    },
  });
}

/**
 * =========================
 * Profile dropdown (GSAP)
 * =========================
 */
const profileWrapRef = ref(null);
const profileBtnRef = ref(null);
const profileMenuRef = ref(null);
const profileChevronRef = ref(null);

const isProfileOpen = ref(false);

function openProfileMenu(immediate = false) {
  const menu = profileMenuRef.value;
  const chev = profileChevronRef.value;
  if (!menu) return;

  gsap.killTweensOf(menu);
  gsap.killTweensOf(chev);

  gsap.set(menu, { display: "block", pointerEvents: "auto" });

  if (immediate) {
    gsap.set(menu, { opacity: 1, y: 0, scale: 1 });
    if (chev) gsap.set(chev, { rotate: 180 });
    return;
  }

  gsap.fromTo(menu, { opacity: 0, y: -6, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.18, ease: "power2.out" });
  if (chev) gsap.to(chev, { rotate: 180, duration: 0.18, ease: "power2.out" });
}

function closeProfileMenu(immediate = false) {
  const menu = profileMenuRef.value;
  const chev = profileChevronRef.value;
  if (!menu) return;

  gsap.killTweensOf(menu);
  gsap.killTweensOf(chev);

  if (immediate) {
    gsap.set(menu, { display: "none", opacity: 0, y: -6, scale: 0.98, pointerEvents: "none" });
    if (chev) gsap.set(chev, { rotate: 0 });
    return;
  }

  gsap.to(menu, {
    opacity: 0,
    y: -6,
    scale: 0.98,
    duration: 0.14,
    ease: "power2.inOut",
    onComplete: () => gsap.set(menu, { display: "none", pointerEvents: "none" }),
  });

  if (chev) gsap.to(chev, { rotate: 0, duration: 0.14, ease: "power2.inOut" });
}

async function toggleProfile() {
  isProfileOpen.value = !isProfileOpen.value;
  await nextTick();

  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (isProfileOpen.value) openProfileMenu(!!reduce);
  else closeProfileMenu(!!reduce);
}

function closeProfile() {
  if (!isProfileOpen.value) return;
  isProfileOpen.value = false;

  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  closeProfileMenu(!!reduce);
}

function goNotifications() {
  closeProfile();
  router.push("/notifications").catch(() => {});
}

function goChatbox() {
  closeProfile();
  router.push("/chatbox").catch(() => {});
}

function logout() {
  closeProfile();

  try {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  } catch (e) {}
  try {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
  } catch (e) {}

  router.replace({ path: "/login" });
}

function onDocClick(e) {
  const wrap = profileWrapRef.value;
  if (!wrap) return;

  // close profile
  if (isProfileOpen.value) {
    const target = e.target;
    if (!(wrap === target || wrap.contains(target))) closeProfile();
  }
}

function onEsc(e) {
  if (e.key === "Escape") {
    closeProfile();
    hideToast(true);
    if (uploadOpen.value) closeUpload();
    if (editOpen.value) closeEdit();
    if (confirmState.value.open) confirmNo();
  }
}

/**
 * =========================
 * Document Types (filter)
 * =========================
 */
const docTypes = ref([
  { key: "all", label: "All", icon: "/document_icon/folders.png" },
  { key: "pdf", label: "PDF", icon: "/document_icon/pdf.png" },
  { key: "docs", label: "Docs", icon: "/document_icon/word.png" },
  { key: "excel", label: "Excel", icon: "/document_icon/logo.png" },
  { key: "ppt", label: "Presentation", icon: "/document_icon/powerpoint.png" },
  { key: "txt", label: "TXT", icon: "/document_icon/txt.png" },
]);

const activeType = ref("all");
function setTypeFilter(key) {
  closeProfile();
  activeType.value = key || "all";
  page.value = 1;
}

/**
 * =========================
 * Documents state + table
 * =========================
 */
const documents = ref([]);
const loading = ref(false);
const error = ref("");

const sortKey = ref("updatedAt");
const sortDir = ref("desc");

const page = ref(1);
const pageSize = ref(10);

const selectedIds = ref(new Set());

const filteredSortedDocs = computed(() => {
  const query = (q.value || "").toLowerCase();
  const type = activeType.value;

  const arr = (documents.value || []).filter((d) => {
    const tOk = type === "all" ? true : (d.type || "").toLowerCase() === type;
    if (!tOk) return false;

    if (!query) return true;
    const hay = [d.name, d.owner, (d.tags || []).join(" "), d.path, d.type, String(d.id ?? "")]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(query);
  });

  // sort
  const dir = sortDir.value === "asc" ? 1 : -1;
  const key = sortKey.value;

  const getVal = (d) => {
    if (key === "name") return (d.name || "").toLowerCase();
    if (key === "type") return (d.type || "").toLowerCase();
    if (key === "size") return Number(d.size || 0);
    return d.updatedAt ? new Date(d.updatedAt).getTime() : 0;
  };

  arr.sort((a, b) => {
    const av = getVal(a);
    const bv = getVal(b);
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });

  return arr;
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredSortedDocs.value.length / pageSize.value)));

const pagedDocs = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return filteredSortedDocs.value.slice(start, start + pageSize.value);
});

watch([pageSize, filteredSortedDocs], () => {
  if (page.value > totalPages.value) page.value = totalPages.value;
  if (page.value < 1) page.value = 1;
});

function prevPage() {
  page.value = Math.max(1, page.value - 1);
}
function nextPage() {
  page.value = Math.min(totalPages.value, page.value + 1);
}

const isAllPageSelected = computed(() => {
  if (pagedDocs.value.length === 0) return false;
  return pagedDocs.value.every((d) => selectedIds.value.has(d.id));
});
const isSomePageSelected = computed(() => {
  if (pagedDocs.value.length === 0) return false;
  return pagedDocs.value.some((d) => selectedIds.value.has(d.id));
});

function toggleSelect(id, ev) {
  const checked = !!ev?.target?.checked;
  const set = new Set(selectedIds.value);
  if (checked) set.add(id);
  else set.delete(id);
  selectedIds.value = set;
}

function toggleSelectAllPage(ev) {
  const checked = !!ev?.target?.checked;
  const set = new Set(selectedIds.value);
  if (checked) pagedDocs.value.forEach((d) => set.add(d.id));
  else pagedDocs.value.forEach((d) => set.delete(d.id));
  selectedIds.value = set;
}

function clearSelection() {
  selectedIds.value = new Set();
}

/**
 * =========================
 * ✅ Modern GSAP: animate rows on change
 * =========================
 */
function animateRows() {
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reduce) return;

  const rows = (rowRefs.value || []).filter(Boolean);
  if (!rows.length) return;

  gsap.killTweensOf(rows);
  gsap.fromTo(rows, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.32, ease: "power2.out", stagger: 0.03 });
}

watch(
  () => [pagedDocs.value, loading.value],
  async () => {
    if (loading.value) return;
    await nextTick();
    animateRows();
  },
  { deep: true }
);

/**
 * =========================
 * CRUD functions (manage document)
 * =========================
 */
function getAuthHeaders() {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const h = {};
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

function normalizeDoc(d) {
  const tags = Array.isArray(d?.tags)
    ? d.tags
    : typeof d?.tags === "string"
    ? d.tags
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
    : [];

  return {
    id: d?.id ?? d?._id ?? crypto.randomUUID?.() ?? String(Date.now()),
    name: d?.name ?? d?.title ?? "Untitled",
    type: (d?.type ?? d?.ext ?? "unknown").toLowerCase(),
    tags,
    owner: d?.owner ?? d?.createdBy ?? "",
    size: Number(d?.size ?? 0),
    updatedAt: d?.updatedAt ?? d?.updated_at ?? d?.modifiedAt ?? d?.createdAt ?? null,
    path: d?.path ?? d?.folder ?? "",
    viewUrl: d?.viewUrl ?? d?.view_url ?? d?.url ?? "",
    downloadUrl: d?.downloadUrl ?? d?.download_url ?? "",
    description: d?.description ?? "",
  };
}

async function loadDocuments() {
  error.value = "";
  loading.value = true;

  try {
    const qs = new URLSearchParams();
    if (q.value) qs.set("query", q.value);
    if (activeType.value && activeType.value !== "all") qs.set("type", activeType.value);
    qs.set("sortKey", sortKey.value);
    qs.set("sortDir", sortDir.value);

    const res = await fetch(`${API_BASE}/documents?${qs.toString()}`, { method: "GET", headers: { ...getAuthHeaders() } });

    if (!res.ok) throw new Error(`Failed to load documents (${res.status})`);

    const data = await res.json();
    const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
    documents.value = list.map(normalizeDoc);

    const ids = new Set(documents.value.map((d) => d.id));
    selectedIds.value = new Set([...selectedIds.value].filter((id) => ids.has(id)));
  } catch (e) {
    documents.value = demoDocs().map(normalizeDoc);
    error.value = `${e?.message || "Load error"} — showing demo data (check your /api/documents endpoint).`;
  } finally {
    loading.value = false;
  }
}

async function deleteDocument(id) {
  if (!id) return;

  loading.value = true;
  error.value = "";

  try {
    const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(id)}`, { method: "DELETE", headers: { ...getAuthHeaders() } });
    if (!res.ok) throw new Error(`Delete failed (${res.status})`);

    documents.value = documents.value.filter((d) => d.id !== id);
    const set = new Set(selectedIds.value);
    set.delete(id);
    selectedIds.value = set;
  } catch (e) {
    documents.value = documents.value.filter((d) => d.id !== id);
    const set = new Set(selectedIds.value);
    set.delete(id);
    selectedIds.value = set;
    error.value = e?.message || "Delete error";
  } finally {
    loading.value = false;
  }
}

async function bulkDelete(ids) {
  if (!ids || ids.length === 0) return;

  loading.value = true;
  error.value = "";

  try {
    const res = await fetch(`${API_BASE}/documents/bulk-delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ ids }),
    });

    if (!res.ok) throw new Error(`Bulk delete failed (${res.status})`);

    documents.value = documents.value.filter((d) => !ids.includes(d.id));
    clearSelection();
  } catch (e) {
    documents.value = documents.value.filter((d) => !ids.includes(d.id));
    clearSelection();
    error.value = e?.message || "Bulk delete error";
  } finally {
    loading.value = false;
  }
}

async function updateDocument(id, payload) {
  if (!id) return;

  loading.value = true;
  error.value = "";

  try {
    const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`Update failed (${res.status})`);

    const updated = normalizeDoc(await res.json());
    documents.value = documents.value.map((d) => (d.id === id ? { ...d, ...updated } : d));
  } catch (e) {
    documents.value = documents.value.map((d) => (d.id === id ? { ...d, ...payload, updatedAt: new Date().toISOString() } : d));
    error.value = e?.message || "Update error";
  } finally {
    loading.value = false;
  }
}

function viewDocument(doc) {
  closeProfile();
  if (!doc) return;

  const url = doc.viewUrl || doc.downloadUrl;
  if (url) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  router.push({ path: `/documents/${doc.id}` }).catch(() => {});
}

function downloadDocument(doc) {
  closeProfile();
  if (!doc) return;

  const url = doc.downloadUrl || doc.viewUrl;
  if (!url) return;

  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.download = doc.name || "document";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * =========================
 * Confirm dialogs
 * =========================
 */
const confirmState = ref({
  open: false,
  title: "Confirm",
  message: "",
  onYes: null,
});

function askConfirm({ title, message, onYes }) {
  confirmState.value = {
    open: true,
    title: title || "Confirm",
    message: message || "",
    onYes: typeof onYes === "function" ? onYes : null,
  };
}

function confirmNo() {
  confirmState.value.open = false;
  confirmState.value.onYes = null;
}

async function confirmYes() {
  const fn = confirmState.value.onYes;
  confirmNo();
  try {
    if (fn) await fn();
  } catch (e) {}
}

function deleteAsk(doc) {
  if (!doc?.id) return;
  askConfirm({
    title: "Delete Document",
    message: `Delete "${doc.name}"? This action cannot be undone.`,
    onYes: () => deleteDocument(doc.id),
  });
}

function bulkDeleteAsk() {
  const ids = [...selectedIds.value];
  if (ids.length === 0) return;

  askConfirm({
    title: "Delete Selected",
    message: `Delete ${ids.length} document(s)? This action cannot be undone.`,
    onYes: () => bulkDelete(ids),
  });
}

/**
 * =========================
 * Upload modal + functions
 * =========================
 */
const uploadOpen = ref(false);
const uploadModalRef = ref(null);
const uploadFile = ref(null);
const uploading = ref(false);
const uploadError = ref("");
const isDragging = ref(false);

const uploadForm = ref({
  title: "",
  type: "pdf",
  tagsText: "",
  description: "",
});

function openUpload() {
  closeProfile();
  uploadError.value = "";
  uploadOpen.value = true;

  nextTick(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduce) return;
    if (uploadModalRef.value) gsap.fromTo(uploadModalRef.value, { y: 12, opacity: 0, scale: 0.98 }, { y: 0, opacity: 1, scale: 1, duration: 0.2, ease: "power3.out" });
  });
}

function closeUpload() {
  uploadOpen.value = false;
  isDragging.value = false;
  uploadError.value = "";
  uploading.value = false;
}

function clearPickedFile() {
  uploadFile.value = null;
}

function onPickFile(e) {
  const f = e?.target?.files?.[0];
  if (!f) return;
  uploadFile.value = f;
}

function onDragOver() {
  isDragging.value = true;
}
function onDragLeave() {
  isDragging.value = false;
}
function onDrop(e) {
  isDragging.value = false;
  const f = e?.dataTransfer?.files?.[0];
  if (!f) return;
  uploadFile.value = f;
}

function parseTags(tagsText) {
  return (tagsText || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

async function submitUpload() {
  if (!uploadFile.value) return;
  uploadError.value = "";
  uploading.value = true;

  try {
    const fd = new FormData();
    fd.append("file", uploadFile.value);

    fd.append("title", uploadForm.value.title || uploadFile.value.name);
    fd.append("type", uploadForm.value.type || "unknown");
    fd.append("description", uploadForm.value.description || "");
    const tags = parseTags(uploadForm.value.tagsText);
    tags.forEach((t) => fd.append("tags[]", t));

    const res = await fetch(`${API_BASE}/documents`, {
      method: "POST",
      headers: { ...getAuthHeaders() },
      body: fd,
    });

    if (!res.ok) throw new Error(`Upload failed (${res.status})`);

    const created = normalizeDoc(await res.json());
    documents.value = [created, ...documents.value];

    closeUpload();
    uploadForm.value = { title: "", type: "pdf", tagsText: "", description: "" };
    uploadFile.value = null;
    page.value = 1;

    showToast({
      type: "success",
      title: "Upload Success",
      message: `"${created.name}" has been added.`,
    });

    await nextTick();
    animateRows();
  } catch (e) {
    // local fallback (demo)
    const now = new Date().toISOString();
    const created = normalizeDoc({
      id: `demo-${Date.now()}`,
      name: uploadForm.value.title || uploadFile.value.name,
      type: uploadForm.value.type,
      tags: parseTags(uploadForm.value.tagsText),
      owner: userName.value,
      size: uploadFile.value.size,
      updatedAt: now,
      description: uploadForm.value.description,
      path: "/",
      viewUrl: "",
      downloadUrl: "",
    });
    documents.value = [created, ...documents.value];

    uploadError.value = `${e?.message || "Upload error"} — added locally (check your POST /api/documents endpoint).`;
    showToast({
      type: "info",
      title: "Saved Locally",
      message: `"${created.name}" added (backend not ready).`,
    });

    uploading.value = false;
  } finally {
    uploading.value = false;
  }
}

/**
 * =========================
 * Edit modal + functions
 * =========================
 */
const editOpen = ref(false);
const editModalRef = ref(null);
const editDocId = ref("");
const savingEdit = ref(false);
const editError = ref("");

const editForm = ref({
  name: "",
  type: "pdf",
  owner: "",
  tagsText: "",
  description: "",
});

function openEdit(doc) {
  closeProfile();
  if (!doc?.id) return;

  editDocId.value = doc.id;
  editForm.value = {
    name: doc.name || "",
    type: doc.type || "pdf",
    owner: doc.owner || "",
    tagsText: (doc.tags || []).join(", "),
    description: doc.description || "",
  };

  editError.value = "";
  editOpen.value = true;

  nextTick(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduce) return;
    if (editModalRef.value) gsap.fromTo(editModalRef.value, { y: 12, opacity: 0, scale: 0.98 }, { y: 0, opacity: 1, scale: 1, duration: 0.2, ease: "power3.out" });
  });
}

function closeEdit() {
  editOpen.value = false;
  savingEdit.value = false;
  editError.value = "";
  editDocId.value = "";
}

async function saveEdit() {
  if (!editDocId.value) return;
  editError.value = "";
  savingEdit.value = true;

  const payload = {
    name: editForm.value.name,
    type: editForm.value.type,
    owner: editForm.value.owner,
    tags: parseTags(editForm.value.tagsText),
    description: editForm.value.description,
  };

  try {
    await updateDocument(editDocId.value, payload);
    const nm = payload.name || "Document";

    closeEdit();

    showToast({
      type: "success",
      title: "Edit Saved",
      message: `"${nm}" has been updated.`,
    });

    await nextTick();
    animateRows();
  } catch (e) {
    editError.value = e?.message || "Save error";
    showToast({
      type: "error",
      title: "Save Failed",
      message: editError.value,
    });
  } finally {
    savingEdit.value = false;
  }
}

/**
 * =========================
 * UI helpers
 * =========================
 */
function formatDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function formatBytes(bytes) {
  const n = Number(bytes || 0);
  if (!Number.isFinite(n) || n <= 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  const dp = i === 0 ? 0 : i <= 2 ? 1 : 2;
  return `${v.toFixed(dp)} ${units[i]}`;
}

function typePill(type) {
  const t = (type || "").toLowerCase();
  if (t === "pdf") return "pPdf";
  if (t === "docs") return "pDocs";
  if (t === "excel") return "pXls";
  if (t === "ppt") return "pPpt";
  if (t === "txt") return "pTxt";
  return "pOther";
}

function typeDot(type) {
  const t = (type || "").toLowerCase();
  if (t === "pdf") return "dPdf";
  if (t === "docs") return "dDocs";
  if (t === "excel") return "dXls";
  if (t === "ppt") return "dPpt";
  if (t === "txt") return "dTxt";
  return "dOther";
}

/**
 * =========================
 * Demo docs if backend not ready
 * =========================
 */
function demoDocs() {
  const now = Date.now();
  return [
    { id: 101, name: "Narrative-Report.pdf", type: "pdf", size: 567 * 1024, owner: "Admin", tags: ["report", "pdf"], updatedAt: new Date(now - 3600 * 1000).toISOString(), path: "/Reports" },
    { id: 102, name: "Thesis-Final.docx", type: "docs", size: 2.3 * 1024 * 1024, owner: "John", tags: ["docs", "final"], updatedAt: new Date(now - 24 * 3600 * 1000).toISOString(), path: "/Docs" },
    { id: 103, name: "Sales2023.xlsx", type: "excel", size: 4.1 * 1024 * 1024, owner: "Finance", tags: ["sales", "excel"], updatedAt: new Date(now - 3 * 24 * 3600 * 1000).toISOString(), path: "/Sheets" },
    { id: 104, name: "Present2023.ppt", type: "ppt", size: 4.0 * 1024 * 1024, owner: "Marketing", tags: ["slides"], updatedAt: new Date(now - 7 * 24 * 3600 * 1000).toISOString(), path: "/Slides" },
    { id: 105, name: "Sample.txt", type: "txt", size: 15 * 1024, owner: "System", tags: [], updatedAt: new Date(now - 2 * 3600 * 1000).toISOString(), path: "/Notes" },
  ];
}

/**
 * =========================
 * Mount / Unmount
 * =========================
 */
onMounted(async () => {
  await nextTick();

  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  // init profile menu hidden
  if (profileMenuRef.value) gsap.set(profileMenuRef.value, { display: "none", opacity: 0, y: -6, scale: 0.98, pointerEvents: "none" });
  if (profileChevronRef.value) gsap.set(profileChevronRef.value, { rotate: 0 });

  document.addEventListener("click", onDocClick, true);
  document.addEventListener("keydown", onEsc);

  await loadDocuments();

  // ✅ Modern entrance animation
  if (!reduce) {
    tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(topbarRef.value, { y: -10, opacity: 0, duration: 0.45 }, 0);
    tl.from([docTypeCardRef.value, docsCardRef.value], { y: 16, opacity: 0, duration: 0.55, stagger: 0.12 }, 0.06);
    tl.from(docTypeTileRefs.value, { y: 10, opacity: 0, duration: 0.32, stagger: 0.05 }, 0.18);

    // animate rows after render
    tl.add(async () => {
      await nextTick();
      animateRows();
    }, 0.28);
  }
});

// Close dropdown & modals when route changes
watch(
  () => route.fullPath,
  () => {
    closeProfile();
    hideToast(true);
    if (uploadOpen.value) closeUpload();
    if (editOpen.value) closeEdit();
    if (confirmState.value.open) confirmNo();
  }
);

// Reset to page 1 when searching
watch(
  () => q.value,
  () => {
    page.value = 1;
  }
);

onBeforeUnmount(() => {
  if (tl) tl.kill();
  tl = null;

  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = null;
  if (toastProgressTween) toastProgressTween.kill();
  toastProgressTween = null;

  document.removeEventListener("click", onDocClick, true);
  document.removeEventListener("keydown", onEsc);
});
</script>

<style scoped>
/* Use theme from app.vue if available (fallback) */
.docViewer {
  width: 100%;
  min-height: calc(100vh - 36px);
  padding: 10px 10px 14px;
  color: var(--txt, rgba(255, 255, 255, 0.92));
}

/* topbar */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 8px 6px 16px;
}

.topLeft {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.topActions {
  display: inline-flex;
  gap: 10px;
  flex-shrink: 0;
}

.searchWrap {
  width: min(620px, 100%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  min-width: 0;
}
.searchWrap i {
  opacity: 0.85;
}
.searchWrap input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 800;
}
.searchWrap input::placeholder {
  color: rgba(255, 255, 255, 0.35);
  font-weight: 800;
}

/* buttons */
.btn {
  border: none;
  cursor: pointer;
  padding: 10px 12px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.88);
  background: rgba(255, 255, 255, 0.06);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 10px 30px rgba(0, 0, 0, 0.18);
  transition: transform 160ms ease, filter 160ms ease, background 160ms ease;
}
.btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.05);
  background: rgba(255, 255, 255, 0.08);
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
.btn.primary {
  background: rgba(56, 189, 248, 0.18);
  box-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.26), 0 10px 30px rgba(0, 0, 0, 0.18);
}
.btn.primary:hover {
  background: rgba(56, 189, 248, 0.22);
}
.btn.ghost {
  background: rgba(255, 255, 255, 0.04);
}
.btn.danger {
  background: rgba(255, 60, 60, 0.12);
  box-shadow: inset 0 0 0 1px rgba(255, 60, 60, 0.18), 0 10px 30px rgba(0, 0, 0, 0.18);
}
.btn.danger:hover {
  background: rgba(255, 60, 60, 0.16);
}

/* profile dropdown */
.profileWrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.userBtn {
  border: none;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 6px 8px;
  border-radius: 12px;
  transition: background 160ms ease, transform 160ms ease;
}
.userBtn:hover {
  background: rgba(255, 255, 255, 0.04);
  transform: translateY(-1px);
}

.userName {
  color: rgba(120, 170, 255, 0.95);
  font-weight: 900;
  white-space: nowrap;
}

.avatar {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatarPh {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(99, 102, 241, 0.18));
}

.chevron {
  font-size: 12px;
  opacity: 0.85;
  transform-origin: center;
  color: rgba(255, 255, 255, 0.75);
}

.profileMenu {
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  width: 220px;
  border-radius: 14px;
  padding: 8px;
  background: rgba(10, 12, 22, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 46px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(10px);
  z-index: 50;
}

.menuItem {
  width: 100%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.86);
  transition: background 160ms ease, transform 160ms ease, color 160ms ease, box-shadow 160ms ease;
}
.menuItem:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25);
}
.menuItem.danger {
  background: rgba(255, 255, 255, 0.02);
  color: rgba(255, 255, 255, 0.88);
}
.menuItem.danger:hover {
  background: rgba(255, 60, 60, 0.12);
  color: rgba(255, 255, 255, 0.95);
}

.miIcon {
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  opacity: 0.9;
}
.miLabel {
  font-weight: 900;
  font-size: 13px;
}

.menuDivider {
  height: 1px;
  margin: 8px 6px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0));
  opacity: 0.65;
}

/* ✅ Toast */
.toastWrap {
  position: fixed;
  top: 14px;
  right: 14px;
  z-index: 200;
  pointer-events: none;
}
.toast {
  pointer-events: auto;
  width: min(420px, calc(100vw - 28px));
  border-radius: 16px;
  padding: 12px 12px 10px;
  display: grid;
  grid-template-columns: 26px 1fr 30px;
  gap: 10px;
  align-items: start;
  background: rgba(10, 12, 22, 0.86);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}
.tIcon {
  width: 26px;
  height: 26px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.tBody {
  min-width: 0;
}
.tTitle {
  font-weight: 950;
  font-size: 13px;
  line-height: 1.2;
}
.tMsg {
  margin-top: 4px;
  font-weight: 850;
  font-size: 11.5px;
  opacity: 0.8;
  line-height: 1.35;
  word-break: break-word;
}
.tClose {
  width: 30px;
  height: 30px;
  border: none;
  cursor: pointer;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.86);
  display: grid;
  place-items: center;
  transition: transform 160ms ease, background 160ms ease;
}
.tClose:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.08);
}
.tBar {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  width: 100%;
  transform-origin: left center;
  background: rgba(56, 189, 248, 0.9);
}
.toast.t-success .tBar {
  background: rgba(34, 197, 94, 0.95);
}
.toast.t-error .tBar {
  background: rgba(255, 60, 60, 0.95);
}
.toast.t-info .tBar {
  background: rgba(56, 189, 248, 0.95);
}

/* layout (FULL WIDTH) */
.layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
}
.leftCol {
  display: grid;
  gap: 18px;
}

/* cards */
.card {
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.24);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 16px 44px rgba(0, 0, 0, 0.3);
}

.section {
  padding: 18px 18px 16px;
}

.sectionHead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
}
.sectionTitle {
  font-size: 16px;
  font-weight: 900;
  margin: 0;
  color: rgba(120, 210, 200, 0.9);
}
.miniHint {
  font-size: 11px;
  opacity: 0.55;
  font-weight: 800;
}

/* Document type tiles */
.docTypes {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 14px;
}

.docTypeTile {
  border: none;
  cursor: pointer;
  border-radius: 10px;
  padding: 14px 12px 12px;
  background: rgba(58, 82, 160, 0.55);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  transition: transform 160ms ease, filter 160ms ease, box-shadow 160ms ease;
  color: rgba(255, 255, 255, 0.9);
}
.docTypeTile:hover {
  transform: translateY(-2px);
  filter: brightness(1.05);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14), 0 14px 30px rgba(0, 0, 0, 0.25);
}
.docTypeTile.active {
  background: rgba(56, 189, 248, 0.18);
  box-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.28), 0 16px 34px rgba(0, 0, 0, 0.26);
}
.docIcon {
  height: 46px;
  display: grid;
  place-items: center;
  margin-bottom: 10px;
}
.docIcon img {
  width: 42px;
  height: 42px;
  object-fit: contain;
}
.docIconPh {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px dashed rgba(255, 255, 255, 0.18);
}
.docLabel {
  font-weight: 900;
  font-size: 12px;
  opacity: 0.92;
  text-align: center;
}

/* Docs card header */
.docsCard {
  padding-bottom: 12px;
}
.docsTop {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.docsTitle .hTitle {
  font-weight: 950;
  font-size: 16px;
}
.docsTitle .hSub {
  margin-top: 4px;
  font-size: 11px;
  opacity: 0.65;
  font-weight: 800;
}
.docsTools {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-weight: 900;
  font-size: 12px;
  opacity: 0.9;
}
.select {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.select i {
  opacity: 0.75;
  font-size: 12px;
}
.select select {
  background: transparent;
  border: none;
  outline: none;
  color: rgba(255, 255, 255, 0.88);
  font-weight: 900;
  font-size: 12px;
}

/* notice */
.notice {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  font-weight: 850;
  margin: 10px 0 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.notice.danger {
  background: rgba(255, 60, 60, 0.12);
  border-color: rgba(255, 60, 60, 0.18);
}

/* table */
.tableWrap {
  overflow: auto;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.16);
}
.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 980px;
}
.table thead th {
  text-align: left;
  font-size: 11px;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  padding: 12px 12px;
  font-weight: 950;
  opacity: 0.72;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: sticky;
  top: 0;
  z-index: 2;
}
.table tbody td {
  padding: 12px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  vertical-align: middle;
}
.table tbody tr:hover td {
  background: rgba(255, 255, 255, 0.03);
}
.table tbody tr:last-child td {
  border-bottom: none;
}

.empty {
  text-align: center;
  padding: 22px 12px !important;
  font-weight: 900;
  opacity: 0.75;
}
.empty i {
  margin-right: 10px;
}

.colCheck {
  width: 44px;
}
.colName {
  width: 360px;
}
.colType {
  width: 120px;
}
.colTags {
  width: 190px;
}
.colOwner {
  width: 130px;
}
.colSize {
  width: 110px;
}
.colUpdated {
  width: 170px;
}
.colActions {
  width: 170px;
}

.nameCell {
  display: flex;
  align-items: center;
  gap: 12px;
}
.fileDot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  opacity: 0.95;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.06);
}
.dPdf {
  background: rgba(255, 165, 0, 0.95);
}
.dDocs {
  background: rgba(56, 189, 248, 0.95);
}
.dXls {
  background: rgba(34, 197, 94, 0.95);
}
.dPpt {
  background: rgba(244, 63, 94, 0.9);
}
.dTxt {
  background: rgba(148, 163, 184, 0.95);
}
.dOther {
  background: rgba(168, 85, 247, 0.85);
}

.nameText {
  min-width: 0;
}
.nm {
  font-weight: 950;
  font-size: 12.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.subLine {
  margin-top: 3px;
  font-size: 10px;
  opacity: 0.65;
  font-weight: 850;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dotSep {
  margin: 0 6px;
  opacity: 0.45;
}
.muted {
  opacity: 0.72;
  font-weight: 850;
  font-size: 11px;
}

.pill {
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
.pPdf {
  background: rgba(255, 165, 0, 0.14);
  border-color: rgba(255, 165, 0, 0.22);
}
.pDocs {
  background: rgba(56, 189, 248, 0.14);
  border-color: rgba(56, 189, 248, 0.22);
}
.pXls {
  background: rgba(34, 197, 94, 0.14);
  border-color: rgba(34, 197, 94, 0.22);
}
.pPpt {
  background: rgba(244, 63, 94, 0.12);
  border-color: rgba(244, 63, 94, 0.2);
}
.pTxt {
  background: rgba(148, 163, 184, 0.12);
  border-color: rgba(148, 163, 184, 0.2);
}
.pOther {
  background: rgba(168, 85, 247, 0.12);
  border-color: rgba(168, 85, 247, 0.2);
}

.tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.tag {
  padding: 6px 9px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 950;
  opacity: 0.85;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.tag.more {
  opacity: 0.7;
}

.rowActions {
  display: inline-flex;
  gap: 10px;
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
.iconBtn.danger {
  background: rgba(255, 60, 60, 0.12);
  border-color: rgba(255, 60, 60, 0.18);
}

/* checkbox */
.check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.check input {
  width: 16px;
  height: 16px;
  accent-color: rgba(56, 189, 248, 0.95);
}
.check span {
  display: none;
}

/* pager */
.pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 12px;
}
.pageInfo {
  font-weight: 900;
  font-size: 12px;
  opacity: 0.8;
}
.miniBtn {
  margin-top: 6px;
  width: max-content;
  border: none;
  cursor: pointer;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.22);
  color: rgba(255, 255, 255, 0.86);
  font-weight: 900;
  font-size: 11px;
  transition: transform 160ms ease, filter 160ms ease;
}
.miniBtn:hover {
  transform: translateY(-1px);
  filter: brightness(1.06);
}
.miniBtn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Modal */
.modalOverlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 16px;
}
.modal {
  width: min(760px, 100%);
  border-radius: 18px;
  background: rgba(10, 12, 22, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
  overflow: hidden;
}
.modal.small {
  width: min(520px, 100%);
}
.modalHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 14px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.modalTitle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 950;
}
.modalBody {
  padding: 14px;
}
.modalFoot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  margin-top: 12px;
}

/* Dropzone */
.dropzone {
  position: relative;
  border-radius: 16px;
  padding: 18px 14px;
  display: flex;
  align-items: center;
  gap: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px dashed rgba(255, 255, 255, 0.18);
  transition: filter 160ms ease, background 160ms ease, border-color 160ms ease;
  cursor: pointer;
}
.dropzone.dragging {
  background: rgba(56, 189, 248, 0.12);
  border-color: rgba(56, 189, 248, 0.28);
}
.dzIcon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.18);
}
.dzIcon i {
  font-size: 18px;
  opacity: 0.9;
}
.dzText {
  display: grid;
  gap: 4px;
}
.dzTitle {
  font-weight: 950;
}
.dzSub {
  font-size: 11px;
  opacity: 0.65;
  font-weight: 850;
}
.fileInput {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

/* form fields */
.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
}
.field {
  display: grid;
  gap: 8px;
}
.field .label {
  font-size: 11px;
  font-weight: 950;
  opacity: 0.75;
}
.field input,
.field select,
.field textarea {
  width: 100%;
  border-radius: 12px;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.1);
  outline: none;
  color: rgba(255, 255, 255, 0.88);
  font-weight: 850;
}
.field textarea {
  resize: vertical;
}
.span2 {
  grid-column: span 2;
}

.pickedFile {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.pfName {
  font-weight: 950;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pfSize {
  font-size: 11px;
  opacity: 0.7;
  font-weight: 900;
}
.confirmMsg {
  font-weight: 850;
  opacity: 0.86;
  padding: 6px 2px 0;
}

/* responsive */
@media (max-width: 1100px) {
  .docTypes {
    grid-template-columns: repeat(3, 1fr);
  }
  .docsTop {
    flex-direction: column;
    align-items: stretch;
  }
}
@media (max-width: 760px) {
  .topbar {
    align-items: flex-start;
  }
  .topLeft {
    flex-direction: column;
    align-items: stretch;
  }
  .topActions {
    justify-content: flex-start;
  }
  .docTypes {
    grid-template-columns: repeat(2, 1fr);
  }
  .grid2 {
    grid-template-columns: 1fr;
  }
  .span2 {
    grid-column: auto;
  }
}
</style>
