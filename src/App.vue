<template>
  <div :class="['app', 'tech', { 'is-auth': isAuthPage }]">
    <!-- Ambient glow (hide on login) -->
    <template v-if="!isAuthPage">
      <div class="glow glow-a"></div>
      <div class="glow glow-b"></div>
    </template>

    <!-- Global sidebar -->
    <aside v-if="!isAuthPage" ref="sidebarEl" class="sidebar">
      <router-link :to="brandHomeTo" style="text-decoration: none">
        <div class="brand js-reveal">
          <div class="brandMark">
            <img src="/logolapnet/fullcircle.png" alt="" style="width: 100%; height: 100%" />
          </div>
          <div class="brandText">
            <div class="brandName">LAPNet</div>
            <div class="brandSub">{{ isViewer ? "Viewer Console" : "Admin Console" }}</div>
          </div>
        </div>
      </router-link>

      <nav class="nav js-reveal">
        <template v-if="isViewer">
          <RouterLink
            v-for="item in viewerNavItems"
            :key="item.key"
            :to="item.to"
            :class="['navItem', { 'is-new': isViewerNew(item) || isViewerChatNew(item) }]"
            active-class="active"
            @mouseenter="navHover($event, true)"
            @mouseleave="navHover($event, false)"
          >
            <span class="navIcon"><i :class="item.fa"></i></span>
            <span class="navLabel">{{ item.label }}</span>

            <span v-if="item.key === VIEWER_ANN_ITEM_KEY && viewerAnnNewCount > 0" class="navBadge">
              {{ viewerAnnNewCount > 99 ? "99+" : viewerAnnNewCount }}
            </span>

            <span
              v-if="item.key === VIEWER_CHAT_ITEM_KEY && viewerChatNewCount > 0"
              class="navChip navChip--danger"
            >
              New
            </span>

            <span class="navPill" />
          </RouterLink>
        </template>

        <template v-else>
          <RouterLink
            :to="mainNavItem.to"
            class="navItem"
            active-class="active"
            @mouseenter="navHover($event, true)"
            @mouseleave="navHover($event, false)"
          >
            <span class="navIcon"><i :class="mainNavItem.fa"></i></span>
            <span class="navLabel">{{ mainNavItem.label }}</span>
            <span class="navPill" />
          </RouterLink>

          <RouterLink
            v-for="item in dashboardItems"
            :key="item.key"
            :to="item.to"
            class="navItem navItem--sub"
            active-class="active"
            @mouseenter="subHover($event, true)"
            @mouseleave="subHover($event, false)"
          >
            <span class="navIcon"><i :class="item.fa"></i></span>
            <span class="navLabel">{{ item.label }}</span>
            <span class="navPill" />
          </RouterLink>

          <div class="navDivider" />

          <div class="navGroup">
            <button
              type="button"
              class="navGroupBtn"
              :class="{ active: isViewActive }"
              @click="toggleView"
              @mouseenter="navHover($event, true)"
              @mouseleave="navHover($event, false)"
              aria-haspopup="true"
              :aria-expanded="isViewOpen ? 'true' : 'false'"
            >
              <span class="navIcon"><i class="fa-solid fa-database"></i></span>
              <span class="navLabel">ເບິ່ງຂໍ້ມູນ</span>

              <span class="navGroupRight">
                <span class="navGroupHint">{{ viewItems.length }}</span>
                <i ref="viewChevronEl" class="fa-solid fa-chevron-down navChevron"></i>
              </span>

              <span class="navPill" />
            </button>

            <div ref="viewMenuEl" class="subNav">
              <RouterLink
                v-for="item in viewItems"
                :key="item.key"
                :to="item.to"
                class="subNavItem"
                active-class="active"
                @mouseenter="subHover($event, true)"
                @mouseleave="subHover($event, false)"
                @click="ensureViewOpenAfterNavigate"
              >
                <span class="subIcon"><i :class="item.fa"></i></span>
                <span class="subLabel">{{ item.label }}</span>
                <span class="subPill" />
              </RouterLink>
            </div>
          </div>

          <div class="navGroup">
            <button
              type="button"
              class="navGroupBtn"
              :class="{ active: isInsertActive }"
              @click="toggleInsert"
              @mouseenter="navHover($event, true)"
              @mouseleave="navHover($event, false)"
              aria-haspopup="true"
              :aria-expanded="isInsertOpen ? 'true' : 'false'"
            >
              <span class="navIcon"><i class="fa-solid fa-circle-plus"></i></span>
              <span class="navLabel">ເພີ່ມຂໍ້ມູນ</span>

              <span class="navGroupRight">
                <span class="navGroupHint">{{ insertItems.length }}</span>
                <i ref="insertChevronEl" class="fa-solid fa-chevron-down navChevron"></i>
              </span>

              <span class="navPill" />
            </button>

            <div ref="insertMenuEl" class="subNav">
              <RouterLink
                v-for="item in insertItems"
                :key="item.key"
                :to="item.to"
                class="subNavItem"
                active-class="active"
                @mouseenter="subHover($event, true)"
                @mouseleave="subHover($event, false)"
                @click="ensureOpenAfterNavigate"
              >
                <span class="subIcon"><i :class="item.fa"></i></span>
                <span class="subLabel">{{ item.label }}</span>
                <span class="subPill" />
              </RouterLink>
            </div>
          </div>
        </template>
      </nav>

      <div class="spacer" />

      <button
        class="logout js-reveal"
        type="button"
        @click="logout"
        @mouseenter="btnHover($event, true)"
        @mouseleave="btnHover($event, false)"
      >
        <span class="navIcon"><i class="fa-solid fa-right-from-bracket"></i></span>
        Log Out
      </button>
    </aside>

    <main class="main">
      <section class="mainBody">
        <RouterView />
      </section>
    </main>

    <transition name="popup">
      <div
        v-if="isViewer && annPopup.show && !isAuthPage"
        class="popupMask"
        @click.self="closeAnnPopup"
      >
        <div class="popupCard" role="dialog" aria-modal="true" aria-label="Announcements popup">
          <div class="popupHead">
            <div class="popupHeadLeft">
              <div class="popupTitle">
                <i class="fa-solid fa-bullhorn"></i>
                Announcements
              </div>

              <div class="popupSub">
                <template v-if="annPopup.loading">Loading...</template>
                <template v-else>
                  <span v-if="annPopup.newCount > 0" class="popupNewCount">
                    {{ annPopup.newCount }} new
                  </span>
                  <span v-else class="popupMuted">Latest updates</span>
                </template>
              </div>
            </div>

            <button class="iconClose" type="button" @click="closeAnnPopup" aria-label="Close">
              ✕
            </button>
          </div>

          <div class="popupBody">
            <div v-if="annPopup.loading" class="popupLoading">
              <div class="loaderDot"></div>
              <div class="loaderDot"></div>
              <div class="loaderDot"></div>
            </div>

            <div v-else-if="annPopup.error" class="popupErr">
              {{ annPopup.error }}
            </div>

            <ul v-else class="annList">
              <li v-for="a in annPopup.items" :key="a._key" class="annItem">
                <div class="annTop">
                  <div class="annTitle">{{ a.title }}</div>

                  <div class="annBadges">
                    <span v-if="a.isPublic" class="annTagPublic">PUBLIC</span>
                    <span v-if="a.isNew" class="annTagNew">NEW</span>
                  </div>
                </div>

                <div class="annMeta">{{ a.when }}</div>

                <div v-if="a.preview" class="annPreview">
                  {{ a.preview }}
                </div>
              </li>

              <li v-if="!annPopup.items.length" class="annEmpty">
                No announcements found
              </li>
            </ul>
          </div>

          <div class="popupActions">
            <button class="popupBtn ghost" type="button" @click="closeAnnPopup">
              Close
            </button>

            <button class="popupBtn" type="button" @click="goToViewerAnnouncementsFromPopup">
              View all
            </button>

            <button
              v-if="annPopup.newCount > 0"
              class="popupBtn soft"
              type="button"
              @click="markAllReadFromPopup"
            >
              Mark read
            </button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="toast">
      <div v-if="isViewer && toast.show && !isAuthPage" class="toast">
        <div class="toastLeft">
          <div class="toastTitle">
            <i class="fa-solid fa-bell"></i>
            New announcements
          </div>
          <div class="toastSub">
            {{ toast.text }}
          </div>
        </div>

        <div class="toastRight">
          <button class="toastBtn" type="button" @click="goToViewerAnnouncements">
            View
          </button>
          <button class="toastBtn ghost" type="button" @click="hideToast" aria-label="Dismiss">
            ✕
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import gsap from "gsap";

