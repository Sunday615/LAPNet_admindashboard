<template>
  <section class="chatMb">
    <!-- header -->
    <header ref="headEl" class="head js-reveal">
      <div class="headLeft">
        <div class="kicker">
          <span class="kDot"></span>
          Admin • MemberBank Chat
        </div>
        <h1 class="title">MemberBank Inbox</h1>
        <p class="sub">
          1:1 chat between admin and each member bank • show iAccount • total 23 banks
        </p>
      </div>

      <div class="headRight">
        <div class="pill">
          <i class="fa-solid fa-building-columns"></i>
          <span class="mono">{{ banks.length }}</span>
          <span class="muted">/ 23 banks</span>
        </div>

        <button class="btn ghost" type="button" @click="reloadAll" :disabled="loading">
          <i class="fa-solid fa-rotate"></i>
          Refresh
        </button>
      </div>
    </header>

    <div class="grid">
      <!-- LEFT: memberbank list -->
      <aside ref="leftEl" class="panel js-reveal">
        <div class="panelTop">
          <div class="panelTitle">
            <i class="fa-solid fa-users"></i>
            Member banks
          </div>

          <div class="search">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input
              v-model.trim="q"
              class="input"
              type="search"
              placeholder="Search bank name / code / iAccount..."
            />
            <button v-if="q" class="clear" type="button" @click="q = ''" title="Clear">✕</button>
          </div>

          <div v-if="banks.length && banks.length !== 23" class="warn">
            <i class="fa-solid fa-circle-info"></i>
            Loaded {{ banks.length }} banks (expected 23). Check /api/members data.
          </div>
        </div>

        <div class="list" role="listbox" aria-label="Member banks list">
          <button
            v-for="b in filteredBanks"
            :key="b._key"
            class="bankItem"
            :class="{ active: activeBank?.bankcode === b.bankcode }"
            type="button"
            @click="selectBank(b)"
          >
            <div class="avatar" aria-hidden="true">
              <img v-if="b.logo" :src="b.logo" alt="" />
              <span v-else>{{ initials(b.name || b.bankcode || "BK") }}</span>
            </div>

            <div class="bankMeta">
              <div class="bankTop">
                <div class="bankName">{{ b.name }}</div>
                <span class="code mono">{{ b.bankcode }}</span>
              </div>

              <div class="bankSub">
                <span class="muted">iAccount:</span>
                <span class="mono">{{ b.iaccount || "-" }}</span>
              </div>
            </div>

            <i class="fa-solid fa-chevron-right chev" aria-hidden="true"></i>
          </button>

          <div v-if="!loading && filteredBanks.length === 0" class="empty">
            No member banks found
          </div>

          <div v-if="banksError" class="err">
            <i class="fa-solid fa-triangle-exclamation"></i>
            {{ banksError }}
          </div>
        </div>
      </aside>

      <!-- RIGHT: chat room -->
      <section ref="rightEl" class="chatPanel js-reveal">
        <!-- chat header -->
        <div class="chatTop">
          <div class="chatTitle">
            <template v-if="activeBank">
              <div class="chatName">
                <i class="fa-solid fa-comments"></i>
                {{ activeBank.name }}
              </div>

              <div class="chatMeta">
                <span class="mono">{{ activeBank.bankcode }}</span>
                <span class="dot">•</span>
                <span class="muted">iAccount:</span>
                <span class="mono">{{ activeBank.iaccount || "-" }}</span>
              </div>
            </template>

            <template v-else>
              <div class="chatName">
                <i class="fa-solid fa-comments"></i>
                Select a member bank
              </div>
              <div class="chatMeta muted">Pick a bank from the left panel</div>
            </template>
          </div>

          <div class="chatTools">
            <button
              class="btn ghost"
              type="button"
              @click="reloadMessages"
              :disabled="!activeBank || msgLoading"
              title="Reload messages"
            >
              <i class="fa-solid fa-rotate"></i>
            </button>

            <button
              class="btn ghost"
              type="button"
              @click="scrollToBottom(true)"
              :disabled="!activeBank"
              title="Scroll to bottom"
            >
              <i class="fa-solid fa-arrow-down"></i>
            </button>
          </div>
        </div>

        <!-- messages -->
        <div ref="msgWrapEl" class="messages" @scroll="onScroll">
          <div v-if="activeBank && msgLoading" class="msgLoading">
            <div class="loaderDot"></div>
            <div class="loaderDot"></div>
            <div class="loaderDot"></div>
          </div>

          <div v-else-if="activeBank && msgError" class="err big">
            <i class="fa-solid fa-triangle-exclamation"></i>
            {{ msgError }}
          </div>

          <div v-else-if="activeBank && messages.length === 0" class="empty big">
            No messages yet. Start the conversation 👋
          </div>

          <div v-else class="msgList">
            <div
              v-for="m in messages"
              :key="m._key"
              class="msgRow"
              :class="{ me: m.isMe }"
            >
              <div class="bubble">
                <div class="bubbleTop">
                  <span class="sender">{{ m.sender }}</span>
                  <span class="time">{{ m.when }}</span>
                </div>
                <div class="text" v-html="m.html"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- composer -->
        <div class="composer">
          <textarea
            v-model="draft"
            class="textarea"
            rows="1"
            placeholder="Type a message..."
            :disabled="!activeBank || sending"
            @keydown.enter.exact.prevent="send"
            @keydown.enter.shift.exact.stop
            @input="autoGrow"
          ></textarea>

          <button class="btn" type="button" @click="send" :disabled="!canSend">
            <i class="fa-solid fa-paper-plane"></i>
            Send
          </button>
        </div>

        <div class="hint">
          <i class="fa-regular fa-lightbulb"></i>
          Enter = send • Shift+Enter = newline
        </div>
      </section>
    </div>

    <!-- toast -->
    <transition name="toast">
      <div v-if="toast.show" class="toast">
        <div class="toastLeft">
          <div class="toastTitle">
            <i :class="toast.icon"></i>
            {{ toast.title }}
          </div>
          <div class="toastSub">{{ toast.text }}</div>
        </div>
        <button class="toastBtn ghost" type="button" @click="toast.show = false" aria-label="Dismiss">✕</button>
      </div>
    </transition>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import gsap from "gsap";

