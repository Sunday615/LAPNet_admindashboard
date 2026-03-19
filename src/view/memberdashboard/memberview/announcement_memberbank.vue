<template>
  <section class="viewer">
    <!-- Header -->
    <header class="head card">
      <div class="headLeft">
        <div class="kicker">Viewer</div>
        <h2 class="title">Announcements</h2>
        <p class="sub">Important notices and updates</p>
      </div>

      <div class="headRight">
        <div class="controls">
          <div class="field">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input
              v-model.trim="query"
              class="input"
              type="search"
              placeholder="Search…"
              aria-label="Search announcements"
            />
          </div>

          <label class="chip" title="Show unread only">
            <input v-model="unreadOnly" type="checkbox" />
            Unread only
          </label>

          <button class="btn" @click="markAllAsRead" :disabled="!announcements.length">
            <i class="fa-solid fa-check-double"></i>
            Mark all read
          </button>

          <button class="btn primary" @click="refresh" :disabled="loading">
            <i class="fa-solid fa-rotate"></i>
            {{ loading ? "Loading…" : "Refresh" }}
          </button>
        </div>

        <div class="metaRow">
          <span class="metaPill">
            <i class="fa-solid fa-bullhorn"></i>
            {{ announcements.length }} items
          </span>
          <span class="metaPill" v-if="unreadCount > 0">
            <i class="fa-solid fa-circle"></i>
            {{ unreadCount }} unread
          </span>
        </div>
      </div>
    </header>

    <!-- Error -->
    <div v-if="error" class="error card">
      <div class="errorTop">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <strong>Failed to load announcements</strong>
      </div>
      <div class="errorMsg">{{ error }}</div>
      <button class="btn primary" @click="refresh">
        <i class="fa-solid fa-rotate"></i>
        Try again
      </button>
    </div>

    <!-- List -->
    <div v-else class="list">
      <div v-if="loading" class="skeleton">
        <div class="sk" v-for="i in 6" :key="i"></div>
      </div>

      <template v-else>
        <article
          v-for="item in filteredAnnouncements"
          :key="item.id"
          class="row card"
          :class="{ unread: !isRead(item.id) }"
          role="button"
          tabindex="0"
          @click="open(item)"
          @keydown.enter.prevent="open(item)"
          @keydown.space.prevent="open(item)"
        >
          <div class="rowLeft">
            <div class="rowTop">
              <h3 class="rowTitle">{{ item.title }}</h3>
              <span v-if="!isRead(item.id)" class="dot" title="Unread"></span>

              <span v-if="item.preview.type !== 'none'" class="badge">
                <i :class="previewBadgeIcon(item.preview.type)"></i>
                {{ previewBadgeText(item.preview.type) }}
              </span>
            </div>

            <p class="rowSummary">
              {{ item.summary }}
            </p>

            <div class="rowMeta">
              <span class="meta">
                <i class="fa-regular fa-clock"></i>
                {{ formatDate(item.date) }}
              </span>
            </div>
          </div>

          <div class="rowRight">
            <button class="linkBtn" @click.stop="open(item)">
              Open <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </article>

        <div v-if="filteredAnnouncements.length === 0" class="empty card">
          <i class="fa-regular fa-folder-open"></i>
          <div>
            <div class="emptyTitle">No announcements found</div>
            <div class="emptySub">Try clearing search or switching filter.</div>
          </div>
        </div>
      </template>
    </div>

    <!-- Overlay / Modal -->
    <teleport to="body">
      <transition name="fade">
        <div v-if="selected" class="overlay" @click.self="close" role="dialog" aria-modal="true">
          <div class="modal card">
            <header class="modalHead">
              <div class="modalHeadLeft">
                <div class="modalKicker">Announcement</div>
                <h3 class="modalTitle">{{ selected.title }}</h3>
                <div class="modalMeta">
                  <span class="meta">
                    <i class="fa-regular fa-clock"></i>
                    {{ formatDate(selected.date) }}
                  </span>

                  <span v-if="selected.preview.type !== 'none'" class="badge">
                    <i :class="previewBadgeIcon(selected.preview.type)"></i>
                    {{ previewBadgeText(selected.preview.type) }}
                  </span>
                </div>
              </div>

              <div class="modalHeadRight">
                <button class="btn" @click="markSelectedAsRead">
                  <i class="fa-solid fa-check"></i>
                  Mark as read
                </button>
                <button class="btn danger" @click="close" aria-label="Close">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>
            </header>

            <div class="modalBody">
              <section class="content cardInner">
                <div class="sectionTitle">
                  <i class="fa-regular fa-file-lines"></i>
                  Key information
                </div>
                <p class="contentText">
                  {{ selected.content || selected.summary }}
                </p>
              </section>

              <section v-if="selected.preview.type !== 'none'" class="preview cardInner">
                <div class="sectionTitle">
                  <i class="fa-solid fa-eye"></i>
                  Preview
                </div>

                <div v-if="assetLoading" class="assetState">
                  <i class="fa-solid fa-spinner fa-spin"></i>
                  <span>Loading file preview…</span>
                </div>

                <div v-else-if="assetError" class="assetState assetStateError">
                  <i class="fa-solid fa-triangle-exclamation"></i>
                  <span>{{ assetError }}</span>
                </div>

                <template v-else>
                  <img
                    v-if="selected.preview.type === 'image' && resolvedPreviewUrl"
                    class="img"
                    :src="resolvedPreviewUrl"
                    :alt="selected.title"
                    loading="lazy"
                  />

                  <iframe
                    v-else-if="selected.preview.type === 'pdf' && resolvedPreviewUrl"
                    class="pdf"
                    :src="pdfEmbedUrl(resolvedPreviewUrl)"
                    title="PDF preview"
                  ></iframe>

                  <div
                    v-else-if="selected.preview.type === 'word'"
                    class="wordPreview"
                  >
                    <div class="wordPreviewIcon">
                      <i class="fa-regular fa-file-word"></i>
                    </div>

                    <div class="wordPreviewBody">
                      <div class="wordPreviewTitle">
                        {{ selected.preview.name || "Word document" }}
                      </div>
                      <div class="wordPreviewSub">
                        Inline preview for secured Word files is not supported in most browsers.
                        Use Open in new tab or Download file.
                      </div>
                    </div>
                  </div>

                  <div
                    v-else-if="resolvedPreviewUrl"
                    class="wordPreview"
                  >
                    <div class="wordPreviewIcon">
                      <i class="fa-regular fa-file"></i>
                    </div>

                    <div class="wordPreviewBody">
                      <div class="wordPreviewTitle">
                        {{ selected.preview.name || "Attachment" }}
                      </div>
                      <div class="wordPreviewSub">
                        Preview is not available for this file type. You can still open or download it.
                      </div>
                    </div>
                  </div>

                  <div v-else class="assetState">
                    <i class="fa-regular fa-file"></i>
                    <span>No preview available</span>
                  </div>
                </template>

                <div class="previewActions">
                  <button
                    class="btn"
                    @click="openSelectedPreviewInNewTab"
                    :disabled="assetLoading || !canOpenSelectedPreview"
                  >
                    <i class="fa-solid fa-up-right-from-square"></i>
                    Open in new tab
                  </button>

                  <button
                    class="btn primary"
                    @click="downloadSelectedPreview"
                    :disabled="assetLoading || !canDownloadSelectedPreview"
                  >
                    <i class="fa-solid fa-download"></i>
                    Download file
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