const sidebarEl = ref(null);
const topbarEl = ref(null);

const route = useRoute();
const router = useRouter();

const isAuthPage = computed(() => route.path === "/login");

const currentUser = ref(null);

function safeJsonParse(x) {
  try {
    return JSON.parse(String(x));
  } catch {
    return null;
  }
}

function normalizeRole(r) {
  return String(r || "").trim().toLowerCase();
}

function readUserFromStorage() {
  const u1 = localStorage.getItem("user");
  if (u1) return safeJsonParse(u1);

  const u2 = sessionStorage.getItem("user");
  if (u2) return safeJsonParse(u2);

  return null;
}

function readTokenFromStorage() {
  return (
    String(localStorage.getItem("token") || "").trim() ||
    String(sessionStorage.getItem("token") || "").trim() ||
    ""
  );
}

const isViewer = computed(() => normalizeRole(currentUser.value?.role) === "viewer");

watch(
  () => route.path,
  () => {
    currentUser.value = readUserFromStorage();
  },
  { immediate: true }
);

const viewerNavItems = [
  { key: "v_main", label: "ພາບລວມ", to: "/v/view_document", fa: "fa-solid fa-chart-line" },
  { key: "v_news", label: "ເອກະສານ", to: "/v/documentviewer", fa: "fa-solid fa-file" },
  { key: "v_jobs", label: "ແຈ້ງການເຖິງສະມາຊິກ", to: "/v/announcement_member", fa: "fa-solid fa-bullhorn" },
  { key: "v_ann", label: "ຟອມແບບສອບຖາມ", to: "/v/formmemberview", fa: "fa-solid fa-list-check" },
  { key: "v_board", label: "ຂໍ້ຄວາມ", to: "/v/chat", fa: "fa-solid fa-message" },
  { key: "v_members", label: "ສະມາຊິກທັງໝົດຂອງ LAPNet", to: "/v/allmembers_viewer", fa: "fa-solid fa-building-columns" },
];

const viewerDefaultTo = computed(() => viewerNavItems[0]?.to || "/v/view_member");
const brandHomeTo = computed(() => (isViewer.value ? viewerDefaultTo.value : "/"));

watch(
  [isViewer, isAuthPage, () => route.path],
  async () => {
    if (isAuthPage.value) return;

    if (isViewer.value) {
      if (!String(route.path || "").startsWith("/v/")) {
        router.replace(viewerDefaultTo.value);
      }
      return;
    }

    if (!isViewer.value && String(route.path || "").startsWith("/v/")) {
      router.replace("/dashboard");
    }
  },
  { immediate: true }
);

const navItems = [
  {
    key: "dashboard",
    label: "ພາບລວມ",
    to: "/dashboard",
    fa: "fa-solid fa-chart-line",
    children: [
      { key: "visitor", label: "Visitor", to: "/visitors", fa: "fa-solid fa-eye" },
      { key: "notifications", label: "ຂໍ້ຄວາມ", to: "/notifications", fa: "fa-solid fa-message" },
      { key: "create_form", label: "ສ້າງ Form", to: "/createform", fa: "fa-solid fa-pen-to-square" },
      { key: "announcementtomember", label: "ສ້າງແຈ້ງການເຖິງສະມາຊິກ", to: "/announcementtomember", fa: "fa-solid fa-bullhorn" },
      { key: "adddocument", label: "ເພີ່ມເອກະສານ", to: "/adddocument", fa: "fa-solid fa-file" },
      { key: "usersmanage", label: "ຈັດການຜູ້ໃຊ້ງານ", to: "/usersmanage", fa: "fa-solid fa-key" },
    ],
  },
  { key: "member", label: "ເພີ່ມທະນາຄານສະມາຊິກ", to: "/memberinsert", fa: "fa-solid fa-building-columns" },
  { key: "news", label: "ເພີ່ມຂ່າວສານ ແລະ ກິດຈະກຳ", to: "/newinsert", fa: "fa-solid fa-newspaper" },
  { key: "protocols", label: "ປະກາດຮັບສະໝັກພະນັກງານ", to: "/joblist", fa: "fa-solid fa-user-plus" },
  { key: "announcement", label: "ປະກາດແຈ້ງການ", to: "/announcement", fa: "fa-solid fa-bullhorn" },
  { key: "board_director", label: "ເພີ່ມສະພາບໍລິຫານ", to: "/board_director", fa: "fa-solid fa-users" },
  { key: "lapnet_employee", label: "ເພີ່ມພະນັກງານ LAPNet", to: "/lapnet_employee", fa: "fa-solid fa-circle-user" },
];

const mainNavItem = navItems[0];
const dashboardItems = computed(() => mainNavItem?.children || []);
const insertItems = navItems.slice(1, 7);

