<!-- documentviewer.vue -->
<template>
  <div class="docViewer">
    <!-- Top bar -->
    <header ref="topbarRef" class="topbar">
      <div class="searchWrap">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input v-model.trim="q" type="text" placeholder="Search Files" />
      </div>

      <!-- ✅ Profile dropdown (your existing refs/logic) -->
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
            <!-- ✅ Add router navigation on click -->
            <button
              v-for="(t, i) in docTypes"
              :key="t.key"
              class="docTypeTile"
              type="button"
              :ref="(el) => setRef(docTypeTileRefs, el, i)"
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

        <!-- External Storage -->
        <div ref="externalCardRef" class="card section">
          <div class="sectionTitle">External Storage</div>

          <div class="storageGrid">
            <div
              v-for="(s, i) in externalStorages"
              :key="s.key"
              class="storageCard"
              :class="s.variant"
              :ref="(el) => setRef(storageCardRefs, el, i)"
            >
              <div class="storageIcon">
                <img v-if="s.icon" :src="s.icon" alt="" />
                <div v-else class="storageIconPh"></div>
              </div>

              <div class="storageName">{{ s.name }}</div>

              <div class="bar">
                <div class="barFill" :ref="(el) => setRef(barFillRefs, el, i)" :style="{ width: '0%' }" />
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
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import gsap from "gsap";

/**
 * ✅ FIX: setRef ปลอดภัย (กัน undefined)
 */
function setRef(arrRef, el, idx) {
  if (!el) return;
  if (!arrRef.value) arrRef.value = [];
  arrRef.value[idx] = el;
}

const router = useRouter();
const route = useRoute();

// demo state
const q = ref("");
const userName = ref("John Doe");
const userAvatar = ref("");

// refs for animation
const topbarRef = ref(null);
const docTypeCardRef = ref(null);
const externalCardRef = ref(null);
const internalCardRef = ref(null);
const foldersCardRef = ref(null);
const filesCardRef = ref(null);

const docTypeTileRefs = ref([]);
const storageCardRefs = ref([]);
const barFillRefs = ref([]);
const donutFgRef = ref(null);

let tl = null;

// ---------------------
// ✅ Profile dropdown (GSAP)
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

function onDocClick(e) {
  const wrap = profileWrapRef.value;
  if (!wrap) return;
  if (!isProfileOpen.value) return;

  const target = e.target;
  if (wrap === target || wrap.contains(target)) return;
  closeProfile();
}

function onEsc(e) {
  if (e.key === "Escape") closeProfile();
}

// ---------------------
// ✅ DocTypes navigation
// ---------------------
function goDocType(t) {
  // close profile if open
  closeProfile();

  const to = t?.to;
  if (!to) return;

  // allow string or route object
  if (typeof to === "string") {
    router.push(to).catch(() => {});
    return;
  }

  router.push(to).catch(() => {});
}

// data (✅ add route for each doc type)
const docTypes = ref([
  { key: "docs", label: "Docs", icon: "/document_icon/word.png", to: "/v/docs" },
  { key: "excel", label: "Excel", icon: "/document_icon/logo.png", to: "/v/excel" },
  { key: "ppt", label: "Presentation", icon: "/document_icon/powerpoint.png", to: "/v/presentation" },
  { key: "pdf", label: "PDF", icon: "/document_icon/pdf.png", to: "/v/pdf" },
  { key: "txt", label: "TXT", icon: "/document_icon/txt.png", to: "/v/txt" },
]);

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

onMounted(async () => {
  await nextTick();

  // init profile menu hidden
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (profileMenuRef.value) {
    gsap.set(profileMenuRef.value, { display: "none", opacity: 0, y: -6, scale: 0.98, pointerEvents: "none" });
  }
  if (profileChevronRef.value) gsap.set(profileChevronRef.value, { rotate: 0 });

  document.addEventListener("click", onDocClick, true);
  document.addEventListener("keydown", onEsc);

  if (reduce) return;

  tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.from(topbarRef.value, { y: -10, opacity: 0, duration: 0.45 }, 0);
  tl.from([docTypeCardRef.value, externalCardRef.value], { y: 14, opacity: 0, duration: 0.55, stagger: 0.12 }, 0.05);
  tl.from([internalCardRef.value, foldersCardRef.value, filesCardRef.value], { y: 14, opacity: 0, duration: 0.55, stagger: 0.12 }, 0.12);

  tl.from(docTypeTileRefs.value, { y: 10, opacity: 0, duration: 0.35, stagger: 0.06 }, 0.22);
  tl.from(storageCardRefs.value, { y: 10, opacity: 0, duration: 0.35, stagger: 0.08 }, 0.30);

  tl.add(() => {
    animateBars();
    animateDonut(internal.value.percent);
  }, 0.35);
});

// ปิด dropdown เมื่อเปลี่ยนหน้า
watch(
  () => route.fullPath,
  () => closeProfile()
);

onBeforeUnmount(() => {
  if (tl) tl.kill();
  tl = null;

  document.removeEventListener("click", onDocClick, true);
  document.removeEventListener("keydown", onEsc);
});
</script>

