<template>
    <div class="tplPage">
        <!-- Top bar -->
        <header class="pageTopbar">
            <div class="topLeft">
                <div class="titleRow">
                    <i class="fa-solid fa-layer-group"></i>
                    <h1 class="pageTitle">Form Templates</h1>
                    <span class="pill">Storage</span>
                </div>
                <p class="pageSub">
                    Store your form templates • Auto-save from the Save button (Create Form) • Import/Export JSON • Use
                    a template to go back to Create Form
                </p>
            </div>

            <div class="topRight">
                <button class="btn" type="button" @click="openCreateFromDraft">
                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                    <span>Save from Draft</span>
                </button>

                <button class="btn ghost" type="button" @click="triggerImport">
                    <i class="fa-solid fa-file-import"></i>
                    <span>Import JSON</span>
                </button>

                <button class="btn ghost dangerBtn" type="button" @click="clearAll" :disabled="!templates.length">
                    <i class="fa-solid fa-trash"></i>
                    <span>Clear</span>
                </button>

                <input ref="importInputRef" type="file" class="hiddenInput" accept="application/json,.json"
                    @change="onImportFile" />
            </div>
        </header>

        <!-- Search / sort -->
        <section class="card toolbar">
            <div class="toolLeft">
                <div class="field">
                    <label class="label">Search</label>
                    <input v-model="q" class="input" type="text" placeholder="Search by name / note..." />
                </div>

                <div class="field">
                    <label class="label">Sort</label>
                    <select v-model="sortBy" class="select">
                        <option value="updated_desc">Updated (newest)</option>
                        <option value="created_desc">Created (newest)</option>
                        <option value="name_asc">Name A→Z</option>
                        <option value="name_desc">Name Z→A</option>
                    </select>
                </div>
            </div>

            <div class="toolRight">
                <div class="statPill">
                    <i class="fa-solid fa-database"></i>
                    <span>{{ filtered.length }} templates</span>
                </div>

                <div class="statPill ghost">
                    <i class="fa-solid fa-clipboard-question"></i>
                    <span>{{ totalQuestions }} questions</span>
                </div>
            </div>
        </section>

        <!-- List -->
        <section class="grid">
            <article v-for="t in filtered" :key="t.id" class="card tplCard">
                <div class="tplTop">
                    <div class="tplTitle">
                        <div class="tplName">{{ t.name }}</div>
                        <div class="tplMeta">
                            <span class="metaItem">
                                <i class="fa-regular fa-calendar"></i>
                                Created: {{ fmtDate(t.createdAt) }}
                            </span>
                            <span class="metaItem">
                                <i class="fa-regular fa-clock"></i>
                                Updated: {{ fmtDate(t.updatedAt) }}
                            </span>
                        </div>
                    </div>

                    <div class="tplActions">
                        <button class="miniBtn" type="button" title="Rename" @click="openRename(t)">
                            <i class="fa-solid fa-pen"></i>
                        </button>

                        <button class="miniBtn" type="button" title="Duplicate" @click="duplicateTemplate(t)">
                            <i class="fa-solid fa-clone"></i>
                        </button>

                        <button class="miniBtn" type="button" title="Export JSON" @click="exportTemplate(t)">
                            <i class="fa-solid fa-file-arrow-down"></i>
                        </button>

                        <button class="miniBtn danger" type="button" title="Delete" @click="deleteTemplate(t.id)">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>

                <div class="tplBody">
                    <div class="tplDesc">
                        {{ t.note || "— No description —" }}
                    </div>

                    <div class="chips">
                        <span class="chip">
                            <i class="fa-solid fa-list-check"></i>
                            {{ (t.payload?.questions || []).length }} questions
                        </span>

                        <span v-if="t.sourceFormId" class="chip ghost">
                            <i class="fa-solid fa-link"></i>
                            FormID: {{ t.sourceFormId }}
                        </span>

                        <span class="chip ghost">
                            <i class="fa-solid fa-envelope"></i>
                            Collect email: {{ !!t.payload?.meta?.collectEmail ? "ON" : "OFF" }}
                        </span>

                        <span class="chip ghost">
                            <i class="fa-solid fa-rotate"></i>
                            Edit after submit: {{ !!t.payload?.meta?.allowEditAfterSubmit ? "ON" : "OFF" }}
                        </span>
                    </div>
                </div>

                <div class="tplFoot">
                    <button class="btn" type="button" @click="useTemplate(t)">
                        <i class="fa-solid fa-play"></i>
                        <span>Use template</span>
                    </button>

                    <button class="btn ghost" type="button" @click="previewJson(t)">
                        <i class="fa-solid fa-code"></i>
                        <span>View JSON</span>
                    </button>
                </div>
            </article>

            <div v-if="!filtered.length" class="empty card">
                <div class="emptyTitle">
                    <i class="fa-regular fa-folder-open"></i>
                    No templates yet
                </div>
                <div class="emptySub">
                    Go to <b>Create Form</b> and click <b>Save</b> (it will auto-save as a template), or click <b>Save
                        from Draft</b>.
                </div>
            </div>
        </section>

        <!-- JSON Preview Overlay -->
        <div v-if="jsonModal.show" class="overlay" @mousedown.self="closeJson">
            <div class="overlayCard">
                <div class="overlayTop">
                    <div class="overlayTitle">
                        <i class="fa-solid fa-code"></i>
                        <span>Template JSON: {{ jsonModal.title }}</span>
                    </div>
                    <button class="miniBtn danger" type="button" @click="closeJson">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <div class="overlayBody">
                    <pre class="jsonPre">{{ jsonModal.text }}</pre>
                    <div class="overlayActions">
                        <button class="btn ghost" type="button" @click="copyJsonModal">
                            <i class="fa-solid fa-copy"></i>
                            Copy
                        </button>
                        <button class="btn" type="button" @click="closeJson">
                            <i class="fa-solid fa-check"></i>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Create/Rename Modal -->
        <div v-if="editModal.show" class="overlay" @mousedown.self="closeEdit">
            <div class="overlayCard">
                <div class="overlayTop">
                    <div class="overlayTitle">
                        <i class="fa-solid"
                            :class="editModal.mode === 'create' ? 'fa-wand-magic-sparkles' : 'fa-pen'"></i>
                        <span>{{ editModal.mode === "create" ? "Save Template from Draft" : "Rename Template" }}</span>
                    </div>
                    <button class="miniBtn danger" type="button" @click="closeEdit">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <div class="overlayBody">
                    <div class="field">
                        <label class="label">Template name</label>
                        <input v-model="editModal.name" class="input" type="text"
                            placeholder="e.g., Job application form" />
                    </div>

                    <div class="field">
                        <label class="label">Note (optional)</label>
                        <textarea v-model="editModal.note" class="textarea" rows="3"
                            placeholder="Short description..." />
                    </div>

                    <div class="overlayActions">
                        <button class="btn ghost" type="button" @click="closeEdit">
                            <i class="fa-solid fa-arrow-left"></i>
                            Cancel
                        </button>

                        <button class="btn" type="button" @click="confirmEdit" :disabled="!editModal.name.trim()">
                            <i class="fa-solid fa-check"></i>
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Toast -->
        <div class="toast" :class="{ show: toast.show, danger: toast.type === 'danger' }" aria-live="polite">
            <i class="fa-solid" :class="toast.type === 'danger' ? 'fa-triangle-exclamation' : 'fa-circle-check'"></i>
            <span>{{ toast.text }}</span>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";

