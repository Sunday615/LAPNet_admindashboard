<!-- src/views/AnnouncementViewer.vue -->
<template>
  <div class="page tech">
    <div class="glow glow-a"></div>
    <div class="glow glow-b"></div>

    <main class="layout">
      <section class="content">
        <!-- Topbar -->
        <header ref="topbarRef" class="topbar js-reveal">
          <div class="topLeft">
            <div class="titleRow">
              <div class="titleIcon"><i class="fa-solid fa-bell"></i></div>
              <div class="titleText">
                <div class="pageTitle">Announcements</div>
                <div class="pageSub">
                  Viewer notifications • Unread <b>{{ unreadCount }}</b> / {{ items.length }}
                </div>
              </div>
            </div>
          </div>

          <div class="topRight">
            <div class="searchWrap">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input
                v-model.trim="q"
                type="text"
                placeholder="Search title / content / tags..."
                @keydown.enter.prevent
              />
            </div>

            <button class="btn ghost" type="button" @click="load" :disabled="loading">
              <i class="fa-solid" :class="loading ? 'fa-spinner fa-spin' : 'fa-rotate'"></i>
              <span>{{ loading ? "Loading" : "Refresh" }}</span>
            </button>

            <button class="btn" type="button" @click="markAllRead" :disabled="items.length === 0 || unreadCount === 0">
              <i class="fa-solid fa-check-double"></i>
              <span>Mark all read</span>
            </button>
          </div>
        </header>

        <!-- Body -->
        <section class="body">
          <!-- Status -->
          <div v-if="error" class="state stateErr">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <div class="txt">
              <div class="t">Fetch failed</div>
              <div class="s">{{ error }}</div>
            </div>
            <button class="btn" type="button" @click="load">
              <i class="fa-solid fa-rotate"></i><span>Try again</span>
            </button>
          </div>

          <div v-else-if="loading && items.length === 0" class="state">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <div class="txt">
              <div class="t">Loading announcements…</div>
              <div class="s">Fetching from API</div>
            </div>
          </div>

          <div v-else-if="filtered.length === 0" class="state">
            <i class="fa-regular fa-bell-slash"></i>
            <div class="txt">
              <div class="t">No announcements</div>
              <div class="s">Try refresh or clear your search.</div>
            </div>
          </div>

          <!-- List -->
          <div v-else class="grid">
            <article
              v-for="(it, idx) in filtered"
              :key="getId(it) || idx"
              class="card annCard js-card"
              :class="{ unread: !isRead(getId(it)) }"
              @click="openItem(it)"
              @mouseenter="cardHover(idx, true)"
              @mouseleave="cardHover(idx, false)"
              ref="cardRefs"
            >
              <div class="cardTop">
                <div class="left">
                  <span
                    class="dot"
                    :class="{ on: !isRead(getId(it)) }"
                    :title="!isRead(getId(it)) ? 'Unread' : 'Read'"
                    aria-hidden="true"
                  ></span>

                  <div class="meta">
                    <div class="title">
                      {{ getTitle(it) }}
                    </div>
                    <div class="sub">
                      <span class="date">
                        <i class="fa-regular fa-clock"></i>
                        {{ formatDate(getCreatedAt(it)) }}
                      </span>
                      <span v-if="hasAttachment(it)" class="pill">
                        <i class="fa-regular fa-image"></i> Attachment
                      </span>
                    </div>
                  </div>
                </div>

                <div class="right">
                  <button class="miniBtn" type="button" @click.stop="openItem(it)">
                    <i class="fa-solid fa-chevron-right"></i>
                  </button>
                </div>
              </div>

              <div class="preview">
                {{ getPreview(it) }}
              </div>

              <div v-if="getTags(it).length" class="tags">
                <span v-for="t in getTags(it)" :key="t" class="tag">{{ t }}</span>
              </div>
            </article>
          </div>
        </section>
      </section>
    </main>

    <!-- Detail Modal -->
    <div v-if="selected" class="modalWrap" @click.self="closeItem">
      <div ref="modalRef" class="modal">
        <div class="modalHead">
          <div class="mhLeft">
            <div class="mhTitle">
              <span class="dot sm" :class="{ on: !isRead(getId(selected)) }" aria-hidden="true"></span>
              {{ getTitle(selected) }}
            </div>
            <div class="mhSub">
              <i class="fa-regular fa-clock"></i>
              {{ formatDate(getCreatedAt(selected), true) }}
            </div>
          </div>

          <div class="mhRight">
            <button class="btn ghost" type="button" @click="toggleRead(selected)">
              <i class="fa-solid" :class="isRead(getId(selected)) ? 'fa-envelope-open' : 'fa-envelope'"></i>
              <span>{{ isRead(getId(selected)) ? "Mark unread" : "Mark read" }}</span>
            </button>

            <button class="btn" type="button" @click="closeItem">
              <i class="fa-solid fa-xmark"></i><span>Close</span>
            </button>
          </div>
        </div>

        <div class="modalBody">
          <div class="contentText">
            {{ getContent(selected) }}
          </div>

          <div v-if="getTags(selected).length" class="tags big">
            <span v-for="t in getTags(selected)" :key="t" class="tag">{{ t }}</span>
          </div>

          <!-- Attachments -->
          <div v-if="attachments(selected).length" class="attach">
            <div class="attachTitle"><i class="fa-regular fa-paperclip"></i> Attachments</div>
            <div class="attachGrid">
              <a
                v-for="(u, i) in attachments(selected)"
                :key="u + i"
                class="attachItem"
                :href="u"
                target="_blank"
                rel="noreferrer"
                @click.stop
              >
                <div class="thumb" v-if="isImageUrl(u)">
                  <img :src="u" alt="" loading="lazy" />
                </div>
                <div class="file" v-else>
                  <i class="fa-regular fa-file-lines"></i>
                </div>
                <div class="fn">{{ fileName(u) }}</div>
              </a>
            </div>
          </div>
        </div>

        <div class="modalFoot">
          <button class="btn ghost" type="button" @click="prevItem">
            <i class="fa-solid fa-arrow-left"></i><span>Prev</span>
          </button>
          <button class="btn ghost" type="button" @click="nextItem">
            <span>Next</span><i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { gsap } from "gsap";