const viewItems = [
  { key: "member_view", label: "ເບິ່ງທະນາຄານສະມາຊິກ", to: "/members", fa: "fa-solid fa-building-columns" },
  { key: "news_view", label: "ເບິ່ງຂ່າວສານ & ກິດຈະກຳ", to: "/newsviewer", fa: "fa-solid fa-newspaper" },
  { key: "job_view", label: "ເບິ່ງຮັບສະໝັກພະນັກງານ", to: "/jobview", fa: "fa-solid fa-user-plus" },
  { key: "announcement_view", label: "ເບິ່ງປະກາດແຈ້ງການ", to: "/announcementviewer", fa: "fa-solid fa-bullhorn" },
  { key: "board_director_view", label: "ເບິ່ງສະພາບໍລິຫານ", to: "/board_directorview", fa: "fa-solid fa-users" },
  { key: "lapnet_employee_view", label: "ເບິ່ງພະນັກງານ LAPNet", to: "/lapnetview", fa: "fa-solid fa-circle-user" },
  { key: "form_templates", label: "ເບິ່ງ Form Templates", to: "/formtemplates", fa: "fa-solid fa-layer-group" },
  { key: "viewsubmitform", label: "ເບິ່ງ Form Submit", to: "/viewsubmitform", fa: "fa-solid fa-list-check" },
  { key: "viewannouncementtomember", label: "ເບິ່ງແຈ້ງການເຖິງສະມາຊິກ", to: "/viewannouncementtomember", fa: "fa-solid fa-bullhorn" },
];

const isInsertOpen = ref(false);
const insertMenuEl = ref(null);
const insertChevronEl = ref(null);
const isInsertActive = computed(() => !isViewer.value && insertItems.some((i) => route.path === i.to));

const isViewOpen = ref(false);
const viewMenuEl = ref(null);
const viewChevronEl = ref(null);
const isViewActive = computed(() => !isViewer.value && viewItems.some((i) => route.path === i.to));

function logout() {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  } catch {}

  try {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
  } catch {}

  isInsertOpen.value = false;
  isViewOpen.value = false;

  stopViewerAnnPoll();
  stopViewerChatPoll();
  viewerAnnNewCount.value = 0;
  viewerAnnLatestAt.value = 0;
  viewerChatNewCount.value = 0;
  viewerChatLatestAt.value = 0;
  hideToast();
  closeAnnPopup(true);

  router.replace({ path: "/login" });
}

function btnHover(e, enter) {
  gsap.to(e.currentTarget, { y: enter ? -2 : 0, duration: 0.22, ease: "power2.out" });
}

function navHover(e, enter) {
  const el = e.currentTarget;
  if (el.classList?.contains("active")) return;
  gsap.to(el, { x: enter ? 3 : 0, duration: 0.18, ease: "power2.out" });
}

function subHover(e, enter) {
  const el = e.currentTarget;
  if (el.classList?.contains("active")) return;
  gsap.to(el, { x: enter ? 4 : 0, duration: 0.18, ease: "power2.out" });
}

function openInsertMenu(immediate = false) {
  const menu = insertMenuEl.value;
  const chev = insertChevronEl.value;
  if (!menu) return;

  gsap.killTweensOf(menu);
  gsap.killTweensOf(chev);
  gsap.set(menu, { display: "block" });

  const h = menu.scrollHeight;

  if (immediate) {
    gsap.set(menu, { height: "auto", opacity: 1 });
    gsap.set(chev, { rotate: 180 });
    return;
  }

  gsap.fromTo(
    menu,
    { height: 0, opacity: 0 },
    {
      height: h,
      opacity: 1,
      duration: 0.28,
      ease: "power2.out",
      onComplete: () => gsap.set(menu, { height: "auto" }),
    }
  );

  gsap.to(chev, { rotate: 180, duration: 0.22, ease: "power2.out" });
}

function closeInsertMenu() {
  const menu = insertMenuEl.value;
  const chev = insertChevronEl.value;
  if (!menu) return;

  gsap.killTweensOf(menu);
  gsap.killTweensOf(chev);

  const h = menu.scrollHeight;
  gsap.set(menu, { height: h });

  gsap.to(menu, {
    height: 0,
    opacity: 0,
    duration: 0.22,
    ease: "power2.inOut",
    onComplete: () => gsap.set(menu, { display: "none" }),
  });

  gsap.to(chev, { rotate: 0, duration: 0.2, ease: "power2.inOut" });
}

async function toggleInsert() {
  isInsertOpen.value = !isInsertOpen.value;
  await nextTick();

  if (isInsertOpen.value) openInsertMenu(false);
  else closeInsertMenu();
}

function ensureOpenAfterNavigate() {
  if (!isInsertOpen.value) {
    isInsertOpen.value = true;
    openInsertMenu(true);
  }
}

function openViewMenu(immediate = false) {
  const menu = viewMenuEl.value;
  const chev = viewChevronEl.value;
  if (!menu) return;

  gsap.killTweensOf(menu);
  gsap.killTweensOf(chev);
  gsap.set(menu, { display: "block" });

  const h = menu.scrollHeight;

  if (immediate) {
    gsap.set(menu, { height: "auto", opacity: 1 });
    gsap.set(chev, { rotate: 180 });
    return;
  }

  gsap.fromTo(
    menu,
    { height: 0, opacity: 0 },
    {
      height: h,
      opacity: 1,
      duration: 0.28,
      ease: "power2.out",
      onComplete: () => gsap.set(menu, { height: "auto" }),
    }
  );

  gsap.to(chev, { rotate: 180, duration: 0.22, ease: "power2.out" });
}

function closeViewMenu() {
  const menu = viewMenuEl.value;
  const chev = viewChevronEl.value;
  if (!menu) return;

  gsap.killTweensOf(menu);
  gsap.killTweensOf(chev);

  const h = menu.scrollHeight;
  gsap.set(menu, { height: h });

  gsap.to(menu, {
    height: 0,
    opacity: 0,
    duration: 0.22,
    ease: "power2.inOut",
    onComplete: () => gsap.set(menu, { display: "none" }),
  });

  gsap.to(chev, { rotate: 0, duration: 0.2, ease: "power2.inOut" });
}

async function toggleView() {
  isViewOpen.value = !isViewOpen.value;
  await nextTick();

  if (isViewOpen.value) openViewMenu(false);
  else closeViewMenu();
}

function ensureViewOpenAfterNavigate() {
  if (!isViewOpen.value) {
    isViewOpen.value = true;
    openViewMenu(true);
  }
}

watch(
  () => route.path,
  async () => {
    if (isAuthPage.value) return;
    if (isViewer.value) return;

    if (isInsertActive.value && !isInsertOpen.value) {
      isInsertOpen.value = true;
      await nextTick();
      openInsertMenu(false);
    }

    if (isViewActive.value && !isViewOpen.value) {
      isViewOpen.value = true;
      await nextTick();
      openViewMenu(false);
    }
  }
);

const didInitSidebar = ref(false);