/* =========================================================
   Config
   ========================================================= */
const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const MEMBERS_API = `${BASE}/api/members`;

// ✅ adjust to your real backend if needed
const CHAT_MESSAGES_API = import.meta.env.VITE_CHAT_MESSAGES_API || `${BASE}/api/chat/messages`;

/* =========================================================
   Helpers
   ========================================================= */
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
function normalizeRole(r) {
  return String(r || "").trim().toLowerCase();
}
function readToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token") || "";
}
function authHeaders() {
  const token = readToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
function wrapList(data) {
  return Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
}
function keyOf(x, i) {
  return x?.id || x?._id || x?.uuid || x?.key || `${i}-${Math.random().toString(16).slice(2)}`;
}
function initials(name) {
  const s = String(name || "").trim();
  if (!s) return "BK";
  const parts = s.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "BK";
}
function stripHtml(s) {
  return String(s || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function fmtWhen(ts) {
  const d = new Date(ts);
  const t = d.getTime();
  if (!Number.isFinite(t)) return "";
  return d.toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}
function toTime(x) {
  const d = new Date(x);
  const t = d.getTime();
  return Number.isFinite(t) ? t : 0;
}

/* =========================================================
   State
   ========================================================= */
const headEl = ref(null);
const leftEl = ref(null);
const rightEl = ref(null);

const me = ref(readUserFromStorage());
const myRole = computed(() => normalizeRole(me.value?.role) || "admin");

const loading = ref(false);
const banksError = ref("");
const banks = ref([]);
const q = ref("");
const activeBank = ref(null);

const msgWrapEl = ref(null);
const msgLoading = ref(false);
const msgError = ref("");
const messages = ref([]);
const draft = ref("");
const sending = ref(false);

const toast = ref({ show: false, title: "", text: "", icon: "fa-solid fa-circle-check" });
let toastTimer = null;

let pollTimer = null;
let pollAbort = null;
const isNearBottom = ref(true);

/* =========================================================
   Derived
   ========================================================= */
const filteredBanks = computed(() => {
  const s = q.value.toLowerCase().trim();
  const list = banks.value || [];
  if (!s) return list;
  return list.filter((b) => {
    const hay = `${b.name} ${b.bankcode} ${b.iaccount}`.toLowerCase();
    return hay.includes(s);
  });
});

const canSend = computed(() => !!activeBank.value && !sending.value && draft.value.trim().length > 0);

/* =========================================================
   Normalize bank + message
   ========================================================= */
function normalizeBank(item, i) {
  const id = item?.id ?? item?._id ?? item?.member_id ?? item?.uuid ?? item?.bank_id ?? null;

  const bankcode = String(item?.bankcode ?? item?.bank_code ?? item?.code ?? item?.member_code ?? "").trim();

  const name =
    String(item?.name ?? item?.bankname ?? item?.bank_name ?? item?.title ?? "").trim() ||
    bankcode ||
    "Member bank";

  // ✅ iAccount mapping (รองรับหลายชื่อ field)
  const iaccount = String(
    item?.iaccount ??
      item?.i_account ??
      item?.iAccount ??
      item?.account ??
      item?.account_no ??
      item?.account_number ??
      ""
  ).trim();

  const logo = item?.logo_url ?? item?.logo ?? item?.image ?? item?.avatar ?? "";

  return {
    _key: keyOf(item, i),
    id,
    bankcode,
    name,
    iaccount,
    logo,
    raw: item,
  };
}

function normalizeMessage(item, i) {
  const text = item?.text ?? item?.message ?? item?.content ?? item?.body ?? "";
  const created = item?.created_at ?? item?.createdAt ?? item?.date ?? item?.time ?? Date.now();

  const senderRole = normalizeRole(item?.sender_role ?? item?.role ?? item?.from_role ?? "");
 const senderName = String(
  (item?.sender_name ?? item?.sender ?? item?.from_name ?? senderRole) || "User"
).trim();


  // best-effort decide "me"
  const myId = String(me.value?.id ?? me.value?.user_id ?? me.value?._id ?? "").trim();
  const senderId = String(item?.sender_id ?? item?.user_id ?? item?.from_id ?? "").trim();
  const isMe = (myId && senderId && myId === senderId) || (!!senderRole && senderRole === myRole.value);

  return {
    _key: keyOf(item, i),
    id: item?.id ?? item?._id ?? null,
    isMe,
    sender: senderName || (isMe ? "Admin" : "MemberBank"),
    when: fmtWhen(created),
    html: escapeHtml(stripHtml(text)).replaceAll("\n", "<br/>"),
    createdAt: toTime(created),
  };
}

/* =========================================================
   API
   ========================================================= */
async function fetchBanks() {
  loading.value = true;
  banksError.value = "";
  try {
    const res = await fetch(MEMBERS_API, { headers: { ...authHeaders() } });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const list = wrapList(await res.json());

    // sort by bankcode (nice for 23 banks)
    banks.value = list.map((x, i) => normalizeBank(x, i)).sort((a, b) => String(a.bankcode).localeCompare(String(b.bankcode)));

    // auto select first
    if (!activeBank.value && banks.value.length) {
      activeBank.value = banks.value[0];
      await loadMessagesForActive();
    }
  } catch (e) {
    banksError.value = e?.message || "Failed to load member banks";
  } finally {
    loading.value = false;
  }
}

async function fetchMessages(bank) {
  if (!bank) return [];

  msgLoading.value = true;
  msgError.value = "";
  try {
    const url = new URL(CHAT_MESSAGES_API);
    if (bank.bankcode) url.searchParams.set("bankcode", bank.bankcode);
    if (bank.id != null) url.searchParams.set("member_id", String(bank.id));

    if (pollAbort) pollAbort.abort();
    pollAbort = new AbortController();

    const res = await fetch(url.toString(), { signal: pollAbort.signal, headers: { ...authHeaders() } });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

    const list = wrapList(await res.json());
    return list.map((x, i) => normalizeMessage(x, i)).sort((a, b) => a.createdAt - b.createdAt);
  } catch (e) {
    if (e?.name === "AbortError") return messages.value;
    msgError.value = e?.message || "Failed to load messages";
    return [];
  } finally {
    msgLoading.value = false;
  }
}

async function postMessage(bank, text) {
  const payload = {
    bankcode: bank?.bankcode || "",
    member_id: bank?.id ?? null,
    text,
  };

  const res = await fetch(CHAT_MESSAGES_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return await res.json();
}

/* =========================================================
   UI actions
   ========================================================= */
async function reloadAll() {
  await fetchBanks();
  if (activeBank.value) await loadMessagesForActive();
}

async function selectBank(b) {
  if (!b) return;
  if (activeBank.value?.bankcode === b.bankcode) return;
  activeBank.value = b;
  await loadMessagesForActive();
}

async function loadMessagesForActive() {
  stopPolling();
  if (!activeBank.value) {
    messages.value = [];
    return;
  }

  messages.value = await fetchMessages(activeBank.value);
  await nextTick();
  scrollToBottom(true);
  startPolling();
}

async function reloadMessages() {
  if (!activeBank.value) return;
  messages.value = await fetchMessages(activeBank.value);
  await nextTick();
  if (isNearBottom.value) scrollToBottom(true);
}

function autoGrow(e) {
  const el = e?.target;
  if (!el) return;
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 140) + "px";
}

function showToast(title, text, icon = "fa-solid fa-circle-check") {
  toast.value = { show: true, title, text, icon };
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.value.show = false), 4200);
}

async function send() {
  if (!canSend.value) return;
  const text = draft.value.trim();
  const bank = activeBank.value;

  // optimistic
  const optimistic = {
    _key: `optimistic-${Date.now()}`,
    id: null,
    isMe: true,
    sender: "Admin",
    when: fmtWhen(Date.now()),
    html: escapeHtml(text).replaceAll("\n", "<br/>"),
    createdAt: Date.now(),
  };

  sending.value = true;
  draft.value = "";
  messages.value = [...messages.value, optimistic];

  await nextTick();
  scrollToBottom(true);

  try {
    await postMessage(bank, text);
    messages.value = await fetchMessages(bank);
    await nextTick();
    scrollToBottom(true);
  } catch (e) {
    showToast("Send failed", e?.message || "Network error", "fa-solid fa-circle-xmark");
  } finally {
    sending.value = false;
  }
}

/* =========================================================
   Scroll / polling
   ========================================================= */
function onScroll() {
  const el = msgWrapEl.value;
  if (!el) return;
  const gap = el.scrollHeight - (el.scrollTop + el.clientHeight);
  isNearBottom.value = gap < 220;
}

function scrollToBottom(smooth = false) {
  const el = msgWrapEl.value;
  if (!el) return;
  el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
}

function startPolling() {
  stopPolling();
  if (!activeBank.value) return;

  pollTimer = setInterval(async () => {
    if (!activeBank.value) return;
    const next = await fetchMessages(activeBank.value);

    const shouldStick = isNearBottom.value;
    messages.value = next;

    if (shouldStick) {
      await nextTick();
      scrollToBottom(false);
    }
  }, 4500);
}

function stopPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
  if (pollAbort) pollAbort.abort();
  pollAbort = null;
}

