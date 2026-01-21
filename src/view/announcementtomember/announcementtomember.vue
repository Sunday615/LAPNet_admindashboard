<!-- src/views/CreateAnnouncement.vue -->
<template>
  <div class="page annPage">
    <div class="annInner">
      <!-- Top bar -->
      <header ref="topbarRef" class="topbar">
        <div class="topLeft">
          <div class="titleRow">
            <div class="titleIcon"><i class="fa-solid fa-bullhorn"></i></div>
            <div class="titleText">
              <div class="pageTitle">Create Announcement</div>
              <div class="pageSub">Title • Paragraph • Upload • Tags • Member access</div>
            </div>
          </div>
        </div>
      </header>

      <!-- Content -->
      <form class="content" @submit.prevent="submit">
        <!-- Card A -->
        <section ref="cardARef" class="card">
          <div class="cardHead">
            <div class="hTitle">Announcement details</div>
            <div class="hint">Enter a title, paragraph, and optional tags.</div>
          </div>

          <div class="grid2">
            <label class="field">
              <span class="label">Title <b class="req">*</b></span>
              <div class="inputWrap">
                <i class="fa-solid fa-heading"></i>
                <input v-model.trim="title" type="text" placeholder="Announcement title..." maxlength="140" required />
              </div>
              <div class="miniHint">{{ title.length }}/140</div>
            </label>

            <label class="field">
              <span class="label">Tags</span>
              <div class="tagInput">
                <i class="fa-solid fa-tags"></i>
                <input
                  v-model="tagDraft"
                  type="text"
                  placeholder="Type a tag then press Enter or ,"
                  @keydown.enter.prevent="addTagsFromDraft()"
                  @keydown="onTagKeydown"
                />
                <button class="miniBtn" type="button" @click="addTagsFromDraft">
                  <i class="fa-solid fa-plus"></i>
                </button>
              </div>

              <div class="tagPills" v-if="tags.length">
                <button
                  v-for="t in tags"
                  :key="t"
                  type="button"
                  class="pillTag"
                  @click="removeTag(t)"
                  :title="`Remove ${t}`"
                >
                  <span>#{{ t }}</span>
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div class="miniHint">Up to {{ maxTags }} tags</div>
            </label>
          </div>

          <label class="field">
            <span class="label">Paragraph <b class="req">*</b></span>
            <textarea v-model.trim="body" class="textarea" rows="7" placeholder="Write your announcement..." required />
            <div class="miniHint">{{ body.length }} characters</div>
          </label>
        </section>

        <!-- Card B -->
        <section ref="cardBRef" class="card">
          <div class="cardHead">
            <div class="hTitle">Attachments</div>
            <div class="hint">Supports: doc/docx, ppt/pptx, xls/xlsx, pdf, txt, image, video</div>
          </div>

          <div
            ref="dropzoneRef"
            class="dropzone"
            :class="{ dragOver: isDragOver }"
            @dragover.prevent="onDragOver"
            @dragleave="onDragLeave"
            @drop.prevent="onDrop"
          >
            <input ref="fileInputRef" class="fileInput" type="file" multiple :accept="accept" @change="onFilePick" />

            <div class="dzInner" @click="openFilePicker" role="button" tabindex="0">
              <div class="dzIcon">
                <i class="fa-solid fa-cloud-arrow-up"></i>
              </div>
              <div class="dzText">
                <div class="dzTitle">Drag & Drop files here</div>
                <div class="dzSub">Or click to browse • Up to {{ maxFiles }} files • Max {{ maxFileMB }}MB per file</div>
              </div>
              <div class="dzBtn">
                <span class="btn ghost small">
                  <i class="fa-solid fa-folder-open"></i><span>Browse</span>
                </span>
              </div>
            </div>
          </div>

          <div class="fileList" v-if="files.length">
            <div class="fileRow" v-for="(f, idx) in files" :key="f._key">
              <div class="fileIcon">
                <i class="fa-solid" :class="fileIconClass(f)"></i>
              </div>

              <div class="fileMeta">
                <div class="fileName" :title="f.name">{{ f.name }}</div>
                <div class="fileSub">{{ prettySize(f.size) }} • {{ f.type || "unknown" }}</div>

                <div class="preview" v-if="f._previewUrl && isPreviewable(f)">
                  <img v-if="isImage(f)" :src="f._previewUrl" alt="" />
                  <video v-else-if="isVideo(f)" :src="f._previewUrl" controls preload="metadata"></video>
                </div>
              </div>

              <div class="fileActions">
                <button type="button" class="iconBtn" @click="removeFile(idx)" title="Remove">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Card C -->
        <section ref="cardCRef" class="card">
          <div class="cardHead">
            <div class="hTitle">Member access (MemberBank)</div>
            <div class="hint">Click the button to open the overlay and pick members (multi-select).</div>
          </div>

          <div class="memberAccess">
            <button type="button" class="selectBtn full" @click="openMemberOverlay">
              <i class="fa-solid fa-users"></i>
              <span class="txt">{{ membersLabel }}</span>
              <span class="badge" v-if="selectedMemberIds.length">{{ selectedMemberIds.length }}</span>
              <i class="fa-solid fa-up-right-from-square ext"></i>
            </button>

            <div class="chips" v-if="selectedMemberIds.length">
              <button
                v-for="id in selectedMemberIds"
                :key="id"
                type="button"
                class="chip"
                @click="toggleMember(id)"
                :title="`Remove ${id}`"
              >
                <img
                  class="chipLogo"
                  :src="memberById(id)?.bankLogo || defaultBankLogo"
                  :alt="memberById(id)?.name || 'Bank logo'"
                  @error="onBankLogoError"
                />
                <span>{{ memberLabelById(id) }}</span>
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div class="miniHint">
              * You must select at least 1 member • To allow everyone, click “Select all” in the overlay.
            </div>
          </div>
        </section>

        <!-- Actions -->
        <div ref="actionsRef" class="actions">
          <button type="button" class="btn ghost" @click="resetAll" :disabled="loading">
            <i class="fa-solid fa-rotate-left"></i><span>Reset</span>
          </button>

          <button type="submit" class="btn" :disabled="loading || !canSubmit">
            <i class="fa-solid" :class="loading ? 'fa-spinner fa-spin' : 'fa-paper-plane'"></i>
            <span>{{ loading ? "Creating..." : "Create Announcement" }}</span>
          </button>
        </div>

        <!-- Keep inline messages as fallback -->
        <p v-if="errorMsg" class="msg err">
          <i class="fa-solid fa-triangle-exclamation"></i> {{ errorMsg }}
        </p>
        <p v-if="successMsg" class="msg ok">
          <i class="fa-solid fa-circle-check"></i> {{ successMsg }}
        </p>
      </form>
    </div>

    <!-- ✅ Modern Toast Alert -->
    <div class="toastHost" aria-live="polite" aria-relevant="additions text">
      <div
        v-if="toast.open"
        ref="toastRef"
        class="toast"
        :class="toast.type"
        role="status"
        :style="{ '--dur': toast.duration + 'ms' }"
      >
        <div class="toastIcon" aria-hidden="true">
          <i
            class="fa-solid"
            :class="toast.type === 'success' ? 'fa-circle-check' : toast.type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-info'"
          ></i>
        </div>

        <div class="toastBody">
          <div class="toastTitle">{{ toast.title }}</div>
          <div class="toastMsg">{{ toast.message }}</div>
        </div>

        <button class="toastClose" type="button" @click="hideToast()" title="Close">
          <i class="fa-solid fa-xmark"></i>
        </button>

        <div class="toastBar" aria-hidden="true"></div>
      </div>
    </div>

    <!-- Member overlay (GSAP) -->
    <div
      ref="memberOverlayRef"
      class="overlay"
      :class="{ isOpen: memberOverlayOpen }"
      :aria-hidden="!memberOverlayOpen"
      @click.self="closeMemberOverlay()"
    >
      <div ref="memberSheetRef" class="sheet" role="dialog" aria-modal="true">
        <div class="sheetHead">
          <div class="sheetTitle">
            <i class="fa-solid fa-users"></i>
            <div>
              <div class="t1">Select members</div>
              <div class="t2">MemberBank access • multi-select</div>
            </div>
          </div>

          <button class="iconBtn2" type="button" @click="closeMemberOverlay()" title="Close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="sheetTools">
          <div class="searchWrap">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input v-model.trim="memberQ" type="text" placeholder="Search member..." />
          </div>

          <div class="bulk">
            <button class="miniBtn2" type="button" @click="selectAllMembers">
              <i class="fa-solid fa-check-double"></i><span>Select all</span>
            </button>
            <button class="miniBtn2 ghost" type="button" @click="clearMembers">
              <i class="fa-solid fa-eraser"></i><span>Clear</span>
            </button>
          </div>
        </div>

        <div class="sheetList">
          <label v-for="m in filteredMembers" :key="m.id" class="mItem">
            <input type="checkbox" :checked="isMemberSelected(m.id)" @change="toggleMember(m.id)" />

            <img class="bankLogo" :src="m.bankLogo || defaultBankLogo" :alt="m.name" @error="onBankLogoError" />

            <span class="mName">{{ m.name }}</span>
            <span class="mId">{{ m.id }}</span>
          </label>

          <div class="empty" v-if="!filteredMembers.length">
            <span v-if="membersLoading">Loading members...</span>
            <span v-else-if="membersError">Failed to load members: {{ membersError }}</span>
            <span v-else>No members found.</span>
          </div>
        </div>

        <div class="sheetFoot">
          <div class="count">{{ selectedMemberIds.length }} selected</div>
          <button class="btn small" type="button" @click="closeMemberOverlay()">
            <i class="fa-solid fa-circle-check"></i><span>Done</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import gsap from "gsap";