const DRAFT_KEY = "lapnet_create_form_draft";
const TPL_KEY = "lapnet_form_templates";

const router = useRouter();

const templates = ref([]);
const q = ref("");
const sortBy = ref("updated_desc");
const importInputRef = ref(null);

const toast = reactive({ show: false, text: "", type: "ok" });
let toastTimer = null;

function showToast(text, type = "ok") {
    toast.text = text;
    toast.type = type;
    toast.show = true;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast.show = false), 2200);
}

const uid = () => `tpl_${Math.random().toString(16).slice(2)}_${Date.now()}`;

function safeJsonParse(str) {
    try {
        return JSON.parse(str);
    } catch {
        return null;
    }
}

function fmtDate(iso) {
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return "—";
        return d.toLocaleString();
    } catch {
        return "—";
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
                sort_order: Number(q?.sort_order ?? (idx + 1)),

                images: Array.isArray(q?.images) ? q.images : [],
                options: Array.isArray(q?.options) ? q.options : [],

                uploadRestrictEnabled: !!q?.uploadRestrictEnabled,
                fileTypes: Array.isArray(q?.fileTypes) ? q.fileTypes : [],
                maxSizeMB: Number(q?.maxSizeMB ?? 10),
                maxFiles: Number(q?.maxFiles ?? 1),
                uploadPreviewFiles: [],

                scoreMax: Number(q?.scoreMax ?? 5),
                scoreIcon: String(q?.scoreIcon ?? "star"),

                gridRows: Array.isArray(q?.gridRows) ? q.gridRows : [],
                gridCols: Array.isArray(q?.gridCols) ? q.gridCols : [],
            };

            if (q?.upload && typeof q.upload === "object") {
                base.uploadRestrictEnabled = !!q.upload.restrictEnabled;
                base.fileTypes = Array.isArray(q.upload.fileTypes) ? q.upload.fileTypes : base.fileTypes;
                base.maxSizeMB = Number(q.upload.maxSizeMB ?? base.maxSizeMB);
                base.maxFiles = Number(q.upload.maxFiles ?? base.maxFiles);
            }
            if (q?.score && typeof q.score === "object") {
                base.scoreMax = Number(q.score.max ?? base.scoreMax);
                base.scoreIcon = String(q.score.icon ?? base.scoreIcon);
            }
            if (q?.table && typeof q.table === "object") {
                const mode = q.table.mode === "checkbox" ? "table_checkbox" : "table_option";
                base.type = normalizeDraftType(mode);
                base.gridRows = Array.isArray(q.table.rows) ? q.table.rows : base.gridRows;
                base.gridCols = Array.isArray(q.table.cols) ? q.table.cols : base.gridCols;
            }

            return base;
        }),
    };

    payload.questions.forEach((qq, i) => (qq.sort_order = i + 1));
    return payload;
}