export default {
  name: "AnnouncementViewer",
  data() {
    return {
      API_URL: "http://localhost:3000/api/announcements",
      items: [],
      loading: false,
      error: "",
      q: "",
      selected: null,

      // read state
      readSet: new Set(),

      // refs list (v-for)
      cardRefs: [],

      // abort
      aborter: null,
    };
  },
  computed: {
    filtered() {
      const s = (this.q || "").toLowerCase();
      if (!s) return this.items;

      return this.items.filter((it) => {
        const title = (this.getTitle(it) || "").toLowerCase();
        const content = (this.getContent(it) || "").toLowerCase();
        const tags = this.getTags(it).join(" ").toLowerCase();
        return title.includes(s) || content.includes(s) || tags.includes(s);
      });
    },
    unreadCount() {
      let c = 0;
      for (const it of this.items) {
        const id = this.getId(it);
        if (id && !this.readSet.has(String(id))) c++;
      }
      return c;
    },
    storageKey() {
      // ใช้ username ถ้ามี เพื่อแยกการอ่านของแต่ละคน
      const u = localStorage.getItem("username") || localStorage.getItem("userName") || "viewer";
      return `ann_read_ids__${u}`;
    },
  },
  mounted() {
    this.restoreReads();
    this.animateShell();
    this.load();
  },
  beforeUnmount() {
    if (this.aborter) this.aborter.abort();
  },
  methods: {
    // -----------------------
    // Fetch
    // -----------------------
    async load() {
      if (this.loading) return;
      this.loading = true;
      this.error = "";

      try {
        if (this.aborter) this.aborter.abort();
        this.aborter = new AbortController();

        const token = localStorage.getItem("token");
        const res = await fetch(this.API_URL, {
          method: "GET",
          signal: this.aborter.signal,
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`${res.status} ${res.statusText}${txt ? ` • ${txt}` : ""}`);
        }

        const json = await res.json().catch(() => ({}));
        const arr = Array.isArray(json) ? json : json.data || json.items || json.rows || [];

        // sort newest first if possible
        const sorted = [...arr].sort((a, b) => {
          const ta = new Date(this.getCreatedAt(a) || 0).getTime();
          const tb = new Date(this.getCreatedAt(b) || 0).getTime();
          return tb - ta;
        });

        this.items = sorted;

        // re-collect refs next tick then animate list
        await this.$nextTick();
        this.animateList();
      } catch (e) {
        if (e?.name === "AbortError") return;
        this.error = e?.message || "Unknown error";
      } finally {
        this.loading = false;
      }
    },

    // -----------------------
    // Read state (localStorage)
    // -----------------------
    restoreReads() {
      try {
        const raw = localStorage.getItem(this.storageKey);
        const ids = raw ? JSON.parse(raw) : [];
        this.readSet = new Set((ids || []).map((x) => String(x)));
      } catch {
        this.readSet = new Set();
      }
    },
    persistReads() {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify([...this.readSet]));
      } catch {
        // ignore
      }
    },
    isRead(id) {
      if (!id) return false;
      return this.readSet.has(String(id));
    },
    markRead(id) {
      if (!id) return;
      this.readSet.add(String(id));
      this.persistReads();
    },
    markUnread(id) {
      if (!id) return;
      this.readSet.delete(String(id));
      this.persistReads();
    },
    toggleRead(item) {
      const id = this.getId(item);
      if (!id) return;
      if (this.isRead(id)) this.markUnread(id);
      else this.markRead(id);
    },
    markAllRead() {
      for (const it of this.items) {
        const id = this.getId(it);
        if (id) this.readSet.add(String(id));
      }
      this.persistReads();
      // small feedback animation
      gsap.fromTo(
        this.$refs.topbarRef,
        { scale: 1 },
        { scale: 1.01, duration: 0.12, yoyo: true, repeat: 1, ease: "power2.out" }
      );
    },

    // -----------------------
    // Open/Close detail
    // -----------------------
    openItem(it) {
      this.selected = it;

      // mark as read on open
      const id = this.getId(it);
      this.markRead(id);

      this.$nextTick(() => {
        if (this.$refs.modalRef) {
          gsap.fromTo(
            this.$refs.modalRef,
            { y: 18, opacity: 0, scale: 0.99 },
            { y: 0, opacity: 1, scale: 1, duration: 0.28, ease: "power3.out" }
          );
        }
      });
    },
    closeItem() {
      const el = this.$refs.modalRef;
      if (!el) {
        this.selected = null;
        return;
      }
      gsap.to(el, {
        y: 10,
        opacity: 0,
        duration: 0.18,
        ease: "power2.in",
        onComplete: () => (this.selected = null),
      });
    },
    nextItem() {
      if (!this.selected) return;
      const id = this.getId(this.selected);
      const idx = this.items.findIndex((x) => String(this.getId(x)) === String(id));
      const next = this.items[idx + 1] || this.items[0];
      if (next) this.openItem(next);
    },
    prevItem() {
      if (!this.selected) return;
      const id = this.getId(this.selected);
      const idx = this.items.findIndex((x) => String(this.getId(x)) === String(id));
      const prev = this.items[idx - 1] || this.items[this.items.length - 1];
      if (prev) this.openItem(prev);
    },

    // -----------------------
    // Helpers: data shape safe
    // -----------------------
    getId(it) {
      return it?.id ?? it?.announcement_id ?? it?.announcementId ?? it?.AnnID ?? it?.AnnId;
    },
    getTitle(it) {
      return it?.title ?? it?.ann_title ?? it?.announcement_title ?? it?.subject ?? "Untitled";
    },
    getContent(it) {
      return it?.paragraph ?? it?.content ?? it?.body ?? it?.description ?? "";
    },
    getCreatedAt(it) {
      return it?.created_at ?? it?.createdAt ?? it?.date ?? it?.created ?? it?.updated_at ?? it?.updatedAt ?? "";
    },
    getTags(it) {
      const t = it?.tags ?? it?.tag ?? it?.labels ?? it?.Categories;
      if (!t) return [];
      if (Array.isArray(t)) return t.map(String).filter(Boolean);
      if (typeof t === "string") {
        // allow comma separated
        return t
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
      }
      return [];
    },
    getPreview(it) {
      const txt = this.getContent(it) || "";
      const clean = String(txt).replace(/\s+/g, " ").trim();
      return clean.length > 160 ? clean.slice(0, 160) + "…" : clean;
    },

    attachments(it) {
      // support: file_url | image_url | files[] | attachments[]
      const a = it?.attachments ?? it?.files ?? it?.file_urls ?? it?.fileUrl ?? it?.file_url ?? it?.image ?? it?.image_url;
      const out = [];

      const pushUrl = (u) => {
        if (!u) return;
        const url = this.normalizeUrl(String(u));
        if (url) out.push(url);
      };

      if (Array.isArray(a)) {
        for (const x of a) {
          if (typeof x === "string") pushUrl(x);
          else if (x?.url) pushUrl(x.url);
          else if (x?.path) pushUrl(x.path);
          else if (x?.file_url) pushUrl(x.file_url);
        }
      } else if (typeof a === "string") {
        pushUrl(a);
      } else if (a?.url) {
        pushUrl(a.url);
      } else if (a?.path) {
        pushUrl(a.path);
      }

      // de-dup
      return [...new Set(out)];
    },
    hasAttachment(it) {
      return this.attachments(it).length > 0;
    },
    normalizeUrl(u) {
      // if already absolute -> return
      if (/^https?:\/\//i.test(u)) return u;

      // if relative like "/uploads/..." keep relative (works if same host serves static)
      if (u.startsWith("/")) return u;

      // fallback: treat as relative path
      return "/" + u;
    },
    isImageUrl(u) {
      return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(u.split("?")[0]);
    },
    fileName(u) {
      try {
        const noQ = u.split("?")[0];
        const parts = noQ.split("/");
        return parts[parts.length - 1] || "file";
      } catch {
        return "file";
      }
    },
    formatDate(v, withTime = false) {
      if (!v) return "—";
      const d = new Date(v);
      if (isNaN(d.getTime())) return String(v);
      const opt = withTime
        ? { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }
        : { year: "numeric", month: "short", day: "2-digit" };
      return d.toLocaleString(undefined, opt);
    },

    // -----------------------
    // GSAP animations
    // -----------------------
    animateShell() {
      const top = this.$refs.topbarRef;
      if (!top) return;

      gsap.fromTo(
        top,
        { y: -12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35, ease: "power3.out" }
      );

      gsap.fromTo(
        ".glow-a",
        { opacity: 0.35 },
        { opacity: 0.75, duration: 2.4, yoyo: true, repeat: -1, ease: "sine.inOut" }
      );
      gsap.fromTo(
        ".glow-b",
        { opacity: 0.25 },
        { opacity: 0.6, duration: 3.1, yoyo: true, repeat: -1, ease: "sine.inOut" }
      );
    },
    animateList() {
      const cards = this.$refs.cardRefs;
      if (!cards || !cards.length) return;

      gsap.fromTo(
        cards,
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.32, ease: "power3.out", stagger: 0.05 }
      );

      // pulse unread dots gently
      const dots = Array.from(document.querySelectorAll(".annCard.unread .dot.on"));
      if (dots.length) {
        gsap.fromTo(dots, { scale: 1 }, { scale: 1.12, duration: 0.55, yoyo: true, repeat: -1, ease: "sine.inOut" });
      }
    },
    cardHover(idx, on) {
      const cards = this.$refs.cardRefs || [];
      const el = cards[idx];
      if (!el) return;
      gsap.to(el, { y: on ? -2 : 0, duration: 0.16, ease: "power2.out" });
    },
  },
};
</script>

