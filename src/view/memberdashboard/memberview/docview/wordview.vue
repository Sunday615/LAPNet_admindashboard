<!-- documentviewer.vue -->
<template>
  <div class="docViewer">
    <!-- Top bar -->
    <header ref="topbarRef" class="topbar">
      <div class="searchWrap">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input v-model.trim="q" type="text" placeholder="Search Files" />
      </div>

      <!-- ✅ Profile dropdown -->
      <div ref="profileWrapRef" class="profileWrap">
        <button ref="profileBtnRef" class="userBtn" type="button" @click="toggleProfile">
          <span class="userName">{{ userName }}</span>

          <div class="avatar" aria-hidden="true">
            <img v-if="userAvatar" :src="userAvatar" alt="" />
            <div v-else class="avatarPh"></div>
          </div>

          <i ref="profileChevronRef" class="fa-solid fa-chevron-down chevron" aria-hidden="true"></i>
        </button>

        <div ref="profileMenuRef" class="profileMenu" role="menu" aria-label="Profile menu">
          <button class="menuItem" type="button" @click="goNotifications">
            <span class="miIcon"><i class="fa-solid fa-bell"></i></span>
            <span class="miLabel">Notifications</span>
          </button>

          <button class="menuItem" type="button" @click="goChatbox">
            <span class="miIcon"><i class="fa-solid fa-comments"></i></span>
            <span class="miLabel">Chatbox</span>
          </button>

          <div class="menuDivider"></div>

          <button class="menuItem danger" type="button" @click="logout">
            <span class="miIcon"><i class="fa-solid fa-right-from-bracket"></i></span>
            <span class="miLabel">Logout</span>
          </button>
        </div>
      </div>
    </header>

    <div class="layout">
      <!-- LEFT -->
      <section class="leftCol">
        <!-- Document Type -->
        <div ref="docTypeCardRef" class="card section">
          <div class="sectionTitle">Document Type</div>

          <div class="docTypes">
            <button
              v-for="(t, i) in docTypes"
              :key="t.key"
              class="docTypeTile"
              type="button"
              :ref="(el) => setIndexRef(docTypeTileRefs, el, i)"
              @click="goDocType(t)"
              :title="t.to ? `Open ${t.label}` : 'Route not set'"
            >
              <div class="docIcon">
                <img v-if="t.icon" :src="t.icon" alt="" />
                <div v-else class="docIconPh"></div>
              </div>
              <div class="docLabel">{{ t.label }}</div>
            </button>
          </div>
        </div>

        <!-- ✅ Word Documents Table (Word only) -->
        <div ref="wordCardRef" class="card section">
          <div class="wordHead">
            <div class="wordTitle">
              <div class="sectionTitle" style="margin: 0">
                <i class="fa-solid fa-file-word"></i>
                Word Documents
              </div>
              <div class="wordSub">
                Showing <b>{{ wordDocs.length }}</b> files
                <span class="dot">•</span>
                Sort: <b>{{ sortLabel }}</b>
              </div>
            </div>

            <div class="wordActions">
              <div class="seg">
                <button class="segBtn" :class="{ on: sortKey === 'updated' }" type="button" @click="setSort('updated')">
                  <i class="fa-solid fa-clock"></i><span>Recent</span>
                </button>
                <button class="segBtn" :class="{ on: sortKey === 'name' }" type="button" @click="setSort('name')">
                  <i class="fa-solid fa-font"></i><span>Name</span>
                </button>
                <button class="segBtn" :class="{ on: sortKey === 'size' }" type="button" @click="setSort('size')">
                  <i class="fa-solid fa-weight-hanging"></i><span>Size</span>
                </button>
              </div>

              <button class="btn mini" type="button" @click="createNewDoc">
                <i class="fa-solid fa-plus"></i>
                <span>New</span>
              </button>
            </div>
          </div>

          <div class="tableWrap wordTableWrap">
            <table class="wordTable">
              <thead>
                <tr>
                  <th style="width: 42px"></th>
                  <th>Name</th>
                  <th style="width: 90px">Ext</th>
                  <th style="width: 110px">Size</th>
                  <th style="width: 190px">Updated</th>
                  <th style="width: 220px">Tags</th>
                  <th style="width: 160px; text-align: right">Actions</th>
                </tr>
              </thead>

              <tbody v-if="wordDocs.length">
                <tr
                  v-for="d in wordDocs"
                  :key="d.key"
                  class="wordRow"
                  :ref="(el) => setKeyRef(rowElMap, d.key, el)"
                >
                  <td>
                    <div class="wIcon">
                      <img src="/document_icon/word.png" alt="" />
                    </div>
                  </td>

                  <td>
                    <div class="nameCell">
                      <div class="nameTop">
                        <button class="linkBtn" type="button" @click="openDoc(d)">
                          <span class="docName">{{ d.name }}</span>
                        </button>

                        <span class="badge2" :class="d.star ? 'bStar' : 'bGhost'">
                          <i class="fa-solid fa-star"></i>
                          {{ d.star ? "Starred" : "Normal" }}
                        </span>

                        <span v-if="d.locked" class="badge2 bLock">
                          <i class="fa-solid fa-lock"></i> Locked
                        </span>
                      </div>

                      <div class="nameSub">
                        <span class="mono">{{ d.path }}</span>
                        <span class="dot">•</span>
                        <span>{{ d.owner }}</span>
                      </div>
                    </div>
                  </td>

                  <td class="mono">{{ fileExt(d.name) }}</td>
                  <td class="mono">{{ fmtBytes(d.size) }}</td>
                  <td>{{ fmtDate(d.updatedAt) }}</td>

                  <td>
                    <div class="tagRow">
                      <span v-for="t in (d.tags || [])" :key="`${d.key}_${t}`" class="tagChip">
                        <i class="fa-solid fa-tag"></i>
                        {{ t }}
                      </span>
                      <button class="tagAdd" type="button" @click="quickTag(d)">
                        <i class="fa-solid fa-plus"></i> Tag
                      </button>
                    </div>
                  </td>

                  <td style="text-align: right">
                    <div class="rowActions">
                      <button class="iconBtn" type="button" title="Preview" @click="previewDoc(d)">
                        <i class="fa-solid fa-eye"></i>
                      </button>
                      <button class="iconBtn" type="button" title="Share" @click="shareDoc(d)">
                        <i class="fa-solid fa-share-nodes"></i>
                      </button>
                      <button class="iconBtn" type="button" :title="d.star ? 'Unstar' : 'Star'" @click="toggleStar(d)">
                        <i class="fa-solid fa-star"></i>
                      </button>

                      <div class="menuWrap" :ref="(el) => setKeyRef(menuWrapMap, d.key, el)">
                        <button class="iconBtn kebab" type="button" title="More" @click.stop="toggleRowMenu(d.key)">
                          <i class="fa-solid fa-ellipsis-vertical"></i>
                        </button>

                        <!-- ✅ hidden by default (CSS) -->
                        <div class="rowMenu" :ref="(el) => setKeyRef(menuElMap, d.key, el)" role="menu" aria-label="Row menu">
                          <button class="rmItem" type="button" @click="renameDoc(d)">
                            <i class="fa-solid fa-pen"></i><span>Rename</span>
                          </button>
                          <button class="rmItem" type="button" @click="moveDoc(d)">
                            <i class="fa-solid fa-folder-tree"></i><span>Move</span>
                          </button>
                          <button class="rmItem" type="button" @click="downloadDoc(d)">
                            <i class="fa-solid fa-download"></i><span>Download</span>
                          </button>
                          <div class="rmDivider"></div>
                          <button class="rmItem danger" type="button" @click="deleteDoc(d)">
                            <i class="fa-solid fa-trash"></i><span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>

              <tbody v-else>
                <tr>
                  <td colspan="7">
                    <div class="empty">
                      <div class="emptyIcon"><i class="fa-solid fa-file-word"></i></div>
                      <div class="emptyTitle">No Word documents found</div>
                      <div class="emptySub">Try searching by name, tag, owner, or path.</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- External Storage -->
        <div ref="externalCardRef" class="card section">
          <div class="sectionTitle">External Storage</div>

          <div class="storageGrid">
            <div
              v-for="(s, i) in externalStorages"
              :key="s.key"
              class="storageCard"
              :class="s.variant"
              :ref="(el) => setIndexRef(storageCardRefs, el, i)"
            >
              <div class="storageIcon">
                <img v-if="s.icon" :src="s.icon" alt="" />
                <div v-else class="storageIconPh"></div>
              </div>

              <div class="storageName">{{ s.name }}</div>

              <div class="bar">
                <div class="barFill" :ref="(el) => setIndexRef(barFillRefs, el, i)" :style="{ width: '0%' }" />
              </div>

              <div class="storageMeta">
                <span class="metaLeft">{{ s.total }}</span>
                <span class="metaRight">{{ s.used }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- RIGHT -->
      <aside class="rightCol">
        <!-- Internal storage -->
        <div ref="internalCardRef" class="card section">
          <div class="sectionTitle">Internal Storage</div>

          <div class="internalBox">
            <div class="donutWrap">
              <svg class="donut" viewBox="0 0 36 36" aria-hidden="true">
                <path
                  class="donutBg"
                  d="M18 2.0845
                     a 15.9155 15.9155 0 0 1 0 31.831
                     a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  ref="donutFgRef"
                  class="donutFg"
                  d="M18 2.0845
                     a 15.9155 15.9155 0 0 1 0 31.831
                     a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div class="donutText">{{ internal.percent }}%</div>
            </div>

            <div class="internalInfo">
              <div class="internalTitle">{{ internal.title }}</div>
              <div class="internalSub">{{ internal.sub }}</div>
              <button class="miniBtn" type="button">View Details</button>
            </div>
          </div>
        </div>

        <!-- Recent Folders -->
        <div ref="foldersCardRef" class="card section">
          <div class="sectionTitle">Recent Folders</div>

          <div class="list">
            <div v-for="f in recentFolders" :key="f.key" class="listRow">
              <div class="rowLeft">
                <div class="folderIcon"></div>
                <div class="rowText">
                  <div class="rowTitle">{{ f.name }}</div>
                  <div class="rowSub">{{ f.meta }}</div>
                </div>
              </div>
              <div class="rowLine"></div>
            </div>
          </div>
        </div>

        <!-- Recent Files -->
        <div ref="filesCardRef" class="card section">
          <div class="sectionTitle">Recent Files</div>

          <div class="files">
            <div v-for="file in recentFiles" :key="file.key" class="fileRow">
              <div class="fileLeft">
                <div class="fileIcon">
                  <div class="fileIconPh"></div>
                </div>
                <div class="fileName">{{ file.name }}</div>
              </div>
              <div class="fileSize">{{ file.size }}</div>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- toast -->
    <div class="toast" :class="{ show: toast.show, danger: toast.type === 'danger' }" aria-live="polite">
      <i class="fa-solid" :class="toast.type === 'danger' ? 'fa-triangle-exclamation' : 'fa-circle-check'"></i>
      <span>{{ toast.text }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch, computed, reactive } from "vue";
import { useRouter, useRoute } from "vue-router";
import gsap from "gsap";

/**
 * ✅ index ref (safe)
 */
function setIndexRef(arrRef, el, idx) {
  if (!el) return;
  if (!arrRef.value) arrRef.value = [];
  arrRef.value[idx] = el;
}

/**
 * ✅ key ref (bugfix: กัน refs เพี้ยนตอน sort/filter)
 */
function setKeyRef(mapRef, key, el) {
  const k = String(key || "");
  if (!k) return;
  if (!mapRef.value) mapRef.value = {};
  if (!el) {
    delete mapRef.value[k];
    return;
  }
  mapRef.value[k] = el;
}

const router = useRouter();
const route = useRoute();

const q = ref("");
const userName = ref("John Doe");
const userAvatar = ref("");

// refs
const topbarRef = ref(null);
const docTypeCardRef = ref(null);
const wordCardRef = ref(null);
const externalCardRef = ref(null);
const internalCardRef = ref(null);
const foldersCardRef = ref(null);
const filesCardRef = ref(null);

const docTypeTileRefs = ref([]);
const storageCardRefs = ref([]);
const barFillRefs = ref([]);
const donutFgRef = ref(null);

// ✅ stable refs by key
const rowElMap = ref({});
const menuElMap = ref({});
const menuWrapMap = ref({});

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

// ---------------------
// Profile dropdown (GSAP)
// ---------------------
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

// ---------------------
// Row Menu (bugfix: stable by key)
// ---------------------
const openMenuKey = ref("");

function openRowMenu(key) {
  const k = String(key || "");
  if (!k) return;

  openMenuKey.value = k;
  const menu = menuElMap.value?.[k];
  if (!menu) return;

  gsap.killTweensOf(menu);
  gsap.set(menu, { display: "block", pointerEvents: "auto" });

  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reduce) {
    gsap.set(menu, { opacity: 1, y: 0, scale: 1 });
    return;
  }

  gsap.fromTo(menu, { opacity: 0, y: -6, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.16, ease: "power2.out" });
}