/* =========================================================
   Animations
   ========================================================= */
function animateIn() {
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  gsap.set(".js-reveal", { opacity: 0, y: 12 });
  tl.to(".js-reveal", { opacity: 1, y: 0, stagger: 0.06, duration: 0.45 }, 0.05);
}

watch(
  () => (localStorage.getItem("user") || sessionStorage.getItem("user")),
  () => (me.value = readUserFromStorage())
);

onMounted(async () => {
  animateIn();
  await fetchBanks();
});

onBeforeUnmount(() => {
  stopPolling();
  if (toastTimer) clearTimeout(toastTimer);
});
</script>

<style scoped>
/* page layout (เข้ากับ theme tech ของคุณ) */
.chatMb {
  min-height: calc(100vh - 36px);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.22);
}

.kicker {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.66);
}
.kDot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.85);
  box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.12);
}
.title {
  margin: 6px 0 0;
  font-size: 22px;
  font-weight: 950;
  letter-spacing: 0.2px;
}
.sub {
  margin: 6px 0 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.62);
}

.headRight {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.pill {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.10);
  color: rgba(255, 255, 255, 0.86);
  font-weight: 900;
  font-size: 12px;
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-weight: 900;
}
.muted { opacity: 0.72; }
.dot { opacity: 0.6; }