/* -----------------------------
  API base
  ✅ Make submit "real" by calling the backend port (or use VITE_API_BASE).
  - If you use Vite proxy, set VITE_API_BASE="" and it will use relative URLs.
----------------------------- */
const API_BASE = ((import.meta?.env?.VITE_API_BASE ?? "") + "").replace(/\/+$/, "");
const API = (p) => (API_BASE ? `${API_BASE}${p}` : p);

/* -----------------------------
  Announcements endpoints
  ✅ Try both common mount paths
----------------------------- */
const ANNOUNCEMENTS_ENDPOINTS = [API("/api/announcements"), API("/api/membersbank/announcements")];

/* -----------------------------
  Form state
----------------------------- */
const title = ref("");
const body = ref("");

const maxTags = 12;
const tags = ref([]);
const tagDraft = ref("");

const accept = ".doc,.docx,.ppt,.pptx,.xls,.xlsx,.pdf,.txt,image/*,video/*";
const maxFiles = 10;
const maxFileMB = 50;

const files = ref([]);

const loading = ref(false);
const errorMsg = ref("");
const successMsg = ref("");

/* -----------------------------
  ✅ Modern toast (success / error)
----------------------------- */
const toastRef = ref(null);
const toast = reactive({
  open: false,
  type: "success", // success | error | info
  title: "",
  message: "",
  duration: 4200,
});
let toastTimer = null;

