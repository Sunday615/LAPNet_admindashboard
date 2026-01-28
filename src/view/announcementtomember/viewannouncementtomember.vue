<!-- src/views/ManageAnnouncements.vue -->
<template>
  <div ref="rootEl" class="annManage">
    <!-- Top bar -->
    <header ref="topbarEl" class="topbar js-reveal">
      <div class="topLeft">
        <div class="titleRow">
          <div class="titleIcon"><i class="fa-solid fa-bullhorn"></i></div>
          <div class="titleText">
            <div class="pageTitle">Manage Announcements</div>
            <div class="pageSub">Search • Preview PDF/Image • Edit • Delete • Pagination</div>
          </div>
        </div>
      </div>

      <div class="topRight">
        <div class="searchWrap" @keydown.esc.prevent="q = ''">
          <i class="fa-solid fa-magnifying-glass searchIcon"></i>
          <input v-model.trim="q" class="search" placeholder="Search title / content / tags..." />
          <button v-if="q" class="clear" type="button" title="Clear" @click="q = ''">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <button
          class="btn ghost"
          type="button"
          :disabled="loading"
          @click="fetchAll"
          @mouseenter="btnHover($event, true)"
          @mouseleave="btnHover($event, false)"
          title="Refresh"
        >
          <i class="fa-solid fa-rotate" :class="{ spin: loading }"></i>
          Refresh
        </button>

        <button
          class="btn"
          type="button"
          @click="goCreate"
          @mouseenter="btnHover($event, true)"
          @mouseleave="btnHover($event, false)"
          title="Create announcement"
        >
          <i class="fa-solid fa-circle-plus"></i>
          Create
        </button>
      </div>
    </header>

    <!-- Stats row -->
    <section class="stats js-reveal">
      <div class="statCard">
        <div class="statLabel">Total</div>
        <div class="statValue">{{ loading ? "…" : filtered.length }}</div>
      </div>
      <div class="statCard">
        <div class="statLabel">Showing</div>
        <div class="statValue">{{ loading ? "…" : pageItems.length }}</div>
      </div>
      <div class="statCard">
        <div class="statLabel">Page</div>
        <div class="statValue">{{ page + 1 }} / {{ totalPages }}</div>
      </div>

      <div class="statActions">
        <button class="chip" type="button" @click="sortMode = 'latest'">
          <i class="fa-solid fa-clock"></i>
          Latest
          <span v-if="sortMode === 'latest'" class="dot"></span>
        </button>
        <button class="chip" type="button" @click="sortMode = 'title'">
          <i class="fa-solid fa-arrow-down-a-z"></i>
          Title
          <span v-if="sortMode === 'title'" class="dot"></span>
        </button>
      </div>
    </section>

    <!-- Body -->
    <section ref="gridEl" class="grid">
      <div v-if="loading" class="state big js-reveal">
        <div class="loaderDot"></div>
        <div class="loaderDot"></div>
        <div class="loaderDot"></div>
        <div class="stateText">Loading announcements…</div>
      </div>

      <div v-else-if="error" class="state err js-reveal">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <div class="stateText">{{ error }}</div>
        <button class="btn soft" type="button" @click="fetchAll">Try again</button>
      </div>

      <template v-else>
        <article
          v-for="a in pageItems"
          :key="a._key"
          class="card js-card js-reveal"
          @mouseenter="cardHover($event, true)"
          @mouseleave="cardHover($event, false)"
        >
          <div class="cardTop">
            <div class="cardTitle">
              <div class="tMain" :title="a.title">{{ a.title }}</div>

              <div class="tSub">
                <span class="pill">
                  <i class="fa-solid fa-calendar"></i>
                  {{ a.when }}
                </span>

                <span v-if="a.visibility" class="pill soft">
                  <i class="fa-solid fa-users"></i>
                  {{ a.visibility }}
                </span>

                <span v-if="a.media.kind === 'pdf'" class="pill pdf">
                  <i class="fa-solid fa-file-pdf"></i>
                  PDF
                </span>

                <span v-else-if="a.media.kind === 'image'" class="pill img">
                  <i class="fa-solid fa-image"></i>
                  Image
                </span>

                <span v-else-if="a.media.url" class="pill file">
                  <i class="fa-solid fa-paperclip"></i>
                  File
                </span>
              </div>
            </div>

            <div class="cardMenu">
              <button
                class="iconBtn"
                type="button"
                title="Preview"
                @click="openPreview(a)"
                @mouseenter="iconHover($event, true)"
                @mouseleave="iconHover($event, false)"
              >
                <i class="fa-solid fa-eye"></i>
              </button>

              <button
                class="iconBtn"
                type="button"
                title="Edit"
                @click="openEdit(a)"
                @mouseenter="iconHover($event, true)"
                @mouseleave="iconHover($event, false)"
              >
                <i class="fa-solid fa-pen-to-square"></i>
              </button>

              <button
                class="iconBtn danger"
                type="button"
                title="Delete"
                @click="askDelete(a)"
                @mouseenter="iconHover($event, true)"
                @mouseleave="iconHover($event, false)"
              >
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>

          <!-- ✅ Media thumb -->
          <div v-if="a.media.kind === 'image' && a.media.url" class="thumb" @click="openPreview(a)" title="Click to preview">
            <img :src="a.media.url" alt="" />
          </div>

          <div
            v-else-if="a.media.kind === 'pdf' && a.media.url"
            class="thumbPdf"
            @click="openPreview(a)"
            title="Click to preview PDF"
          >
            <div class="pdfIcon"><i class="fa-solid fa-file-pdf"></i></div>
            <div class="pdfText">
              <div class="pdfTitle">PDF Attachment</div>
              <div class="pdfSub">{{ fileName(a.media.url) }}</div>
            </div>
            <div class="pdfPill">OPEN</div>
          </div>

          <div class="cardBody">
            <div v-if="a.preview" class="preview">{{ a.preview }}</div>
            <div v-else class="preview muted">No content</div>

            <div v-if="a.tags.length" class="tags">
              <span v-for="t in a.tags" :key="t" class="tag">#{{ t }}</span>
            </div>
          </div>

          <div class="cardFoot">
            <div class="mono id" :title="a.id || ''">
              <i class="fa-solid fa-hashtag"></i>
              {{ a.id || "—" }}
            </div>

            <div class="footBtns">
              <button v-if="a.media.url" class="btn tiny ghost" type="button" @click="openInNewTab(a.media.url)">
                <i class="fa-solid fa-up-right-from-square"></i>
                Open file
              </button>
              <button class="btn tiny ghost" type="button" @click="openPreview(a)">Open</button>
            </div>
          </div>
        </article>

        <div v-if="!pageItems.length" class="state js-reveal">
          <i class="fa-solid fa-inbox"></i>
          <div class="stateText">No announcements match your search.</div>
        </div>
      </template>
    </section>

    <!-- Pagination -->
    <footer class="pager js-reveal" v-if="!loading && !error && filtered.length">
      <button class="btn ghost" type="button" :disabled="page <= 0" @click="page = 0">
        <i class="fa-solid fa-angles-left"></i>
      </button>
      <button class="btn ghost" type="button" :disabled="page <= 0" @click="page--">
        <i class="fa-solid fa-angle-left"></i>
        Prev
      </button>

      <div class="pageInfo">
        <span class="muted">Page</span>
        <b class="mono">{{ page + 1 }}</b>
        <span class="muted">of</span>
        <b class="mono">{{ totalPages }}</b>
      </div>

      <button class="btn ghost" type="button" :disabled="page >= totalPages - 1" @click="page++">
        Next
        <i class="fa-solid fa-angle-right"></i>
      </button>
      <button class="btn ghost" type="button" :disabled="page >= totalPages - 1" @click="page = totalPages - 1">
        <i class="fa-solid fa-angles-right"></i>
      </button>

      <div class="pageSize">
        <span class="muted">Per page</span>
        <select v-model.number="pageSize" class="select">
          <option :value="6">6</option>
          <option :value="9">9</option>
          <option :value="12">12</option>
        </select>
      </div>
    </footer>

    <!-- =========================
         ✅ Preview / Edit Overlay
         ========================= -->
    <transition name="popup">
      <div v-if="modal.show" class="mask" @click.self="closeModal">
        <div class="modal" role="dialog" aria-modal="true" aria-label="Announcement modal">
          <div class="mHead">
            <div class="mHeadLeft">
              <div class="mTitle">
                <i class="fa-solid" :class="modal.mode === 'edit' ? 'fa-pen-to-square' : 'fa-eye'"></i>
                {{ modal.mode === "edit" ? "Edit Announcement" : "Preview" }}
              </div>

              <div class="mSub">
                <span class="pill soft">
                  <i class="fa-solid fa-calendar"></i>
                  {{ modal.item?.when || "-" }}
                </span>
                <span v-if="modal.item?.visibility" class="pill soft">
                  <i class="fa-solid fa-users"></i>
                  {{ modal.item.visibility }}
                </span>

                <span v-if="modal.item?.media?.kind === 'pdf'" class="pill pdf">
                  <i class="fa-solid fa-file-pdf"></i> PDF
                </span>
                <span v-else-if="modal.item?.media?.kind === 'image'" class="pill img">
                  <i class="fa-solid fa-image"></i> Image
                </span>
              </div>
            </div>

            <div class="mHeadRight">
              <button
                v-if="modal.item?.media?.url"
                class="btn tiny ghost"
                type="button"
                @click="openInNewTab(modal.item.media.url)"
              >
                <i class="fa-solid fa-up-right-from-square"></i>
                Open file
              </button>

              <button class="iconClose" type="button" @click="closeModal" aria-label="Close">✕</button>
            </div>
          </div>

          <div class="mBody">
            <!-- PREVIEW -->
            <template v-if="modal.mode === 'preview'">
              <div class="pvTitle">{{ modal.item?.title }}</div>

              <!-- ✅ Media Preview -->
              <div v-if="modal.item?.media?.kind === 'image' && modal.item?.media?.url" class="pvImg">
                <img :src="modal.item.media.url" alt="" />
              </div>

              <div v-else-if="modal.item?.media?.kind === 'pdf' && modal.item?.media?.url" class="pvPdf">
                <iframe
                  class="pdfFrame"
                  :src="pdfViewerSrc(modal.item.media.url)"
                  title="PDF Preview"
                />
                <div class="pvHelp">
                  If PDF preview is blocked, click
                  <button class="linkBtn" type="button" @click="openInNewTab(modal.item.media.url)">Open file</button>.
                </div>
              </div>

              <div v-else-if="modal.item?.media?.url" class="pvFile">
                <div class="pvFileRow">
                  <i class="fa-solid fa-paperclip"></i>
                  <div class="pvFileName">{{ fileName(modal.item.media.url) }}</div>
                </div>
                <button class="btn soft" type="button" @click="openInNewTab(modal.item.media.url)">
                  <i class="fa-solid fa-up-right-from-square"></i>
                  Open file
                </button>
              </div>

              <div class="pvText">
                {{ modal.item?.fullText || "—" }}
              </div>

              <div v-if="modal.item?.tags?.length" class="pvTags">
                <span v-for="t in modal.item.tags" :key="t" class="tag">#{{ t }}</span>
              </div>
            </template>

            <!-- EDIT -->
            <template v-else>
              <form class="form" @submit.prevent="saveEdit">
                <div class="row">
                  <label class="label">Title</label>
                  <input v-model.trim="form.title" class="input" placeholder="Announcement title..." />
                </div>

                <div class="row">
                  <label class="label">Content</label>
                  <textarea v-model="form.body" class="textarea" rows="7" placeholder="Write something..."></textarea>
                  <div class="hint">Tip: HTML will be stripped in cards preview.</div>
                </div>

                <div class="two">
                  <div class="row">
                    <label class="label">Tags</label>
                    <input v-model.trim="form.tags" class="input" placeholder="e.g. urgent, meeting, policy" />
                    <div class="hint">Comma separated</div>
                  </div>

                  <div class="row">
                    <label class="label">Visibility</label>
                    <select v-model="form.visibility" class="select">
                      <option value="">Auto / Unknown</option>
                      <option value="All">All</option>
                      <option value="Members">Members</option>
                      <option value="Admin">Admin</option>
                    </select>
                    <div class="hint">Adjust as your backend supports</div>
                  </div>
                </div>

                <!-- ✅ Media (PDF or Image) -->
                <div class="row">
                  <label class="label">Attachment (PDF or Image)</label>

                  <div class="upload">
                    <input
                      ref="fileEl"
                      type="file"
                      accept="image/*,application/pdf"
                      @change="onPickFile"
                    />

                    <button class="btn ghost" type="button" @click="triggerFile">
                      <i class="fa-solid fa-cloud-arrow-up"></i>
                      Choose file
                    </button>

                    <button
                      v-if="form.previewUrl || form.keepUrl"
                      class="btn soft"
                      type="button"
                      @click="removeMedia"
                    >
                      <i class="fa-solid fa-xmark"></i>
                      Remove
                    </button>
                  </div>

                  <!-- ✅ Current / Selected preview -->
                  <div v-if="form.previewKind === 'image' && (form.previewUrl || form.keepUrl)" class="imgPrev">
                    <img :src="form.previewUrl || form.keepUrl" alt="" />
                  </div>

                  <div v-else-if="form.previewKind === 'pdf' && (form.previewUrl || form.keepUrl)" class="pdfPrev">
                    <div class="pdfPrevTop">
                      <i class="fa-solid fa-file-pdf"></i>
                      <div class="pdfPrevName">{{ fileName(form.previewUrl || form.keepUrl) }}</div>
                      <button class="btn tiny ghost" type="button" @click="openInNewTab(form.previewUrl || form.keepUrl)">
                        <i class="fa-solid fa-up-right-from-square"></i>
                        Open
                      </button>
                    </div>

                    <iframe class="pdfFrame small" :src="pdfViewerSrc(form.previewUrl || form.keepUrl)" title="PDF Preview" />
                    <div class="hint">
                      If preview blocked, click Open.
                    </div>
                  </div>

                  <div v-else-if="(form.previewUrl || form.keepUrl)" class="filePrev">
                    <i class="fa-solid fa-paperclip"></i>
                    <span class="mono">{{ fileName(form.previewUrl || form.keepUrl) }}</span>
                    <button class="btn tiny ghost" type="button" @click="openInNewTab(form.previewUrl || form.keepUrl)">
                      Open
                    </button>
                  </div>

                  <div v-else class="hint">No attachment</div>
                </div>

                <div class="mActions">
                  <button class="btn ghost" type="button" @click="closeModal" :disabled="modal.busy">
                    Cancel
                  </button>
                  <button class="btn" type="submit" :disabled="modal.busy">
                    <i class="fa-solid fa-floppy-disk"></i>
                    {{ modal.busy ? "Saving..." : "Save" }}
                  </button>
                </div>

                <div class="note">
                  <i class="fa-solid fa-circle-info"></i>
                  Update endpoint fallback tries PUT/PATCH and file field names: <b>file</b> → <b>image</b> → <b>attachment</b>.
                </div>
              </form>
            </template>
          </div>
        </div>
      </div>
    </transition>

    <!-- =========================
         ✅ Delete Confirm Overlay
         ========================= -->
    <transition name="popup">
      <div v-if="confirmDel.show" class="mask" @click.self="confirmDel.show = false">
        <div class="confirm" role="dialog" aria-modal="true" aria-label="Confirm delete">
          <div class="cHead">
            <div class="cTitle">
              <i class="fa-solid fa-triangle-exclamation"></i>
              Delete announcement?
            </div>
            <button class="iconClose" type="button" @click="confirmDel.show = false" aria-label="Close">✕</button>
          </div>

          <div class="cBody">
            <div class="cLine">
              You are about to delete:
              <b class="cName">{{ confirmDel.item?.title }}</b>
            </div>
            <div class="cWarn">This action cannot be undone.</div>
          </div>

          <div class="cActions">
            <button class="btn ghost" type="button" @click="confirmDel.show = false" :disabled="confirmDel.busy">
              Cancel
            </button>
            <button class="btn danger" type="button" @click="doDelete" :disabled="confirmDel.busy">
              <i class="fa-solid fa-trash"></i>
              {{ confirmDel.busy ? "Deleting..." : "Delete" }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- =========================
         ✅ Toast
         ========================= -->
    <transition name="toast">
      <div v-if="toast.show" class="toast" :class="toast.kind">
        <div class="toastLeft">
          <div class="toastTitle">
            <i
              class="fa-solid"
              :class="toast.kind === 'ok' ? 'fa-circle-check' : toast.kind === 'err' ? 'fa-circle-xmark' : 'fa-circle-info'"
            ></i>
            {{ toast.title }}
          </div>
          <div class="toastSub">{{ toast.text }}</div>
        </div>

        <div class="toastRight">
          <button class="toastBtn ghost" type="button" @click="hideToast" aria-label="Dismiss">✕</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import gsap from "gsap";

const router = useRouter();

const API_ORIGIN = "http://localhost:3000";
const ANN_API_URL = "http://localhost:3000/api/announcements";

const rootEl = ref(null);

const loading = ref(false);
const error = ref("");
const itemsRaw = ref([]);

const q = ref("");
const page = ref(0);
const pageSize = ref(9);
const sortMode = ref("latest"); // 'latest' | 'title'

/* -----------------------
   URL + media helpers
   ----------------------- */
function toAbsUrl(u) {
  const s = String(u || "").trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("//")) return `${window.location.protocol}${s}`;
  if (s.startsWith("/")) return `${API_ORIGIN}${s}`;
  return `${API_ORIGIN}/${s.replace(/^\.?\//, "")}`;
}