// ---- API base (.env only)
function resolveApiBase() {
  const raw = String(import.meta?.env?.VITE_API_BASE_URL || "").trim();
  return raw.replace(/\/+$/, "");
}

function joinBaseAndPath(baseUrl, path) {
  const p = String(path || "");
  if (!baseUrl) return p;
  const b = String(baseUrl || "").replace(/\/+$/, "");
  const pp = p.startsWith("/") ? p : `/${p}`;
  if (b.endsWith("/api") && pp.startsWith("/api/")) return b + pp.slice(4);
  return b + pp;
}

const API_BASE = resolveApiBase();
const API_URL = joinBaseAndPath(API_BASE, "/api/announcements");
const USERS_URL = joinBaseAndPath(API_BASE, "/api/users/");

/* Year format: Anno Domini */
const AD_LABEL = "";

// ---- Optional auth header
function readToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token") || "";
}

function authHeaders() {
  const t = readToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// ---- Per-user storage key
function safeJsonParse(x) {
  try {
    return JSON.parse(String(x));
  } catch {
    return null;
  }
}

function readUserFromStorage() {
  const u1 = localStorage.getItem("user");
  if (u1) return safeJsonParse(u1);
  const u2 = sessionStorage.getItem("user");
  if (u2) return safeJsonParse(u2);
  return null;
}

function getUserKey() {
  const u = readUserFromStorage();
  return String(u?.id || u?.user_id || u?.username || u?.email || "anon");
}

function getStorageKey() {
  return `announcement_read_ids_v1_${getUserKey()}`;
}

// ---- state
const loading = ref(false);
const error = ref("");
const raw = ref([]);

const userBankcode = ref("");
const usersError = ref("");

const query = ref("");
const unreadOnly = ref(false);

const selected = ref(null);

// ---- attachment asset state
const assetLoading = ref(false);
const assetError = ref("");
const resolvedPreviewUrl = ref("");
const resolvedPreviewMime = ref("");
const resolvedPreviewName = ref("");

const assetCache = new Map();
const createdObjectUrls = new Set();

// ---- read set
const readSet = ref(loadReadSet());

function loadReadSet() {
  try {
    const rawValue = localStorage.getItem(getStorageKey());
    const arr = rawValue ? JSON.parse(rawValue) : [];
    return new Set(arr.map(String));
  } catch {
    return new Set();
  }
}

function persistReadSet(set) {
  localStorage.setItem(getStorageKey(), JSON.stringify([...set]));
}

function isRead(id) {
  return readSet.value.has(String(id));
}

function markRead(id) {
  const next = new Set(readSet.value);
  next.add(String(id));
  readSet.value = next;
  persistReadSet(next);
}

function markAllAsRead() {
  const next = new Set(readSet.value);
  for (const a of announcements.value) next.add(String(a.id));
  readSet.value = next;
  persistReadSet(next);
}

function markSelectedAsRead() {
  if (!selected.value) return;
  markRead(selected.value.id);
}

// ---- helpers
function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);

  const dd = String(d.getDate()).padStart(2, "0");
  const mon = d.toLocaleString(undefined, { month: "short" });
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");

  return `${dd} ${mon} ${AD_LABEL} ${yyyy} ${hh}:${mm}`;
}