async function initSidebarUI() {
  if (didInitSidebar.value) return;
  if (!sidebarEl.value) return;

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  gsap.set(".js-reveal", { opacity: 0, y: 12 });

  tl.from(sidebarEl.value, { x: -24, opacity: 0, duration: 0.55 }, 0);

  if (topbarEl.value) {
    tl.from(topbarEl.value, { y: -12, opacity: 0, duration: 0.45 }, 0.08);
  }

  tl.to(".js-reveal", { opacity: 1, y: 0, stagger: 0.06, duration: 0.42 }, 0.14);

  await nextTick();

  if (!isViewer.value) {
    if (isViewActive.value) {
      isViewOpen.value = true;
      openViewMenu(true);
    } else {
      const menu = viewMenuEl.value;
      const chev = viewChevronEl.value;
      if (menu) gsap.set(menu, { display: "none", height: 0, opacity: 0 });
      if (chev) gsap.set(chev, { rotate: 0 });
    }

    if (isInsertActive.value) {
      isInsertOpen.value = true;
      openInsertMenu(true);
    } else {
      const menu = insertMenuEl.value;
      const chev = insertChevronEl.value;
      if (menu) gsap.set(menu, { display: "none", height: 0, opacity: 0 });
      if (chev) gsap.set(chev, { rotate: 0 });
    }
  }

  didInitSidebar.value = true;
}

watch(isAuthPage, async (auth) => {
  if (auth) {
    didInitSidebar.value = false;
    return;
  }

  await nextTick();
  await initSidebarUI();
});

onMounted(async () => {
  if (!isAuthPage.value) {
    await nextTick();
    await initSidebarUI();
  }
});

/* =========================================================
   Viewer announcement popup + badge + target filtering
   ========================================================= */

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "").trim();
const VIEWER_ANN_ITEM_KEY = "v_jobs";
const VIEWER_ANN_ROUTE = "/v/announcement_member";

const viewerAnnNewCount = ref(0);
const viewerAnnLatestAt = ref(0);

let viewerAnnTimer = null;
let viewerAnnAbort = null;

const toast = ref({ show: false, text: "" });

let toastTimer = null;

const annPopup = ref({
  show: false,
  loading: false,
  error: "",
  items: [],
  newCount: 0,
  latestAt: 0,
});

function normalizeText(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeBaseUrl(base) {
  return String(base || "").replace(/\/+$/, "");
}

function resolveApiUrl(path) {
  const base = normalizeBaseUrl(API_BASE_URL);
  const cleanPath = String(path || "").startsWith("/") ? String(path || "") : `/${String(path || "")}`;
  return `${base}${cleanPath}`;
}

function getViewerIdentityKey() {
  const u = readUserFromStorage();
  return String(u?.id || u?.user_id || u?.username || u?.email || "anon");
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value == null) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return "";
}

function getCurrentViewerBankCodeRaw() {
  const u = readUserFromStorage() || {};

  const candidates = [
    u,
    u?.profile,
    u?.member,
    u?.member_profile,
    u?.memberProfile,
    u?.bank,
    u?.bank_profile,
    u?.bankProfile,
    u?.data,
    u?.payload,
  ].filter(Boolean);

  for (const entry of candidates) {
    const bankCode = firstNonEmpty(
      entry?.Bankcode,
      entry?.bankcode,
      entry?.bank_code,
      entry?.bankCode,
      entry?.member_code,
      entry?.memberCode,
      entry?.member_bank_code,
      entry?.memberBankCode,
      entry?.member_bank,
      entry?.memberBank,
      entry?.bank_id,
      entry?.bankId,
      entry?.code,
      entry?.bank?.code,
      entry?.bank?.bankcode,
      entry?.bank?.bank_code,
      entry?.bank?.Bankcode
    );

    if (bankCode) return bankCode;
  }

  return "";
}

function getCurrentViewerBankCode() {
  return normalizeText(getCurrentViewerBankCodeRaw());
}

function viewerAnnSeenStorageKey() {
  return `viewer_last_seen_announcements_v1_${getViewerIdentityKey()}`;
}