function loadTemplates() {
    const raw = localStorage.getItem(TPL_KEY);
    const parsed = safeJsonParse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((t) => ({
        id: String(t?.id || uid()),
        sourceFormId: t?.sourceFormId != null ? String(t.sourceFormId) : null,
        name: String(t?.name || "Untitled template"),
        note: String(t?.note || ""),
        createdAt: String(t?.createdAt || new Date().toISOString()),
        updatedAt: String(t?.updatedAt || new Date().toISOString()),
        payload: normalizePayload(t?.payload || {}),
    }));
}

function persist() {
    localStorage.setItem(TPL_KEY, JSON.stringify(templates.value, null, 2));
}

const filtered = computed(() => {
    const term = q.value.trim().toLowerCase();
    let list = templates.value.filter((t) => {
        if (!term) return true;
        return (
            String(t.name || "").toLowerCase().includes(term) ||
            String(t.note || "").toLowerCase().includes(term)
        );
    });

    const s = sortBy.value;
    if (s === "updated_desc") list.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    else if (s === "created_desc") list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    else if (s === "name_asc") list.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    else if (s === "name_desc") list.sort((a, b) => String(b.name).localeCompare(String(a.name)));

    return list;
});

const totalQuestions = computed(() => {
    return templates.value.reduce((sum, t) => sum + (t.payload?.questions?.length || 0), 0);
});

const jsonModal = reactive({ show: false, title: "", text: "" });

function previewJson(t) {
    jsonModal.show = true;
    jsonModal.title = t.name;
    jsonModal.text = JSON.stringify(
        { sourceFormId: t.sourceFormId, payload: t.payload, name: t.name, note: t.note },
        null,
        2
    );
}

async function copyJsonModal() {
    try {
        await navigator.clipboard.writeText(jsonModal.text || "");
        showToast("Copied JSON");
    } catch {
        showToast("Copy failed", "danger");
    }
}

function closeJson() {
    jsonModal.show = false;
    jsonModal.title = "";
    jsonModal.text = "";
}

const editModal = reactive({
    show: false,
    mode: "create", // create | rename
    name: "",
    note: "",
    targetId: null,
    __payload: null,
});

function closeEdit() {
    editModal.show = false;
    editModal.mode = "create";
    editModal.name = "";
    editModal.note = "";
    editModal.targetId = null;
    editModal.__payload = null;
}

function openCreateFromDraft() {
    const raw = localStorage.getItem(DRAFT_KEY);
    const draft = safeJsonParse(raw);

    if (!draft || !draft.meta || !Array.isArray(draft.questions)) {
        showToast("No draft found. Go to Create Form and click Save first.", "danger");
        return;
    }

    const payload = normalizePayload(draft);

    editModal.show = true;
    editModal.mode = "create";
    editModal.name = String(payload.meta.title || "").trim() || "Untitled template";
    editModal.note = "";
    editModal.targetId = "__CREATE__";
    editModal.__payload = payload;
}

function openRename(t) {
    editModal.show = true;
    editModal.mode = "rename";
    editModal.name = t.name;
    editModal.note = t.note || "";
    editModal.targetId = t.id;
}