function truncateText(text, max = 160) {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function getExt(url = "") {
  const clean = String(url).split("?")[0].toLowerCase();
  const parts = clean.split(".");
  return parts.length > 1 ? parts.pop() : "";
}

function fileNameFromUrl(url = "") {
  try {
    const clean = String(url).split("?")[0];
    const parts = clean.split("/");
    return decodeURIComponent(parts[parts.length - 1] || "file");
  } catch {
    return "file";
  }
}

function detectPreviewTypeFromUrl(url) {
  const ext = getExt(url);
  const img = new Set(["png", "jpg", "jpeg", "gif", "webp", "bmp"]);
  const word = new Set(["doc", "docx"]);

  if (img.has(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (word.has(ext)) return "word";
  return "file";
}

function detectPreviewTypeFromMime(mime = "") {
  const m = String(mime).toLowerCase().trim();
  if (!m) return "none";
  if (m.startsWith("image/")) return "image";
  if (m === "application/pdf") return "pdf";
  if (
    m === "application/msword" ||
    m === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "word";
  }
  return "file";
}

function pdfEmbedUrl(url) {
  const hasHash = String(url).includes("#");
  return hasHash ? url : `${url}#toolbar=0&navpanes=0&scrollbar=1`;
}

function resolveAssetUrl(url) {
  if (!url) return "";
  const s = String(url).trim();
  if (/^(https?:|data:|blob:)/i.test(s)) return s;

  const origin = (API_BASE.endsWith("/api") ? API_BASE.slice(0, -4) : API_BASE) || window.location.origin;

  if (!s.startsWith("/")) return `${origin}/${s}`;
  return `${origin}${s}`;
}

function previewBadgeIcon(type) {
  if (type === "image") return "fa-regular fa-image";
  if (type === "pdf") return "fa-regular fa-file-pdf";
  if (type === "word") return "fa-regular fa-file-word";
  return "fa-regular fa-file";
}

function previewBadgeText(type) {
  if (type === "image") return "Image";
  if (type === "pdf") return "PDF";
  if (type === "word") return "Word";
  return "File";
}

// ---- normalize preview
function pickPreview(item) {
  const candidates = [];

  const directEntries = [
    { url: item.image_url, name: item.image_name || item.imageName || "" },
    { url: item.imageUrl, name: item.image_name || item.imageName || "" },
    { url: item.pdf_url, name: item.pdf_name || item.pdfName || "" },
    { url: item.pdfUrl, name: item.pdf_name || item.pdfName || "" },
    { url: item.doc_url, name: item.doc_name || item.docName || "" },
    { url: item.docUrl, name: item.doc_name || item.docName || "" },
    { url: item.docx_url, name: item.docx_name || item.docxName || "" },
    { url: item.docxUrl, name: item.docx_name || item.docxName || "" },
    { url: item.word_url, name: item.word_name || item.wordName || "" },
    { url: item.wordUrl, name: item.word_name || item.wordName || "" },
    { url: item.file_url, name: item.file_name || item.fileName || "" },
    { url: item.fileUrl, name: item.file_name || item.fileName || "" },
    { url: item.url, name: item.name || item.filename || "" },
    { url: item.path, name: item.name || item.filename || "" },
  ].filter((x) => x.url);

  for (const entry of directEntries) {
    const abs = resolveAssetUrl(entry.url);
    candidates.push({
      url: abs,
      type: detectPreviewTypeFromUrl(abs),
      name: entry.name || fileNameFromUrl(abs),
      mime: "",
    });
  }

  const attachments = Array.isArray(item.attachments) ? item.attachments : [];
  for (const a of attachments) {
    const u = a.url || a.file_url || a.fileUrl || a.path;
    if (!u) continue;

    const abs = resolveAssetUrl(u);
    const mime = String(a.mime_type || a.mimeType || a.type || "").toLowerCase();
    let type = detectPreviewTypeFromMime(mime);
    if (type === "none") type = detectPreviewTypeFromUrl(abs);

    candidates.push({
      url: abs,
      type,
      name: a.originalname || a.originalName || a.filename || a.fileName || a.name || fileNameFromUrl(abs),
      mime,
    });
  }

  const image = candidates.find((c) => c.type === "image");
  if (image) return image;

  const pdf = candidates.find((c) => c.type === "pdf");
  if (pdf) return pdf;

  const word = candidates.find((c) => c.type === "word");
  if (word) return word;

  const generic = candidates.find((c) => c.type === "file");
  if (generic) return generic;

  return { type: "none", url: "", name: "", mime: "" };
}

// ---- audience targeting
function truthy(v) {
  return v === true || v === 1 || v === "1" || String(v).toLowerCase() === "true";
}

function normalizeMemberIds(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);

  const s = String(v).trim();
  if (!s) return [];
  const maybeJson = safeJsonParse(s);
  if (Array.isArray(maybeJson)) return maybeJson.map((x) => String(x).trim()).filter(Boolean);

  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

function normalize(item) {
  const id = item.id ?? item.announcement_id ?? item._id ?? crypto.randomUUID();
  const title = item.title ?? item.subject ?? item.name ?? "Untitled announcement";
  const content = item.content ?? item.description ?? item.body ?? item.detail ?? "";
  const date = item.created_at ?? item.createdAt ?? item.date ?? item.updated_at ?? item.updatedAt ?? "";

  const targetAll = truthy(item.target_all ?? item.targetAll ?? item.target_all_flag ?? item.targetAllFlag);
  const memberIds = normalizeMemberIds(item.member_ids ?? item.memberIds ?? item.members ?? item.member_codes);

  return {
    id: String(id),
    title: String(title),
    content: String(content || ""),
    summary: truncateText(content || item.summary || item.short || "", 160) || "—",
    date,
    preview: pickPreview(item),
    targetAll,
    memberIds,
    _raw: item,
  };
}

function isVisibleForUser(ann) {
  if (ann?.targetAll) return true;

  const bc = String(userBankcode.value || "").trim();
  if (!bc) return false;

  const ids = Array.isArray(ann?.memberIds) ? ann.memberIds : [];
  return ids.some((x) => String(x).trim() === bc);
}

// All normalized announcements
const allAnnouncements = computed(() => raw.value.map(normalize));

// Visible announcements only
const announcements = computed(() => allAnnouncements.value.filter(isVisibleForUser));

const unreadCount = computed(() => announcements.value.filter((a) => !isRead(a.id)).length);

const filteredAnnouncements = computed(() => {
  const q = query.value.toLowerCase();

  let list = announcements.value;

  if (unreadOnly.value) {
    list = list.filter((a) => !isRead(a.id));
  }

  if (q) {
    list = list.filter((a) => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q));
  }

  return [...list].sort((a, b) => {
    const ar = isRead(a.id) ? 1 : 0;
    const br = isRead(b.id) ? 1 : 0;
    if (ar !== br) return ar - br;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
});

// ---- fetch
let aborter = null;

async function fetchUsersAndSetBankcode(signal) {
  usersError.value = "";
  try {
    const res = await fetch(USERS_URL, { signal, headers: { ...authHeaders() } });
    if (!res.ok) throw new Error(`Users HTTP ${res.status}`);

    const data = await res.json();
    const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
    const me = readUserFromStorage();

    const meId = me?.id ?? me?.user_id ?? me?._id ?? me?.uuid ?? null;
    const meUsername = String(me?.username ?? me?.user_name ?? "").trim();
    const meEmail = String(me?.email ?? "").trim();

    const pick =
      (meId != null &&
        list.find((u) => String(u?.id ?? u?.user_id ?? u?._id ?? u?.uuid ?? "") === String(meId))) ||
      (!meId && meUsername && list.find((u) => String(u?.username ?? u?.user_name ?? "").trim() === meUsername)) ||
      (!meId && !meUsername && meEmail && list.find((u) => String(u?.email ?? "").trim() === meEmail)) ||
      null;

    const bc = pick?.bankcode ?? pick?.bank_code ?? pick?.bankCode ?? "";
    userBankcode.value = String(bc || "").trim();
  } catch (e) {
    if (e?.name !== "AbortError") {
      usersError.value = e?.message || String(e);
      userBankcode.value = "";
    }
  }
}

async function refresh() {
  loading.value = true;
  error.value = "";

  try {
    if (aborter) aborter.abort();
    aborter = new AbortController();

    const [annRes] = await Promise.all([
      (async () => {
        const res = await fetch(API_URL, { signal: aborter.signal, headers: { ...authHeaders() } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })(),
      fetchUsersAndSetBankcode(aborter.signal),
    ]);

    const list = Array.isArray(annRes) ? annRes : Array.isArray(annRes?.data) ? annRes.data : [];
    raw.value = list;
    readSet.value = loadReadSet();
  } catch (e) {
    if (e?.name !== "AbortError") error.value = e?.message || String(e);
  } finally {
    loading.value = false;
  }
}

// ---- asset helpers
function clearResolvedPreviewState() {
  assetLoading.value = false;
  assetError.value = "";
  resolvedPreviewUrl.value = "";
  resolvedPreviewMime.value = "";
  resolvedPreviewName.value = "";
}

function rememberObjectUrl(url) {
  if (url && url.startsWith("blob:")) {
    createdObjectUrls.add(url);
  }
}

function normalizeContentDispositionFileName(headerValue) {
  const rawValue = String(headerValue || "");
  if (!rawValue) return "";

  const utfMatch = rawValue.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1]);
    } catch {
      return utfMatch[1];
    }
  }

  const plainMatch = rawValue.match(/filename\s*=\s*"([^"]+)"/i) || rawValue.match(/filename\s*=\s*([^;]+)/i);
  if (plainMatch?.[1]) return plainMatch[1].trim();

  return "";
}

async function fetchProtectedAsset(preview) {
  if (!preview?.url) {
    throw new Error("Attachment URL is missing");
  }

  const cacheKey = preview.url;
  if (assetCache.has(cacheKey)) {
    return assetCache.get(cacheKey);
  }

  const res = await fetch(preview.url, {
    headers: { ...authHeaders() },
  });

  if (!res.ok) {
    throw new Error(`File HTTP ${res.status}`);
  }

  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  rememberObjectUrl(blobUrl);

  const contentDisposition = res.headers.get("content-disposition");
  const nameFromHeader = normalizeContentDispositionFileName(contentDisposition);
  const finalName = nameFromHeader || preview.name || fileNameFromUrl(preview.url) || "attachment";

  const payload = {
    blobUrl,
    mime: blob.type || preview.mime || "",
    name: finalName,
  };

  assetCache.set(cacheKey, payload);
  return payload;
}

async function ensureSelectedPreviewAsset() {
  clearResolvedPreviewState();

  if (!selected.value?.preview || selected.value.preview.type === "none" || !selected.value.preview.url) {
    return;
  }

  assetLoading.value = true;

  try {
    const result = await fetchProtectedAsset(selected.value.preview);
    resolvedPreviewUrl.value = result.blobUrl;
    resolvedPreviewMime.value = result.mime;
    resolvedPreviewName.value = result.name;
  } catch (e) {
    assetError.value = e?.message || "Failed to load attachment";
  } finally {
    assetLoading.value = false;
  }
}

const canOpenSelectedPreview = computed(() => {
  if (!selected.value?.preview || selected.value.preview.type === "none") return false;
  if (assetLoading.value) return false;
  return Boolean(resolvedPreviewUrl.value);
});

const canDownloadSelectedPreview = computed(() => {
  if (!selected.value?.preview || selected.value.preview.type === "none") return false;
  if (assetLoading.value) return false;
  return Boolean(resolvedPreviewUrl.value);
});

function triggerDownload(url, fileName) {
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || "attachment";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function openSelectedPreviewInNewTab() {
  if (!selected.value?.preview || selected.value.preview.type === "none") return;

  if (!resolvedPreviewUrl.value) {
    await ensureSelectedPreviewAsset();
  }

  if (!resolvedPreviewUrl.value) return;

  window.open(resolvedPreviewUrl.value, "_blank", "noopener,noreferrer");
}

async function downloadSelectedPreview() {
  if (!selected.value?.preview || selected.value.preview.type === "none") return;

  if (!resolvedPreviewUrl.value) {
    await ensureSelectedPreviewAsset();
  }

  if (!resolvedPreviewUrl.value) return;

  const fileName = resolvedPreviewName.value || selected.value.preview.name || "attachment";
  triggerDownload(resolvedPreviewUrl.value, fileName);
}

// ---- modal
function open(item) {
  selected.value = item;
  markRead(item.id);
  lockScroll(true);
}

function close() {
  selected.value = null;
  lockScroll(false);
  clearResolvedPreviewState();
}

function onKeydown(e) {
  if (e.key === "Escape" && selected.value) close();
}

function lockScroll(lock) {
  document.documentElement.style.overflow = lock ? "hidden" : "";
  document.body.style.overflow = lock ? "hidden" : "";
}

watch(selected, async (v) => {
  if (!v) {
    lockScroll(false);
    clearResolvedPreviewState();
    return;
  }

  await ensureSelectedPreviewAsset();
});

onMounted(() => {
  refresh();
  window.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  if (aborter) aborter.abort();
  window.removeEventListener("keydown", onKeydown);
  lockScroll(false);

  for (const url of createdObjectUrls) {
    URL.revokeObjectURL(url);
  }
  createdObjectUrls.clear();
  assetCache.clear();
});
</script>

<style scoped>
.viewer {
  display: grid;
  gap: 14px;
}

.card {
  background: var(--panel, rgba(255, 255, 255, 0.045));
  border: 1px solid var(--stroke, rgba(255, 255, 255, 0.08));
  border-radius: 18px;
  backdrop-filter: blur(14px);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.28);
}

.cardInner {
  background: var(--panel2, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--stroke, rgba(255, 255, 255, 0.08));
  border-radius: 16px;
  padding: 14px;
}

.head {
  padding: 16px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

@media (min-width: 980px) {
  .head {
    grid-template-columns: 1fr 1.2fr;
    align-items: end;
  }
}

.kicker {
  color: var(--muted, rgba(255, 255, 255, 0.55));
  font-weight: 800;
  letter-spacing: 0.2px;
  font-size: 12px;
}

.title {
  margin: 4px 0 0;
  font-size: 22px;
  font-weight: 900;
  color: var(--txt, rgba(255, 255, 255, 0.92));
}

.sub {
  margin: 6px 0 0;
  color: var(--muted, rgba(255, 255, 255, 0.55));
  font-size: 13px;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-start;
}

.field {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  background: var(--glass, rgba(255, 255, 255, 0.035));
  border: 1px solid var(--stroke, rgba(255, 255, 255, 0.08));
}

.field i {
  opacity: 0.9;
}

.input {
  background: transparent;
  border: none;
  outline: none;
  color: var(--txt, rgba(255, 255, 255, 0.92));
  width: 220px;
  max-width: 56vw;
}

.input::placeholder {
  color: var(--muted, rgba(255, 255, 255, 0.55));
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 999px;
  background: var(--glass, rgba(255, 255, 255, 0.035));
  border: 1px solid var(--stroke, rgba(255, 255, 255, 0.08));
  color: rgba(255, 255, 255, 0.85);
  font-weight: 800;
  font-size: 13px;
  user-select: none;
  cursor: pointer;
}

.chip input {
  accent-color: rgba(56, 189, 248, 0.9);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid var(--stroke, rgba(255, 255, 255, 0.08));
  background: var(--glass, rgba(255, 255, 255, 0.035));
  color: rgba(255, 255, 255, 0.86);
  font-weight: 900;
  cursor: pointer;
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, background 160ms ease;
}

.btn:hover {
  transform: translateY(-1px);
  border-color: rgba(56, 189, 248, 0.22);
  box-shadow: 0 14px 34px rgba(56, 189, 248, 0.08);
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn.primary {
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.18), rgba(99, 102, 241, 0.12));
  border-color: rgba(56, 189, 248, 0.2);
}

.btn.danger {
  border-color: rgba(248, 113, 113, 0.22);
  background: rgba(248, 113, 113, 0.08);
}

.metaRow {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.metaPill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
  border: 1px solid var(--stroke, rgba(255, 255, 255, 0.08));
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.82);
}