function loadViewerSeen() {
  const key = viewerAnnSeenStorageKey();
  const raw = localStorage.getItem(key);
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function saveViewerSeen(ts) {
  const key = viewerAnnSeenStorageKey();
  localStorage.setItem(key, String(ts || 0));
}

function viewerPopupSessionKey() {
  return `viewer_login_popup_shown_v1_${getViewerIdentityKey()}`;
}

function hasShownPopupThisSession() {
  try {
    return sessionStorage.getItem(viewerPopupSessionKey()) === "1";
  } catch {
    return false;
  }
}

function markPopupShownThisSession() {
  try {
    sessionStorage.setItem(viewerPopupSessionKey(), "1");
  } catch {}
}

function toTime(x) {
  const d = new Date(x);
  const n = d.getTime();
  return Number.isFinite(n) ? n : 0;
}

function getAnnTime(item) {
  return (
    toTime(item?.created_at) ||
    toTime(item?.createdAt) ||
    toTime(item?.date) ||
    toTime(item?.updated_at) ||
    toTime(item?.updatedAt) ||
    0
  );
}

function pickAnnTitle(item) {
  return (
    String(item?.title || item?.subject || item?.name || item?.heading || "").trim() ||
    "(Untitled)"
  );
}

function stripHtml(s) {
  return String(s || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickAnnBody(item) {
  return (
    item?.body ??
    item?.content ??
    item?.detail ??
    item?.description ??
    item?.message ??
    item?.text ??
    ""
  );
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

function annKey(item, i) {
  return item?.id || item?._id || item?.uuid || item?.key || `${i}-${getAnnTime(item)}`;
}

function extractMemberIds(item) {
  const raw = item?.member_ids;

  if (Array.isArray(raw)) {
    return raw
      .map((entry) => {
        if (typeof entry === "string" || typeof entry === "number") return normalizeText(entry);
        if (entry && typeof entry === "object") {
          return normalizeText(
            entry?.Bankcode ||
              entry?.bankcode ||
              entry?.bank_code ||
              entry?.bankCode ||
              entry?.member_code ||
              entry?.memberCode ||
              entry?.code ||
              entry?.id
          );
        }
        return "";
      })
      .filter(Boolean);
  }

  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((x) => normalizeText(x))
      .filter(Boolean);
  }

  return [];
}

function isAnnouncementPublic(item) {
  return item?.target_all === true;
}

function isAnnouncementForViewer(item, bankCode) {
  if (isAnnouncementPublic(item)) return true;
  if (!bankCode) return false;

  const memberIds = extractMemberIds(item);
  if (!memberIds.length) return false;

  return memberIds.includes(bankCode);
}

function filterAnnouncementsForViewer(list) {
  const bankCode = getCurrentViewerBankCode();
  return (Array.isArray(list) ? list : []).filter((item) => isAnnouncementForViewer(item, bankCode));
}

function normalizeAnnouncementList(list) {
  const filtered = filterAnnouncementsForViewer(list);

  return filtered
    .map((item, index) => ({
      ...item,
      _t: getAnnTime(item),
      _key: annKey(item, index),
      _isPublic: isAnnouncementPublic(item),
    }))
    .sort((a, b) => (b._t || 0) - (a._t || 0));
}

async function parseFetchError(res) {
  try {
    const data = await res.json();
    return data?.message || `${res.status} ${res.statusText}`;
  } catch {
    try {
      const text = await res.text();
      return text || `${res.status} ${res.statusText}`;
    } catch {
      return `${res.status} ${res.statusText}`;
    }
  }
}

async function fetchAnnouncementsList(signal) {
  const url = resolveApiUrl("/api/announcements");
  const res = await fetch(url, {
    method: "GET",
    signal,
  });

  if (!res.ok) {
    const msg = await parseFetchError(res);
    throw new Error(msg || "Failed to fetch announcements");
  }

  const data = await res.json();
  const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  return normalizeAnnouncementList(list);
}

async function checkViewerAnnouncements() {
  if (isAuthPage.value) return;
  if (!isViewer.value) return;

  try {
    if (viewerAnnAbort) viewerAnnAbort.abort();
    viewerAnnAbort = new AbortController();

    const list = await fetchAnnouncementsList(viewerAnnAbort.signal);

    let latest = 0;
    for (const it of list) {
      const t = getAnnTime(it);
      if (t > latest) latest = t;
    }

    viewerAnnLatestAt.value = latest;

    const seen = loadViewerSeen();

    if (seen == null) {
      saveViewerSeen(latest);
      viewerAnnNewCount.value = 0;
      return;
    }

    const newCount = list.reduce((acc, it) => acc + (getAnnTime(it) > seen ? 1 : 0), 0);
    const prev = viewerAnnNewCount.value;

    viewerAnnNewCount.value = newCount;

    if (newCount > prev && route.path !== VIEWER_ANN_ROUTE) {
      showToast(`${newCount} new item${newCount > 1 ? "s" : ""} added`);
    }
  } catch (e) {
    if (e?.name === "AbortError") return;
    console.error("checkViewerAnnouncements error:", e);
  }
}

function startViewerAnnPoll() {
  stopViewerAnnPoll();
  checkViewerAnnouncements();
  viewerAnnTimer = setInterval(checkViewerAnnouncements, 45000);
  window.addEventListener("focus", checkViewerAnnouncements);
}

function stopViewerAnnPoll() {
  if (viewerAnnTimer) {
    clearInterval(viewerAnnTimer);
    viewerAnnTimer = null;
  }

  window.removeEventListener("focus", checkViewerAnnouncements);

  if (viewerAnnAbort) {
    viewerAnnAbort.abort();
    viewerAnnAbort = null;
  }
}

function markViewerAnnouncementsSeen() {
  const latest = viewerAnnLatestAt.value || Date.now();
  saveViewerSeen(latest);
  viewerAnnNewCount.value = 0;
  hideToast();
}

function isViewerNew(item) {
  return item?.key === VIEWER_ANN_ITEM_KEY && viewerAnnNewCount.value > 0;
}

/* =========================================================
   Viewer chat sidebar chip for new admin messages
   ========================================================= */

const VIEWER_CHAT_ITEM_KEY = "v_board";
const VIEWER_CHAT_ROUTE = "/v/chat";

const viewerChatNewCount = ref(0);
const viewerChatLatestAt = ref(0);

let viewerChatTimer = null;
let viewerChatAbort = null;

function viewerChatSeenStorageKey() {
  return `viewer_last_seen_admin_messages_v1_${getViewerIdentityKey()}`;
}

function loadViewerChatSeen() {
  const raw = localStorage.getItem(viewerChatSeenStorageKey());
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function saveViewerChatSeen(ts) {
  localStorage.setItem(viewerChatSeenStorageKey(), String(ts || 0));
}

function viewerChatHeaders(extra = {}, bankCodeOverride = "") {
  const headers = {
    ...extra,
    "x-role": "bank",
    "x-user-role": "bank",
  };

  const rawBankCode = firstNonEmpty(bankCodeOverride, getCurrentViewerBankCodeRaw());
  const normalizedBankCode = normalizeText(rawBankCode);

  const bankCode = rawBankCode || normalizedBankCode;
  if (bankCode) {
    headers["x-bankcode"] = bankCode;
    headers["x-bank-code"] = bankCode;
    headers["x-member-bank"] = bankCode;
    headers["x-member-code"] = bankCode;
  }

  const token = readTokenFromStorage();
  if (token) headers.Authorization = `Bearer ${token}`;

  return headers;
}

function buildViewerChatHeaderCandidates(extra = {}) {
  const rawBankCode = firstNonEmpty(getCurrentViewerBankCodeRaw());
  const normalizedBankCode = normalizeText(rawBankCode);

  const candidates = [
    viewerChatHeaders(extra, rawBankCode),
    viewerChatHeaders(extra, normalizedBankCode),
    viewerChatHeaders(extra, ""),
  ];

  const seen = new Set();
  return candidates.filter((entry) => {
    const key = JSON.stringify(entry);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchViewerChatApi(path, options = {}) {
  const {
    method = "GET",
    body = undefined,
    signal = undefined,
    withJson = false,
  } = options;

  const url = resolveApiUrl(path);
  const headerCandidates = buildViewerChatHeaderCandidates(
    withJson ? { "Content-Type": "application/json" } : {}
  );

  let lastError = null;

  for (const headers of headerCandidates) {
    try {
      const res = await fetch(url, {
        method,
        headers,
        body,
        signal,
      });

      if (res.ok) return res;

      const msg = await parseFetchError(res);
      lastError = new Error(msg || `${res.status} ${res.statusText}`);

      if (![400, 401, 403, 404].includes(Number(res.status))) {
        throw lastError;
      }
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      lastError = error;
    }
  }

  throw lastError || new Error("Viewer chat request failed");
}

function getMessageSenderRole(item) {
  return normalizeRole(
    item?.sender_role ||
      item?.senderRole ||
      item?.from_role ||
      item?.fromRole ||
      item?.author_role ||
      item?.authorRole ||
      item?.role ||
      item?.sender?.role
  );
}

function getMessageSenderBankCode(item) {
  return normalizeText(
    item?.sender_bankcode ||
      item?.senderBankcode ||
      item?.sender_bank_code ||
      item?.senderBankCode ||
      item?.bankcode ||
      item?.bank_code ||
      item?.bankCode ||
      item?.member_code ||
      item?.memberCode ||
      item?.sender?.bankcode ||
      item?.sender?.bank_code ||
      item?.sender?.Bankcode
  );
}

function isAdminSideMessage(item) {
  const senderRole = getMessageSenderRole(item);
  if (senderRole) {
    return !["bank", "viewer", "member", "memberbank"].includes(senderRole);
  }

  const currentBankCode = getCurrentViewerBankCode();
  const senderBankCode = getMessageSenderBankCode(item);
  if (currentBankCode && senderBankCode) {
    return currentBankCode !== senderBankCode;
  }

  if (
    item?.is_mine === true ||
    item?.isMine === true ||
    item?.mine === true ||
    item?.from_me === true ||
    item?.fromMe === true ||
    item?.own === true
  ) {
    return false;
  }

  return true;
}

async function ensureViewerConversation(signal) {
  const res = await fetchViewerChatApi("/api/chat/conversations/ensure", {
    method: "POST",
    body: JSON.stringify({}),
    signal,
    withJson: true,
  });

  const data = await res.json();
  return Number(data?.conversation_id || data?.id || data?.conversation?.id || 0);
}

async function fetchViewerConversationMessages(signal) {
  const conversationId = await ensureViewerConversation(signal);
  if (!conversationId) return [];

  const res = await fetchViewerChatApi(`/api/chat/conversations/${conversationId}/messages?limit=200`, {
    method: "GET",
    signal,
  });

  const data = await res.json();
  return Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.messages)
    ? data.messages
    : Array.isArray(data)
    ? data
    : [];
}

async function checkViewerChatNotifications() {
  if (isAuthPage.value) return;
  if (!isViewer.value) return;

  try {
    if (viewerChatAbort) viewerChatAbort.abort();
    viewerChatAbort = new AbortController();

    const list = await fetchViewerConversationMessages(viewerChatAbort.signal);
    const adminMessages = (Array.isArray(list) ? list : []).filter(isAdminSideMessage);

    let latest = 0;
    for (const it of adminMessages) {
      const t = toTime(it?.created_at || it?.createdAt || it?.sent_at || it?.updated_at || it?.updatedAt);
      if (t > latest) latest = t;
    }

    viewerChatLatestAt.value = latest;

    if (route.path === VIEWER_CHAT_ROUTE) {
      saveViewerChatSeen(latest || Date.now());
      viewerChatNewCount.value = 0;
      return;
    }

    const seen = loadViewerChatSeen();

    if (seen == null) {
      saveViewerChatSeen(latest);
      viewerChatNewCount.value = 0;
      return;
    }

    viewerChatNewCount.value = adminMessages.reduce((sum, item) => {
      const createdAt = toTime(
        item?.created_at || item?.createdAt || item?.sent_at || item?.updated_at || item?.updatedAt
      );
      return createdAt > seen ? sum + 1 : sum;
    }, 0);
  } catch (e) {
    if (e?.name === "AbortError") return;
    console.error("checkViewerChatNotifications error:", e);
  }
}

function startViewerChatPoll() {
  stopViewerChatPoll();
  checkViewerChatNotifications();
  viewerChatTimer = setInterval(checkViewerChatNotifications, 20000);
  window.addEventListener("focus", checkViewerChatNotifications);
}

function stopViewerChatPoll() {
  if (viewerChatTimer) {
    clearInterval(viewerChatTimer);
    viewerChatTimer = null;
  }

  window.removeEventListener("focus", checkViewerChatNotifications);

  if (viewerChatAbort) {
    viewerChatAbort.abort();
    viewerChatAbort = null;
  }
}

function markViewerChatSeen() {
  const latest = viewerChatLatestAt.value || Date.now();
  saveViewerChatSeen(latest);
  viewerChatNewCount.value = 0;
}

function isViewerChatNew(item) {
  return item?.key === VIEWER_CHAT_ITEM_KEY && viewerChatNewCount.value > 0;
}

watch(
  () => route.path,
  (p) => {
    if (!isViewer.value) return;
    if (p === VIEWER_CHAT_ROUTE) {
      markViewerChatSeen();
    }
  }
);

watch(
  [isViewer, isAuthPage, () => route.path],
  () => {
    if (isViewer.value && !isAuthPage.value) startViewerChatPoll();
    else stopViewerChatPoll();
  },
  { immediate: true }
);

watch(
  () => route.path,
  (p) => {
    if (!isViewer.value) return;
    if (p === VIEWER_ANN_ROUTE) {
      markViewerAnnouncementsSeen();
    }
  }
);

watch(
  [isViewer, isAuthPage, () => route.path],
  () => {
    if (isViewer.value && !isAuthPage.value) startViewerAnnPoll();
    else stopViewerAnnPoll();
  },
  { immediate: true }
);

function showToast(text) {
  toast.value = { show: true, text };

  if (toastTimer) clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.value.show = false;
  }, 5500);
}

function hideToast() {
  toast.value.show = false;

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = null;
}

function goToViewerAnnouncements() {
  router.push(VIEWER_ANN_ROUTE);
  hideToast();
}

async function openAnnPopup() {
  annPopup.value.show = true;
  annPopup.value.loading = true;
  annPopup.value.error = "";
  annPopup.value.items = [];
  annPopup.value.newCount = 0;
  annPopup.value.latestAt = 0;

  try {
    const list = await fetchAnnouncementsList();

    const latest = list[0]?._t || 0;
    annPopup.value.latestAt = latest;

    const seen = loadViewerSeen();
    const seenTs = seen == null ? 0 : seen;

    const newCount = list.reduce((acc, it) => acc + ((it._t || 0) > seenTs ? 1 : 0), 0);
    annPopup.value.newCount = newCount;

    annPopup.value.items = list.slice(0, 8).map((it) => {
      const title = pickAnnTitle(it);
      const body = stripHtml(pickAnnBody(it));
      const preview = body ? (body.length > 140 ? `${body.slice(0, 140)}…` : body) : "";
      const when = it._t ? formatWhen(it._t) : "-";

      return {
        _key: it._key,
        title,
        preview,
        when,
        isNew: (it._t || 0) > seenTs,
        isPublic: it._isPublic === true,
        _t: it._t || 0,
      };
    });
  } catch (e) {
    annPopup.value.error = e?.message || "Load announcements failed";
    console.error("openAnnPopup error:", e);
  } finally {
    annPopup.value.loading = false;
  }
}

function closeAnnPopup(hard = false) {
  annPopup.value.show = false;

  if (hard) {
    annPopup.value.loading = false;
    annPopup.value.error = "";
    annPopup.value.items = [];
    annPopup.value.newCount = 0;
    annPopup.value.latestAt = 0;
  }
}

function markAllReadFromPopup() {
  const latest = annPopup.value.latestAt || viewerAnnLatestAt.value || Date.now();
  saveViewerSeen(latest);
  viewerAnnNewCount.value = 0;
  hideToast();
  closeAnnPopup();
}

function goToViewerAnnouncementsFromPopup() {
  markAllReadFromPopup();
  router.push(VIEWER_ANN_ROUTE);
}

function onGlobalKeydown(e) {
  if (e?.key === "Escape" && annPopup.value.show) closeAnnPopup();
}

watch(
  () => annPopup.value.show,
  (v) => {
    if (v) window.addEventListener("keydown", onGlobalKeydown);
    else window.removeEventListener("keydown", onGlobalKeydown);
  },
  { immediate: true }
);

async function maybeShowViewerPopupOnLogin() {
  if (isAuthPage.value) return;
  if (!isViewer.value) return;
  if (hasShownPopupThisSession()) return;

  markPopupShownThisSession();
  await openAnnPopup();
}

watch(
  [isViewer, isAuthPage, () => route.path],
  async () => {
    if (isViewer.value && !isAuthPage.value) {
      await nextTick();
      setTimeout(() => {
        maybeShowViewerPopupOnLogin();
      }, 180);
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  stopViewerAnnPoll();
  stopViewerChatPoll();
  hideToast();
  window.removeEventListener("keydown", onGlobalKeydown);
});
</script>

<style scoped>
:global(:root) {
  color-scheme: dark;
}
:global(*) {
  box-sizing: border-box;
}

.app.tech {
  --bg0: #050914;
  --bg1: #070e23;
  --panel: rgba(255, 255, 255, 0.045);
  --panel2: rgba(255, 255, 255, 0.03);
  --stroke: rgba(255, 255, 255, 0.08);

  --blueA: rgba(56, 189, 248, 0.55);
  --blueB: rgba(99, 102, 241, 0.45);
  --blueC: rgba(14, 165, 233, 0.3);
  --txt: rgba(255, 255, 255, 0.92);
  --muted: rgba(255, 255, 255, 0.55);

  --glass: rgba(255, 255, 255, 0.035);
  --glass2: rgba(255, 255, 255, 0.02);

  --navH: 46px;
  --navPadY: 12px;
  --navPadX: 12px;
  --navRadius: 14px;

  min-height: 100vh;
  display: grid;
  grid-template-columns: 260px 1fr;
  background: radial-gradient(1100px 620px at 18% 14%, rgba(56, 189, 248, 0.16), transparent 58%),
    radial-gradient(900px 520px at 82% 18%, rgba(99, 102, 241, 0.14), transparent 60%),
    radial-gradient(800px 520px at 70% 90%, rgba(14, 165, 233, 0.1), transparent 62%),
    linear-gradient(180deg, var(--bg1), var(--bg0));
  color: var(--txt);
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
  overflow: hidden;
  position: relative;
}

.app.tech.is-auth {
  grid-template-columns: 1fr;
  background: transparent;
}

.app.tech::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.22;
  background: linear-gradient(to right, rgba(255, 255, 255, 0.06) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
  background-size: 46px 46px;
  mask-image: radial-gradient(circle at 35% 18%, black 0%, transparent 60%);
}

.app.tech.is-auth::before {
  display: none;
}

.glow {
  position: fixed;
  pointer-events: none;
  filter: blur(52px);
  opacity: 0.75;
}

.glow-a {
  width: 560px;
  height: 560px;
  left: -180px;
  top: 120px;
  background: radial-gradient(circle at 30% 30%, rgba(56, 189, 248, 0.4), transparent 62%);
}

.glow-b {
  width: 560px;
  height: 560px;
  right: -200px;
  top: -160px;
  background: radial-gradient(circle at 30% 30%, rgba(99, 102, 241, 0.34), transparent 62%);
}

.sidebar {
  padding: 22px 18px;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(8, 12, 28, 0.55);
  backdrop-filter: blur(14px);
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-shadow: 14px 0 44px rgba(0, 0, 0, 0.35);
  position: relative;
  overflow: hidden;
}

.sidebar::before {
  content: "";
  position: absolute;
  inset: -2px;
  background: linear-gradient(
    90deg,
    rgba(56, 189, 248, 0.45),
    rgba(99, 102, 241, 0.25),
    rgba(14, 165, 233, 0.22),
    rgba(56, 189, 248, 0.45)
  );
  opacity: 0.14;
  filter: blur(14px);
  pointer-events: none;
  animation: holoShift 7s linear infinite;
}

@keyframes holoShift {
  0% {
    transform: translateX(-16%);
  }
  100% {
    transform: translateX(16%);
  }
}

.brand {
  display: flex;
  gap: 12px;
  align-items: center;
  position: relative;
}

.brandMark {
  width: 50px;
  height: 50px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-weight: 900;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.65), rgba(99, 102, 241, 0.45));
  box-shadow: 0 18px 42px rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.22);
}

.brandName {
  font-weight: 900;
  color: #fff;
  letter-spacing: 0.2px;
}

.brandSub {
  font-size: 12px;
  color: var(--muted);
  margin-top: 2px;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 6px;
}

.navItem,
.navGroupBtn {
  text-decoration: none;
  position: relative;
  width: 100%;
  border-radius: var(--navRadius);
  min-height: var(--navH);
  padding: var(--navPadY) var(--navPadX);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.78);
  display: flex;
  align-items: center;
  gap: 10px;
  transition: background 180ms ease, color 180ms ease, border-color 180ms ease, box-shadow 180ms ease,
    transform 180ms ease;
  cursor: pointer;
}

.navItem.is-new {
  border-color: rgba(56, 189, 248, 0.22);
  box-shadow: 0 12px 30px rgba(56, 189, 248, 0.08);
}

.navBadge {
  position: absolute;
  right: 28px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  font-weight: 900;
  padding: 4px 8px;
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(56, 189, 248, 0.2);
  background: rgba(56, 189, 248, 0.10);
  box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.06);
}