.btn {
  padding: 10px 12px;
  border-radius: 14px;
  font-weight: 950;
  cursor: pointer;
  border: 1px solid rgba(56, 189, 248, 0.22);
  background: rgba(56, 189, 248, 0.12);
  color: rgba(255, 255, 255, 0.92);
  display: inline-flex;
  gap: 10px;
  align-items: center;
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
}
.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: rgba(56, 189, 248, 0.28);
  box-shadow: 0 14px 34px rgba(56, 189, 248, 0.10);
}
.btn:disabled { opacity: 0.55; cursor: not-allowed; }
.btn.ghost {
  border-color: rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.84);
}

.grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 12px;
}

.panel,
.chatPanel {
  min-height: 0;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(12px);
  overflow: hidden;
}

.panelTop {
  padding: 12px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: grid;
  gap: 10px;
}
.panelTitle {
  font-weight: 950;
  display: inline-flex;
  gap: 10px;
  align-items: center;
  color: rgba(255, 255, 255, 0.92);
}

.search {
  position: relative;
  display: flex;
  align-items: center;
}
.search i {
  position: absolute;
  left: 12px;
  opacity: 0.7;
}
.input {
  width: 100%;
  padding: 10px 36px 10px 36px;
  border-radius: 14px;
  outline: none;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.10);
  color: rgba(255, 255, 255, 0.9);
  font-weight: 700;
}
.input:focus {
  border-color: rgba(56, 189, 248, 0.24);
  box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.08);
}
.clear {
  position: absolute;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
}