function closeRowMenu(immediate = false) {
  const k = String(openMenuKey.value || "");
  if (!k) return;

  const menu = menuElMap.value?.[k];
  openMenuKey.value = "";

  if (!menu) return;

  gsap.killTweensOf(menu);

  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (immediate || reduce) {
    gsap.set(menu, { display: "none", opacity: 0, y: -6, scale: 0.98, pointerEvents: "none" });
    return;
  }

  gsap.to(menu, {
    opacity: 0,
    y: -6,
    scale: 0.98,
    duration: 0.12,
    ease: "power2.inOut",
    onComplete: () => gsap.set(menu, { display: "none", pointerEvents: "none" }),
  });
}

function toggleRowMenu(key) {
  const k = String(key || "");
  if (!k) return;

  if (openMenuKey.value === k) closeRowMenu();
  else {
    closeRowMenu(true);
    openRowMenu(k);
  }
}

// close dropdown / menus on outside click
function onDocClick(e) {
  const target = e.target;

  // close profile
  const wrap = profileWrapRef.value;
  if (isProfileOpen.value && wrap && !(wrap === target || wrap.contains(target))) closeProfile();

  // close row menu (click outside current menuWrap)
  const openKey = String(openMenuKey.value || "");
  if (openKey) {
    const w = menuWrapMap.value?.[openKey];
    if (!w || !(w === target || w.contains(target))) closeRowMenu();
  }
}

