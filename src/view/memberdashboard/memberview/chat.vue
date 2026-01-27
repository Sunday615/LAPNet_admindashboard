<template>
  <section ref="rootEl" class="mbChat">
    <!-- header -->
    <header class="mbHead js-reveal">
      <div class="mbHeadLeft">
        <div class="kicker">
          <span class="kDot"></span>
          MemberBank • Admin Chat
        </div>

        <h1 class="title">Support Chat</h1>

        <p class="sub">
          Logged in as:
          <b class="mono">{{ userLabel }}</b>
          <span class="dotSep">•</span>
          bankcode:
          <b class="mono">{{ member.bankcode || "—" }}</b>
        </p>
      </div>

      <div class="mbHeadRight">
        <button class="btn ghost" type="button" @click="reloadAll" :disabled="loadingInit || msgLoading">
          <span class="btnIcon" :class="{ spin: loadingInit || msgLoading }">⟲</span>
          Reload
        </button>
      </div>
    </header>

    <!-- state: loading user -->
    <div v-if="loadingInit && !conversationId" class="state js-reveal">
      <div class="spinner"></div>
      Loading your account…
    </div>

    <!-- state: missing bankcode -->
    <div v-else-if="!member.bankcode" class="state err js-reveal">
      <i class="fa-solid fa-triangle-exclamation"></i>
      <div class="text">
        Cannot detect bankcode from logged-in user.
        <div class="muted" style="margin-top: 6px">
          Please check your <span class="mono">/api/users</span> (me/profile) response has bankcode/iAccount.
        </div>
      </div>
      <button class="btn tiny" type="button" @click="reloadAll">Try again</button>
    </div>

    <!-- chat panel -->
    <div v-else class="panel js-reveal">
      <!-- chat header -->
      <div class="chatHead">
        <div class="who">
          <div class="avatar" aria-hidden="true">
            <img v-if="member.logo" :src="member.logo" alt="" @error="onImgError($event)" />
            <span v-else>{{ (member.name || "M").slice(0, 1).toUpperCase() }}</span>
          </div>

          <div class="whoText">
            <div class="whoName">
              {{ member.name || "MemberBank" }}
              <span class="mono whoId">({{ member.bankcode }})</span>
            </div>

            <div class="whoSub">
              <span class="dot"></span>
              <span class="muted">Direct chat with Admin</span>
              <span class="dotSep">•</span>
              <span class="muted">
                {{
                  msgLoading
                    ? "Loading…"
                    : messages.length
                      ? `${messages.length} messages`
                      : "No messages yet"
                }}
              </span>
            </div>
          </div>
        </div>

        <div class="chatActions">
          <button class="btn ghost" type="button" @click="reloadMessages" :disabled="msgLoading || loadingInit">
            <span class="btnIcon" :class="{ spin: msgLoading }">⟲</span>
            Refresh
          </button>
        </div>
      </div>

      <!-- messages -->
      <div ref="msgWrapEl" class="msgWrap">
        <div v-if="msgLoading" class="state">
          <div class="spinner"></div>
          Loading messages...
        </div>

        <div v-else-if="msgError" class="state err">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span class="text">{{ msgError }}</span>
          <button class="btn tiny" type="button" @click="reloadAll">Try again</button>
        </div>

        <div v-else class="msgs">
          <div v-if="!messages.length" class="state">
            <i class="fa-regular fa-comment-dots"></i>
            Start the conversation…
          </div>

          <div v-for="m in messages" :key="m._key" class="row" :class="{ me: isMe(m), other: !isMe(m) }">
            <div class="bubble" :class="{ pending: m._pending }">
              <div class="body" v-html="escapeToHtml(m.body || '')" />
              <div class="meta">
                <span class="time mono">{{ formatTime(m.created_at) }}</span>
                <span v-if="m._pending" class="pend mono">sending…</span>
                <span v-else-if="m.edited_at" class="edit mono">edited</span>
              </div>
            </div>
          </div>

          <div ref="bottomEl" class="bottom" />
        </div>
      </div>

      <!-- composer -->
      <form class="composer" @submit.prevent="sendMessage">
        <div class="inputWrap">
          <textarea
            ref="textareaEl"
            v-model="draft"
            class="input"
            rows="1"
            placeholder="Type a message…"
            @input="autosize()"
            @keydown.enter.exact.prevent="sendMessage"
            @keydown.enter.shift.exact.stop
          />
        </div>

        <button class="btn" type="submit" :disabled="sending || !draft.trim() || loadingInit">
          <i class="fa-solid fa-paper-plane"></i>
          Send
        </button>
      </form>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import gsap from "gsap";

