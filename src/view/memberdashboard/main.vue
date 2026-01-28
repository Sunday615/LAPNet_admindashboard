<!-- src/views/ViewerOverview.vue  (Overview + Members card + Members in charts) -->
<template>
  <section class="ov">
    <!-- Header -->
    <header ref="headEl" class="ovHead js-reveal">
      <div class="headLeft">
        <div class="kicker">
          <span class="kDot"></span>
          Members Console
        </div>
        <h1 class="title">ພາບລວມ (Overview)</h1>
        <p class="sub">Documents • Announcements • Form Templates • Members</p>
      </div>

      <div class="headRight">
        <!-- ✅ SINGLE BOX (Account + MemberBank) -->
        <div
          class="profileBox"
          @mouseenter="profileHover($event, true)"
          @mouseleave="profileHover($event, false)"
          title="Account / MemberBank"
        >
          <div class="avatar">
            <span v-if="profileLoading || memberLoading" class="dotSpin"></span>

            <template v-else>
              <!-- ✅ show bank logo if exists, else show user initial -->
              <img
                v-if="memberProfile?.logo"
                class="avatarImg"
                :src="memberProfile.logo"
                :alt="memberProfile.name || 'Bank logo'"
                @error="onAvatarLogoError"
              />
              <span v-else>{{ avatarText }}</span>
            </template>
          </div>

          <div class="profileMeta">
            <div class="profileName">
              {{ profileLoading ? "Loading..." : displayUsername }}
            </div>

            <!-- ✅ Bank info (full name, no ellipsis) -->
            <div class="profileBankLine">
              <i class="fa-solid fa-building-columns"></i>

              <div class="bankStack">
                <div class="bankCodeRow">
                  <template v-if="profileLoading">
                    <span class="mono">...</span>
                  </template>
                  <template v-else>
                    <span class="mono" v-if="profile?.bankcode">{{ profile.bankcode }}</span>
                    <span class="mono" v-else>NO_BANKCODE</span>
                  </template>
                </div>

                <div class="bankNameRow">
                  <template v-if="profileLoading">
                    <span class="muted">...</span>
                  </template>

                  <template v-else>
                    <span v-if="memberProfile?.name" class="bankName">
                      {{ memberProfile.name }}
                    </span>
                    <span v-else class="bankName muted">
                      {{ profile?.bankcode ? "MemberBank not found" : "Not mapped" }}
                    </span>
                  </template>
                </div>
              </div>
            </div>

            <!-- errors -->
            <div v-if="profileError" class="profileErr">{{ profileError }}</div>
            <div v-else-if="memberError" class="profileErr">{{ memberError }}</div>
          </div>
        </div>

        <button class="btn" type="button" @click="refresh" :disabled="loading">
          <span class="btnIcon" :class="{ spin: loading }">⟲</span>
          Refresh
        </button>
      </div>
    </header>

    <!-- Error -->
    <div v-if="error" class="banner js-reveal">
      <div class="bannerTitle">⚠️ Load error</div>
      <div class="bannerBody">{{ error }}</div>
    </div>

    <!-- Grid -->
    <div class="grid">
      <!-- Documents -->
      <article class="card stat js-reveal" @mouseenter="cardHover($event, true)" @mouseleave="cardHover($event, false)">
        <div class="cardHead">
          <div class="cardTitle">
            <i class="fa-solid fa-file-lines"></i>
            Documents
          </div>
          <div class="pill">Total</div>
        </div>
        <div class="statRow">
          <div class="statValue">{{ totals.documents }}</div>
          <div class="statMeta">
            <div class="statLabel">Last 7 days</div>
            <div class="statSub">+{{ last7.documents }} new</div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="mini">
          <div class="miniLabel">Latest</div>
          <div class="miniText">{{ latestDocTitle }}</div>
        </div>

        <button class="miniBtn" type="button" @click="go('/v/documentviewer')">
          View documents <i class="fa-solid fa-arrow-right"></i>
        </button>
      </article>

      <!-- Announcements -->
      <article class="card stat js-reveal" @mouseenter="cardHover($event, true)" @mouseleave="cardHover($event, false)">
        <div class="cardHead">
          <div class="cardTitle">
            <i class="fa-solid fa-bullhorn"></i>
            Announcements
          </div>
          <div class="pill">Total</div>
        </div>
        <div class="statRow">
          <div class="statValue">{{ totals.announcements }}</div>
          <div class="statMeta">
            <div class="statLabel">Last 7 days</div>
            <div class="statSub">+{{ last7.announcements }} new</div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="mini">
          <div class="miniLabel">Latest</div>
          <div class="miniText">{{ latestAnnTitle }}</div>
        </div>

        <button class="miniBtn" type="button" @click="go('/v/announcement_member')">
          View announcements <i class="fa-solid fa-arrow-right"></i>
        </button>
      </article>

      <!-- ✅ FORMS (ACTIVE ONLY) -->
      <article class="card stat js-reveal" @mouseenter="cardHover($event, true)" @mouseleave="cardHover($event, false)">
        <div class="cardHead">
          <div class="cardTitle">
            <i class="fa-solid fa-list-check"></i>
            Form Templates
          </div>
          <div class="pill">Active</div>
        </div>
        <div class="statRow">
          <div class="statValue">{{ totals.forms }}</div>
          <div class="statMeta">
            <div class="statLabel">Last 7 days</div>
            <div class="statSub">+{{ last7.forms }} new</div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="mini">
          <div class="miniLabel">Latest (active)</div>
          <div class="miniText">{{ latestFormTitle }}</div>
        </div>

        <button class="miniBtn" type="button" @click="go('/v/formmemberview')">
          View forms <i class="fa-solid fa-arrow-right"></i>
        </button>
      </article>

      <!-- ✅ MEMBERS -->
      <article class="card stat js-reveal" @mouseenter="cardHover($event, true)" @mouseleave="cardHover($event, false)">
        <div class="cardHead">
          <div class="cardTitle">
            <i class="fa-solid fa-building-columns"></i>
            Members
          </div>
          <div class="pill">Total</div>
        </div>
        <div class="statRow">
          <div class="statValue">{{ totals.members }}</div>
          <div class="statMeta">
            <div class="statLabel">Last 7 days</div>
            <div class="statSub">+{{ last7.members }} new</div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="mini">
          <div class="miniLabel">Latest</div>
          <div class="miniText">{{ latestMemberTitle }}</div>
        </div>

        <!-- ✅ change route if your viewer route differs -->
        <button class="miniBtn" type="button" @click="go('/v/allmembers_viewer')">
          View members <i class="fa-solid fa-arrow-right"></i>
        </button>
      </article>

      <!-- Trend chart -->
      <article class="card chartWide js-reveal" @mouseenter="cardHover($event, true)" @mouseleave="cardHover($event, false)">
        <div class="cardHead">
          <div class="cardTitle">
            <i class="fa-solid fa-chart-line"></i>
            Last 6 Months Trend
          </div>
          <div class="pill">Line</div>
        </div>

        <div class="chartWrap">
          <canvas ref="trendCanvas"></canvas>
        </div>

        <div class="hint">Count by month (Documents / Announcements / Active Forms / Members)</div>
      </article>

      <!-- Distribution chart -->
      <article class="card chartNarrow js-reveal" @mouseenter="cardHover($event, true)" @mouseleave="cardHover($event, false)">
        <div class="cardHead">
          <div class="cardTitle">
            <i class="fa-solid fa-chart-pie"></i>
            Distribution
          </div>
          <div class="pill">Doughnut</div>
        </div>

        <div class="chartWrap small">
          <canvas ref="distCanvas"></canvas>
        </div>

        <div class="hint">Total proportions</div>
      </article>

      <article class="card actions js-reveal">
        <div class="cardHead">
          <div class="cardTitle">
            <i class="fa-solid fa-bolt"></i>
            Quick Actions
          </div>
          <div class="pill">Shortcuts</div>
        </div>

        <div class="actionGrid">
          <button class="qbtn" type="button" @click="go('/v/documentviewer')">
            <i class="fa-solid fa-file"></i>
            Documents
          </button>
          <button class="qbtn" type="button" @click="go('/v/announcement_member')">
            <i class="fa-solid fa-bullhorn"></i>
            Announcements
          </button>
          <button class="qbtn" type="button" @click="go('/v/formmemberview')">
            <i class="fa-solid fa-list-check"></i>
            Forms
          </button>
          <button class="qbtn" type="button" @click="go('/v/allmembers_viewer')">
            <i class="fa-solid fa-building-columns"></i>
            Members
          </button>
          <button class="qbtn" type="button" @click="go('/v/chat')">
            <i class="fa-solid fa-message"></i>
            Chat
          </button>
        </div>
      </article>

      <!-- Recent: Documents -->
      <article class="card list js-reveal">
        <div class="cardHead">
          <div class="cardTitle">
            <i class="fa-solid fa-clock"></i>
            Recent Documents
          </div>
          <div class="pill">Latest 6</div>
        </div>

        <div v-if="loading" class="skeletonList">
          <div class="sk" v-for="i in 6" :key="'docsk' + i"></div>
        </div>

        <ul v-else class="rows">
          <li
            v-for="d in recentDocs"
            :key="d._key"
            class="row"
            @mouseenter="rowHover($event, true)"
            @mouseleave="rowHover($event, false)"
          >
            <div class="rowMain">
              <div class="rowTitle">{{ d.title || d.name || "(Untitled)" }}</div>
              <div class="rowSub">{{ formatDate(d._date) }}</div>
            </div>
            <div class="chip">{{ d.category || d.type || "DOC" }}</div>
          </li>
          <li v-if="!recentDocs.length" class="empty">No documents found</li>
        </ul>
      </article>

      <!-- Recent: Announcements -->
      <article class="card list js-reveal">
        <div class="cardHead">
          <div class="cardTitle">
            <i class="fa-solid fa-clock"></i>
            Recent Announcements
          </div>
          <div class="pill">Latest 6</div>
        </div>

        <div v-if="loading" class="skeletonList">
          <div class="sk" v-for="i in 6" :key="'annsk' + i"></div>
        </div>

        <ul v-else class="rows">
          <li
            v-for="a in recentAnns"
            :key="a._key"
            class="row"
            @mouseenter="rowHover($event, true)"
            @mouseleave="rowHover($event, false)"
          >
            <div class="rowMain">
              <div class="rowTitle">{{ a.title || a.subject || "(Untitled)" }}</div>
              <div class="rowSub">{{ formatDate(a._date) }}</div>
            </div>
            <div class="chip">{{ a.category || "ANN" }}</div>
          </li>
          <li v-if="!recentAnns.length" class="empty">No announcements found</li>
        </ul>
      </article>

      <!-- ✅ Recent: Forms (ACTIVE ONLY) -->
      <article class="card list js-reveal">
        <div class="cardHead">
          <div class="cardTitle">
            <i class="fa-solid fa-clock"></i>
            Recent Form Templates
          </div>
          <div class="pill">Active only</div>
        </div>

        <div v-if="loading" class="skeletonList">
          <div class="sk" v-for="i in 6" :key="'formsk' + i"></div>
        </div>

        <ul v-else class="rows">
          <li
            v-for="f in recentForms"
            :key="f._key"
            class="row"
            @mouseenter="rowHover($event, true)"
            @mouseleave="rowHover($event, false)"
          >
            <div class="rowMain">
              <div class="rowTitle">{{ f.name || f.title || "(Untitled)" }}</div>
              <div class="rowSub">{{ formatDate(f._date) }}</div>
            </div>
            <div class="chip">ACTIVE</div>
          </li>
          <li v-if="!recentForms.length" class="empty">No active form templates</li>
        </ul>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import gsap from "gsap";