.list {
  display: grid;
  gap: 12px;
}

.row {
  padding: 14px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
  transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease, background 140ms ease;
}

.row:hover {
  transform: translateY(-1px);
  border-color: rgba(56, 189, 248, 0.22);
  box-shadow: 0 18px 44px rgba(56, 189, 248, 0.08);
}

.row.unread {
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.12), rgba(255, 255, 255, 0.03));
  border-color: rgba(56, 189, 248, 0.22);
}

.rowLeft {
  min-width: 0;
}

.rowTop {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.rowTitle {
  margin: 0;
  font-size: 16px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.95);
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.95);
  box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.12);
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(56, 189, 248, 0.18);
  background: rgba(56, 189, 248, 0.08);
  color: rgba(255, 255, 255, 0.9);
  font-weight: 900;
  font-size: 12px;
}

.rowSummary {
  margin: 10px 0 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
  line-height: 1.55;
  max-width: 78ch;
}

.rowMeta {
  margin-top: 10px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--muted, rgba(255, 255, 255, 0.55));
  font-size: 12px;
  font-weight: 800;
}

.rowRight {
  display: flex;
  align-items: center;
}

.linkBtn {
  border: none;
  background: transparent;
  color: rgba(56, 189, 248, 0.95);
  font-weight: 900;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 6px;
}