.navChip {
  position: absolute;
  right: 28px;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0.02em;
  color: #fff;
}

.navChip--danger {
  background: rgba(239, 68, 68, 0.16);
  border: 1px solid rgba(248, 113, 113, 0.42);
  box-shadow: 0 0 0 6px rgba(239, 68, 68, 0.08);
}

.navItem--sub {
  background: rgba(255, 255, 255, 0.022);
  border-color: rgba(255, 255, 255, 0.055);
  padding-left: calc(var(--navPadX) + 6px);
}

.navItem--sub::before {
  content: "";
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.35);
  opacity: 0.9;
}

.navItem--sub.active::before {
  background: rgba(56, 189, 248, 0.95);
  box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.12);
}

.navItem:hover,
.navGroupBtn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.92);
  border-color: rgba(56, 189, 248, 0.22);
  box-shadow: 0 12px 30px rgba(56, 189, 248, 0.1);
  transform: translateY(-1px);
}

.navItem.active,
.navGroupBtn.active {
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.22), rgba(99, 102, 241, 0.14));
  border-color: rgba(56, 189, 248, 0.24);
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 18px 40px rgba(56, 189, 248, 0.12);
}

.navIcon {
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, 0.9);
}

.navLabel {
  font-weight: 800;
  font-size: 14px;
}