import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  DoughnutController,
  ArcElement,
} from "chart.js";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  DoughnutController,
  ArcElement
);

const router = useRouter();
const headEl = ref(null);

/* ✅ Force Year + Anno Domini label everywhere */
const DISPLAY_YEAR = 2026;
const AD_LABEL = "";

// ---- API base
const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const endpoints = {
  documents: `${BASE}/api/documents`,
  announcements: `${BASE}/api/announcements`,
  forms: `${BASE}/api/form-templates`,
  users: `${BASE}/api/users`,
  members: `${BASE}/api/members`,
};

// ---- State
const loading = ref(false);
const error = ref("");

const documents = ref([]);
const announcements = ref([]);

// ✅ forms that will be shown (ACTIVE ONLY)
const forms = ref([]);

// ✅ members list (for card + graph)
const members = ref([]);

const totals = reactive({ documents: 0, announcements: 0, forms: 0, members: 0 });
const last7 = reactive({ documents: 0, announcements: 0, forms: 0, members: 0 });

// ---- Profile (Account)
const profileLoading = ref(false);
const profileError = ref("");
const profile = ref({
  username: "-",
  bankcode: "",
  member_id: null,
});

// ---- MemberBank Profile (logo + name)
const memberLoading = ref(false);
const memberError = ref("");
const memberProfile = ref({
  member_id: null,
  bankcode: "",
  name: "",
  logo: "",
});