function showToast(type, title, message, duration = 4200) {
  clearTimeout(toastTimer);

  toast.type = type || "info";
  toast.title = title || (type === "success" ? "Success" : type === "error" ? "Error" : "Notice");
  toast.message = (message || "").toString();
  toast.duration = Number(duration) || 4200;
  toast.open = true;

  nextTick(() => {
    const el = toastRef.value;
    if (!el) return;
    gsap.killTweensOf(el);
    gsap.fromTo(el, { autoAlpha: 0, y: -10, x: 10, scale: 0.98 }, { autoAlpha: 1, y: 0, x: 0, scale: 1, duration: 0.22, ease: "power3.out" });
  });

  toastTimer = setTimeout(() => hideToast(), toast.duration);
}

function hideToast(immediate = false) {
  clearTimeout(toastTimer);
  const el = toastRef.value;

  if (immediate || !el) {
    toast.open = false;
    return;
  }

  gsap.killTweensOf(el);
  gsap.to(el, {
    autoAlpha: 0,
    y: -8,
    x: 10,
    scale: 0.985,
    duration: 0.18,
    ease: "power2.in",
    onComplete: () => {
      toast.open = false;
    },
  });
}

/* -----------------------------
  MemberBank (fetch from API)
----------------------------- */
const defaultBankLogo = "/bank-logos/default.png";
const MEMBERS_ENDPOINTS = [API("/api/members"), "http://localhost:3000/api/members"]; // fallback if API_BASE empty but no proxy

function buildFallbackMembers() {
  return Array.from({ length: 21 }, (_, i) => {
    const n = i + 1;
    const id = `MB${String(n).padStart(3, "0")}`;
    return {
      id,
      name: `MemberBank ${String(n).padStart(2, "0")}`,
      bankLogo: `/bank-logos/${id}.png`,
    };
  });
}

const members = ref(buildFallbackMembers());
const usingFallbackMembers = ref(true);

const membersLoading = ref(false);
const membersError = ref("");

function pickArrayFromApi(json) {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.members)) return json.members;
  if (Array.isArray(json?.result)) return json.result;
  return [];
}

function resolveBankLogo(val) {
  const s = (val ?? "").toString().trim();
  if (!s) return "";
  if (/^(https?:|data:|blob:)/i.test(s)) return s;
  if (s.startsWith("/")) return `http://localhost:3000${s}`;
  return `http://localhost:3000/${s.replace(/^\/+/, "")}`;
}