function confirmEdit() {
    const name = editModal.name.trim();
    const note = String(editModal.note || "").trim();
    if (!name) return;

    if (editModal.mode === "create") {
        const payload = editModal.__payload;
        if (!payload) {
            showToast("Missing draft payload", "danger");
            closeEdit();
            return;
        }

        const now = new Date().toISOString();
        templates.value.unshift({
            id: uid(),
            sourceFormId: null,
            name,
            note,
            createdAt: now,
            updatedAt: now,
            payload,
        });
        persist();
        showToast("Template saved");
        closeEdit();
        return;
    }

    const id = editModal.targetId;
    const t = templates.value.find((x) => x.id === id);
    if (!t) {
        showToast("Template not found", "danger");
        closeEdit();
        return;
    }

    t.name = name;
    t.note = note;
    t.updatedAt = new Date().toISOString();
    persist();
    showToast("Updated");
    closeEdit();
}

function useTemplate(t) {
    try {
        const draft = {
            id: null,
            meta: t.payload.meta,
            questions: t.payload.questions,
            updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft, null, 2));
        showToast("Loaded template → Create Form");
        router.push("/createform");
    } catch {
        showToast("Use template failed", "danger");
    }
}

function duplicateTemplate(t) {
    const now = new Date().toISOString();
    templates.value.unshift({
        id: uid(),
        sourceFormId: null,
        name: `${t.name} (copy)`,
        note: t.note || "",
        createdAt: now,
        updatedAt: now,
        payload: normalizePayload(t.payload),
    });
    persist();
    showToast("Duplicated");
}

function deleteTemplate(id) {
    templates.value = templates.value.filter((x) => x.id !== id);
    persist();
    showToast("Deleted");
}

function clearAll() {
    templates.value = [];
    persist();
    showToast("Cleared");
}

function exportTemplate(t) {
    try {
        const out = {
            name: t.name,
            note: t.note,
            sourceFormId: t.sourceFormId,
            payload: t.payload,
            exportedAt: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${String(t.name || "template").replace(/\s+/g, "_").toLowerCase()}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast("Exported");
    } catch {
        showToast("Export failed", "danger");
    }
}

function triggerImport() {
    importInputRef.value?.click?.();
}

function onImportFile(e) {
    const file = e.target?.files?.[0];
    if (!file) return;

    const fr = new FileReader();
    fr.onload = () => {
        try {
            const parsed = safeJsonParse(String(fr.result || ""));
            const payloadRaw = parsed?.payload ? parsed.payload : parsed;
            const payload = normalizePayload(payloadRaw);

            const now = new Date().toISOString();
            templates.value.unshift({
                id: uid(),
                sourceFormId: parsed?.sourceFormId != null ? String(parsed.sourceFormId) : null,
                name: String(parsed?.name || payload?.meta?.title || "Imported template"),
                note: String(parsed?.note || ""),
                createdAt: now,
                updatedAt: now,
                payload,
            });

            persist();
            showToast("Imported");
        } catch {
            showToast("Invalid JSON", "danger");
        } finally {
            if (e.target) e.target.value = "";
        }
    };
    fr.onerror = () => {
        showToast("Failed to read file", "danger");
        if (e.target) e.target.value = "";
    };
    fr.readAsText(file);
}

onMounted(() => {
    templates.value = loadTemplates();
});
</script>

<style scoped>
/* ✅ CSS unchanged */
.tplPage {
    width: 100%;
    height: 100%;
    padding: 10px 6px;
    color: var(--txt);
}

.pageTopbar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    padding: 14px 14px 10px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.22);
    margin-bottom: 12px;
}

.titleRow {
    display: flex;
    align-items: center;
    gap: 10px;
}

.pageTitle {
    margin: 0;
    font-size: 18px;
    font-weight: 950;
    letter-spacing: 0.2px;
}

.pill {
    font-size: 11px;
    font-weight: 900;
    padding: 4px 8px;
    border-radius: 999px;
    background: rgba(56, 189, 248, 0.12);
    border: 1px solid rgba(56, 189, 248, 0.18);
    color: rgba(255, 255, 255, 0.9);
}

.pageSub {
    margin: 6px 0 0;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    line-height: 1.4;
}

.topRight {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.card {
    position: relative;
    border-radius: 18px;
    padding: 14px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    box-shadow: 0 16px 34px rgba(0, 0, 0, 0.25);
}

.btn {
    border: 1px solid rgba(56, 189, 248, 0.22);
    background: linear-gradient(90deg, rgba(56, 189, 248, 0.18), rgba(99, 102, 241, 0.1));
    color: rgba(255, 255, 255, 0.92);
    border-radius: 14px;
    padding: 10px 12px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-weight: 900;
    transition: background 180ms ease, transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.btn:hover {
    background: linear-gradient(90deg, rgba(56, 189, 248, 0.24), rgba(99, 102, 241, 0.14));
    border-color: rgba(56, 189, 248, 0.28);
    box-shadow: 0 14px 28px rgba(56, 189, 248, 0.1);
    transform: translateY(-1px);
}

.btn.ghost {
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.03);
}

.btn.ghost:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(56, 189, 248, 0.22);
}