function onEsc(e) {
  if (e.key === "Escape") {
    closeProfile();
    closeRowMenu(true);
  }
}

// ---------------------
// Doc type navigation
// ---------------------
const docTypes = ref([
  { key: "docs", label: "Docs", icon: "/document_icon/word.png", to: "/v/docs" },
  { key: "excel", label: "Excel", icon: "/document_icon/logo.png", to: "/v/excel" },
  { key: "ppt", label: "Presentation", icon: "/document_icon/powerpoint.png", to: "/v/presentation" },
  { key: "pdf", label: "PDF", icon: "/document_icon/pdf.png", to: "/v/pdf" },
  { key: "txt", label: "TXT", icon: "/document_icon/txt.png", to: "/v/txt" },
]);

function goDocType(t) {
  closeProfile();
  closeRowMenu(true);
  const to = t?.to;
  if (!to) return;
  router.push(to).catch(() => {});
}

// ---------------------
// Word documents (filter/sort) + helpers
// ---------------------
const documents = ref([
  { key: "w1", name: "Report101.docx", size: 1048576, updatedAt: "2026-01-18T09:12:00Z", owner: "John", tags: ["Work", "Q1"], path: "/docs/Report101.docx", locked: false, star: true },
  { key: "w2", name: "Thesis-Final.docx", size: 2097152, updatedAt: "2026-01-12T14:05:00Z", owner: "John", tags: ["School"], path: "/docs/Thesis-Final.docx", locked: true, star: false },
  { key: "w3", name: "Meeting-Notes.doc", size: 320000, updatedAt: "2026-01-19T03:25:00Z", owner: "Team", tags: ["Notes", "Team"], path: "/docs/Meeting-Notes.doc", locked: false, star: false },

  // non-word examples (won't show in table)
  { key: "p1", name: "Narrative-Report.pdf", size: 580000, updatedAt: "2026-01-10T08:00:00Z", owner: "John", tags: ["PDF"], path: "/pdf/Narrative-Report.pdf", locked: false, star: false },
  { key: "x1", name: "Sales2023.xlsx", size: 4100000, updatedAt: "2025-12-31T10:00:00Z", owner: "Finance", tags: ["Excel"], path: "/excel/Sales2023.xlsx", locked: false, star: false },
]);