async function fetchJsonTry(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Fetch failed (${res.status})`);
  }
  return res.json();
}

async function fetchMembers() {
  membersLoading.value = true;
  membersError.value = "";

  try {
    let json = null;
    let lastErr = null;

    for (const url of MEMBERS_ENDPOINTS) {
      try {
        json = await fetchJsonTry(url);
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
      }
    }
    if (!json) throw lastErr || new Error("Fetch members failed.");

    const raw = pickArrayFromApi(json);

    const mapped = raw
      .map((r) => {
        const id = (r?.Bankcode ?? r?.BankCode ?? r?.bankcode ?? r?.code ?? r?.id ?? "").toString().trim();
        const name = (r?.BanknameLA ?? r?.BankNameLA ?? r?.banknameLA ?? r?.name ?? "").toString().trim();
        const bankLogo = resolveBankLogo(r?.image ?? r?.Image ?? r?.bankLogo ?? r?.logo ?? r?.bank_logo ?? "");

        const orderRaw =
          r?.idmember ?? r?.IdMember ?? r?.IDMEMBER ?? r?.memberId ?? r?.MemberId ?? r?.idMember ?? null;
        const orderNum = Number(orderRaw);
        const order = Number.isFinite(orderNum) ? orderNum : null;

        return { id, name, bankLogo, order };
      })
      .filter((m) => m.id && m.name);

    if (!mapped.length) throw new Error("Members API returned no usable rows.");

    mapped.sort((a, b) => {
      const ao = a.order ?? Number.POSITIVE_INFINITY;
      const bo = b.order ?? Number.POSITIVE_INFINITY;
      if (ao !== bo) return ao - bo;

      const aNum = Number(a.id);
      const bNum = Number(b.id);
      const aHasNum = Number.isFinite(aNum) && !Number.isNaN(aNum);
      const bHasNum = Number.isFinite(bNum) && !Number.isNaN(bNum);
      if (aHasNum && bHasNum && aNum !== bNum) return aNum - bNum;

      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });

    usingFallbackMembers.value = false;
    members.value = mapped.map(({ order, ...rest }) => rest);

    const set = new Set(members.value.map((m) => m.id));
    selectedMemberIds.value = selectedMemberIds.value.filter((id) => set.has(id));
  } catch (err) {
    usingFallbackMembers.value = true;
    members.value = buildFallbackMembers();
    membersError.value = (err?.message || "Fetch members failed.").toString();
  } finally {
    membersLoading.value = false;
  }
}

const selectedMemberIds = ref([]);
const memberQ = ref("");

const filteredMembers = computed(() => {
  const q = memberQ.value.toLowerCase();
  if (!q) return members.value;
  return members.value.filter((m) => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q));
});

function memberById(id) {
  return members.value.find((m) => m.id === id);
}

function onBankLogoError(e) {
  const img = e?.target;
  if (img && img.src !== defaultBankLogo) img.src = defaultBankLogo;
}

function isMemberSelected(id) {
  return selectedMemberIds.value.includes(id);
}
function toggleMember(id) {
  const arr = selectedMemberIds.value.slice();
  const i = arr.indexOf(id);
  if (i >= 0) arr.splice(i, 1);
  else arr.push(id);
  selectedMemberIds.value = arr;
}
function selectAllMembers() {
  selectedMemberIds.value = members.value.map((m) => m.id);
}
function clearMembers() {
  selectedMemberIds.value = [];
}
function memberLabelById(id) {
  const m = memberById(id);
  return m ? `${m.name} (${m.id})` : id;
}

const isAllSelected = computed(() => {
  return members.value.length > 0 && selectedMemberIds.value.length === members.value.length;
});

const membersLabel = computed(() => {
  if (!selectedMemberIds.value.length) return "Select members (required)";
  if (isAllSelected.value) return "All members selected";
  return `${selectedMemberIds.value.length} members selected`;
});

/* -----------------------------
  Validation
----------------------------- */
const canSubmit = computed(() => {
  const basic =
    title.value.trim().length > 0 &&
    body.value.trim().length > 0 &&
    selectedMemberIds.value.length > 0 &&
    !loading.value;

  if (!basic) return false;

  // If using fallback list (API failed), only allow submit when "Select all" (target_all=1)
  if (usingFallbackMembers.value && !isAllSelected.value) return false;

  return true;
});

/* -----------------------------
  Tags helpers
----------------------------- */
function normalizeTag(t) {
  return t.trim().replace(/^#/, "").replace(/\s+/g, "_").replace(/[^\w\-]/g, "").slice(0, 28);
}
function addTagsFromDraft() {
  const raw = tagDraft.value || "";
  const parts = raw
    .split(",")
    .map((x) => normalizeTag(x))
    .filter(Boolean);

  if (!parts.length) return;

  const set = new Set(tags.value);
  for (const p of parts) {
    if (set.size >= maxTags) break;
    set.add(p);
  }
  tags.value = Array.from(set);
  tagDraft.value = "";
}
function onTagKeydown(e) {
  if (e.key === ",") {
    e.preventDefault();
    addTagsFromDraft();
  }
}
function removeTag(t) {
  tags.value = tags.value.filter((x) => x !== t);
}

/* -----------------------------
  File upload (drag/drop + preview)
----------------------------- */
const fileInputRef = ref(null);
const dropzoneRef = ref(null);
const isDragOver = ref(false);

function openFilePicker() {
  fileInputRef.value?.click();
}
function onDragOver() {
  isDragOver.value = true;
}
function onDragLeave() {
  isDragOver.value = false;
}
function onDrop(e) {
  isDragOver.value = false;
  const list = Array.from(e.dataTransfer?.files || []);
  addFiles(list);
}
function onFilePick(e) {
  const list = Array.from(e.target.files || []);
  addFiles(list);
  e.target.value = "";
}

function addFiles(list) {
  errorMsg.value = "";
  successMsg.value = "";

  if (!list.length) return;

  const current = files.value.slice();
  const remain = Math.max(0, maxFiles - current.length);
  if (remain <= 0) {
    errorMsg.value = `You can upload up to ${maxFiles} files.`;
    showToast("error", "Upload limit", errorMsg.value, 5200);
    return;
  }

  const maxBytes = maxFileMB * 1024 * 1024;

  const toAdd = [];
  for (const f of list.slice(0, remain)) {
    if (f.size > maxBytes) {
      errorMsg.value = `File too large: ${f.name} (max ${maxFileMB}MB)`;
      showToast("error", "File too large", errorMsg.value, 5200);
      continue;
    }

    const withMeta = f;
    withMeta._key = `${f.name}-${f.size}-${f.lastModified}-${Math.random().toString(16).slice(2)}`;
    if (isImage(withMeta) || isVideo(withMeta)) withMeta._previewUrl = URL.createObjectURL(withMeta);
    else withMeta._previewUrl = "";
    toAdd.push(withMeta);
  }

  files.value = current.concat(toAdd);
}

function removeFile(idx) {
  const arr = files.value.slice();
  const f = arr[idx];
  if (f?._previewUrl) URL.revokeObjectURL(f._previewUrl);
  arr.splice(idx, 1);
  files.value = arr;
}

function isImage(f) {
  return (f.type || "").startsWith("image/");
}
function isVideo(f) {
  return (f.type || "").startsWith("video/");
}
function isPreviewable(f) {
  return isImage(f) || isVideo(f);
}

function prettySize(bytes) {
  const n = Number(bytes || 0);
  if (n < 1024) return `${n} B`;
  const kb = n / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

function fileIconClass(f) {
  const name = (f.name || "").toLowerCase();
  const type = (f.type || "").toLowerCase();
  if (type.startsWith("image/")) return "fa-image";
  if (type.startsWith("video/")) return "fa-video";
  if (name.endsWith(".pdf")) return "fa-file-pdf";
  if (name.endsWith(".doc") || name.endsWith(".docx")) return "fa-file-word";
  if (name.endsWith(".ppt") || name.endsWith(".pptx")) return "fa-file-powerpoint";
  if (name.endsWith(".xls") || name.endsWith(".xlsx")) return "fa-file-excel";
  if (name.endsWith(".txt")) return "fa-file-lines";
  return "fa-file";
}

/* -----------------------------
  Submit (multipart/form-data)
----------------------------- */
function buildFormData(fileFieldName = "attachments") {
  const fd = new FormData();

  const cleanTitle = title.value.trim();
  const cleanBody = body.value.trim();

  fd.append("title", cleanTitle);

  fd.append("body", cleanBody);
  fd.append("paragraph", cleanBody);
  fd.append("detail", cleanBody);

  fd.append("tags", JSON.stringify(tags.value || []));

  const ids = selectedMemberIds.value.slice();
  const all = isAllSelected.value;

  fd.append("target_all", all ? "1" : "0");

  const idsPayload = all ? [] : ids;
  fd.append("memberIds", JSON.stringify(idsPayload));
  fd.append("member_ids", JSON.stringify(idsPayload));

  fd.append("status", "published");
  fd.append("collect_email", "0");

  for (const f of files.value) fd.append(fileFieldName, f);

  return fd;
}

async function readErrorMessage(res) {
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("application/json")) {
    const j = await res.json().catch(() => null);
    if (!j) return `Request failed (${res.status})`;

    if (j?.message && Array.isArray(j?.missing) && j.missing.length) {
      return `${j.message}: ${j.missing.join(", ")}`;
    }
    if (j?.message) return String(j.message);
    return `Request failed (${res.status})`;
  }

  const txt = await res.text().catch(() => "");
  if (!txt) return `Request failed (${res.status})`;

  try {
    const j = JSON.parse(txt);
    if (j?.message && Array.isArray(j?.missing) && j.missing.length) return `${j.message}: ${j.missing.join(", ")}`;
    if (j?.message) return String(j.message);
  } catch {}

  return txt;
}

function looksLikeUnexpectedField(msg) {
  const s = (msg || "").toString().toLowerCase();
  return s.includes("unexpected field") || s.includes("limit_unexpected_file") || s.includes("multererror");
}

async function submit() {
  errorMsg.value = "";
  successMsg.value = "";

  if (!canSubmit.value) {
    if (usingFallbackMembers.value && !isAllSelected.value) {
      errorMsg.value =
        "Members API failed, and your selected IDs may not exist in DB. Please fix /api/members, or click “Select all” to submit as target_all.";
      showToast("error", "Cannot submit", errorMsg.value, 6500);
      return;
    }
    errorMsg.value = "Please fill in Title, Paragraph, and select at least 1 member.";
    showToast("error", "Missing fields", errorMsg.value, 5200);
    return;
  }

  loading.value = true;

  try {
    let lastErr = null;

    for (const url of ANNOUNCEMENTS_ENDPOINTS) {
      for (const fileField of ["attachments", "files"]) {
        try {
          const fd = buildFormData(fileField);
          const res = await fetch(url, { method: "POST", body: fd });

          if (!res.ok) {
            const msg = await readErrorMessage(res);

            if (res.status === 404) {
              lastErr = new Error(`Not found: ${url}`);
              break;
            }

            if (res.status === 400 && looksLikeUnexpectedField(msg) && fileField === "attachments") {
              lastErr = new Error(msg);
              continue;
            }

            throw new Error(msg);
          }

          let data = null;
          try {
            data = await res.json();
          } catch {}

          const msg = data?.id
            ? `Announcement created successfully! (ID: ${data.id})`
            : "Announcement created successfully!";

          successMsg.value = msg;

          // ✅ Modern success alert
          showToast("success", "Saved successfully", msg, 4200);

          resetAll(false);
          return;
        } catch (e) {
          lastErr = e;
        }
      }
    }

    throw lastErr || new Error("Create announcement failed.");
  } catch (err) {
    errorMsg.value = (err?.message || "Create announcement failed.").toString();
    showToast("error", "Save failed", errorMsg.value, 6500);
  } finally {
    loading.value = false;
  }
}

function resetAll(clearMsgs = true) {
  title.value = "";
  body.value = "";
  tags.value = [];
  tagDraft.value = "";
  memberQ.value = "";
  selectedMemberIds.value = [];

  for (const f of files.value) {
    if (f?._previewUrl) URL.revokeObjectURL(f._previewUrl);
  }
  files.value = [];

  if (clearMsgs) {
    errorMsg.value = "";
    successMsg.value = "";
  }
}

/* -----------------------------
  GSAP entrance
----------------------------- */
const topbarRef = ref(null);
const cardARef = ref(null);
const cardBRef = ref(null);
const cardCRef = ref(null);
const actionsRef = ref(null);

let ctx;

/* -----------------------------
  Member overlay (GSAP) + navigation lock fix
----------------------------- */
const memberOverlayRef = ref(null);
const memberSheetRef = ref(null);
const memberOverlayOpen = ref(false);
let memberTl = null;

function setBodyLock(lock) {
  document.documentElement.style.overflow = lock ? "hidden" : "";
  document.body.style.overflow = lock ? "hidden" : "";
}

function closeMemberOverlay(immediate = false) {
  const overlay = memberOverlayRef.value;
  const sheet = memberSheetRef.value;

  memberOverlayOpen.value = false;
  setBodyLock(false);

  if (!overlay || !sheet) return;

  gsap.killTweensOf([overlay, sheet]);
  memberTl?.kill();

  if (immediate) {
    gsap.set(overlay, { display: "none", autoAlpha: 0, pointerEvents: "none" });
    gsap.set(sheet, { autoAlpha: 0, y: 16, scale: 0.985 });
    return;
  }

  gsap.set(overlay, { pointerEvents: "none" });

  memberTl = gsap.timeline({
    onComplete: () => {
      gsap.set(overlay, { display: "none" });
    },
  });

  memberTl
    .to(sheet, { autoAlpha: 0, y: 16, scale: 0.985, duration: 0.16, ease: "power2.in" }, 0)
    .to(overlay, { autoAlpha: 0, duration: 0.16, ease: "power2.in" }, 0.02);
}

async function openMemberOverlay() {
  memberOverlayOpen.value = true;
  setBodyLock(true);

  await nextTick();

  const overlay = memberOverlayRef.value;
  const sheet = memberSheetRef.value;
  if (!overlay || !sheet) return;

  gsap.killTweensOf([overlay, sheet]);
  memberTl?.kill();

  gsap.set(overlay, { display: "flex", autoAlpha: 0, pointerEvents: "auto" });
  gsap.set(sheet, { autoAlpha: 0, y: 24, scale: 0.98 });

  memberTl = gsap.timeline();
  memberTl
    .to(overlay, { autoAlpha: 1, duration: 0.18, ease: "power2.out" }, 0)
    .to(sheet, { autoAlpha: 1, y: 0, scale: 1, duration: 0.24, ease: "power3.out" }, 0.02);

  nextTick(() => {
    const input = sheet.querySelector("input");
    input?.focus?.();
  });
}

onBeforeRouteLeave(() => {
  closeMemberOverlay(true);
  hideToast(true);
});

function onKeydown(e) {
  if (e.key === "Escape") {
    if (memberOverlayOpen.value) closeMemberOverlay();
    if (toast.open) hideToast();
  }
}

onMounted(() => {
  fetchMembers();

  ctx = gsap.context(() => {
    gsap.set([cardARef.value, cardBRef.value, cardCRef.value, actionsRef.value], { autoAlpha: 0, y: 18 });

    gsap.fromTo(
      topbarRef.value,
      { autoAlpha: 0, y: -14 },
      { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out" }
    );

    gsap.to([cardARef.value, cardBRef.value, cardCRef.value, actionsRef.value], {
      autoAlpha: 1,
      y: 0,
      duration: 0.5,
      ease: "power3.out",
      stagger: 0.08,
      delay: 0.08,
    });

    if (memberOverlayRef.value)
      gsap.set(memberOverlayRef.value, { display: "none", autoAlpha: 0, pointerEvents: "none" });
  });

  document.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKeydown);

  for (const f of files.value) {
    if (f?._previewUrl) URL.revokeObjectURL(f._previewUrl);
  }

  closeMemberOverlay(true);
  hideToast(true);

  ctx?.revert();
});

watch(
  () => files.value.length,
  async () => {
    await nextTick();
    const rows = document.querySelectorAll(".fileRow");
    if (!rows?.length) return;
    gsap.fromTo(
      rows[rows.length - 1],
      { autoAlpha: 0, y: 10 },
      { autoAlpha: 1, y: 0, duration: 0.22, ease: "power2.out" }
    );
  }
);
</script>

<style scoped>
/* ===== Full container layout ===== */
.page.annPage {
  padding: 18px 18px 28px;
  min-height: calc(100vh - 12px);
}
.annInner {
  width: 100%;
  max-width: 100%;
  margin: 0;
}

/* ===== Topbar ===== */
.topbar {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 14px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(8, 16, 38, 0.55);
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.28);
  margin-bottom: 14px;
}

.titleRow {
  display: flex;
  align-items: center;
  gap: 12px;
}
.titleIcon {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 30% 30%, rgba(90, 180, 255, 0.25), rgba(0, 0, 0, 0));
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.titleIcon i {
  font-size: 18px;
  color: rgba(210, 235, 255, 0.95);
}
.pageTitle {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.2px;
  color: rgba(240, 250, 255, 0.98);
}
.pageSub {
  font-size: 12px;
  color: rgba(210, 235, 255, 0.7);
  margin-top: 2px;
}

/* ===== Content ===== */
.content {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ===== Cards ===== */
.card {
  width: 100%;
  border-radius: 18px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(8, 16, 38, 0.45);
  backdrop-filter: blur(10px);
  box-shadow: 0 12px 34px rgba(0, 0, 0, 0.25);
}
.cardHead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}
.hTitle {
  font-size: 13px;
  font-weight: 900;
  color: rgba(240, 250, 255, 0.95);
}
.hint {
  font-size: 12px;
  color: rgba(210, 235, 255, 0.65);
}

/* ===== Fields ===== */
.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}
.field .label {
  display: inline-block;
  font-size: 12px;
  font-weight: 800;
  color: rgba(230, 245, 255, 0.88);
  margin-bottom: 6px;
}
.req {
  color: rgba(255, 120, 120, 0.95);
}
.inputWrap {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(10, 20, 45, 0.42);
}
.inputWrap i {
  opacity: 0.8;
}
.inputWrap input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: rgba(240, 250, 255, 0.95);
  font-size: 13px;
}
.textarea {
  width: 100%;
  padding: 12px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(10, 20, 45, 0.42);
  color: rgba(240, 250, 255, 0.95);
  outline: 0;
  resize: vertical;
}
.miniHint {
  margin-top: 6px;
  font-size: 11px;
  color: rgba(210, 235, 255, 0.62);
}

/* ===== Tags ===== */
.tagInput {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(10, 20, 45, 0.42);
}
.tagInput input {
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: rgba(240, 250, 255, 0.95);
  font-size: 13px;
}
.miniBtn {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(90, 180, 255, 0.12);
  color: rgba(240, 250, 255, 0.95);
  cursor: pointer;
}
.miniBtn:hover {
  background: rgba(90, 180, 255, 0.18);
}
.tagPills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.pillTag {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(90, 180, 255, 0.11);
  color: rgba(240, 250, 255, 0.95);
  border-radius: 999px;
  padding: 7px 10px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.pillTag:hover {
  background: rgba(90, 180, 255, 0.16);
}

/* ===== Dropzone ===== */
.dropzone {
  border-radius: 18px;
  border: 1px dashed rgba(255, 255, 255, 0.14);
  background: rgba(10, 20, 45, 0.28);
  overflow: hidden;
}
.dropzone.dragOver {
  border-color: rgba(90, 180, 255, 0.55);
  background: rgba(90, 180, 255, 0.08);
}
.fileInput {
  display: none;
}
.dzInner {
  padding: 14px;
  display: grid;
  grid-template-columns: 52px 1fr auto;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}
.dzIcon {
  width: 52px;
  height: 52px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 30% 30%, rgba(90, 180, 255, 0.25), rgba(0, 0, 0, 0));
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.dzIcon i {
  font-size: 18px;
  color: rgba(230, 245, 255, 0.95);
}
.dzTitle {
  font-size: 13px;
  font-weight: 900;
  color: rgba(240, 250, 255, 0.95);
}
.dzSub {
  margin-top: 3px;
  font-size: 11px;
  color: rgba(210, 235, 255, 0.65);
}

.fileList {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.fileRow {
  display: grid;
  grid-template-columns: 44px 1fr 40px;
  gap: 12px;
  padding: 10px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(10, 20, 45, 0.38);
}
.fileIcon {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(90, 180, 255, 0.1);
}
.fileIcon i {
  opacity: 0.9;
}
.fileMeta {
  min-width: 0;
}
.fileName {
  font-size: 13px;
  font-weight: 800;
  color: rgba(240, 250, 255, 0.95);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.fileSub {
  margin-top: 3px;
  font-size: 11px;
  color: rgba(210, 235, 255, 0.65);
}
.preview {
  margin-top: 10px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.15);
}
.preview img {
  width: 100%;
  display: block;
  max-height: 260px;
  object-fit: contain;
}
.preview video {
  width: 100%;
  display: block;
  max-height: 260px;
}
.fileActions {
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
}
.iconBtn {
  width: 36px;
  height: 36px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 90, 90, 0.08);
  color: rgba(240, 250, 255, 0.92);
  cursor: pointer;
}
.iconBtn:hover {
  background: rgba(255, 90, 90, 0.14);
}

/* ===== Member access ===== */
.memberAccess {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.selectBtn {
  padding: 11px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(10, 20, 45, 0.42);
  color: rgba(240, 250, 255, 0.95);
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}
.selectBtn.full {
  width: 100%;
  justify-content: space-between;
}
.selectBtn .txt {
  flex: 1;
  text-align: left;
  font-size: 13px;
  font-weight: 900;
  opacity: 0.92;
}
.badge {
  min-width: 26px;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 900;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(90, 180, 255, 0.16);
}
.ext {
  opacity: 0.8;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chip {
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(90, 180, 255, 0.11);
  color: rgba(240, 250, 255, 0.95);
  padding: 7px 10px;
  font-size: 12px;
  display: inline-flex;
  gap: 8px;
  align-items: center;
  cursor: pointer;
}
.chip:hover {
  background: rgba(90, 180, 255, 0.16);
}

.chipLogo {
  width: 18px;
  height: 18px;
  border-radius: 7px;
  object-fit: contain;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
}

/* ===== Buttons / Actions ===== */
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 2px;
}
.btn {
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(90, 180, 255, 0.18);
  color: rgba(240, 250, 255, 0.95);
  padding: 10px 12px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-weight: 900;
  font-size: 12px;
}
.btn:hover {
  background: rgba(90, 180, 255, 0.24);
}
.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.btn.ghost {
  background: rgba(255, 255, 255, 0.06);
}
.btn.ghost:hover {
  background: rgba(255, 255, 255, 0.1);
}
.btn.small {
  padding: 8px 10px;
  font-size: 12px;
}
.btn.ghost.small {
  padding: 8px 10px;
}

/* ===== Messages ===== */
.msg {
  margin-top: 6px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  font-weight: 800;
}
.msg.err {
  background: rgba(255, 90, 90, 0.08);
  color: rgba(255, 210, 210, 0.95);
}
.msg.ok {
  background: rgba(80, 255, 180, 0.08);
  color: rgba(210, 255, 235, 0.95);
}

/* ===== ✅ Toast (Modern Alert) ===== */
.toastHost {
  position: fixed;
  top: 14px;
  right: 14px;
  z-index: 10000;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.toast {
  pointer-events: auto;
  width: min(420px, calc(100vw - 28px));
  display: grid;
  grid-template-columns: 46px 1fr 38px;
  align-items: start;
  gap: 10px;
  padding: 12px 12px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: linear-gradient(180deg, rgba(10, 20, 45, 0.88), rgba(8, 16, 38, 0.82));
  backdrop-filter: blur(10px);
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.5);
  position: relative;
  overflow: hidden;
}
.toast::before {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: 18px;
  padding: 1px;
  background: radial-gradient(circle at 20% 20%, rgba(90, 180, 255, 0.22), rgba(0, 0, 0, 0));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
.toastIcon {
  width: 46px;
  height: 46px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(90, 180, 255, 0.12);
  color: rgba(240, 250, 255, 0.95);
}
.toast.success .toastIcon {
  background: rgba(80, 255, 180, 0.12);
}
.toast.error .toastIcon {
  background: rgba(255, 90, 90, 0.12);
}
.toastBody {
  min-width: 0;
}
.toastTitle {
  font-size: 12px;
  font-weight: 950;
  color: rgba(245, 252, 255, 0.98);
  letter-spacing: 0.2px;
}
.toastMsg {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(210, 235, 255, 0.75);
  line-height: 1.35;
  word-break: break-word;
}
.toastClose {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(240, 250, 255, 0.9);
  cursor: pointer;
}
.toastClose:hover {
  background: rgba(255, 255, 255, 0.1);
}
.toastBar {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 8px;
  height: 3px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.10);
  overflow: hidden;
}
.toastBar::after {
  content: "";
  display: block;
  height: 100%;
  width: 100%;
  transform-origin: left;
  transform: scaleX(1);
  background: rgba(90, 180, 255, 0.75);
  animation: toastBar var(--dur) linear forwards;
}
.toast.success .toastBar::after {
  background: rgba(80, 255, 180, 0.8);
}
.toast.error .toastBar::after {
  background: rgba(255, 90, 90, 0.8);
}
@keyframes toastBar {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

/* ===== Overlay ===== */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: none; /* GSAP set to flex */
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(0, 0, 0, 0.52);
  backdrop-filter: blur(10px);

  pointer-events: none;
}
.overlay.isOpen {
  pointer-events: auto;
}

.sheet {
  width: min(820px, 96vw);
  max-height: min(760px, 88vh);
  display: flex;
  flex-direction: column;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(8, 16, 38, 0.86);
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}
.sheetHead {
  padding: 14px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.sheetTitle {
  display: flex;
  align-items: center;
  gap: 12px;
  color: rgba(240, 250, 255, 0.95);
}
.sheetTitle i {
  width: 42px;
  height: 42px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: rgba(90, 180, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.t1 {
  font-size: 13px;
  font-weight: 900;
}
.t2 {
  font-size: 12px;
  color: rgba(210, 235, 255, 0.68);
  margin-top: 2px;
}
.iconBtn2 {
  width: 40px;
  height: 40px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 90, 90, 0.08);
  color: rgba(240, 250, 255, 0.92);
  cursor: pointer;
}
.iconBtn2:hover {
  background: rgba(255, 90, 90, 0.14);
}

.sheetTools {
  padding: 12px 12px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.searchWrap {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(10, 20, 45, 0.42);
}
.searchWrap input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: rgba(240, 250, 255, 0.95);
  font-size: 12px;
}
.bulk {
  display: flex;
  gap: 8px;
  align-items: center;
}
.miniBtn2 {
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(90, 180, 255, 0.12);
  color: rgba(240, 250, 255, 0.95);
  padding: 10px 12px;
  font-size: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}
.miniBtn2.ghost {
  background: rgba(255, 255, 255, 0.06);
}
.miniBtn2:hover {
  background: rgba(90, 180, 255, 0.18);
}
.miniBtn2.ghost:hover {
  background: rgba(255, 255, 255, 0.1);
}

.sheetList {
  padding: 8px;
  overflow: auto;
  flex: 1;
}
.mItem {
  width: 100%;
  padding: 12px 12px;
  border-radius: 16px;
  display: grid;
  grid-template-columns: 18px 34px 1fr auto;
  align-items: center;
  gap: 12px;
  color: rgba(240, 250, 255, 0.92);
  cursor: pointer;
}
.mItem:hover {
  background: rgba(90, 180, 255, 0.12);
}
.bankLogo {
  width: 30px;
  height: 30px;
  border-radius: 12px;
  object-fit: contain;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
}
.mName {
  font-size: 12px;
  font-weight: 900;
}
.mId {
  font-size: 11px;
  color: rgba(210, 235, 255, 0.68);
}
.empty {
  padding: 16px 10px;
  text-align: center;
  font-size: 12px;
  color: rgba(210, 235, 255, 0.65);
}

.sheetFoot {
  padding: 12px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.count {
  font-size: 12px;
  color: rgba(210, 235, 255, 0.72);
  font-weight: 900;
}

/* ===== Responsive ===== */
@media (max-width: 900px) {
  .grid2 {
    grid-template-columns: 1fr;
  }
  .dzInner {
    grid-template-columns: 52px 1fr;
  }
  .dzBtn {
    display: none;
  }
  .sheetTools {
    grid-template-columns: 1fr;
  }
  .bulk {
    justify-content: flex-end;
  }
  .toastHost {
    left: 14px;
    right: 14px;
  }
}
</style>