.warn {
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(56, 189, 248, 0.18);
  background: rgba(56, 189, 248, 0.08);
  color: rgba(255, 255, 255, 0.86);
  font-size: 12px;
  font-weight: 800;
  display: inline-flex;
  gap: 10px;
  align-items: center;
}

.list {
  padding: 10px 10px 12px;
  overflow: auto;
  min-height: 0;
  height: calc(100% - 120px);
}
.list::-webkit-scrollbar { width: 10px; }
.list::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.08); border-radius: 999px; }

.bankItem {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 10px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  color: rgba(255, 255, 255, 0.82);
  cursor: pointer;
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, background 160ms ease;
  margin-bottom: 10px;
}
.bankItem:hover {
  transform: translateY(-1px);
  border-color: rgba(56, 189, 248, 0.18);
  box-shadow: 0 14px 34px rgba(56, 189, 248, 0.08);
  background: rgba(255, 255, 255, 0.03);
}
.bankItem.active {
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.16), rgba(99, 102, 241, 0.10));
  border-color: rgba(56, 189, 248, 0.22);
  box-shadow: 0 18px 40px rgba(56, 189, 248, 0.10);
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: grid;
  place-items: center;
  font-weight: 950;
  overflow: hidden;
}
.avatar img { width: 100%; height: 100%; object-fit: cover; }