function isWordFile(name) {
  const s = String(name || "").toLowerCase();
  return s.endsWith(".doc") || s.endsWith(".docx");
}

function fileExt(name) {
  const s = String(name || "");
  const m = s.match(/\.([a-zA-Z0-9]+)$/);
  return m ? `.${m[1].toLowerCase()}` : "—";
}

const sortKey = ref("updated"); // 'updated' | 'name' | 'size'
const sortLabel = computed(() => {
  if (sortKey.value === "name") return "Name";
  if (sortKey.value === "size") return "Size";
  return "Recent";
});

function setSort(k) {
  sortKey.value = k;
  closeRowMenu(true);
  nextTick().then(animateWordRows);
}

const wordDocs = computed(() => {
  const needle = String(q.value || "").trim().toLowerCase();

  const onlyWord = documents.value.filter((d) => isWordFile(d.name));

  const filtered = !needle
    ? onlyWord
    : onlyWord.filter((d) => {
        const hay = `${d.name} ${d.path} ${d.owner} ${(d.tags || []).join(" ")}`.toLowerCase();
        return hay.includes(needle);
      });

  const arr = filtered.slice();

  if (sortKey.value === "name") arr.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  else if (sortKey.value === "size") arr.sort((a, b) => Number(b.size || 0) - Number(a.size || 0));
  else arr.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return arr;
});

// ✅ bugfix: เมื่อ filter/sort เปลี่ยน => ปิดเมนู + animate ใหม่ (refs ไม่เพี้ยนเพราะใช้ key map)
watch(
  () => wordDocs.value.map((x) => x.key).join("|"),
  async () => {
    closeRowMenu(true);
    await nextTick();
    animateWordRows();
  }
);

