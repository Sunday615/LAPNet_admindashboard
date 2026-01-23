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
                        <input v-model.trim="query" class="input" type="search" placeholder="Search…"
                            aria-label="Search announcements" />
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
                <article v-for="item in filteredAnnouncements" :key="item.id" class="row card"
                    :class="{ unread: !isRead(item.id) }" role="button" tabindex="0" @click="open(item)"
                    @keydown.enter.prevent="open(item)" @keydown.space.prevent="open(item)">
                    <div class="rowLeft">
                        <div class="rowTop">
                            <h3 class="rowTitle">{{ item.title }}</h3>
                            <span v-if="!isRead(item.id)" class="dot" title="Unread"></span>

                            <span v-if="item.preview.type !== 'none'" class="badge">
                                <i
                                    :class="item.preview.type === 'image' ? 'fa-regular fa-image' : 'fa-regular fa-file-pdf'"></i>
                                {{ item.preview.type === "image" ? "Image" : "PDF" }}
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
                                        <i :class="selected.preview.type === 'image'
                                            ? 'fa-regular fa-image'
                                            : 'fa-regular fa-file-pdf'"></i>
                                        {{ selected.preview.type === "image" ? "Image" : "PDF" }}
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

                                <img v-if="selected.preview.type === 'image'" class="img" :src="selected.preview.url"
                                    :alt="selected.title" loading="lazy" />

                                <iframe v-else class="pdf" :src="pdfEmbedUrl(selected.preview.url)"
                                    title="PDF preview"></iframe>

                                <div class="previewActions">
                                    <a class="btn primary" :href="selected.preview.url" target="_blank" rel="noopener">
                                        <i class="fa-solid fa-up-right-from-square"></i>
                                        Open in new tab
                                    </a>
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

const API_URL = "http://localhost:3000/api/announcements";

// ---- Per-user storage key (uses localStorage/sessionStorage "user" if available)
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

const query = ref("");
const unreadOnly = ref(false);

const selected = ref(null);

// ---- read set
const readSet = ref(loadReadSet());

function loadReadSet() {
    try {
        const raw = localStorage.getItem(getStorageKey());
        const arr = raw ? JSON.parse(raw) : [];
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
    return d.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}
function truncateText(text, max = 160) {
    const t = (text || "").replace(/\s+/g, " ").trim();
    if (!t) return "";
    return t.length > max ? t.slice(0, max - 1) + "…" : t;
}
function getExt(url = "") {
    const clean = String(url).split("?")[0].toLowerCase();
    const parts = clean.split(".");
    return parts.length > 1 ? parts.pop() : "";
}
function detectPreviewTypeFromUrl(url) {
    const ext = getExt(url);
    const img = new Set(["png", "jpg", "jpeg", "gif", "webp", "bmp"]);
    if (img.has(ext)) return "image";
    if (ext === "pdf") return "pdf";
    return "none";
}
function pdfEmbedUrl(url) {
    const hasHash = String(url).includes("#");
    return hasHash ? url : `${url}#toolbar=0&navpanes=0&scrollbar=1`;
}
function resolveAssetUrl(url) {
    if (!url) return "";
    const s = String(url);
    if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("data:") || s.startsWith("blob:"))
        return s;

    // if API is localhost:3000, make relative URLs absolute to that origin
    const origin = new URL(API_URL).origin;

    // "uploads/.." -> "/uploads/.."
    if (!s.startsWith("/")) return `${origin}/${s}`;
    return `${origin}${s}`;
}

// ---- normalize preview (supports many shapes)
function pickPreview(item) {
    const candidates = [];

    const directUrls = [
        item.image_url,
        item.imageUrl,
        item.pdf_url,
        item.pdfUrl,
        item.file_url,
        item.fileUrl,
        item.url,
        item.path,
    ].filter(Boolean);

    for (const u of directUrls) {
        const abs = resolveAssetUrl(u);
        candidates.push({ url: abs, type: detectPreviewTypeFromUrl(abs) });
    }

    const attachments = Array.isArray(item.attachments) ? item.attachments : [];
    for (const a of attachments) {
        const u = a.url || a.file_url || a.path;
        if (!u) continue;

        const abs = resolveAssetUrl(u);
        const mime = String(a.mime_type || a.mimeType || "").toLowerCase();
        let type = "none";
        if (mime.startsWith("image/")) type = "image";
        else if (mime === "application/pdf") type = "pdf";
        else type = detectPreviewTypeFromUrl(abs);

        candidates.push({ url: abs, type });
    }

    // Prefer image, then pdf
    const image = candidates.find((c) => c.type === "image");
    if (image) return image;

    const pdf = candidates.find((c) => c.type === "pdf");
    if (pdf) return pdf;

    return { type: "none", url: "" };
}

function normalize(item) {
    const id = item.id ?? item.announcement_id ?? item._id ?? crypto.randomUUID();

    const title = item.title ?? item.subject ?? item.name ?? "Untitled announcement";
    const content = item.content ?? item.description ?? item.body ?? item.detail ?? "";
    const date = item.created_at ?? item.createdAt ?? item.date ?? item.updated_at ?? item.updatedAt ?? "";

    return {
        id: String(id),
        title: String(title),
        content: String(content || ""),
        summary: truncateText(content || item.summary || item.short || "", 160) || "—",
        date,
        preview: pickPreview(item),
        _raw: item,
    };
}

const announcements = computed(() => raw.value.map(normalize));

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

    // Unread first, then newest
    return [...list].sort((a, b) => {
        const ar = isRead(a.id) ? 1 : 0;
        const br = isRead(b.id) ? 1 : 0;
        if (ar !== br) return ar - br;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
});

// ---- fetch
let aborter = null;

async function refresh() {
    loading.value = true;
    error.value = "";

    try {
        if (aborter) aborter.abort();
        aborter = new AbortController();

        const res = await fetch(API_URL, { signal: aborter.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];

        raw.value = list;
        // reload read set (in case user changed)
        readSet.value = loadReadSet();
    } catch (e) {
        if (e?.name !== "AbortError") error.value = e?.message || String(e);
    } finally {
        loading.value = false;
    }
}

// ---- modal
function open(item) {
    selected.value = item;
    markRead(item.id); // mark read on open (common UX)
    lockScroll(true);
}
function close() {
    selected.value = null;
    lockScroll(false);
}
function onKeydown(e) {
    if (e.key === "Escape" && selected.value) close();
}
function lockScroll(lock) {
    document.documentElement.style.overflow = lock ? "hidden" : "";
    document.body.style.overflow = lock ? "hidden" : "";
}

watch(selected, (v) => {
    if (!v) lockScroll(false);
});

onMounted(() => {
    refresh();
    window.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
    if (aborter) aborter.abort();
    window.removeEventListener("keydown", onKeydown);
    lockScroll(false);
});
</script>

<style scoped>
/* Uses your global theme vars from .app.tech:
   --panel --panel2 --stroke --txt --muted --glass --glass2 --blueA --blueB etc.
*/

.viewer {
    display: grid;
    gap: 14px;
}

/* Shared card look (glass) */
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
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.03));
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

  /* nicer scrolling + prevent “scroll leaking” to page */
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