.bankMeta { flex: 1; min-width: 0; }
.bankTop {
  display: flex;
  align-items: center;
  gap: 10px;
}
.bankName {
  font-weight: 950;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.code {
  margin-left: auto;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.04);
  opacity: 0.92;
}
.bankSub {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.62);
  display: inline-flex;
  gap: 8px;
  align-items: center;
  white-space: nowrap;
}
.chev { opacity: 0.55; }

.chatTop {
  padding: 12px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.chatName {
  font-weight: 950;
  display: inline-flex;
  gap: 10px;
  align-items: center;
}
.chatMeta {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.62);
  display: inline-flex;
  gap: 8px;
  align-items: center;
}
.chatTools { display: inline-flex; gap: 8px; align-items: center; }

.messages {
  min-height: 0;
  height: calc(100% - 132px);
  overflow: auto;
  padding: 14px 14px 10px;
}
.messages::-webkit-scrollbar { width: 10px; }
.messages::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.08); border-radius: 999px; }

.msgList { display: grid; gap: 10px; }

.msgRow { display: flex; justify-content: flex-start; }
.msgRow.me { justify-content: flex-end; }

.bubble {
  max-width: min(620px, 92%);
  border-radius: 16px;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.03);
}
.msgRow.me .bubble {
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.18), rgba(99, 102, 241, 0.10));
  border-color: rgba(56, 189, 248, 0.22);
}
.bubbleTop {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
  margin-bottom: 6px;
  opacity: 0.78;
}
.sender { font-weight: 950; }
.time { opacity: 0.7; }
.text {
  font-size: 13px;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.88);
  word-break: break-word;
}

.composer {
  padding: 10px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  gap: 10px;
  align-items: flex-end;
}
.textarea {
  flex: 1;
  resize: none;
  padding: 10px 12px;
  border-radius: 14px;
  outline: none;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.10);
  color: rgba(255, 255, 255, 0.9);
  font-weight: 700;
  min-height: 42px;
  max-height: 140px;
  overflow: auto;
}
.textarea:focus {
  border-color: rgba(56, 189, 248, 0.24);
  box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.08);
}

.hint {
  padding: 10px 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.62);
  display: inline-flex;
  gap: 10px;
  align-items: center;
}

/* states */
.empty,
.err {
  margin: 10px 0 0;
  padding: 12px 12px;
  border-radius: 14px;
  border: 1px dashed rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.70);
  text-align: center;
}
.empty.big,
.err.big { margin: 0; }
.err {
  border-style: solid;
  border-color: rgba(255, 80, 80, 0.22);
  background: rgba(255, 80, 80, 0.08);
  color: rgba(255, 255, 255, 0.88);
}

/* loader */
.msgLoading {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  padding: 18px 0;
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
.loaderDot:nth-child(2) { animation-delay: 0.12s; }
.loaderDot:nth-child(3) { animation-delay: 0.24s; }
@keyframes ld {
  0% { transform: translateY(0); opacity: 0.55; }
  50% { transform: translateY(-5px); opacity: 1; }
  100% { transform: translateY(0); opacity: 0.55; }
}

/* toast */
.toast {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 12px;
  border-radius: 16px;
  background: rgba(8, 12, 28, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.10);
  backdrop-filter: blur(14px);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.38);
  max-width: min(460px, 92vw);
}
.toastLeft { display: grid; gap: 4px; min-width: 0; }
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
.toastBtn {
  padding: 9px 10px;
  border-radius: 12px;
  font-weight: 900;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.80);
}
.toast-enter-active,
.toast-leave-active { transition: transform 180ms ease, opacity 180ms ease; }
.toast-enter-from,
.toast-leave-to { opacity: 0; transform: translateY(10px); }

/* responsive */
@media (max-width: 1100px) {
  .grid { grid-template-columns: 1fr; }
  .panel { height: 360px; }
}
</style>