function cleanUrl(u) {
  return String(u || "").split("#")[0].split("?")[0];
}

function extFromUrl(u) {
  const c = cleanUrl(u);
  const i = c.lastIndexOf(".");
  if (i === -1) return "";
  return c.slice(i + 1).toLowerCase();
}

function kindFromUrl(u) {
  const ext = extFromUrl(u);
  if (ext === "pdf") return "pdf";
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext)) return "image";
  return u ? "other" : "none";
}

function fileName(u) {
  const s = cleanUrl(u);
  const parts = s.split("/");
  const name = parts[parts.length - 1] || s;
  return decodeURIComponent(name);
}

function pdfViewerSrc(url) {
  // some servers require direct url; iframe will try to render
  // (you can also do: `${url}#toolbar=0` but keep simple)
  return url;
}

function openInNewTab(url) {
  const u = String(url || "");
  if (!u) return;
  window.open(u, "_blank", "noopener,noreferrer");
}

/* -----------------------
   Normalizers (robust)
   ----------------------- */
function toTime(x) {
  const d = new Date(x);
  const n = d.getTime();
  return Number.isFinite(n) ? n : 0;
}

function getTime(it) {
  return (
    toTime(it?.created_at) ||
    toTime(it?.createdAt) ||
    toTime(it?.date) ||
    toTime(it?.updated_at) ||
    toTime(it?.updatedAt) ||
    0
  );
}