function fmtBytes(n) {
  const bytes = Number(n || 0);
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  const v = bytes / Math.pow(k, i);
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
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

// “Advanced” actions (demo)
function openDoc(d) {
  closeRowMenu();
  showToast(`Open: ${d.name}`);
}
function previewDoc(d) {
  closeRowMenu();
  showToast(`Preview: ${d.name}`);
}
function shareDoc(d) {
  closeRowMenu();
  showToast("Share link copied", "ok");
}
function downloadDoc(d) {
  closeRowMenu();
  showToast(`Download: ${d.name}`);
}
function renameDoc(d) {
  closeRowMenu();
  showToast(`Rename: ${d.name}`);
}
function moveDoc(d) {
  closeRowMenu();
  showToast(`Move: ${d.name}`);
}
function deleteDoc(d) {
  closeRowMenu();
  documents.value = documents.value.filter((x) => x.key !== d.key);
  showToast("Deleted", "danger");
}
function toggleStar(d) {
  d.star = !d.star;
  showToast(d.star ? "Starred" : "Unstarred");
}
function quickTag(d) {
  const t = "New";
  d.tags = Array.isArray(d.tags) ? d.tags : [];
  if (!d.tags.includes(t)) d.tags.push(t);
  showToast("Tag added");
}
function createNewDoc() {
  const now = new Date();
  const key = `w_${Math.random().toString(16).slice(2)}`;
  documents.value.unshift({
    key,
    name: `New-Doc-${now.getTime()}.docx`,
    size: 120000,
    updatedAt: now.toISOString(),
    owner: "John",
    tags: ["Draft"],
    path: `/docs/New-Doc-${now.getTime()}.docx`,
    locked: false,
    star: false,
  });
  showToast("Created new Word doc");
}

// ---------------------
// animation helpers
// ---------------------
const externalStorages = ref([
  { key: "icloud", name: "Icloud", total: "250GB", used: "168GB", percent: 67, icon: "/document_icon/cloud.png", variant: "v1" },
  { key: "gdrive", name: "Google Drive", total: "2TB", used: "953GB", percent: 48, icon: "/document_icon/google-drive.png", variant: "v2" },
  { key: "mega", name: "Mega", total: "400GB", used: "147GB", percent: 37, icon: "/document_icon/mega.png", variant: "v3" },
  { key: "mediafire", name: "MediaFire", total: "366GB", used: "74GB", percent: 20, icon: "/document_icon/folders.png", variant: "v4" },
]);

const internal = ref({
  percent: 60,
  title: "Internal Storage",
  sub: "98 GB of 147 GB used",
});

const recentFolders = ref([
  { key: "dl", name: "Download", meta: "16 items • 56 MB" },
  { key: "doc", name: "Document", meta: "50 items • 109 MB" },
]);

const recentFiles = ref([
  { key: "f1", name: "Report101.docx", size: "1MB" },
  { key: "f2", name: "Data-One.xlsx", size: "180KB" },
  { key: "f3", name: "Document2023.docx", size: "3MB" },
  { key: "f4", name: "Present2023.ppt", size: "4MB" },
  { key: "f5", name: "Sample.txt", size: "15KB" },
  { key: "f6", name: "Narrative-Report.pdf", size: "567KB" },
  { key: "f7", name: "Thesis-Final.docx", size: "2MB" },
  { key: "f8", name: "Sales2023.xlsx", size: "4MB" },
]);

function animateDonut(percent) {
  const el = donutFgRef.value;
  if (!el) return;
  gsap.set(el, { strokeDasharray: "100 100", strokeDashoffset: 100 });
  gsap.to(el, { strokeDashoffset: 100 - percent, duration: 1.1, ease: "power2.out" });
}
function animateBars() {
  barFillRefs.value?.forEach((el, i) => {
    const p = externalStorages.value[i]?.percent ?? 0;
    gsap.fromTo(el, { width: "0%" }, { width: `${p}%`, duration: 1.0, ease: "power2.out", delay: 0.15 + i * 0.08 });
  });
}

function animateWordRows() {
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reduce) return;

  const rows = wordDocs.value.map((d) => rowElMap.value?.[String(d.key)]).filter(Boolean);
  if (!rows.length) return;

  gsap.killTweensOf(rows);
  gsap.fromTo(rows, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, stagger: 0.05, ease: "power2.out" });
}

onMounted(async () => {
  await nextTick();

  // init profile menu hidden (also hidden in CSS, but keep safe)
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (profileMenuRef.value) {
    gsap.set(profileMenuRef.value, { display: "none", opacity: 0, y: -6, scale: 0.98, pointerEvents: "none" });
  }
  if (profileChevronRef.value) gsap.set(profileChevronRef.value, { rotate: 0 });

  document.addEventListener("click", onDocClick, true);
  document.addEventListener("keydown", onEsc);

  if (!reduce) {
    tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(topbarRef.value, { y: -10, opacity: 0, duration: 0.45 }, 0);
    tl.from([docTypeCardRef.value, wordCardRef.value, externalCardRef.value], { y: 14, opacity: 0, duration: 0.55, stagger: 0.10 }, 0.05);
    tl.from([internalCardRef.value, foldersCardRef.value, filesCardRef.value], { y: 14, opacity: 0, duration: 0.55, stagger: 0.12 }, 0.12);

    tl.from(docTypeTileRefs.value, { y: 10, opacity: 0, duration: 0.35, stagger: 0.06 }, 0.22);
    tl.from(storageCardRefs.value, { y: 10, opacity: 0, duration: 0.35, stagger: 0.08 }, 0.30);

    tl.add(() => {
      animateBars();
      animateDonut(internal.value.percent);
      animateWordRows();
    }, 0.35);
  } else {
    animateBars();
    animateDonut(internal.value.percent);
  }
});