.navPill {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0);
}

.navItem.active .navPill,
.navGroupBtn.active .navPill {
  background: rgba(56, 189, 248, 0.95);
  box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.14);
}

.navDivider {
  height: 1px;
  margin: 6px 6px 2px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0),
    rgba(255, 255, 255, 0.10),
    rgba(56, 189, 248, 0.12),
    rgba(255, 255, 255, 0.10),
    rgba(255, 255, 255, 0)
  );
  opacity: 0.65;
}

.navGroup {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
}

.navGroupRight {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.navGroupHint {
  font-size: 12px;
  font-weight: 850;
  padding: 4px 8px;
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.035);
}

.navChevron {
  font-size: 12px;
  opacity: 0.85;
  transform-origin: center;
}

.subNav {
  display: none;
  height: 0px;
  opacity: 0;
  overflow: hidden;
  padding: 6px 6px 2px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.28);
  position: relative;
}

.subNav::before {
  content: "";
  position: absolute;
  inset: -1px;
  pointer-events: none;
  border-radius: 16px;
  background: radial-gradient(420px 220px at 18% 20%, rgba(56, 189, 248, 0.12), transparent 60%),
    radial-gradient(420px 220px at 80% 50%, rgba(99, 102, 241, 0.1), transparent 62%);
  opacity: 0.9;
}