function getId(it) {
  return it?.id ?? it?._id ?? it?.uuid ?? it?.announcement_id ?? it?.key ?? null;
}

function pickTitle(it) {
  return String(it?.title ?? it?.subject ?? it?.name ?? it?.heading ?? "").trim() || "(Untitled)";
}

function pickBody(it) {
  return it?.body ?? it?.content ?? it?.detail ?? it?.description ?? it?.message ?? it?.text ?? "";
}

function stripHtml(s) {
  return String(s || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatWhen(ts) {
  const d = new Date(ts);
  if (!Number.isFinite(d.getTime())) return "-";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseTags(it) {
  const t = it?.tags ?? it?.tag ?? it?.labels ?? it?.keywords ?? it?.categories ?? it?.category ?? "";
  if (Array.isArray(t)) return t.map((x) => String(x).trim()).filter(Boolean).slice(0, 12);

  const s = String(t || "").trim();
  if (!s) return [];
  return s
    .split(/[,\n]/g)
    .map((x) => x.trim().replace(/^#/, ""))
    .filter(Boolean)
    .slice(0, 12);
}

function pickVisibility(it) {
  const v = it?.visibility ?? it?.audience ?? it?.member_access ?? it?.access ?? it?.scope ?? it?.target ?? "";
  const s = String(v || "").trim();
  if (!s) return "";
  if (s === "1") return "Members";
  if (s === "0") return "All";
  return s.length > 18 ? s.slice(0, 18) + "…" : s;
}

/* ✅ Pick media url for PDF/Image (robust) */
function pickMediaUrl(it) {
  // direct candidates
  const cands = [
    it?.pdf_url,
    it?.pdf,
    it?.document_url,
    it?.doc_url,
    it?.file_url,
    it?.file,
    it?.attachment_url,
    it?.attachment,
    it?.image_url,
    it?.image,
    it?.cover,
    it?.thumbnail,
    it?.photo,
    it?.banner,
    it?.url,
  ].filter(Boolean);

  if (cands.length) return String(cands[0]).trim();

  // attachments array
  if (Array.isArray(it?.attachments) && it.attachments.length) {
    const a0 = it.attachments[0];
    const u = a0?.url ?? a0?.path ?? a0?.src ?? a0?.file_url ?? "";
    if (u) return String(u).trim();
  }

  // files array
  if (Array.isArray(it?.files) && it.files.length) {
    const f0 = it.files[0];
    const u = f0?.url ?? f0?.path ?? f0?.src ?? "";
    if (u) return String(u).trim();
  }

  return "";
}

function makeKey(it, i) {
  return getId(it) ?? `${i}-${Math.random().toString(16).slice(2)}`;
}

/* -----------------------
   Fetch
   ----------------------- */
async function fetchAll() {
  loading.value = true;
  error.value = "";
  try {
    const res = await fetch(ANN_API_URL);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const data = await res.json();
    const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];

    itemsRaw.value = (list || []).map((it, i) => {
      const t = getTime(it);
      const title = pickTitle(it);
      const fullText = stripHtml(pickBody(it));
      const preview = fullText ? (fullText.length > 160 ? fullText.slice(0, 160) + "…" : fullText) : "";

      const rawMedia = pickMediaUrl(it);
      const absMedia = rawMedia ? toAbsUrl(rawMedia) : "";
      const mediaKind = kindFromUrl(absMedia);

      return {
        _raw: it,
        _t: t,
        _key: makeKey(it, i),
        id: String(getId(it) ?? ""),
        title,
        fullText,
        preview,
        when: t ? formatWhen(t) : "-",
        tags: parseTags(it),
        visibility: pickVisibility(it),
        media: { url: absMedia, kind: mediaKind },
      };
    });

    await nextTick();
    if (page.value >= totalPages.value) page.value = Math.max(0, totalPages.value - 1);

    await nextTick();
    revealCards();
  } catch (e) {
    error.value = e?.message || "Failed to load announcements";
  } finally {
    loading.value = false;
  }
}

/* -----------------------
   Filtering + sorting
   ----------------------- */
const filtered = computed(() => {
  const s = String(q.value || "").toLowerCase().trim();
  let list = itemsRaw.value.slice();

  if (s) {
    list = list.filter((x) => {
      const tags = (x.tags || []).join(" ").toLowerCase();
      return (
        String(x.title || "").toLowerCase().includes(s) ||
        String(x.fullText || "").toLowerCase().includes(s) ||
        tags.includes(s) ||
        String(x.id || "").toLowerCase().includes(s) ||
        String(x.media?.url || "").toLowerCase().includes(s)
      );
    });
  }

  if (sortMode.value === "title") {
    list.sort((a, b) => String(a.title).localeCompare(String(b.title)));
  } else {
    list.sort((a, b) => (b._t || 0) - (a._t || 0));
  }

  return list;
});

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)));

const pageItems = computed(() => {
  const start = page.value * pageSize.value;
  return filtered.value.slice(start, start + pageSize.value);
});

watch([q, pageSize, sortMode], () => {
  page.value = 0;
});

/* -----------------------
   Modal (preview/edit)
   ----------------------- */
const modal = ref({
  show: false,
  mode: "preview", // 'preview' | 'edit'
  busy: false,
  item: null,
});

const fileEl = ref(null);
let objectUrlToRevoke = "";

const form = ref({
  id: "",
  title: "",
  body: "",
  tags: "",
  visibility: "",

  // selected file
  file: null,
  previewUrl: "",
  previewKind: "none",

  // existing media url
  keepUrl: "",
  keepKind: "none",

  // removal flag
  removeExisting: false,
});

function openPreview(a) {
  modal.value = { show: true, mode: "preview", busy: false, item: a };
  gsap.fromTo(".modal", { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.18, ease: "power2.out" });
}

function openEdit(a) {
  modal.value = { show: true, mode: "edit", busy: false, item: a };

  const raw = a?._raw || {};
  form.value.id = a.id || String(getId(raw) ?? "");
  form.value.title = a.title || "";
  form.value.body = String(pickBody(raw) ?? "");
  form.value.tags = (a.tags || []).join(", ");
  form.value.visibility = a.visibility || "";

  // keep existing media
  form.value.keepUrl = a.media?.url || "";
  form.value.keepKind = a.media?.kind || "none";

  // reset selection
  resetPickedFile(true);
  form.value.removeExisting = false;

  gsap.fromTo(".modal", { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.18, ease: "power2.out" });
}

function closeModal() {
  modal.value.show = false;
  modal.value.busy = false;
  modal.value.item = null;
  resetPickedFile(true);
}

function triggerFile() {
  fileEl.value?.click?.();
}

function kindFromFile(f) {
  const t = String(f?.type || "").toLowerCase();
  if (t.includes("pdf")) return "pdf";
  if (t.startsWith("image/")) return "image";
  // fallback by name
  const name = String(f?.name || "");
  const ext = extFromUrl(name);
  if (ext === "pdf") return "pdf";
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext)) return "image";
  return "other";
}