/** =======================
 *  API CONFIG
 *  ======================= */
const RAW_BASE = (import.meta?.env?.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const API_ROOT = /\/api$/i.test(RAW_BASE) ? RAW_BASE : `${RAW_BASE}/api`;
const API_ORIGIN = /\/api$/i.test(RAW_BASE) ? RAW_BASE.replace(/\/api$/i, "") : RAW_BASE;

const USERS_API = (import.meta?.env?.VITE_USERS_API || `${API_ROOT}/users`).replace(/\/$/, "");
const MEMBERS_API = (import.meta?.env?.VITE_MEMBERS_API || `${API_ROOT}/members`).replace(/\/$/, "");
const CHAT_API = (import.meta?.env?.VITE_CHAT_API || `${API_ROOT}/chat`).replace(/\/$/, "");
const FETCH_CREDENTIALS = (import.meta?.env?.VITE_FETCH_CREDENTIALS || "omit").toLowerCase();

/** =======================
 *  STATE
 *  ======================= */
const rootEl = ref(null);
const msgWrapEl = ref(null);
const bottomEl = ref(null);
const textareaEl = ref(null);

const loadingInit = ref(false);

const user = ref(null);
const member = ref({
  bankcode: "",
  name: "",
  logo: "",
});

const conversationId = ref(null);

const messages = ref([]);
const msgLoading = ref(false);
const msgError = ref("");

const draft = ref("");
const sending = ref(false);

let revealTween = null;
let pollTimer = null;

/** =======================
 *  HELPERS
 *  ======================= */
function pickArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.members)) return data.members;
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data?.rows)) return data.rows;
  return [];
}