<style scoped>
/* ===== Tech base ===== */
.page.tech {
  min-height: 100vh;
  background: radial-gradient(1200px 600px at 20% 10%, rgba(60, 160, 255, 0.18), transparent 60%),
    radial-gradient(900px 520px at 85% 30%, rgba(120, 80, 255, 0.14), transparent 55%),
    linear-gradient(180deg, #060914, #050712);
  position: relative;
  overflow: hidden;
  color: #e9f1ff;
}

.glow {
  position: absolute;
  width: 720px;
  height: 720px;
  filter: blur(70px);
  border-radius: 999px;
  pointer-events: none;
  opacity: 0.55;
}
.glow-a {
  left: -220px;
  top: -240px;
  background: radial-gradient(circle at 30% 30%, rgba(40, 170, 255, 0.55), transparent 60%);
}
.glow-b {
  right: -260px;
  bottom: -260px;
  background: radial-gradient(circle at 30% 30%, rgba(160, 110, 255, 0.5), transparent 60%);
}

.layout {
  width: min(1200px, calc(100% - 40px));
  margin: 0 auto;
  padding: 22px 0 36px;
  position: relative;
  z-index: 2;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ===== Topbar ===== */
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  padding: 14px 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(10, 14, 28, 0.65);
  backdrop-filter: blur(10px);
  border-radius: 18px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.28);
}