// close dropdown when route changes
watch(
  () => route.fullPath,
  () => {
    closeProfile();
    closeRowMenu(true);
  }
);

onBeforeUnmount(() => {
  if (toastTimer) clearTimeout(toastTimer);
  if (tl) tl.kill();
  tl = null;

  document.removeEventListener("click", onDocClick, true);
  document.removeEventListener("keydown", onEsc);
});
</script>

<style scoped>
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

.searchWrap {
  width: min(520px, 100%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.10);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
}
.searchWrap i { opacity: 0.85; }
.searchWrap input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 700;
}
.searchWrap input::placeholder { color: rgba(255, 255, 255, 0.35); font-weight: 700; }

/* profile dropdown */
.profileWrap { position: relative; display: inline-flex; align-items: center; }
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
.userBtn:hover { background: rgba(255, 255, 255, 0.04); transform: translateY(-1px); }
.userName { color: rgba(120, 170, 255, 0.95); font-weight: 800; white-space: nowrap; }
.avatar {
  width: 30px; height: 30px; border-radius: 999px; overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
}
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.avatarPh { width: 100%; height: 100%; background: linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(99, 102, 241, 0.18)); }
.chevron { font-size: 12px; opacity: 0.85; transform-origin: center; color: rgba(255, 255, 255, 0.75); }

.profileMenu {
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  width: 220px;
  border-radius: 14px;
  padding: 8px;
  background: rgba(10, 12, 22, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.10);
  box-shadow: 0 20px 46px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(10px);
  z-index: 50;

  /* ✅ hidden default (bugfix) */
  display: none;
  opacity: 0;
  pointer-events: none;
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
  transition: background 160ms ease, transform 160ms ease, box-shadow 160ms ease;
}
.menuItem:hover { background: rgba(255, 255, 255, 0.06); transform: translateY(-1px); box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25); }
.menuItem.danger:hover { background: rgba(255, 60, 60, 0.12); }
.miIcon { width: 18px; height: 18px; display: grid; place-items: center; opacity: 0.9; }
.miLabel { font-weight: 850; font-size: 13px; }
.menuDivider {
  height: 1px;
  margin: 8px 6px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0));
  opacity: 0.65;
}

/* layout */
.layout { display: grid; grid-template-columns: 1fr 340px; gap: 18px; }
.leftCol { display: grid; gap: 18px; }
.rightCol { display: grid; gap: 18px; }

/* cards */
.card {
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.24);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 16px 44px rgba(0, 0, 0, 0.30);
}
.section { padding: 18px 18px 16px; }
.sectionTitle {
  font-size: 16px;
  font-weight: 850;
  margin-bottom: 14px;
  color: rgba(120, 210, 200, 0.9);
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

/* Document type tiles */
.docTypes { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; }
.docTypeTile {
  border: none; cursor: pointer;
  border-radius: 10px;
  padding: 14px 12px 12px;
  background: rgba(58, 82, 160, 0.55);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.10);
  transition: transform 160ms ease, filter 160ms ease, box-shadow 160ms ease;
  color: rgba(255, 255, 255, 0.9);
}
.docTypeTile:hover {
  transform: translateY(-2px);
  filter: brightness(1.05);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14), 0 14px 30px rgba(0, 0, 0, 0.25);
}
.docIcon { height: 46px; display: grid; place-items: center; margin-bottom: 10px; }
.docIcon img { width: 42px; height: 42px; object-fit: contain; }
.docIconPh {
  width: 42px; height: 42px; border-radius: 10px;
  background: rgba(255, 255, 255, 0.10);
  border: 1px dashed rgba(255, 255, 255, 0.18);
}
.docLabel { font-weight: 800; font-size: 12px; opacity: 0.9; text-align: center; }