function canonCode(v) {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function stripLeadingZeros(s) {
  const t = String(s ?? "");
  if (/^\d+$/.test(t)) return t.replace(/^0+/, "") || "0";
  return t;
}

function padLeftZeros(s, len) {
  const t = String(s ?? "");
  if (!/^\d+$/.test(t)) return t;
  return t.padStart(len, "0");
}

function buildCodeKeys(...vals) {
  const out = new Set();
  for (const v of vals) {
    const raw = String(v ?? "").trim();
    if (!raw) continue;

    const c = canonCode(raw);
    if (!c) continue;

    out.add(raw);
    out.add(raw.toLowerCase());
    out.add(c);

    const no0 = stripLeadingZeros(c);
    if (no0) out.add(no0);

    for (const L of [3, 4, 5, 6, 8, 10]) {
      out.add(padLeftZeros(no0, L));
      out.add(padLeftZeros(c, L));
    }
  }
  return out;
}

function resolveLogoUrl(raw) {
  const v =
    raw?.logo ||
    raw?.logo_url ||
    raw?.logoUrl ||
    raw?.logo_path ||
    raw?.logoPath ||
    raw?.logo_file ||
    raw?.logoFile ||
    raw?.logo_filename ||
    raw?.logoFilename ||
    raw?.logoFileName ||
    raw?.avatar ||
    raw?.avatar_url ||
    raw?.avatarUrl ||
    raw?.image ||
    raw?.image_url ||
    raw?.imageUrl ||
    raw?.image_path ||
    raw?.imagePath ||
    raw?.photo ||
    raw?.photo_url ||
    raw?.photoUrl ||
    raw?.profile_image ||
    raw?.profileImage ||
    raw?.profile_path ||
    raw?.profilePath ||
    "";

  const s = String(v || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/")) return `${API_ORIGIN}${s}`;
  return `${API_ORIGIN}/${s.replace(/^\.?\//, "")}`;
}

function escapeToHtml(s) {
  const safe = String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
  return safe.replaceAll("\n", "<br>");
}

function formatTime(d) {
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "";
    return dt.toLocaleString(undefined, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function onImgError(e) {
  const img = e?.target;
  if (img) img.style.display = "none";
}

function getToken() {
  try {
    return localStorage.getItem("token") || sessionStorage.getItem("token") || "";
  } catch {
    return "";
  }
}

function parseJwtPayload(token) {
  try {
    const parts = String(token || "").split(".");
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = "=".repeat((4 - (b64.length % 4)) % 4);
    const json = atob(b64 + pad);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getDeep(obj, path) {
  try {
    return path.split(".").reduce((acc, k) => acc?.[k], obj);
  } catch {
    return undefined;
  }
}

function extractBankcode(u) {
  const paths = [
    "bankcode",
    "bank_code",
    "bankCode",
    "iaccount",
    "iAccount",
    "i_account",
    "account_code",
    "accountCode",
    "code",

    "data.bankcode",
    "data.bank_code",
    "data.bankCode",
    "data.iaccount",
    "data.iAccount",
    "data.i_account",

    "profile.bankcode",
    "profile.bank_code",
    "profile.bankCode",
    "profile.iaccount",
    "profile.iAccount",

    "member.bankcode",
    "member.bank_code",
    "member.bankCode",
    "member.iaccount",
    "member.iAccount",

    "memberbank.bankcode",
    "memberbank.bank_code",
    "memberbank.bankCode",
    "memberbank.iaccount",
    "memberbank.iAccount",

    "bank.bankcode",
    "bank.bank_code",
    "bank.bankCode",
    "bank.code",
    "bank.iaccount",
    "bank.iAccount",

    "account.bankcode",
    "account.bank_code",
    "account.bankCode",
    "account.iaccount",
    "account.iAccount",
  ];

  for (const p of paths) {
    const v = getDeep(u, p);
    const s = String(v ?? "").trim();
    if (s) return s;
  }
  return "";
}

function extractBankcodeFromToken() {
  const payload = parseJwtPayload(getToken());
  if (!payload) return "";

  const candidates = [
    payload.bankcode,
    payload.bank_code,
    payload.bankCode,
    payload.iaccount,
    payload.iAccount,
    payload.i_account,
    payload.code,
    payload.account_code,
    payload.accountCode,

    payload?.user?.bankcode,
    payload?.user?.bank_code,
    payload?.user?.bankCode,
    payload?.user?.iaccount,
    payload?.user?.iAccount,

    payload?.profile?.bankcode,
    payload?.profile?.bank_code,
    payload?.profile?.iaccount,
    payload?.profile?.iAccount,
  ];

  for (const v of candidates) {
    const s = String(v ?? "").trim();
    if (s) return s;
  }
  return "";
}

function extractUserIdFromToken() {
  const payload = parseJwtPayload(getToken());
  if (!payload) return "";
  const candidates = [payload.id, payload.user_id, payload.userId, payload.uid, payload.sub];
  for (const v of candidates) {
    const s = String(v ?? "").trim();
    if (s) return s;
  }
  return "";
}

function extractUserLabel(u) {
  const v = u?.username ?? u?.user_name ?? u?.email ?? u?.name ?? u?.display_name ?? u?.displayName ?? u?.id ?? "User";
  return String(v || "User").trim();
}

async function fetchJSON(url, options = {}) {
  const token = getToken();

  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers,
      credentials: FETCH_CREDENTIALS === "include" ? "include" : "omit",
    });
  } catch (e) {
    console.error("[fetchJSON network error]", url, e);
    throw new Error("Network error: ติดต่อ API ไม่ได้ (เช็คว่า backend รันอยู่ไหม / CORS)");
  }

  const raw = await res.text();
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }

  if (!res.ok) {
    console.error("[fetchJSON fail]", { url, status: res.status, data });
    const msg = (data && (data.message || data.error)) || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

/** =======================
 *  LOAD CURRENT USER
 *  ======================= */
async function apiGetCurrentUser() {
  const candidates = [
    `${USERS_API}/me`,
    `${USERS_API}/profile`,
    `${USERS_API}/current`,
    USERS_API,
    `${API_ROOT}/auth/me`,
    `${API_ROOT}/me`,
  ];

  const tokenUid = extractUserIdFromToken();
  let lastErr = null;

  for (const url of candidates) {
    try {
      const data = await fetchJSON(url, { headers: { "x-role": "member" } });
      let maybe = data?.user ?? data?.data ?? data?.result ?? data;

      if (Array.isArray(maybe)) {
        const arr = maybe;

        if (tokenUid) {
          const hit =
            arr.find((x) => String(x?.id ?? "").trim() === tokenUid) ||
            arr.find((x) => String(x?.user_id ?? "").trim() === tokenUid) ||
            arr.find((x) => String(x?._id ?? "").trim() === tokenUid) ||
            arr.find((x) => String(x?.uid ?? "").trim() === tokenUid);
          if (hit && typeof hit === "object") return hit;
        }

        if (arr.length === 1) return arr[0];

        const picked =
          arr.find((x) => x?.is_me || x?.isMe || x?.current || x?.me) ||
          arr.find((x) => x?.role === "member" || x?.sender_role === "member") ||
          arr[0];

        if (picked && typeof picked === "object") return picked;
        continue;
      }

      if (maybe && typeof maybe === "object") return maybe;
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr || new Error("Cannot load current user from users endpoint");
}

/** =======================
 *  RESOLVE MEMBER BY BANKCODE (robust mapping)
 *  ======================= */
function memberCodeCandidates(m) {
  return [
    // codes
    m?.bankcode,
    m?.bank_code,
    m?.bankCode,
    m?.iaccount,
    m?.iAccount,
    m?.i_account,
    m?.code,
    m?.account_code,
    m?.accountCode,
    m?.member_code,
    m?.memberCode,
    m?.id,
    m?.member_id,
    m?.memberId,

    // names/abbr (ช่วยกรณี user code เป็น BCEL แต่ members เก็บเป็นชื่อ/ย่อ)
    m?.abbr,
    m?.abbreviation,
    m?.short_name,
    m?.shortName,
    m?.bank_short,
    m?.bankShort,
    m?.bank_name,
    m?.bankName,
    m?.name,
    m?.display_name,
    m?.displayName,
    m?.title,
  ];
}

function extractMemberName(found) {
  return String(
    found?.name ??
      found?.bank_name ??
      found?.bankName ??
      found?.member_name ??
      found?.display_name ??
      found?.displayName ??
      found?.title ??
      ""
  ).trim();
}

async function resolveMemberFromMembersApi(userCodeRaw) {
  const raw = String(userCodeRaw || "").trim();
  if (!raw) return null;

  try {
    const data = await fetchJSON(MEMBERS_API, { headers: { "x-role": "member" } });
    const arr = pickArray(data);

    // 1) build canonical map from all member candidates (codes + names/abbr)
    const map = new Map();
    for (const it of arr) {
      const keys = buildCodeKeys(...memberCodeCandidates(it));
      for (const k of keys) map.set(canonCode(k), it);
    }

    // try by variants of user raw
    const wantedKeys = buildCodeKeys(raw);
    for (const k of wantedKeys) {
      const hit = map.get(canonCode(k));
      if (hit) return hit;
    }

    // 2) fallback: exact equals (case-insensitive) on “any candidate” (helps BCEL vs bank_name=BCEL)
    const rawUp = raw.toUpperCase();
    const rawCanon = canonCode(raw);

    const exact = arr.find((m) =>
      memberCodeCandidates(m).some((v) => {
        const s = String(v ?? "").trim();
        if (!s) return false;
        if (s.toUpperCase() === rawUp) return true;
        if (canonCode(s) === rawCanon) return true;
        return false;
      })
    );
    if (exact) return exact;

    // 3) last resort: match contains (only if raw is letters >= 3)
    if (/^[a-z]{3,}$/i.test(raw)) {
      const contains = arr.find((m) =>
        memberCodeCandidates(m).some((v) => {
          const s = String(v ?? "").trim().toUpperCase();
          if (!s) return false;
          return s.includes(rawUp);
        })
      );
      if (contains) return contains;
    }

    return null;
  } catch (e) {
    console.warn("[MemberChat] resolveMemberFromMembersApi failed:", e?.message || e);
    return null;
  }
}

/** =======================
 *  CHAT API
 *  ======================= */
function normalizeMessage(raw) {
  const created = raw.created_at ?? raw.createdAt ?? raw.time ?? raw.sent_at ?? new Date().toISOString();
  const id = raw.id ?? raw.message_id ?? raw.mid ?? null;
  return {
    id,
    conversation_id: raw.conversation_id ?? raw.conversationId ?? null,
    sender_role: raw.sender_role ?? raw.role ?? raw.from_role ?? "",
    sender_bankcode: raw.sender_bankcode ?? raw.bankcode ?? raw.bank_code ?? null,
    body: raw.body ?? raw.message ?? raw.text ?? "",
    created_at: created,
    edited_at: raw.edited_at ?? raw.editedAt ?? null,
    client_msg_id: raw.client_msg_id ?? raw.clientMsgId ?? null,
    _pending: Boolean(raw._pending),
    _key: id ? `m:${id}` : `tmp:${raw.client_msg_id || Math.random().toString(16).slice(2)}`,
  };
}

function isMe(m) {
  return String(m?.sender_role || "").toLowerCase() !== "admin";
}

function atBottom() {
  const el = msgWrapEl.value;
  if (!el) return true;
  return el.scrollHeight - (el.scrollTop + el.clientHeight) < 80;
}

function scrollToBottom(immediate = false) {
  const bottom = bottomEl.value;
  if (!bottom) return;
  bottom.scrollIntoView({ block: "end", behavior: immediate ? "auto" : "smooth" });
}

async function apiEnsureConversationMember(bankcode) {
  const data = await fetchJSON(`${CHAT_API}/conversations/ensure`, {
    method: "POST",
    headers: { "x-role": "member" },
    body: JSON.stringify({ bankcode }),
  });
  const convId = data?.conversation_id ?? data?.id ?? data?.conversationId;
  if (!convId) throw new Error("Conversation id not returned");
  return Number(convId);
}

async function apiLoadMessages(convId, { silent = false } = {}) {
  if (!silent) {
    msgLoading.value = true;
    msgError.value = "";
  }
  try {
    const data = await fetchJSON(`${CHAT_API}/conversations/${convId}/messages?limit=50`, {
      headers: { "x-role": "member" },
    });

    const keepBottom = atBottom();
    const arr = pickArray(data).map(normalizeMessage);
    messages.value = arr;

    await nextTick();
    if (keepBottom) scrollToBottom(true);
  } catch (e) {
    msgError.value = e?.message || "Failed to load messages";
  } finally {
    if (!silent) msgLoading.value = false;
  }
}

async function apiSendMessage(convId, body, clientMsgId) {
  const data = await fetchJSON(`${CHAT_API}/conversations/${convId}/messages`, {
    method: "POST",
    headers: { "x-role": "member" },
    body: JSON.stringify({ body, client_msg_id: clientMsgId }),
  });
  const msg = data?.message ?? data;
  return normalizeMessage(msg);
}

/** =======================
 *  INIT / UI ACTIONS
 *  ======================= */
const userLabel = computed(() => (user.value ? extractUserLabel(user.value) : "—"));

async function reloadAll() {
  loadingInit.value = true;
  msgError.value = "";
  try {
    const u = await apiGetCurrentUser();
    user.value = u;

    // 1) get code from user response, fallback to token
    const rawFromUser = extractBankcode(u);
    const rawFromToken = extractBankcodeFromToken();
    const rawCode = rawFromUser || rawFromToken;

    // set fallback first
    member.value.bankcode = String(rawCode || "").trim();
    member.value.name =
      String(u?.bank_name ?? u?.bankName ?? u?.display_name ?? u?.displayName ?? u?.name ?? "").trim() || "";
    member.value.logo = resolveLogoUrl(u);

    if (!member.value.bankcode) return;

    // 2) ✅ resolve real member (name/logo) from /api/members using bankcode mapping
    const found = await resolveMemberFromMembersApi(member.value.bankcode);
    if (found) {
      // prefer real bankcode from members
      const finalBankcode =
        String(
          found?.bankcode ??
            found?.bank_code ??
            found?.bankCode ??
            found?.iaccount ??
            found?.iAccount ??
            found?.code ??
            member.value.bankcode
        ).trim();

      member.value.bankcode = finalBankcode;

      const realName = extractMemberName(found);
      if (realName) member.value.name = realName;

      const realLogo = resolveLogoUrl(found);
      if (realLogo) member.value.logo = realLogo;
    }

    // 3) ensure conversation with resolved bankcode
    const convId = await apiEnsureConversationMember(member.value.bankcode);
    conversationId.value = convId;

    await apiLoadMessages(convId);
    await nextTick();
    autosize(true);

    startPolling();
  } catch (e) {
    msgError.value = e?.message || "Failed to init chat";
  } finally {
    loadingInit.value = false;
  }
}

async function reloadMessages() {
  if (!conversationId.value) return;
  await apiLoadMessages(conversationId.value);
}

async function sendMessage() {
  if (!conversationId.value) return;
  const text = draft.value.trim();
  if (!text) return;

  const convId = conversationId.value;
  const clientMsgId = `c_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  const optimistic = normalizeMessage({
    id: null,
    conversation_id: convId,
    sender_role: "member",
    body: text,
    created_at: new Date().toISOString(),
    client_msg_id: clientMsgId,
    _pending: true,
  });

  messages.value.push(optimistic);
  draft.value = "";

  await nextTick();
  autosize(true);
  scrollToBottom(false);

  sending.value = true;
  try {
    const saved = await apiSendMessage(convId, text, clientMsgId);
    const idx = messages.value.findIndex((m) => m.client_msg_id === clientMsgId || m._key === optimistic._key);
    if (idx >= 0) messages.value[idx] = saved;
    else messages.value.push(saved);

    await nextTick();
    scrollToBottom(false);
  } catch (e) {
    msgError.value = e?.message || "Send failed";
    const idx = messages.value.findIndex((m) => m.client_msg_id === clientMsgId || m._key === optimistic._key);
    if (idx >= 0) messages.value[idx]._pending = false;
  } finally {
    sending.value = false;
  }
}

function autosize(forceSmall = false) {
  const el = textareaEl.value;
  if (!el) return;
  el.style.height = "auto";
  const h = Math.min(140, Math.max(42, el.scrollHeight || 42));
  el.style.height = (forceSmall ? 42 : h) + "px";
}

/** =======================
 *  Polling (optional)
 *  ======================= */
function startPolling() {
  stopPolling();
  pollTimer = setInterval(async () => {
    if (!conversationId.value) return;
    if (msgLoading.value || loadingInit.value) return;
    await apiLoadMessages(conversationId.value, { silent: true });
  }, 5000);
}

function stopPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
}

/** =======================
 *  GSAP
 *  ======================= */
function runReveal() {
  const root = rootEl.value;
  if (!root) return;
  const nodes = root.querySelectorAll(".js-reveal");
  if (!nodes.length) return;

  revealTween?.kill?.();
  gsap.set(nodes, { opacity: 0, y: 12 });

  revealTween = gsap.to(nodes, {
    opacity: 1,
    y: 0,
    duration: 0.42,
    ease: "power3.out",
    stagger: 0.06,
    clearProps: "opacity,transform",
  });
}

onMounted(async () => {
  runReveal();
  await reloadAll();
});

onBeforeUnmount(() => {
  revealTween?.kill?.();
  revealTween = null;
  stopPolling();
});

watch(draft, async () => {
  await nextTick();
  autosize(false);
});
</script>

<style scoped>
.mbChat { display: grid; gap: 14px; padding: 8px 2px 2px; }

/* Header */
.mbHead{
  display:flex; align-items:flex-end; justify-content:space-between; gap:12px;
  border-radius:18px; padding:16px 16px;
  background:var(--panel); border:1px solid var(--stroke);
  backdrop-filter:blur(14px);
  box-shadow:0 18px 44px rgba(0,0,0,.28);
}
.kicker{
  display:inline-flex; align-items:center; gap:10px;
  font-size:12px; letter-spacing:.12em; text-transform:uppercase;
  color:var(--muted);
}
.kDot{
  width:10px; height:10px; border-radius:999px;
  background:rgba(56,189,248,.95);
  box-shadow:0 0 0 6px rgba(56,189,248,.10);
}
.title{ margin:8px 0 6px; font-size:26px; line-height:1.1; letter-spacing:-.02em; }
.sub{ margin:0; font-size:13px; color:rgba(255,255,255,.72); }
.muted{ color:var(--muted); }
.mono{
  font-variant-numeric: tabular-nums;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
.mbHeadRight{ display:flex; gap:10px; align-items:center; }
.dotSep{ opacity:.5; margin:0 6px; }

/* Panel */
.panel{
  border-radius:18px;
  background:var(--panel);
  border:1px solid var(--stroke);
  overflow:hidden;
  display:flex;
  flex-direction:column;
  min-height:72vh;
  box-shadow:0 18px 44px rgba(0,0,0,.22);
}

.chatHead{
  padding:14px 14px;
  display:flex; justify-content:space-between; align-items:center; gap:10px;
  border-bottom:1px solid rgba(255,255,255,.08);
  background:var(--panel2);
}
.who{ display:flex; align-items:center; gap:12px; }
.avatar{
  width:44px; height:44px; border-radius:14px;
  display:grid; place-items:center;
  overflow:hidden;
  background:var(--glass); border:1px solid var(--stroke);
}
.avatar img{ width:100%; height:100%; object-fit:cover; }
.avatar span{ font-weight:950; color:rgba(255,255,255,.88); }
.whoName{ font-weight:950; }
.whoId{ margin-left:6px; font-size:12px; color:rgba(255,255,255,.65); }
.whoSub{
  display:flex; align-items:center; gap:8px;
  font-size:12px; color:rgba(255,255,255,.65);
  margin-top:2px;
}
.dot{
  width:8px; height:8px; border-radius:999px;
  background:rgba(120,255,170,.95);
  box-shadow:0 0 0 6px rgba(120,255,170,.10);
}

.chatActions{ display:flex; gap:8px; }

.msgWrap{ flex:1; overflow:auto; padding:14px 14px; }
.msgs{ display:flex; flex-direction:column; gap:10px; }
.row{ display:flex; }
.row.me{ justify-content:flex-end; }
.row.other{ justify-content:flex-start; }

.bubble{
  max-width:min(72ch, 85%);
  padding:10px 12px;
  border-radius:16px;
  background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.10);
  box-shadow:0 14px 34px rgba(0,0,0,.26);
}
.row.me .bubble{ background:rgba(56,189,248,.10); border-color:rgba(56,189,248,.18); }
.bubble.pending{ opacity:.72; }
.body{ word-break:break-word; line-height:1.35; font-size:14px; }
.meta{
  margin-top:6px;
  display:flex; gap:10px; justify-content:flex-end;
  font-size:11px; color:rgba(255,255,255,.62);
}
.bottom{ height:1px; }

/* Composer */
.composer{
  padding:12px;
  display:flex; gap:10px; align-items:flex-end;
  border-top:1px solid rgba(255,255,255,.08);
  background:var(--panel2);
}
.inputWrap{ flex:1; }
.input{
  width:100%;
  min-height:42px;
  max-height:140px;
  resize:none;
  padding:10px 12px;
  border-radius:14px;
  border:1px solid rgba(255,255,255,.10);
  background:var(--glass);
  color:rgba(255,255,255,.92);
  outline:none;
  font-size:14px;
}

/* Buttons + state */
.btn{
  display:inline-flex; align-items:center; gap:10px;
  border:1px solid rgba(56,189,248,.22);
  background:rgba(56,189,248,.12);
  color:rgba(255,255,255,.92);
  padding:10px 12px;
  border-radius:14px;
  cursor:pointer;
  font-weight:950;
  transition: transform 180ms ease, background 180ms ease, border-color 180ms ease;
}
.btn:hover{ transform: translateY(-1px); background: rgba(56,189,248,.16); }
.btn:disabled{ opacity:.55; cursor:not-allowed; transform:none; }
.btn.ghost{
  border-color: rgba(255,255,255,.10);
  background: rgba(255,255,255,.06);
  color: rgba(255,255,255,.82);
}
.btn.tiny{ padding:8px 10px; border-radius:12px; font-size:12px; }

.btnIcon{ display:inline-block; }
.spin{ animation: spin .9s linear infinite; }
@keyframes spin{ to{ transform: rotate(360deg); } }

.state{
  padding:16px 14px;
  border-radius:14px;
  background:rgba(255,255,255,.03);
  border:1px solid rgba(255,255,255,.08);
  color:rgba(255,255,255,.72);
  display:flex; align-items:center; gap:10px; justify-content:center;
  text-align:center;
}
.state.err{
  color: rgba(255,170,170,.95);
  border-color: rgba(255,80,80,.22);
  background: rgba(255,80,80,.08);
}
.state .text{ max-width:70%; overflow:hidden; text-overflow:ellipsis; }
.spinner{
  width:18px; height:18px; border-radius:999px;
  border:2px solid rgba(255,255,255,.2);
  border-top-color: rgba(255,255,255,.85);
  animation: spin .7s linear infinite;
}
</style>