.titleRow {
  display: flex;
  gap: 12px;
  align-items: center;
}
.titleIcon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.pageTitle {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.2px;
}
.pageSub {
  font-size: 12.5px;
  color: rgba(233, 241, 255, 0.72);
  margin-top: 2px;
}

.topRight {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.searchWrap {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  min-width: 280px;
}
.searchWrap i {
  opacity: 0.75;
}
.searchWrap input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: #e9f1ff;
  font-size: 13px;
}

.btn {
  border: none;
  cursor: pointer;
  padding: 10px 12px;
  border-radius: 14px;
  font-weight: 700;
  font-size: 13px;
  color: #071125;
  background: linear-gradient(135deg, rgba(60, 160, 255, 0.95), rgba(135, 110, 255, 0.9));
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.22);
}
.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.btn.ghost {
  color: rgba(233, 241, 255, 0.9);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: none;
}

/* ===== Body ===== */
.body {
  padding: 2px 2px;
}

.state {
  padding: 18px;
  border-radius: 18px;
  background: rgba(10, 14, 28, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  gap: 12px;
}
.state i {
  font-size: 18px;
  opacity: 0.85;
}
.state .txt .t {
  font-weight: 800;
}
.state .txt .s {
  margin-top: 2px;
  font-size: 12.5px;
  color: rgba(233, 241, 255, 0.72);
}
.stateErr {
  border-color: rgba(255, 80, 100, 0.25);
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

/* ===== Cards ===== */
.card {
  border-radius: 18px;
  background: rgba(10, 14, 28, 0.58);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.28);
  overflow: hidden;
}
.annCard {
  padding: 14px 14px 12px;
  cursor: pointer;
  transition: border-color 0.15s ease;
}
.annCard:hover {
  border-color: rgba(80, 170, 255, 0.3);
}
.annCard.unread {
  border-color: rgba(255, 80, 100, 0.22);
}

.cardTop {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}
.left {
  display: flex;
  gap: 10px;
  min-width: 0;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.22);
  box-shadow: 0 0 0 0 rgba(255, 80, 100, 0);
  margin-top: 4px;
  flex: 0 0 auto;
}
.dot.on {
  background: rgba(255, 70, 95, 0.95);
  box-shadow: 0 0 0 6px rgba(255, 70, 95, 0.12);
}
.dot.sm {
  width: 9px;
  height: 9px;
}