.subNavItem {
  position: relative;
  text-decoration: none;
  width: 100%;
  border-radius: 14px;
  padding: 10px 10px 10px 12px;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.72);
  transition: background 180ms ease, color 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.subNavItem:hover {
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.9);
  border-color: rgba(56, 189, 248, 0.18);
  box-shadow: 0 12px 26px rgba(56, 189, 248, 0.08);
}

.subNavItem.active {
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.18), rgba(99, 102, 241, 0.12));
  border-color: rgba(56, 189, 248, 0.2);
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 18px 36px rgba(56, 189, 248, 0.1);
}

.subIcon {
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  opacity: 0.95;
}

.subLabel {
  font-weight: 800;
  font-size: 13px;
}

.subPill {
  margin-left: auto;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0);
}

.subNavItem.active .subPill {
  background: rgba(56, 189, 248, 0.95);
  box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.12);
}

.spacer {
  flex: 1;
}

.logout {
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.78);
  border-radius: 14px;
  padding: 12px 12px;
  display: flex;
  gap: 10px;
  align-items: center;
  cursor: pointer;
}

.main {
  padding: 18px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.app.tech.is-auth .main {
  padding: 0;
}

.mainBody {
  flex: 1;
  overflow: auto;
  padding-right: 6px;
}

.app.tech.is-auth .mainBody {
  padding-right: 0;
}

.mainBody::-webkit-scrollbar {
  width: 10px;
}

.mainBody::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
}

.popupMask {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(10px);
}

.popupCard {
  width: min(720px, 96vw);
  max-height: min(78vh, 760px);
  overflow: hidden;
  border-radius: 18px;
  background: rgba(8, 12, 28, 0.86);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.52);
  backdrop-filter: blur(14px);
  display: grid;
  grid-template-rows: auto 1fr auto;
}

.popupHead {
  padding: 14px 14px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.popupTitle {
  font-weight: 950;
  display: inline-flex;
  gap: 10px;
  align-items: center;
  color: rgba(255, 255, 255, 0.92);
}

.popupSub {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.66);
}

.popupNewCount {
  font-weight: 950;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(56, 189, 248, 0.2);
  background: rgba(56, 189, 248, 0.10);
  color: rgba(255, 255, 255, 0.9);
}

.popupMuted {
  opacity: 0.85;
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

.popupBody {
  padding: 12px 14px 12px;
  overflow: auto;
}

.popupBody::-webkit-scrollbar {
  width: 10px;
}

.popupBody::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
}

.popupLoading {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  padding: 26px 0;
  opacity: 0.9;
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
  0% {
    transform: translateY(0);
    opacity: 0.55;
  }
  50% {
    transform: translateY(-5px);
    opacity: 1;
  }
  100% {
    transform: translateY(0);
    opacity: 0.55;
  }
}

.popupErr {
  padding: 14px 12px;
  border-radius: 14px;
  background: rgba(255, 80, 80, 0.10);
  border: 1px solid rgba(255, 80, 80, 0.22);
  color: rgba(255, 255, 255, 0.88);
}

.annList {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 10px;
}

.annItem {
  border-radius: 14px;
  padding: 12px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.annTop {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.annTitle {
  font-weight: 950;
  color: rgba(255, 255, 255, 0.92);
  line-height: 1.25;
}

.annBadges {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.annTagNew,
.annTagPublic {
  font-size: 11px;
  font-weight: 950;
  padding: 4px 8px;
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
}

.annTagNew {
  border: 1px solid rgba(56, 189, 248, 0.22);
  background: rgba(56, 189, 248, 0.12);
}

.annTagPublic {
  border: 1px solid rgba(99, 102, 241, 0.24);
  background: rgba(99, 102, 241, 0.14);
}

.annMeta {
  margin-top: 6px;
  font-size: 12px;
  opacity: 0.68;
}

.annPreview {
  margin-top: 8px;
  font-size: 12px;
  opacity: 0.82;
  line-height: 1.35;
  word-break: break-word;
}

.annEmpty {
  padding: 18px 12px;
  opacity: 0.7;
  text-align: center;
  border-radius: 14px;
  border: 1px dashed rgba(255, 255, 255, 0.14);
}

.popupActions {
  padding: 12px 14px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.popupBtn {
  padding: 10px 12px;
  border-radius: 12px;
  font-weight: 900;
  cursor: pointer;
  border: 1px solid rgba(56, 189, 248, 0.22);
  background: rgba(56, 189, 248, 0.12);
  color: rgba(255, 255, 255, 0.92);
}

.popupBtn.ghost {
  border-color: rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.80);
}

.popupBtn.soft {
  border-color: rgba(56, 189, 248, 0.18);
  background: rgba(56, 189, 248, 0.08);
}

.popup-enter-active,
.popup-leave-active {
  transition: transform 180ms ease, opacity 180ms ease;
}

.popup-enter-from,
.popup-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.99);
}

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
  max-width: min(420px, 92vw);
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
  border: 1px solid rgba(56, 189, 248, 0.22);
  background: rgba(56, 189, 248, 0.12);
  color: rgba(255, 255, 255, 0.92);
}

.toastBtn.ghost {
  border-color: rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.80);
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

@media (max-width: 1100px) {
  .app.tech {
    grid-template-columns: 86px 1fr;
  }

  .brandText,
  .navLabel {
    display: none;
  }

  .navGroupHint,
  .navChevron {
    display: none;
  }

  .subLabel {
    display: none;
  }

  .navDivider {
    margin: 6px 2px 2px;
  }

  .navBadge,
  .navChip {
    right: 26px;
  }
}

@media (max-width: 920px) {
  .main {
    padding: 14px;
  }

  .app.tech.is-auth .main {
    padding: 0;
  }
}
</style>