.empty {
  padding: 16px;
  display: flex;
  gap: 12px;
  align-items: center;
  color: rgba(255, 255, 255, 0.75);
}

.emptyTitle {
  font-weight: 900;
  color: rgba(255, 255, 255, 0.92);
}

.emptySub {
  margin-top: 3px;
  color: var(--muted, rgba(255, 255, 255, 0.55));
  font-size: 13px;
}

.error {
  padding: 14px;
  display: grid;
  gap: 10px;
  border-color: rgba(248, 113, 113, 0.22);
  background: rgba(248, 113, 113, 0.06);
}

.errorTop {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 900;
}

.errorMsg {
  color: rgba(255, 255, 255, 0.75);
  font-size: 13px;
}

/* Skeleton */
.skeleton {
  display: grid;
  gap: 12px;
}

.sk {
  height: 92px;
  border-radius: 18px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.03),
    rgba(255, 255, 255, 0.07),
    rgba(255, 255, 255, 0.03)
  );
  background-size: 200% 200%;
  border: 1px solid var(--stroke, rgba(255, 255, 255, 0.08));
  animation: shimmer 1.15s ease infinite;
}

@keyframes shimmer {
  0% {
    background-position: 0% 50%;
  }

  100% {
    background-position: 100% 50%;
  }
}