.meta {
  min-width: 0;
}
.title {
  font-weight: 900;
  font-size: 14px;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sub {
  margin-top: 6px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 12px;
  color: rgba(233, 241, 255, 0.75);
}
.date i {
  margin-right: 6px;
  opacity: 0.8;
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.preview {
  margin-top: 10px;
  font-size: 13px;
  color: rgba(233, 241, 255, 0.78);
  line-height: 1.45;
}

.tags {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.tags.big {
  margin-top: 14px;
}
.tag {
  font-size: 12px;
  padding: 5px 9px;
  border-radius: 999px;
  background: rgba(60, 160, 255, 0.12);
  border: 1px solid rgba(60, 160, 255, 0.2);
  color: rgba(233, 241, 255, 0.92);
}

.miniBtn {
  width: 36px;
  height: 36px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(233, 241, 255, 0.9);
  cursor: pointer;
  display: grid;
  place-items: center;
}

/* ===== Modal ===== */
.modalWrap {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: grid;
  place-items: center;
  z-index: 50;
  padding: 18px;
}
.modal {
  width: min(980px, 100%);
  border-radius: 20px;
  background: rgba(10, 14, 28, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.45);
  overflow: hidden;
}

.modalHead {
  padding: 14px 14px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.mhTitle {
  font-size: 16px;
  font-weight: 950;
  display: flex;
  align-items: center;
  gap: 10px;
}
.mhSub {
  margin-top: 6px;
  font-size: 12.5px;
  color: rgba(233, 241, 255, 0.72);
}
.mhRight {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.modalBody {
  padding: 14px;
}
.contentText {
  white-space: pre-wrap;
  line-height: 1.6;
  font-size: 13.5px;
  color: rgba(233, 241, 255, 0.86);
}

.attach {
  margin-top: 16px;
}
.attachTitle {
  font-weight: 900;
  font-size: 13px;
  margin-bottom: 10px;
  color: rgba(233, 241, 255, 0.9);
}
.attachGrid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}
.attachItem {
  text-decoration: none;
  color: rgba(233, 241, 255, 0.9);
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.thumb {
  height: 110px;
  background: rgba(0, 0, 0, 0.15);
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.file {
  height: 110px;
  display: grid;
  place-items: center;
  font-size: 22px;
  opacity: 0.9;
}
.fn {
  padding: 10px 10px 12px;
  font-size: 12px;
  opacity: 0.85;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.modalFoot {
  padding: 12px 14px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

/* ===== Responsive ===== */
@media (max-width: 980px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .searchWrap {
    min-width: 220px;
  }
  .attachGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