/* ✅ Word table */
.wordHead {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.wordTitle { display: grid; gap: 4px; }
.wordSub { color: rgba(255,255,255,0.65); font-weight: 800; font-size: 12px; }
.wordActions { display: inline-flex; gap: 10px; align-items: center; flex-wrap: wrap; }

.seg {
  display: inline-flex;
  border-radius: 999px;
  padding: 4px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.10);
}
.segBtn {
  border: none;
  cursor: pointer;
  padding: 8px 10px;
  border-radius: 999px;
  background: transparent;
  color: rgba(255,255,255,0.78);
  font-weight: 900;
  font-size: 12px;
  display: inline-flex;
  gap: 8px;
  align-items: center;
  transition: background 160ms ease, color 160ms ease;
}
.segBtn.on { background: rgba(56, 189, 248, 0.14); color: rgba(255,255,255,0.92); }

.tableWrap.wordTableWrap { overflow: auto; }

.wordTable {
  width: 100%;
  border-collapse: collapse;
  min-width: 940px;
}
.wordTable th,
.wordTable td {
  border-bottom: 1px solid rgba(255, 255, 255, 0.10);
  padding: 12px 10px;
  vertical-align: middle;
}
.wordTable th {
  text-align: left;
  color: rgba(255,255,255,0.72);
  font-weight: 900;
  font-size: 12px;
  background: rgba(255,255,255,0.02);
  position: sticky;
  top: 0;
  backdrop-filter: blur(10px);
}
.wordRow:hover td { background: rgba(255,255,255,0.03); }

.wIcon {
  width: 34px; height: 34px;
  border-radius: 10px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.10);
  display: grid;
  place-items: center;
}
.wIcon img { width: 22px; height: 22px; object-fit: contain; }

.nameCell { display: grid; gap: 6px; }
.nameTop { display: inline-flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.linkBtn { border: none; background: transparent; padding: 0; cursor: pointer; text-align: left; }
.docName { font-weight: 950; color: rgba(120, 170, 255, 0.95); }
.linkBtn:hover .docName { text-decoration: underline; }

.nameSub {
  color: rgba(255,255,255,0.58);
  font-weight: 800;
  font-size: 12px;
  display: inline-flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New"; }
.dot { opacity: 0.6; }

.badge2 {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 950;
  font-size: 11px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(255,255,255,0.03);
  color: rgba(255,255,255,0.80);
}
.badge2.bStar { border-color: rgba(255, 214, 102, 0.22); background: rgba(255, 214, 102, 0.10); }
.badge2.bGhost { border-color: rgba(255,255,255,0.10); background: rgba(255,255,255,0.03); }
.badge2.bLock { border-color: rgba(248, 113, 113, 0.22); background: rgba(248, 113, 113, 0.10); }

.tagRow { display: inline-flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.tagChip {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.10);
  font-weight: 900;
  font-size: 12px;
  color: rgba(255,255,255,0.80);
}
.tagAdd {
  border: 1px dashed rgba(255,255,255,0.18);
  background: rgba(255,255,255,0.02);
  color: rgba(255,255,255,0.72);
  padding: 6px 10px;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 900;
  font-size: 12px;
}
.tagAdd:hover { background: rgba(255,255,255,0.05); }

.rowActions { display: inline-flex; justify-content: flex-end; gap: 8px; align-items: center; }
.iconBtn {
  width: 34px; height: 34px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(0,0,0,0.18);
  color: rgba(255,255,255,0.86);
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
}
.iconBtn:hover {
  transform: translateY(-1px);
  background: rgba(255,255,255,0.05);
  box-shadow: 0 14px 28px rgba(0,0,0,0.25);
}

.menuWrap { position: relative; display: inline-flex; }
.rowMenu {
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  width: 200px;
  border-radius: 14px;
  padding: 8px;
  background: rgba(10, 12, 22, 0.92);
  border: 1px solid rgba(255,255,255,0.10);
  box-shadow: 0 20px 46px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(10px);
  z-index: 60;

  /* ✅ hidden default (bugfix: ไม่เด้งโชว์เอง) */
  display: none;
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
  pointer-events: none;
}
.rmItem {
  width: 100%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 12px;
  background: rgba(255,255,255,0.03);
  color: rgba(255,255,255,0.86);
  transition: background 160ms ease, transform 160ms ease;
  font-weight: 900;
}
.rmItem:hover { background: rgba(255,255,255,0.06); transform: translateY(-1px); }
.rmItem.danger:hover { background: rgba(255, 60, 60, 0.12); }
.rmDivider {
  height: 1px;
  margin: 8px 6px;
  background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.14), rgba(255,255,255,0));
  opacity: 0.65;
}

.empty {
  padding: 26px 10px;
  display: grid;
  gap: 8px;
  justify-items: center;
  color: rgba(255,255,255,0.80);
}
.emptyIcon {
  width: 52px; height: 52px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.10);
  color: rgba(120, 170, 255, 0.95);
  font-size: 20px;
}
.emptyTitle { font-weight: 950; }
.emptySub { font-size: 12px; font-weight: 800; color: rgba(255,255,255,0.60); }