// ---- Charts
const trendCanvas = ref(null);
const distCanvas = ref(null);
let trendChart = null;
let distChart = null;

// ---- Helpers (storage/user)
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
function readToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token") || "";
}
function authHeaders() {
  const token = readToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ---- Helpers (lists/dates)
function pickDate(obj) {
  const candidates = [
    obj.createdAt,
    obj.created_at,
    obj.createdDate,
    obj.created_date,
    obj.updatedAt,
    obj.updated_at,
    obj.date,
    obj.datetime,
    obj.time,
  ].filter(Boolean);

  for (const c of candidates) {
    const d = new Date(c);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

function pickKey(obj, i) {
  return obj.id || obj._id || obj.uuid || obj.key || `${i}-${Math.random().toString(16).slice(2)}`;
}

function normalizeList(list) {
  return (Array.isArray(list) ? list : []).map((x, i) => ({
    ...x,
    _date: pickDate(x),
    _key: pickKey(x, i),
  }));
}

function joinParts(...parts) {
  return parts
    .map((p) => String(p ?? "").trim())
    .filter(Boolean)
    .join(" ");
}

function toFixedYearDate(input) {
  const d = new Date(input);
  const t = d.getTime();
  if (!Number.isFinite(t)) return null;

  const m = d.getMonth();
  const day = d.getDate();

  const fixed = new Date(DISPLAY_YEAR, m, day);
  if (fixed.getMonth() !== m) {
    return new Date(DISPLAY_YEAR, m + 1, 0);
  }
  return fixed;
}

function formatDate(input) {
  const d = toFixedYearDate(input);
  if (!d) return "-";

  const dd = String(d.getDate()).padStart(2, "0");
  const mon = d.toLocaleString(undefined, { month: "short" });

  return joinParts(dd, mon, AD_LABEL, DISPLAY_YEAR);
}

function isWithinLastDays(date, days) {
  const t = new Date(date).getTime();
  const diff = Date.now() - t;
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}

function monthKey(date) {
  const d = new Date(date);
  return { y: DISPLAY_YEAR, m: d.getMonth() };
}

function lastNMonths(n = 6) {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mon = d.toLocaleString(undefined, { month: "short" });
    out.push({
      y: DISPLAY_YEAR,
      m: d.getMonth(),
      label: joinParts(mon, AD_LABEL, DISPLAY_YEAR),
    });
  }
  return out;
}

async function fetchJSON(url) {
  const res = await fetch(url, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} (${url})`);
  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.members)) return data.members;
  if (Array.isArray(data?.result)) return data.result;
  return [];
}

/* ✅ ACTIVE CHECK: activetoggle = 1 */
function isFormActive(x) {
  const v =
    x?.activetoggle ??
    x?.activeToggle ??
    x?.active_toggle ??
    x?.is_active ??
    x?.isActive ??
    x?.active ??
    0;

  if (v === true) return true;
  const n = Number(v);
  return Number.isFinite(n) ? n === 1 : false;
}

// ------------------------
// ✅ Member helpers (logo resolve + mapping)
// ------------------------
function resolveAssetUrl(val) {
  const s = (val ?? "").toString().trim();
  if (!s) return "";
  if (/^(https?:|data:|blob:)/i.test(s)) return s;

  const base = String(BASE || "http://localhost:3000").replace(/\/+$/, "");
  if (s.startsWith("/")) return `${base}${s}`;
  return `${base}/${s.replace(/^\/+/, "")}`;
}

function readMemberId(r) {
  const raw =
    r?.idmember ?? r?.IdMember ?? r?.IDMEMBER ?? r?.memberId ?? r?.MemberId ?? r?.idMember ?? r?.member_id ?? null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function normalizeMemberRow(r) {
  const bankcode = (r?.Bankcode ?? r?.BankCode ?? r?.bankcode ?? r?.code ?? r?.id ?? "").toString().trim();
  const name = (r?.BanknameLA ?? r?.BankNameLA ?? r?.banknameLA ?? r?.name ?? r?.bank_name ?? "").toString().trim();
  const logoRaw = r?.image ?? r?.Image ?? r?.bankLogo ?? r?.logo ?? r?.bank_logo ?? "";
  const logo = resolveAssetUrl(logoRaw);
  const member_id = readMemberId(r);

  return { member_id, bankcode, name, logo };
}

function onAvatarLogoError() {
  memberProfile.value = { ...memberProfile.value, logo: "" };
}

async function fetchMemberProfileByBankcode(bankcode) {
  memberLoading.value = true;
  memberError.value = "";

  try {
    const code = String(bankcode ?? "").trim();
    if (!code) {
      memberProfile.value = { member_id: null, bankcode: "", name: "", logo: "" };
      return;
    }

    // ✅ use already-loaded members list first; fallback to API
    const raw = members.value?.length ? members.value : await fetchJSON(endpoints.members);
    const mapped = (raw || []).map(normalizeMemberRow).filter((m) => m.bankcode);

    const found = mapped.find((m) => String(m.bankcode) === code) || null;

    if (!found) {
      memberProfile.value = { member_id: null, bankcode: code, name: "", logo: "" };
      return;
    }

    memberProfile.value = {
      member_id: found.member_id ?? null,
      bankcode: found.bankcode,
      name: found.name,
      logo: found.logo || "",
    };
  } catch (e) {
    memberError.value = e?.message || "MemberBank load failed";
    memberProfile.value = { member_id: null, bankcode: String(bankcode ?? ""), name: "", logo: "" };
  } finally {
    memberLoading.value = false;
  }
}

// ---- Profile fetch + pick
function pickProfileUser(usersList) {
  const list = Array.isArray(usersList) ? usersList : [];
  const me = readUserFromStorage();

  const meId = me?.id ?? me?.user_id ?? me?._id ?? me?.uuid ?? null;
  const meUsername = (me?.username ?? me?.user_name ?? "").toString().trim();
  const meEmail = (me?.email ?? "").toString().trim();

  const byId =
    meId != null ? list.find((u) => String(u?.id ?? u?.user_id ?? u?._id ?? u?.uuid ?? "") === String(meId)) : null;

  const byUsername =
    !byId && meUsername
      ? list.find((u) => String(u?.username ?? u?.user_name ?? u?.name ?? "").trim() === meUsername)
      : null;

  const byEmail =
    !byId && !byUsername
      ? list.find((u) => String(u?.email ?? "").trim() && String(u?.email ?? "").trim() === meEmail)
      : null;

  return byId || byUsername || byEmail || list[0] || null;
}

function pickBankcodeFromUser(u) {
  const v = u?.bankcode ?? u?.Bankcode ?? u?.BankCode ?? u?.bank_code ?? u?.code ?? "";
  return String(v ?? "").trim();
}

function pickMemberIdFromUser(u) {
  const raw = u?.member_id ?? u?.memberId ?? u?.MemberId ?? u?.idmember ?? u?.IdMember ?? null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

async function fetchUserProfile() {
  profileLoading.value = true;
  profileError.value = "";

  try {
    const usersRaw = await fetchJSON(endpoints.users);
    const u = pickProfileUser(usersRaw);

    if (!u) {
      profile.value = { username: "-", bankcode: "", member_id: null };
      return;
    }

    const username = u?.username ?? u?.user_name ?? u?.name ?? u?.email ?? "-";
    const bankcode = pickBankcodeFromUser(u) || String(readUserFromStorage()?.bankcode ?? "").trim();
    const member_id = pickMemberIdFromUser(u) ?? pickMemberIdFromUser(readUserFromStorage() || {});

    profile.value = {
      username: String(username || "-"),
      bankcode,
      member_id,
    };

    // ✅ load MemberBank (logo + name)
    fetchMemberProfileByBankcode(bankcode);
  } catch (e) {
    profileError.value = e?.message || "Profile load failed";
  } finally {
    profileLoading.value = false;
  }
}

// ---- UI computed
const recentDocs = computed(() => documents.value.slice(0, 6));
const recentAnns = computed(() => announcements.value.slice(0, 6));
const recentForms = computed(() => forms.value.slice(0, 6));

const latestDocTitle = computed(() => recentDocs.value?.[0]?.title || recentDocs.value?.[0]?.name || "-");
const latestAnnTitle = computed(() => recentAnns.value?.[0]?.title || recentAnns.value?.[0]?.subject || "-");
const latestFormTitle = computed(() => recentForms.value?.[0]?.name || recentForms.value?.[0]?.title || "-");

const latestMemberTitle = computed(() => {
  const m = members.value?.[0];
  return (
    m?.BanknameLA ||
    m?.BankNameLA ||
    m?.banknameLA ||
    m?.name ||
    m?.bank_name ||
    m?.bankcode ||
    "-"
  );
});

const displayUsername = computed(() => (profile.value?.username ? String(profile.value.username) : "-"));
const avatarText = computed(() => {
  const u = displayUsername.value;
  if (!u || u === "-") return "U";
  return String(u).trim().charAt(0).toUpperCase() || "U";
});

// ---- Charts
function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function buildCharts() {
  if (!trendCanvas.value || !distCanvas.value) return;

  if (trendChart) trendChart.destroy();
  if (distChart) distChart.destroy();

  const months = lastNMonths(6);
  const labels = months.map((x) => x.label);

  const bucketCount = (arr) => {
    const map = new Map(months.map((m) => [`${m.y}-${m.m}`, 0]));
    for (const item of arr) {
      const { y, m } = monthKey(item._date);
      const k = `${y}-${m}`;
      if (map.has(k)) map.set(k, map.get(k) + 1);
    }
    return months.map((m) => map.get(`${m.y}-${m.m}`) || 0);
  };

  const docsSeries = bucketCount(documents.value);
  const annsSeries = bucketCount(announcements.value);
  const formsSeries = bucketCount(forms.value);
  const membersSeries = bucketCount(members.value);

  const c1 = cssVar("--blueA", "rgba(56, 189, 248, 0.9)");
  const c2 = cssVar("--blueB", "rgba(99, 102, 241, 0.9)");
  const c3 = cssVar("--blueC", "rgba(14, 165, 233, 0.85)");
  const c4 = cssVar("--greenA", "rgba(34, 197, 94, 0.88)");

  const tickColor = "rgba(255,255,255,0.72)";
  const gridColor = "rgba(255,255,255,0.08)";

  trendChart = new Chart(trendCanvas.value, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Documents",
          data: docsSeries,
          borderColor: c1,
          backgroundColor: "rgba(56,189,248,0.10)",
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 3,
        },
        {
          label: "Announcements",
          data: annsSeries,
          borderColor: c2,
          backgroundColor: "rgba(99,102,241,0.10)",
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 3,
        },
        {
          label: "Active Forms",
          data: formsSeries,
          borderColor: c3,
          backgroundColor: "rgba(14,165,233,0.10)",
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 3,
        },
        {
          label: "Members",
          data: membersSeries,
          borderColor: c4,
          backgroundColor: "rgba(34,197,94,0.10)",
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top", labels: { color: tickColor } },
        tooltip: { mode: "index", intersect: false },
      },
      interaction: { mode: "nearest", axis: "x", intersect: false },
      scales: {
        x: { ticks: { color: tickColor }, grid: { color: gridColor } },
        y: { beginAtZero: true, ticks: { precision: 0, color: tickColor }, grid: { color: gridColor } },
      },
    },
  });

  distChart = new Chart(distCanvas.value, {
    type: "doughnut",
    data: {
      labels: ["Documents", "Announcements", "Active Forms", "Members"],
      datasets: [
        {
          data: [totals.documents, totals.announcements, totals.forms, totals.members],
          backgroundColor: [c1, c2, c3, c4],
          borderColor: "rgba(255,255,255,0.10)",
          borderWidth: 1,
          cutout: "62%",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom", labels: { color: tickColor } },
      },
    },
  });
}

// ---- Animations
function revealIn() {
  const scope = document.querySelector(".ov");
  if (!scope) return;

  const els = Array.from(scope.querySelectorAll(".js-reveal"));
  gsap.set(els, { opacity: 0, y: 10 });

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  if (headEl.value) {
    tl.fromTo(headEl.value, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45 }, 0);
  }
  tl.to(els, { opacity: 1, y: 0, duration: 0.42, stagger: 0.06 }, 0.05);
}

function cardHover(e, enter) {
  gsap.to(e.currentTarget, { y: enter ? -2 : 0, duration: 0.18, ease: "power2.out" });
}
function rowHover(e, enter) {
  gsap.to(e.currentTarget, { x: enter ? 3 : 0, duration: 0.16, ease: "power2.out" });
}
function profileHover(e, enter) {
  gsap.to(e.currentTarget, { y: enter ? -2 : 0, duration: 0.18, ease: "power2.out" });
}

// ---- Actions
function go(path) {
  router.push(path);
}

async function refresh() {
  loading.value = true;
  error.value = "";
  try {
    const [docsRaw, annsRaw, formsRaw, membersRaw] = await Promise.all([
      fetchJSON(endpoints.documents),
      fetchJSON(endpoints.announcements),
      fetchJSON(endpoints.forms),
      fetchJSON(endpoints.members), // ✅ NEW
    ]);

    documents.value = normalizeList(docsRaw).sort((a, b) => b._date - a._date);
    announcements.value = normalizeList(annsRaw).sort((a, b) => b._date - a._date);
    forms.value = normalizeList(formsRaw).filter(isFormActive).sort((a, b) => b._date - a._date);
    members.value = normalizeList(membersRaw).sort((a, b) => b._date - a._date);

    totals.documents = documents.value.length;
    totals.announcements = announcements.value.length;
    totals.forms = forms.value.length;
    totals.members = members.value.length;

    last7.documents = documents.value.filter((x) => isWithinLastDays(x._date, 7)).length;
    last7.announcements = announcements.value.filter((x) => isWithinLastDays(x._date, 7)).length;
    last7.forms = forms.value.filter((x) => isWithinLastDays(x._date, 7)).length;
    last7.members = members.value.filter((x) => isWithinLastDays(x._date, 7)).length;

    // ✅ fetch profile (uses members list cache when mapping logo/name)
    fetchUserProfile();

    buildCharts();
    revealIn();
  } catch (e) {
    error.value = e?.message || String(e);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  refresh();
});

onBeforeUnmount(() => {
  if (trendChart) trendChart.destroy();
  if (distChart) distChart.destroy();
});
</script>

<style scoped>
.ov {
  padding: 14px;
}

.ovHead {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.045);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(14px);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.28);
}

.headRight {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.kicker {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.8;
}
.kDot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.9);
  box-shadow: 0 0 18px rgba(56, 189, 248, 0.55);
}
.title {
  margin: 8px 0 4px;
  font-size: 26px;
  line-height: 1.1;
  font-weight: 950;
}
.sub {
  margin: 0;
  font-size: 13px;
  opacity: 0.7;
}

/* ✅ Single Profile box */
.profileBox {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: default;
  min-width: 320px;
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-weight: 950;
  color: rgba(255, 255, 255, 0.92);
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.35), rgba(99, 102, 241, 0.25));
  border: 1px solid rgba(56, 189, 248, 0.18);
  box-shadow: 0 14px 34px rgba(56, 189, 248, 0.10);
  overflow: hidden;
}

.avatarImg {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 6px;
  background: rgba(255, 255, 255, 0.06);
}

.dotSpin {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.08);
  animation: pulse 0.9s ease-in-out infinite;
}
@keyframes pulse {
  0% {
    transform: scale(0.9);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(0.9);
    opacity: 0.6;
  }
}

.profileMeta {
  display: grid;
  gap: 6px;
  min-width: 0;
}

/* Username can still be ellipsized if super long */
.profileName {
  font-weight: 950;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.92);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 240px;
}

/* ✅ Bank info: FULL NAME (no ellipsis) */
.profileBankLine {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 12px;
  line-height: 1.25;
  opacity: 0.9;

  white-space: normal;
  overflow: visible;
  text-overflow: unset;
}

.bankStack {
  display: grid;
  gap: 2px;
}

.bankCodeRow {
  opacity: 0.9;
}

.bankNameRow {
  opacity: 0.95;
}

.bankName {
  font-weight: 950;
  white-space: normal;
  overflow: visible;
  text-overflow: unset;
  word-break: break-word;
}

.muted {
  opacity: 0.75;
  font-weight: 800;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.profileErr {
  margin-top: 2px;
  font-size: 11px;
  color: rgba(255, 140, 140, 0.9);
  opacity: 0.95;
  white-space: normal;
  word-break: break-word;
  max-width: 320px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 40px;
  padding: 0 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(56, 189, 248, 0.18);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}
.btn:hover {
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 14px 34px rgba(56, 189, 248, 0.10);
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btnIcon {
  display: inline-block;
}
.spin {
  animation: spin 0.9s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.banner {
  margin-top: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(255, 80, 80, 0.10);
  border: 1px solid rgba(255, 80, 80, 0.22);
}
.bannerTitle {
  font-weight: 900;
  margin-bottom: 4px;
}
.bannerBody {
  opacity: 0.85;
  font-size: 13px;
}

.grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 14px;
}

.card {
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(14px);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.28);
  overflow: hidden;
}
.cardHead {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 14px 10px;
}
.cardTitle {
  font-weight: 950;
  letter-spacing: 0.2px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.pill {
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.10);
  opacity: 0.9;
}

/* ✅ 4 stats per row on desktop */
.stat {
  grid-column: span 3;
  padding-bottom: 12px;
}
.chartWide {
  grid-column: span 8;
}
.chartNarrow {
  grid-column: span 4;
}
.actions {
  grid-column: span 12;
}
.list {
  grid-column: span 4;
}

.statRow {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  padding: 0 14px 12px;
}
.statValue {
  font-size: 42px;
  font-weight: 950;
  letter-spacing: -1px;
}
.statMeta {
  text-align: right;
}
.statLabel {
  font-size: 12px;
  opacity: 0.72;
}
.statSub {
  font-size: 13px;
  font-weight: 900;
  opacity: 0.9;
}

.divider {
  height: 1px;
  margin: 0 14px;
  background: rgba(255, 255, 255, 0.10);
}
.mini {
  padding: 12px 14px 8px;
}
.miniLabel {
  font-size: 12px;
  opacity: 0.72;
  margin-bottom: 6px;
}
.miniText {
  font-size: 13px;
  font-weight: 900;
  opacity: 0.95;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.miniBtn {
  margin: 0 14px 14px;
  width: calc(100% - 28px);
  display: inline-flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  font-weight: 900;
  cursor: pointer;
  border: 1px solid rgba(56, 189, 248, 0.18);
  background: rgba(56, 189, 248, 0.08);
  color: rgba(255, 255, 255, 0.9);
}
.miniBtn:hover {
  background: rgba(56, 189, 248, 0.10);
}

.chartWrap {
  height: 280px;
  padding: 0 14px 12px;
}
.chartWrap.small {
  height: 240px;
}
.hint {
  padding: 0 14px 14px;
  font-size: 12px;
  opacity: 0.7;
}

.actionGrid {
  padding: 0 14px 14px;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}
.qbtn {
  border-radius: 14px;
  padding: 12px 12px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.86);
  font-weight: 950;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.qbtn:hover {
  border-color: rgba(56, 189, 248, 0.18);
  box-shadow: 0 14px 34px rgba(56, 189, 248, 0.08);
  background: rgba(255, 255, 255, 0.05);
}

.rows {
  list-style: none;
  padding: 0 10px 12px;
  margin: 0;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 10px;
  border-radius: 12px;
  transition: background 160ms ease;
}
.row:hover {
  background: rgba(255, 255, 255, 0.05);
}
.rowTitle {
  font-weight: 950;
  font-size: 13px;
}
.rowSub {
  font-size: 12px;
  opacity: 0.68;
  margin-top: 2px;
}
.chip {
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(0, 0, 0, 0.22);
  opacity: 0.9;
  white-space: nowrap;
}
.empty {
  padding: 16px 10px;
  opacity: 0.7;
  font-size: 13px;
}

.skeletonList {
  padding: 0 14px 14px;
}
.sk {
  height: 42px;
  border-radius: 12px;
  margin-top: 10px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05),
    rgba(255, 255, 255, 0.10),
    rgba(255, 255, 255, 0.05)
  );
  background-size: 240% 100%;
  animation: shimmer 1.1s ease infinite;
}
@keyframes shimmer {
  0% {
    background-position: 0% 0;
  }
  100% {
    background-position: 120% 0;
  }
}

@media (max-width: 1100px) {
  .stat {
    grid-column: span 6;
  }
  .chartWide {
    grid-column: span 12;
  }
  .chartNarrow {
    grid-column: span 12;
  }
  .list {
    grid-column: span 6;
  }
  .actionGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .profileBox {
    min-width: 280px;
  }
  .profileName {
    max-width: 200px;
  }
}

@media (max-width: 720px) {
  .ovHead {
    flex-direction: column;
    align-items: flex-start;
  }
  .headRight {
    width: 100%;
    justify-content: space-between;
  }

  .stat,
  .list {
    grid-column: span 12;
  }
  .actionGrid {
    grid-template-columns: 1fr;
  }

  .profileBox {
    width: 100%;
    min-width: 0;
  }
  .profileName {
    max-width: 260px;
  }
}
</style>