/* Modal */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.58);
  display: grid;
  place-items: center;
  padding: 18px;
}

.modal {
  width: min(1020px, 96vw);
  max-height: calc(100vh - 36px);
  overflow: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.modalHead {
  position: sticky;
  top: 0;
  padding: 14px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  background: rgba(8, 12, 28, 0.78);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(14px);
}

.modalKicker {
  font-size: 12px;
  font-weight: 900;
  color: var(--muted, rgba(255, 255, 255, 0.55));
}

.modalTitle {
  margin: 6px 0 0;
  font-size: 18px;
  font-weight: 950;
  color: rgba(255, 255, 255, 0.95);
}

.modalMeta {
  margin-top: 10px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.modalHeadRight {
  display: flex;
  gap: 10px;
  align-items: center;
}

.modalBody {
  padding: 14px;
  display: grid;
  gap: 14px;
}

.sectionTitle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 950;
  margin-bottom: 10px;
  color: rgba(255, 255, 255, 0.92);
}

.contentText {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.82);
}

.assetState {
  min-height: 140px;
  border-radius: 16px;
  border: 1px dashed rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.025);
  display: grid;
  place-items: center;
  gap: 10px;
  padding: 18px;
  text-align: center;
  color: rgba(255, 255, 255, 0.78);
}

.assetStateError {
  color: rgba(255, 170, 170, 0.95);
  border-color: rgba(248, 113, 113, 0.22);
  background: rgba(248, 113, 113, 0.06);
}

.wordPreview {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 18px;
  border-radius: 16px;
  border: 1px dashed rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.025);
}

.wordPreviewIcon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.2);
  color: rgba(255, 255, 255, 0.92);
  font-size: 20px;
  flex: 0 0 auto;
}

.wordPreviewBody {
  min-width: 0;
}

.wordPreviewTitle {
  font-size: 15px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.94);
  word-break: break-word;
}

.wordPreviewSub {
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.72);
  line-height: 1.55;
  font-size: 13px;
}

.img {
  width: 100%;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.10);
}

.pdf {
  width: 100%;
  height: min(70vh, 760px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(0, 0, 0, 0.25);
}

.previewActions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

/* Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 160ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>