function resetPickedFile(keepExisting = false) {
  try {
    if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
  } catch {}
  objectUrlToRevoke = "";

  form.value.file = null;
  form.value.previewUrl = "";
  form.value.previewKind = "none";

  if (!keepExisting) {
    form.value.keepUrl = "";
    form.value.keepKind = "none";
    form.value.removeExisting = true;
  }

  if (fileEl.value) fileEl.value.value = "";
}

function onPickFile(e) {
  const f = e?.target?.files?.[0];
  if (!f) return;

  resetPickedFile(true);

  form.value.file = f;
  form.value.previewKind = kindFromFile(f);
  const u = URL.createObjectURL(f);
  objectUrlToRevoke = u;
  form.value.previewUrl = u;

  // selecting new file implies replacing existing
  form.value.removeExisting = false;
}

function removeMedia() {
  // remove both selected and existing
  resetPickedFile(false);
}

/* -----------------------
   Update API (best-effort)
   ----------------------- */
async function fetchJsonSafe(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function tryUpdateWithFormData(id, baseFields, file) {
  const url = `${ANN_API_URL}/${encodeURIComponent(id)}`;
  const fields = ["file", "image", "attachment"]; // ✅ fallback field names

  const methods = ["PUT", "PATCH"];

  for (const fileField of fields) {
    for (const method of methods) {
      const fd = new FormData();
      fd.append("title", baseFields.title);
      fd.append("body", baseFields.body);
      fd.append("visibility", baseFields.visibility);
      fd.append("tags", baseFields.tagsJson);
      fd.append("remove_existing", baseFields.removeExisting ? "1" : "0");
      fd.append(fileField, file);

      const res = await fetch(url, { method, body: fd });
      if (res.ok) return res;

      // some APIs return 200 with ok=false? (rare) ignore
      await fetchJsonSafe(res);
    }
  }
  return null;
}

async function tryUpdateJson(id, payload) {
  const url = `${ANN_API_URL}/${encodeURIComponent(id)}`;

  // try PUT then PATCH
  let res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  return res;
}

async function saveEdit() {
  const id = String(form.value.id || "").trim();
  if (!id) return toastErr("Missing ID", "This item has no id field from API.");
  if (!String(form.value.title || "").trim()) return toastErr("Missing title", "Please enter a title.");

  modal.value.busy = true;

  try {
    const tagsArr = String(form.value.tags || "")
      .split(/[,\n]/g)
      .map((x) => x.trim().replace(/^#/, ""))
      .filter(Boolean);

    // base fields
    const baseFields = {
      title: form.value.title,
      body: form.value.body || "",
      visibility: form.value.visibility || "",
      tagsJson: JSON.stringify(tagsArr),
      removeExisting: !!form.value.removeExisting,
    };

    let res = null;

    // ✅ if new file selected -> FormData
    if (form.value.file) {
      res = await tryUpdateWithFormData(id, baseFields, form.value.file);
      if (!res) throw new Error("Upload failed (endpoint or field name mismatch).");
    } else {
      // ✅ JSON update (and allow remove existing attachment)
      const payload = {
        title: baseFields.title,
        body: baseFields.body,
        tags: tagsArr,
        visibility: baseFields.visibility,

        // best-effort: tell backend to clear attachment if removed
        remove_existing: baseFields.removeExisting ? 1 : 0,

        // keep url if not removed (some APIs accept this)
        attachment_url: baseFields.removeExisting ? "" : (form.value.keepUrl || ""),
        file_url: baseFields.removeExisting ? "" : (form.value.keepUrl || ""),
        image_url: baseFields.removeExisting ? "" : (form.value.keepKind === "image" ? (form.value.keepUrl || "") : ""),
        pdf_url: baseFields.removeExisting ? "" : (form.value.keepKind === "pdf" ? (form.value.keepUrl || "") : ""),
      };

      res = await tryUpdateJson(id, payload);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    }

    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

    toastOk("Saved", "Announcement updated successfully.");
    closeModal();
    await fetchAll();
  } catch (e) {
    toastErr("Save failed", e?.message || "Cannot update announcement.");
  } finally {
    modal.value.busy = false;
  }
}

/* -----------------------
   Delete confirm
   ----------------------- */
const confirmDel = ref({
  show: false,
  busy: false,
  item: null,
});

function askDelete(a) {
  confirmDel.value = { show: true, busy: false, item: a };
  gsap.fromTo(".confirm", { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.18, ease: "power2.out" });
}

async function doDelete() {
  const a = confirmDel.value.item;
  const id = String(a?.id || "").trim();
  if (!id) return toastErr("Missing ID", "This item has no id field from API.");

  confirmDel.value.busy = true;

  try {
    let res = await fetch(`${ANN_API_URL}/${encodeURIComponent(id)}`, { method: "DELETE" });

    // fallback
    if (!res.ok) {
      res = await fetch(`${ANN_API_URL}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    }

    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

    toastOk("Deleted", "Announcement deleted.");
    confirmDel.value.show = false;
    confirmDel.value.item = null;

    await fetchAll();
  } catch (e) {
    toastErr("Delete failed", e?.message || "Cannot delete announcement.");
  } finally {
    confirmDel.value.busy = false;
  }
}

/* -----------------------
   Nav helpers
   ----------------------- */
function goCreate() {
  // Adjust to your create route if different
  router.push("/announcement");
}

/* -----------------------
   Toast
   ----------------------- */
const toast = ref({ show: false, kind: "ok", title: "", text: "" });
let toastTimer = null;

function showToast(kind, title, text) {
  toast.value = { show: true, kind, title, text };
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.value.show = false), 5200);
}
function hideToast() {
  toast.value.show = false;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = null;
}
function toastOk(title, text) {
  showToast("ok", title, text);
}
function toastErr(title, text) {
  showToast("err", title, text);
}

/* -----------------------
   GSAP animations
   ----------------------- */
function btnHover(e, enter) {
  gsap.to(e.currentTarget, { y: enter ? -2 : 0, duration: 0.22, ease: "power2.out" });
}
function iconHover(e, enter) {
  gsap.to(e.currentTarget, { y: enter ? -2 : 0, duration: 0.18, ease: "power2.out" });
}
function cardHover(e, enter) {
  gsap.to(e.currentTarget, { y: enter ? -3 : 0, duration: 0.2, ease: "power2.out" });
}

function revealCards() {
  const cards = rootEl.value?.querySelectorAll?.(".js-card");
  if (!cards || !cards.length) return;

  gsap.killTweensOf(cards);
  gsap.fromTo(
    cards,
    { opacity: 0, y: 10 },
    { opacity: 1, y: 0, duration: 0.42, ease: "power3.out", stagger: 0.04 }
  );
}

async function initReveal() {
  gsap.set(".js-reveal", { opacity: 0, y: 12 });
  gsap.to(".js-reveal", { opacity: 1, y: 0, stagger: 0.06, duration: 0.42, ease: "power3.out", delay: 0.05 });
}

/* -----------------------
   Lifecycle
   ----------------------- */
function onGlobalKeydown(e) {
  if (e?.key === "Escape") {
    if (modal.value.show) closeModal();
    if (confirmDel.value.show) confirmDel.value.show = false;
  }
}

onMounted(async () => {
  window.addEventListener("keydown", onGlobalKeydown);
  await nextTick();
  await initReveal();
  await fetchAll();
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onGlobalKeydown);
  hideToast();
  resetPickedFile(true);
});
</script>

<style scoped>
.annManage {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 6px 2px 18px;
  color: var(--txt);
}

/* Topbar */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;

  padding: 14px 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.25);
  position: relative;
  overflow: hidden;
}
.topbar::before {
  content: "";
  position: absolute;
  inset: -1px;
  pointer-events: none;
  background: radial-gradient(560px 260px at 18% 15%, rgba(56, 189, 248, 0.12), transparent 60%),
    radial-gradient(560px 260px at 80% 35%, rgba(99, 102, 241, 0.1), transparent 62%);
  opacity: 0.9;
}

.titleRow {
  display: flex;
  align-items: center;
  gap: 12px;
}
.titleIcon {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.20), rgba(99, 102, 241, 0.14));
  border: 1px solid rgba(56, 189, 248, 0.18);
  box-shadow: 0 18px 46px rgba(56, 189, 248, 0.08);
}
.pageTitle {
  font-weight: 950;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.95);
}
.pageSub {
  margin-top: 2px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.62);
}

.topRight {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Search */
.searchWrap {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 10px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.08);
  min-width: min(420px, 42vw);
}
.searchIcon {
  opacity: 0.85;
}
.search {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 700;
}
.clear {
  width: 30px;
  height: 30px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
}
.clear:hover {
  border-color: rgba(56, 189, 248, 0.22);
  box-shadow: 0 14px 34px rgba(56, 189, 248, 0.08);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border-radius: 14px;
  font-weight: 900;
  cursor: pointer;

  border: 1px solid rgba(56, 189, 248, 0.22);
  background: rgba(56, 189, 248, 0.12);
  color: rgba(255, 255, 255, 0.92);
}
.btn.ghost {
  border-color: rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.82);
}
.btn.soft {
  border-color: rgba(56, 189, 248, 0.16);
  background: rgba(56, 189, 248, 0.08);
}
.btn.tiny {
  padding: 8px 10px;
  border-radius: 12px;
  font-weight: 900;
  font-size: 12px;
}
.btn.danger {
  border-color: rgba(255, 80, 80, 0.22);
  background: rgba(255, 80, 80, 0.10);
}
.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.spin {
  animation: spin 0.9s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Stats */
.stats {
  display: grid;
  grid-template-columns: 180px 180px 180px 1fr;
  gap: 12px;
  align-items: stretch;
}
.statCard {
  padding: 12px 12px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 46px rgba(0, 0, 0, 0.18);
}
.statLabel {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.62);
  font-weight: 800;
}
.statValue {
  margin-top: 6px;
  font-size: 18px;
  font-weight: 950;
  color: rgba(255, 255, 255, 0.92);
}
.statActions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  align-items: center;
  padding: 10px 10px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.07);
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  font-weight: 900;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.84);
  position: relative;
}
.chip .dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.95);
  box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.14);
}

/* Grid */
.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  align-items: stretch;
}

/* Card */
.card {
  border-radius: 18px;
  padding: 12px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.20);
  overflow: hidden;
  position: relative;
}
.card::before {
  content: "";
  position: absolute;
  inset: -1px;
  pointer-events: none;
  opacity: 0.7;
  background: radial-gradient(520px 260px at 10% 0%, rgba(56, 189, 248, 0.10), transparent 60%),
    radial-gradient(520px 260px at 90% 10%, rgba(99, 102, 241, 0.08), transparent 62%);
}
.cardTop {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  position: relative;
  z-index: 1;
}
.cardTitle .tMain {
  font-weight: 950;
  color: rgba(255, 255, 255, 0.94);
  line-height: 1.2;
  font-size: 15px;

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.tSub {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.82);
}
.pill.soft {
  border-color: rgba(56, 189, 248, 0.16);
  background: rgba(56, 189, 248, 0.08);
}
.pill.pdf {
  border-color: rgba(255, 80, 80, 0.20);
  background: rgba(255, 80, 80, 0.10);
}
.pill.img {
  border-color: rgba(56, 189, 248, 0.18);
  background: rgba(56, 189, 248, 0.08);
}
.pill.file {
  border-color: rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.05);
}

.cardMenu {
  display: inline-flex;
  gap: 8px;
}
.iconBtn {
  width: 36px;
  height: 36px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
}
.iconBtn:hover {
  border-color: rgba(56, 189, 248, 0.22);
  box-shadow: 0 14px 34px rgba(56, 189, 248, 0.10);
}
.iconBtn.danger:hover {
  border-color: rgba(255, 80, 80, 0.22);
  box-shadow: 0 14px 34px rgba(255, 80, 80, 0.10);
}

/* Image thumb */
.thumb {
  margin-top: 10px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.02);
  position: relative;
  z-index: 1;
  cursor: pointer;
}
.thumb img {
  width: 100%;
  height: 160px;
  object-fit: cover;
  display: block;
  opacity: 0.95;
}

/* PDF thumb */
.thumbPdf {
  margin-top: 10px;
  border-radius: 16px;
  border: 1px solid rgba(255, 80, 80, 0.18);
  background: rgba(255, 80, 80, 0.06);
  padding: 12px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  position: relative;
  z-index: 1;
}
.pdfIcon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 80, 80, 0.22);
  background: rgba(255, 80, 80, 0.10);
}
.pdfIcon i {
  font-size: 18px;
}
.pdfText {
  min-width: 0;
  display: grid;
  gap: 2px;
}
.pdfTitle {
  font-weight: 950;
  color: rgba(255, 255, 255, 0.92);
}
.pdfSub {
  font-size: 12px;
  opacity: 0.72;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 52ch;
}
.pdfPill {
  margin-left: auto;
  font-weight: 950;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 80, 80, 0.22);
  background: rgba(255, 80, 80, 0.12);
}

/* Body */
.cardBody {
  margin-top: 10px;
  position: relative;
  z-index: 1;
}
.preview {
  font-size: 12px;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.82);
  word-break: break-word;

  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.preview.muted {
  color: rgba(255, 255, 255, 0.55);
}
.tags {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tag {
  font-size: 12px;
  font-weight: 900;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(56, 189, 248, 0.18);
  background: rgba(56, 189, 248, 0.08);
  color: rgba(255, 255, 255, 0.86);
}
.cardFoot {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  position: relative;
  z-index: 1;
}
.footBtns {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
.id {
  font-size: 12px;
  opacity: 0.7;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

/* States */
.state {
  grid-column: 1 / -1;
  padding: 18px 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.025);
  border: 1px dashed rgba(255, 255, 255, 0.14);
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  color: rgba(255, 255, 255, 0.75);
}
.state.big {
  flex-direction: column;
  gap: 12px;
}
.state.err {
  border-style: solid;
  border-color: rgba(255, 80, 80, 0.22);
  background: rgba(255, 80, 80, 0.08);
}
.stateText {
  font-weight: 800;
}
.loaderDot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.06);
  animation: ld 0.9s ease-in-out infinite;
}
.loaderDot:nth-child(2) {
  animation-delay: 0.12s;
}
.loaderDot:nth-child(3) {
  animation-delay: 0.24s;
}
@keyframes ld {
  0% { transform: translateY(0); opacity: 0.55; }
  50% { transform: translateY(-5px); opacity: 1; }
  100% { transform: translateY(0); opacity: 0.55; }
}

/* Pager */
.pager {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;

  padding: 12px 12px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.07);
}
.pageInfo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.05);
}
.muted {
  color: rgba(255, 255, 255, 0.62);
  font-weight: 800;
}
.pageSize {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.select,
.input,
.textarea {
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.88);
  outline: none;
  padding: 10px 12px;
  font-weight: 800;
}
.textarea {
  resize: vertical;
  min-height: 140px;
}

/* Overlay mask */
.mask {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(10px);
}

/* Modal */
.modal {
  width: min(900px, 96vw);
  max-height: min(84vh, 900px);
  overflow: hidden;
  border-radius: 18px;
  background: rgba(8, 12, 28, 0.86);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.52);
  backdrop-filter: blur(14px);
  display: grid;
  grid-template-rows: auto 1fr;
}
.mHead {
  padding: 14px 14px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.mHeadRight {
  display: inline-flex;
  gap: 10px;
  align-items: center;
}
.mTitle {
  font-weight: 950;
  display: inline-flex;
  gap: 10px;
  align-items: center;
  color: rgba(255, 255, 255, 0.92);
}
.mSub {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.iconClose {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
}
.iconClose:hover {
  border-color: rgba(56, 189, 248, 0.22);
  box-shadow: 0 14px 34px rgba(56, 189, 248, 0.10);
}
.mBody {
  padding: 12px 14px 14px;
  overflow: auto;
}
.mBody::-webkit-scrollbar {
  width: 10px;
}
.mBody::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
}

/* Preview content */
.pvTitle {
  font-weight: 950;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.94);
}
.pvImg {
  margin-top: 12px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.10);
}
.pvImg img {
  width: 100%;
  height: 320px;
  object-fit: cover;
  display: block;
}
.pvPdf {
  margin-top: 12px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 80, 80, 0.18);
  background: rgba(255, 255, 255, 0.02);
}
.pdfFrame {
  width: 100%;
  height: min(62vh, 520px);
  border: 0;
  display: block;
  background: rgba(0, 0, 0, 0.2);
}
.pdfFrame.small {
  height: 340px;
}
.pvHelp {
  padding: 10px 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.68);
  border-top: 1px solid rgba(255, 80, 80, 0.12);
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.linkBtn {
  border: none;
  background: transparent;
  color: rgba(56, 189, 248, 0.92);
  font-weight: 900;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.pvFile {
  margin-top: 12px;
  padding: 12px 12px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.04);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.pvFileRow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.pvFileName {
  font-weight: 900;
  opacity: 0.9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 56ch;
}

.pvText {
  margin-top: 12px;
  font-size: 13px;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.84);
  white-space: pre-wrap;
  word-break: break-word;
}
.pvTags {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* Form */
.form {
  display: grid;
  gap: 12px;
}
.row {
  display: grid;
  gap: 8px;
}
.label {
  font-size: 12px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.78);
}
.hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}
.two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.upload {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.upload input[type="file"] {
  display: none;
}
.imgPrev {
  margin-top: 10px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.10);
}
.imgPrev img {
  width: 100%;
  height: 220px;
  object-fit: cover;
  display: block;
}
.pdfPrev {
  margin-top: 10px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 80, 80, 0.18);
  background: rgba(255, 80, 80, 0.05);
}
.pdfPrevTop {
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 80, 80, 0.12);
}
.pdfPrevName {
  font-weight: 950;
  opacity: 0.9;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.filePrev {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.04);
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.mActions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 4px;
}
.note {
  margin-top: 6px;
  padding: 10px 12px;
  border-radius: 16px;
  border: 1px solid rgba(56, 189, 248, 0.16);
  background: rgba(56, 189, 248, 0.06);
  color: rgba(255, 255, 255, 0.78);
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}

/* Confirm */
.confirm {
  width: min(520px, 96vw);
  border-radius: 18px;
  background: rgba(8, 12, 28, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.52);
  backdrop-filter: blur(14px);
  overflow: hidden;
}
.cHead {
  padding: 14px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.cTitle {
  font-weight: 950;
  display: inline-flex;
  gap: 10px;
  align-items: center;
  color: rgba(255, 255, 255, 0.92);
}
.cBody {
  padding: 14px 14px;
  display: grid;
  gap: 8px;
}
.cName {
  margin-left: 6px;
}
.cWarn {
  color: rgba(255, 80, 80, 0.92);
  font-weight: 900;
}
.cActions {
  padding: 12px 14px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

/* Toast */
.toast {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 9999;

  display: flex;
  align-items: center;
  gap: 14px;

  padding: 12px 12px;
  border-radius: 16px;
  background: rgba(8, 12, 28, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.10);
  backdrop-filter: blur(14px);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.38);
  max-width: min(460px, 92vw);
}
.toast.ok {
  border-color: rgba(56, 189, 248, 0.18);
}
.toast.err {
  border-color: rgba(255, 80, 80, 0.22);
}
.toastLeft {
  display: grid;
  gap: 4px;
  min-width: 0;
}
.toastTitle {
  font-weight: 950;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.92);
}
.toastSub {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.65);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.toastRight {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}
.toastBtn {
  padding: 9px 10px;
  border-radius: 12px;
  font-weight: 900;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.82);
}

/* Transitions */
.popup-enter-active,
.popup-leave-active {
  transition: transform 180ms ease, opacity 180ms ease;
}
.popup-enter-from,
.popup-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.99);
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

/* Responsive */
@media (max-width: 1100px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .searchWrap {
    min-width: min(340px, 40vw);
  }
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 720px) {
  .topbar {
    flex-direction: column;
    align-items: stretch;
  }
  .topRight {
    flex-direction: column;
    align-items: stretch;
  }
  .searchWrap {
    min-width: 100%;
  }
  .grid {
    grid-template-columns: 1fr;
  }
  .two {
    grid-template-columns: 1fr;
  }
  .pageSize {
    display: none;
  }
}
</style>