/* buttons (reuse style) */
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
.btn.mini { padding: 8px 10px; border-radius: 12px; font-size: 12px; }

/* External storage cards */
.storageGrid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.storageCard {
  border-radius: 14px;
  padding: 16px 16px 14px;
  min-height: 132px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 38px rgba(0, 0, 0, 0.22);
  position: relative;
  overflow: hidden;
}
.storageCard.v1 { background: linear-gradient(90deg, rgba(50, 86, 160, 0.75), rgba(10, 54, 90, 0.55)); }
.storageCard.v2 { background: linear-gradient(90deg, rgba(35, 95, 160, 0.7), rgba(12, 82, 90, 0.55)); }
.storageCard.v3 { background: linear-gradient(90deg, rgba(40, 88, 150, 0.7), rgba(16, 70, 92, 0.55)); }
.storageCard.v4 { background: linear-gradient(90deg, rgba(40, 88, 150, 0.7), rgba(20, 92, 92, 0.55)); }
.storageIcon {
  width: 28px; height: 28px; border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: grid; place-items: center; margin-bottom: 10px;
}
.storageIcon img { width: 18px; height: 18px; object-fit: contain; }
.storageIconPh { width: 18px; height: 18px; border-radius: 6px; background: rgba(255, 255, 255, 0.14); }
.storageName { font-weight: 900; font-size: 20px; margin-bottom: 12px; color: rgba(255, 255, 255, 0.95); }
.bar { height: 8px; border-radius: 999px; background: rgba(255, 255, 255, 0.22); overflow: hidden; margin-bottom: 10px; }
.barFill { height: 100%; border-radius: 999px; background: rgba(255, 255, 255, 0.92); }
.storageMeta { display: flex; justify-content: space-between; font-weight: 800; opacity: 0.72; }

/* Internal storage */
.internalBox {
  display: grid;
  grid-template-columns: 76px 1fr;
  gap: 14px;
  align-items: center;
  background: rgba(255, 165, 0, 0.18);
  border: 1px solid rgba(255, 165, 0, 0.22);
  border-radius: 10px;
  padding: 12px 12px;
}
.donutWrap { width: 72px; height: 72px; position: relative; display: grid; place-items: center; }
.donut { width: 72px; height: 72px; }
.donutBg { fill: none; stroke: rgba(255, 255, 255, 0.22); stroke-width: 3.6; }
.donutFg { fill: none; stroke: rgba(255, 165, 0, 0.95); stroke-width: 3.6; stroke-linecap: round; }
.donutText { position: absolute; font-weight: 950; font-size: 12px; color: rgba(255, 255, 255, 0.92); }
.internalInfo { display: grid; gap: 4px; }
.internalTitle { font-weight: 900; font-size: 12px; opacity: 0.95; }
.internalSub { font-weight: 800; font-size: 11px; opacity: 0.75; }
.miniBtn {
  margin-top: 6px;
  width: max-content;
  border: none;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.22);
  color: rgba(255, 255, 255, 0.86);
  font-weight: 850;
  font-size: 11px;
}
.miniBtn:hover { filter: brightness(1.06); }

/* lists */
.list { display: grid; gap: 10px; }
.listRow { display: grid; gap: 10px; }
.rowLeft { display: flex; align-items: center; gap: 10px; }
.folderIcon { width: 18px; height: 14px; border-radius: 3px; background: rgba(255, 200, 0, 0.85); box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.15) inset; }
.rowText { display: grid; gap: 2px; }
.rowTitle { font-weight: 850; font-size: 12px; opacity: 0.88; }
.rowSub { font-weight: 750; font-size: 10px; opacity: 0.55; }
.rowLine { height: 2px; border-radius: 999px; background: rgba(255, 255, 255, 0.18); }

/* files */
.files { display: grid; gap: 10px; }
.fileRow { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding-bottom: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.10); }
.fileRow:last-child { border-bottom: none; padding-bottom: 0; }
.fileLeft { display: flex; align-items: center; gap: 10px; min-width: 0; }
.fileIcon { width: 18px; height: 18px; border-radius: 4px; background: rgba(255, 255, 255, 0.10); border: 1px solid rgba(255, 255, 255, 0.12); display: grid; place-items: center; }
.fileIconPh { width: 10px; height: 10px; border-radius: 3px; background: rgba(120, 170, 255, 0.85); }
.fileName { font-weight: 800; font-size: 12px; opacity: 0.85; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fileSize { font-weight: 800; font-size: 11px; opacity: 0.55; }

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
  .layout { grid-template-columns: 1fr; }
}
@media (max-width: 760px) {
  .docTypes { grid-template-columns: repeat(2, 1fr); }
  .storageGrid { grid-template-columns: 1fr; }
}
</style>