<style scoped>
/* ใช้ theme จาก app.vue ถ้ามี (fallback ให้ด้วย) */
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
.searchWrap i {
  opacity: 0.85;
}
.searchWrap input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 700;
}
.searchWrap input::placeholder {
  color: rgba(255, 255, 255, 0.35);
  font-weight: 700;
}

/* profile dropdown */
.profileWrap {
  position: relative;
  display: inline-flex;
  align-items: center;
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
  font-weight: 800;
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
  border: 1px solid rgba(255, 255, 255, 0.10);
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
  font-weight: 850;
  font-size: 13px;
}

.menuDivider {
  height: 1px;
  margin: 8px 6px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0));
  opacity: 0.65;
}

/* layout */
.layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 18px;
}

.leftCol {
  display: grid;
  gap: 18px;
}

.rightCol {
  display: grid;
  gap: 18px;
}

/* cards */
.card {
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.24);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 16px 44px rgba(0, 0, 0, 0.30);
}

.section {
  padding: 18px 18px 16px;
}

.sectionTitle {
  font-size: 16px;
  font-weight: 850;
  margin-bottom: 14px;
  color: rgba(120, 210, 200, 0.9);
}

/* Document type tiles */
.docTypes {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
}

.docTypeTile {
  border: none;
  cursor: pointer;
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
  background: rgba(255, 255, 255, 0.10);
  border: 1px dashed rgba(255, 255, 255, 0.18);
}
.docLabel {
  font-weight: 800;
  font-size: 12px;
  opacity: 0.9;
  text-align: center;
}

/* External storage cards */
.storageGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.storageCard {
  border-radius: 14px;
  padding: 16px 16px 14px;
  min-height: 132px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 38px rgba(0, 0, 0, 0.22);
  position: relative;
  overflow: hidden;
}

/* variants */
.storageCard.v1 {
  background: linear-gradient(90deg, rgba(50, 86, 160, 0.75), rgba(10, 54, 90, 0.55));
}
.storageCard.v2 {
  background: linear-gradient(90deg, rgba(35, 95, 160, 0.7), rgba(12, 82, 90, 0.55));
}
.storageCard.v3 {
  background: linear-gradient(90deg, rgba(40, 88, 150, 0.7), rgba(16, 70, 92, 0.55));
}
.storageCard.v4 {
  background: linear-gradient(90deg, rgba(40, 88, 150, 0.7), rgba(20, 92, 92, 0.55));
}

.storageIcon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: grid;
  place-items: center;
  margin-bottom: 10px;
}
.storageIcon img {
  width: 18px;
  height: 18px;
  object-fit: contain;
}
.storageIconPh {
  width: 18px;
  height: 18px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.14);
}

.storageName {
  font-weight: 900;
  font-size: 20px;
  letter-spacing: 0.2px;
  margin-bottom: 12px;
  color: rgba(255, 255, 255, 0.95);
}

.bar {
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  overflow: hidden;
  margin-bottom: 10px;
}
.barFill {
  height: 100%;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
}

.storageMeta {
  display: flex;
  justify-content: space-between;
  font-weight: 800;
  opacity: 0.72;
}

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

.donutWrap {
  width: 72px;
  height: 72px;
  position: relative;
  display: grid;
  place-items: center;
}
.donut {
  width: 72px;
  height: 72px;
}
.donutBg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.22);
  stroke-width: 3.6;
}
.donutFg {
  fill: none;
  stroke: rgba(255, 165, 0, 0.95);
  stroke-width: 3.6;
  stroke-linecap: round;
}
.donutText {
  position: absolute;
  font-weight: 950;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.92);
}

.internalInfo {
  display: grid;
  gap: 4px;
}
.internalTitle {
  font-weight: 900;
  font-size: 12px;
  opacity: 0.95;
}
.internalSub {
  font-weight: 800;
  font-size: 11px;
  opacity: 0.75;
}
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
.miniBtn:hover {
  filter: brightness(1.06);
}

/* lists */
.list {
  display: grid;
  gap: 10px;
}
.listRow {
  display: grid;
  gap: 10px;
}
.rowLeft {
  display: flex;
  align-items: center;
  gap: 10px;
}
.folderIcon {
  width: 18px;
  height: 14px;
  border-radius: 3px;
  background: rgba(255, 200, 0, 0.85);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.15) inset;
}
.rowText {
  display: grid;
  gap: 2px;
}
.rowTitle {
  font-weight: 850;
  font-size: 12px;
  opacity: 0.88;
}
.rowSub {
  font-weight: 750;
  font-size: 10px;
  opacity: 0.55;
}
.rowLine {
  height: 2px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
}

/* files */
.files {
  display: grid;
  gap: 10px;
}
.fileRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.10);
}
.fileRow:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.fileLeft {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.fileIcon {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.10);
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: grid;
  place-items: center;
}
.fileIconPh {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background: rgba(120, 170, 255, 0.85);
}
.fileName {
  font-weight: 800;
  font-size: 12px;
  opacity: 0.85;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.fileSize {
  font-weight: 800;
  font-size: 11px;
  opacity: 0.55;
}

/* responsive */
@media (max-width: 1100px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .rightCol {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 760px) {
  .docTypes {
    grid-template-columns: repeat(2, 1fr);
  }
  .storageGrid {
    grid-template-columns: 1fr;
  }
  .rightCol {
    grid-template-columns: 1fr;
  }
}
</style>