.dangerBtn {
    border-color: rgba(248, 113, 113, 0.26) !important;
}

.dangerBtn:hover {
    border-color: rgba(248, 113, 113, 0.42) !important;
    background: rgba(248, 113, 113, 0.08) !important;
}

.miniBtn {
    width: 34px;
    height: 34px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.03);
    color: rgba(255, 255, 255, 0.9);
    cursor: pointer;
    display: grid;
    place-items: center;
    transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
}

.miniBtn:hover {
    transform: translateY(-1px);
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(56, 189, 248, 0.18);
}

.miniBtn.danger {
    border-color: rgba(248, 113, 113, 0.18);
}

.miniBtn.danger:hover {
    border-color: rgba(248, 113, 113, 0.35);
    background: rgba(248, 113, 113, 0.08);
}

.field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.label {
    font-size: 12px;
    font-weight: 800;
    color: rgba(255, 255, 255, 0.72);
}

.input,
.textarea,
.select {
    width: 100%;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.18);
    color: rgba(255, 255, 255, 0.92);
    padding: 10px 12px;
    outline: none;
}

.textarea {
    resize: vertical;
}

.toolbar {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
}

.toolLeft {
    display: grid;
    grid-template-columns: 1fr 220px;
    gap: 10px;
    width: min(760px, 100%);
}

@media (max-width: 900px) {
    .toolbar {
        flex-direction: column;
        align-items: stretch;
    }

    .toolLeft {
        grid-template-columns: 1fr;
    }
}

.toolRight {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.statPill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 999px;
    border: 1px solid rgba(56, 189, 248, 0.18);
    background: rgba(56, 189, 248, 0.08);
    font-weight: 900;
    font-size: 12px;
}

.statPill.ghost {
    border-color: rgba(255, 255, 255, 0.10);
    background: rgba(255, 255, 255, 0.03);
}

.grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
}

@media (max-width: 1200px) {
    .grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 800px) {
    .grid {
        grid-template-columns: 1fr;
    }
}

.tplCard {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.tplTop {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
}

.tplName {
    font-weight: 950;
    font-size: 16px;
}

.tplMeta {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 6px;
}

.metaItem {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.62);
    font-weight: 800;
    display: inline-flex;
    gap: 8px;
    align-items: center;
}

.tplActions {
    display: inline-flex;
    gap: 8px;
}

.tplBody {
    display: grid;
    gap: 10px;
}

.tplDesc {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.70);
    line-height: 1.5;
}

.chips {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(56, 189, 248, 0.12);
    border: 1px solid rgba(56, 189, 248, 0.18);
    color: rgba(255, 255, 255, 0.92);
    font-size: 12px;
    font-weight: 900;
}

.chip.ghost {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.78);
}

.tplFoot {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: auto;
}

.empty {
    grid-column: 1 / -1;
    text-align: center;
    padding: 20px;
}

.emptyTitle {
    font-weight: 950;
    font-size: 16px;
    display: inline-flex;
    gap: 10px;
    align-items: center;
}

.emptySub {
    margin-top: 8px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.65);
    line-height: 1.5;
}

.overlay {
    position: fixed;
    inset: 0;
    z-index: 99998;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(12px);
}

.overlayCard {
    width: min(760px, calc(100vw - 24px));
    border-radius: 18px;
    border: 1px solid rgba(56, 189, 248, 0.18);
    background: rgba(8, 12, 28, 0.78);
    box-shadow: 0 28px 80px rgba(0, 0, 0, 0.55);
    overflow: hidden;
}

.overlayTop {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 12px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: linear-gradient(90deg, rgba(56, 189, 248, 0.10), rgba(99, 102, 241, 0.06));
}

.overlayTitle {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-weight: 950;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.92);
}

.overlayBody {
    padding: 12px;
    display: grid;
    gap: 12px;
}

.overlayActions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.jsonPre {
    margin: 0;
    padding: 12px;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(0, 0, 0, 0.22);
    max-height: 420px;
    overflow: auto;
    color: rgba(255, 255, 255, 0.78);
    font-size: 11px;
    line-height: 1.45;
}

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

.toast.show {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
}

.toast.danger {
    border-color: rgba(248, 113, 113, 0.28);
}

.hiddenInput {
    display: none;
}
</style>
