<template>
  <section ref="rootEl" class="mbChat">
    <!-- header -->
    <header class="mbHead js-reveal">
      <div class="mbHeadLeft">
        <div class="kicker">
          <span class="kDot"></span>
          Admin • MemberBank Chat
        </div>
        <h1 class="title">MemberBank Inbox</h1>
        <p class="sub">
          Showing only banks that have chats • total
          <b class="mono">{{ totalBanksLabel }}</b>
          banks
        </p>
      </div>

      <div class="mbHeadRight">
        <div class="pill">
          <i class="fa-solid fa-building-columns"></i>
          <span class="mono">{{ filteredBanks.length }}</span>
          <span class="muted">/ {{ totalBanksLabel }}</span>
        </div>

        <button class="btn ghost" type="button" @click="reloadAll" :disabled="loadingBanks">
          <span class="btnIcon" :class="{ spin: loadingBanks }">⟲</span>
          Refresh
        </button>
      </div>
    </header>

    <div class="mbGrid js-reveal">
      <!-- LEFT -->
      <aside class="left">
        <div class="panelTop">
          <div class="panelTitle">
            <i class="fa-solid fa-inbox"></i>
            Banks
          </div>

          <div class="search">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input
              v-model.trim="q"
              class="searchInput"
              type="search"
              placeholder="Search bankcode / iAccount / name..."
            />
            <button v-if="q" class="x" type="button" @click="q = ''" title="Clear">×</button>
          </div>
        </div>

        <div class="list">
          <div v-if="loadingBanks" class="state">
            <div class="spinner"></div>
            Loading banks...
          </div>

          <div v-else-if="bankError" class="state err">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span class="text">{{ bankError }}</span>
            <button class="btn tiny" type="button" @click="reloadAll">Try again</button>
          </div>

          <!-- ✅ show member real name + logo from /api/members (mapping by bankcode) -->
          <template v-else>
            <button
              v-for="b in filteredBanks"
              :key="b._key"
              type="button"
              class="bankItem"
              :class="{ active: activeBank?.id === b.id }"
              @click="selectBank(b)"
              @mouseenter="cardHover($event, true)"
              @mouseleave="cardHover($event, false)"
            >
              <div class="bankTop">
                <div class="bankName">
                  <div class="bankRow">
                    <div class="bankAvatar" aria-hidden="true">
                      <img v-if="bankLogo(b)" :src="bankLogo(b)" alt="" @error="onImgError($event)" />
                      <span v-else>{{ (bankName(b) || "M").slice(0, 1).toUpperCase() }}</span>
                    </div>

                    <div class="bankText">
                      <span class="name">{{ bankName(b) || "MemberBank" }}</span>
                      <span class="mono id">#{{ b.bankcode || b.iaccount || b.id }}</span>
                    </div>
                  </div>
                </div>

                <span v-if="b.unread_count > 0" class="badge">
                  {{ b.unread_count > 99 ? "99+" : b.unread_count }}
                </span>
              </div>

              <div class="bankBottom">
                <div class="preview">{{ b.last_preview || "—" }}</div>
                <div class="time mono">{{ b.last_at ? formatTime(b.last_at) : "" }}</div>
              </div>
            </button>

            <div v-if="!filteredBanks.length" class="state">
              <i class="fa-regular fa-comment-dots"></i>
              No active chats yet
            </div>
          </template>
        </div>
      </aside>

      <!-- RIGHT -->
      <main class="right">
        <div v-if="!activeBank" class="empty">
          <div class="emptyCard">
            <div class="bigIcon">💬</div>
            <h2>Select a bank</h2>
            <p>Choose a member bank on the left to start chatting.</p>
          </div>
        </div>

        <template v-else>
          <!-- chat header -->
          <div class="chatHead">
            <div class="who">
              <div class="avatar" aria-hidden="true">
                <img v-if="activeBank.logo" :src="activeBank.logo" alt="" @error="onImgError($event)" />
                <i v-else class="fa-solid fa-building-columns"></i>
              </div>

              <div class="whoText">
                <div class="whoName">
                  {{ activeBank.name || "MemberBank" }}
                  <span class="mono whoId">({{ activeBank.bankcode || activeBank.iaccount || activeBank.id }})</span>
                </div>
                <div class="whoSub">
                  <span class="dot"></span>
                  <span class="muted">Direct chat</span>
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
              <button class="btn ghost" type="button" @click="reloadMessages" :disabled="msgLoading">
                <span class="btnIcon" :class="{ spin: msgLoading }">⟲</span>
                Reload
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
              <button class="btn tiny" type="button" @click="reloadMessages">Try again</button>
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

            <button class="btn" type="submit" :disabled="sending || !draft.trim()">
              <i class="fa-solid fa-paper-plane"></i>
              Send
            </button>
          </form>
        </template>
      </main>
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

const banks = ref([]);
const loadingBanks = ref(false);
const bankError = ref("");

const activeBank = ref(null);

const messages = ref([]);
const msgLoading = ref(false);
const msgError = ref("");

const q = ref("");
const draft = ref("");
const sending = ref(false);

let revealTween = null;

/** ✅ members index for mapping (bankcode -> member) */
const membersIndex = ref(new Map());

/** =======================
 *  HELPERS
 *  ======================= */
function normKey(v) {
  return String(v ?? "").trim().toLowerCase();
}

function canonCode(v) {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s\-_]+/g, "");
}

function pickArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.members)) return data.members;
  if (Array.isArray(data?.banks)) return data.banks;
  if (Array.isArray(data?.rows)) return data.rows;
  return [];
}

function resolveLogoUrl(raw) {
  const v =
    raw?.logo ||
    raw?.logo_url ||
    raw?.logoUrl ||
    raw?.avatar ||
    raw?.avatar_url ||
    raw?.avatarUrl ||
    raw?.image ||
    raw?.image_url ||
    raw?.imageUrl ||
    raw?.profile_image ||
    raw?.profileImage ||
    "";

  const s = String(v || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/")) return `${API_ORIGIN}${s}`;
  return `${API_ORIGIN}/${s.replace(/^\.?\//, "")}`;
}

function normalizeMember(raw, i = 0) {
  const id = raw?.id ?? raw?.member_id ?? raw?.memberId ?? raw?.user_id ?? raw?._id ?? i;

  const bankcode =
    raw?.bankcode ??
    raw?.bank_code ??
    raw?.bankCode ??
    raw?.code ??
    raw?.iaccount ??
    raw?.iAccount ??
    raw?.i_account ??
    null;

  const iaccount =
    raw?.iaccount ?? raw?.iAccount ?? raw?.i_account ?? raw?.account_code ?? raw?.accountCode ?? raw?.code ?? "";

  const name =
    raw?.name ??
    raw?.bank_name ??
    raw?.bankName ??
    raw?.member_name ??
    raw?.display_name ??
    raw?.displayName ??
    raw?.title ??
    "MemberBank";

  const safeCode = String(bankcode || iaccount || id || "").trim();

  const codesRaw = [
    bankcode,
    iaccount,
    raw?.bank_code,
    raw?.bankcode,
    raw?.bankCode,
    raw?.code,
    raw?.iaccount,
    raw?.iAccount,
    raw?.i_account,
    raw?.account_code,
    raw?.accountCode,
    raw?.member_code,
    raw?.memberCode,
    id,
  ];

  const codes = Array.from(
    new Set(
      codesRaw
        .map((x) => String(x ?? "").trim())
        .filter(Boolean)
    )
  );

  return {
    id,
    bankcode: safeCode,
    iaccount: String(iaccount || safeCode || "").trim(),
    name: String(name || "").trim(),
    logo: resolveLogoUrl(raw),

    unread_count: 0,
    last_preview: "",
    last_at: null,
    conversation_id: null,

    _codes: codes,
    _key: `m:${String(id)}:${safeCode}`,
  };
}

function normalizeMetaBank(raw) {
  const bankcode = raw?.bankcode ?? raw?.bank_code ?? raw?.code ?? raw?.iaccount ?? raw?.iAccount ?? "";
  const member_id = raw?.member_id ?? raw?.memberId ?? raw?.user_id ?? raw?.uid ?? null;

  return {
    bankcode: String(bankcode || "").trim(),
    member_id,
    conversation_id: raw?.conversation_id ?? raw?.conversationId ?? raw?.conversation ?? raw?.id ?? null,
    unread_count: Number(raw?.unread_count ?? raw?.unread ?? 0),
    last_preview: raw?.last_preview ?? raw?.last_message ?? raw?.preview ?? "",
    last_at: raw?.last_at ?? raw?.last_message_at ?? raw?.updated_at ?? null,
  };
}

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

function isMe(m) {
  return String(m?.sender_role || "").toLowerCase() === "admin";
}

function onImgError(e) {
  const img = e?.target;
  if (img) img.style.display = "none";
}

/** ✅ build index: bankcode -> member */
function buildMembersIndex(membersArr) {
  const mp = new Map();
  for (const mb of membersArr || []) {
    const keys = new Set(
      [mb.bankcode, mb.iaccount, mb.id, ...(mb._codes || [])]
        .map((x) => String(x ?? "").trim())
        .filter(Boolean)
    );
    for (const k of keys) {
      mp.set(normKey(k), mb);
      mp.set(canonCode(k), mb);
    }
  }
  membersIndex.value = mp;
}

function memberFromBank(b) {
  const code = String(b?.bankcode || b?.iaccount || b?.id || "").trim();
  if (!code) return null;
  return membersIndex.value.get(normKey(code)) || membersIndex.value.get(canonCode(code)) || null;
}

function bankName(b) {
  const mb = memberFromBank(b);
  return mb?.name || b?.name || "MemberBank";
}

function bankLogo(b) {
  const mb = memberFromBank(b);
  return mb?.logo || b?.logo || "";
}

function getToken() {
  try {
    return localStorage.getItem("token") || sessionStorage.getItem("token") || "";
  } catch {
    return "";
  }
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
 *  API CALLS
 *  ======================= */
async function apiLoadOnlyBanksWithChats() {
  loadingBanks.value = true;
  bankError.value = "";
  try {
    const [mData, metaData] = await Promise.all([
      fetchJSON(MEMBERS_API),
      fetchJSON(`${CHAT_API}/admin/banks`, {
        headers: { "x-role": "admin" },
      }),
    ]);

    const members = pickArray(mData).map(normalizeMember).filter((x) => x && x.id != null);

    // ✅ build members mapping for name/logo
    buildMembersIndex(members);

    const metaArr = pickArray(metaData).map(normalizeMetaBank);

    // existing merge logic (kept as-is)
    const memberMap = new Map();
    for (const mb of members) {
      const keys = new Set(
        [mb.bankcode, mb.iaccount, mb.id, ...(mb._codes || [])]
          .map((x) => String(x ?? "").trim())
          .filter(Boolean)
      );

      for (const k of keys) {
        memberMap.set(normKey(k), mb);
        memberMap.set(canonCode(k), mb);
      }
    }

    const merged = metaArr.map((m, idx) => {
      const k1 = normKey(m.bankcode);
      const k2 = canonCode(m.bankcode);

      const mid1 = m.member_id != null ? normKey(m.member_id) : "";
      const mid2 = m.member_id != null ? canonCode(m.member_id) : "";

      const found =
        memberMap.get(k1) ||
        memberMap.get(k2) ||
        (mid1 ? memberMap.get(mid1) : null) ||
        (mid2 ? memberMap.get(mid2) : null);

      const base = found
        ? { ...found }
        : {
            id: `unknown_${idx}`,
            bankcode: String(m.bankcode || `unknown_${idx}`),
            iaccount: String(m.bankcode || ""),
            name: "MemberBank",
            logo: "",
            _key: `unknown:${idx}:${String(m.bankcode || "")}`,
            unread_count: 0,
            last_preview: "",
            last_at: null,
            conversation_id: null,
          };

      return {
        ...base,
        unread_count: m.unread_count ?? base.unread_count,
        last_preview: m.last_preview ?? base.last_preview,
        last_at: m.last_at ?? base.last_at,
        conversation_id: m.conversation_id ?? base.conversation_id,
        _key: base._key || `b:${String(base.id)}:${String(base.bankcode || "")}`,
      };
    });

    merged.sort((a, b) => {
      const ta = a.last_at ? new Date(a.last_at).getTime() : 0;
      const tb = b.last_at ? new Date(b.last_at).getTime() : 0;
      return tb - ta;
    });

    banks.value = merged;
  } catch (e) {
    bankError.value = e?.message || "Failed to load active chat banks";
  } finally {
    loadingBanks.value = false;
  }
}

async function apiEnsureConversation(bank) {
  if (bank?.conversation_id) return Number(bank.conversation_id);

  const bankcode = String(bank?.bankcode || bank?.iaccount || "").trim();
  if (!bankcode) throw new Error("Missing bankcode/iAccount for this member");

  const data = await fetchJSON(`${CHAT_API}/conversations/ensure`, {
    method: "POST",
    headers: { "x-role": "admin" },
    body: JSON.stringify({ bankcode }),
  });

  const convId = data?.conversation_id ?? data?.id ?? data?.conversationId;
  if (!convId) throw new Error("Conversation id not returned");
  return Number(convId);
}

async function apiLoadMessages(conversationId) {
  msgLoading.value = true;
  msgError.value = "";
  try {
    const data = await fetchJSON(`${CHAT_API}/conversations/${conversationId}/messages?limit=50`, {
      headers: { "x-role": "admin" },
    });
    const arr = pickArray(data);
    messages.value = arr.map(normalizeMessage);

    await nextTick();
    scrollToBottom(true);
  } catch (e) {
    msgError.value = e?.message || "Failed to load messages";
  } finally {
    msgLoading.value = false;
  }
}

async function apiSendMessage(conversationId, body, clientMsgId) {
  const data = await fetchJSON(`${CHAT_API}/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "x-role": "admin" },
    body: JSON.stringify({ body, client_msg_id: clientMsgId }),
  });
  const msg = data?.message ?? data;
  return normalizeMessage(msg);
}

/** =======================
 *  UI LOGIC
 *  ======================= */
const filteredBanks = computed(() => {
  const s = q.value.trim().toLowerCase();
  if (!s) return banks.value;
  return banks.value.filter((b) => {
    const hay = `${b.bankcode || ""} ${b.iaccount || ""} ${b.name || ""} ${b.id || ""}`.toLowerCase();
    return hay.includes(s);
  });
});

const totalBanksLabel = computed(() => banks.value.length || 0);

async function reloadAll() {
  await apiLoadOnlyBanksWithChats();
  if (activeBank.value) {
    const found = banks.value.find((x) => x.id === activeBank.value.id);
    if (found) activeBank.value = found;
  }
}

async function selectBank(b) {
  activeBank.value = b;
  draft.value = "";
  messages.value = [];
  msgError.value = "";

  try {
    const convId = await apiEnsureConversation(b);
    b.conversation_id = convId;
    await apiLoadMessages(convId);
    b.unread_count = 0;

    await nextTick();
    autosize(true);
  } catch (e) {
    msgError.value = e?.message || "Failed to open conversation";
  }
}

async function reloadMessages() {
  if (!activeBank.value) return;
  const convId = await apiEnsureConversation(activeBank.value);
  await apiLoadMessages(convId);
}

function scrollToBottom(immediate = false) {
  const bottom = bottomEl.value;
  if (!bottom) return;
  bottom.scrollIntoView({ block: "end", behavior: immediate ? "auto" : "smooth" });
}

async function sendMessage() {
  if (!activeBank.value) return;
  const text = draft.value.trim();
  if (!text) return;

  const convId = await apiEnsureConversation(activeBank.value);
  const clientMsgId = `c_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  const optimistic = normalizeMessage({
    id: null,
    conversation_id: convId,
    sender_role: "admin",
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

    activeBank.value.last_preview = text;
    activeBank.value.last_at = new Date().toISOString();
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

function cardHover(e, enter) {
  gsap.to(e.currentTarget, { y: enter ? -2 : 0, duration: 0.18, ease: "power2.out" });
}

onMounted(async () => {
  runReveal();
  await reloadAll();
});

onBeforeUnmount(() => {
  revealTween?.kill?.();
  revealTween = null;
});

watch(draft, async () => {
  await nextTick();
  autosize(false);
});
</script>

<style scoped>
/* ใช้ style เดิมของคุณได้เลย (ไม่ได้แก้) */
.mbChat {
  display: grid;
  gap: 14px;
  padding: 8px 2px 2px;
}
/* Header */
.mbHead {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  border-radius: 18px;
  padding: 16px 16px;
  background: var(--panel);
  border: 1px solid var(--stroke);
  backdrop-filter: blur(14px);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.28);
}
.kicker {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}
.kDot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.95);
  box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.1);
}
.title {
  margin: 8px 0 6px;
  font-size: 26px;
  line-height: 1.1;
  letter-spacing: -0.02em;
}
.sub {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.72);
}
.muted {
  color: var(--muted);
}
.mono {
  font-variant-numeric: tabular-nums;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
.mbHeadRight {
  display: flex;
  gap: 10px;
  align-items: center;
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 999px;
  background: var(--glass);
  border: 1px solid var(--stroke);
}
/* Grid */
.mbGrid {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 14px;
  min-height: 72vh;
}
/* Left */
.left {
  border-radius: 18px;
  background: var(--panel);
  border: 1px solid var(--stroke);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.22);
}
.panelTop {
  padding: 14px 14px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: var(--panel2);
}
.panelTitle {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 900;
  margin-bottom: 10px;
}
.search {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 10px;
  border-radius: 12px;
  background: var(--glass);
  border: 1px solid var(--stroke);
}
.search i {
  color: rgba(255, 255, 255, 0.65);
}
.searchInput {
  width: 100%;
  border: 0;
  outline: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.92);
  font-size: 13px;
}
.x {
  border: 0;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.88);
  width: 28px;
  height: 28px;
  border-radius: 10px;
  cursor: pointer;
}
.list {
  padding: 10px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.bankItem {
  text-align: left;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
  padding: 12px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  color: inherit;
  transition: background 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}
.bankItem:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(56, 189, 248, 0.18);
  box-shadow: 0 12px 26px rgba(56, 189, 248, 0.08);
}
.bankItem.active {
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.18), rgba(99, 102, 241, 0.12));
  border-color: rgba(56, 189, 248, 0.22);
  box-shadow: 0 18px 36px rgba(56, 189, 248, 0.1);
}
.bankTop {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.bankRow {
  display: flex;
  align-items: center;
  gap: 10px;
}
.bankAvatar {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.bankAvatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.bankAvatar span {
  font-weight: 950;
  color: rgba(255, 255, 255, 0.88);
}
.bankName .name {
  font-weight: 950;
  display: block;
}
.bankName .id {
  display: block;
  margin-top: 2px;
  color: rgba(255, 255, 255, 0.62);
  font-size: 12px;
}
.badge {
  min-width: 26px;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.2);
  color: rgba(255, 255, 255, 0.92);
  font-weight: 950;
  font-size: 12px;
  box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.06);
}
.bankBottom {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: rgba(255, 255, 255, 0.65);
  font-size: 12px;
}
.preview {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 240px;
}
/* Right */
.right {
  border-radius: 18px;
  background: var(--panel);
  border: 1px solid var(--stroke);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.22);
}
.empty {
  flex: 1;
  display: grid;
  place-items: center;
  padding: 18px;
}
.emptyCard {
  width: min(520px, 100%);
  border-radius: 18px;
  background: var(--panel2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 20px;
  text-align: center;
}
.bigIcon {
  font-size: 34px;
  margin-bottom: 6px;
}
.chatHead {
  padding: 14px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: var(--panel2);
}
.who {
  display: flex;
  align-items: center;
  gap: 12px;
}
.avatar {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: var(--glass);
  border: 1px solid var(--stroke);
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.whoName {
  font-weight: 950;
}
.whoId {
  margin-left: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.65);
}
.whoSub {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.65);
  margin-top: 2px;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(120, 255, 170, 0.95);
  box-shadow: 0 0 0 6px rgba(120, 255, 170, 0.1);
}
.dotSep {
  opacity: 0.5;
}
.msgWrap {
  flex: 1;
  overflow: auto;
  padding: 14px 14px;
}
.msgs {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.row {
  display: flex;
}
.row.me {
  justify-content: flex-end;
}
.row.other {
  justify-content: flex-start;
}
.bubble {
  max-width: min(72ch, 85%);
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.26);
}
.row.me .bubble {
  background: rgba(56, 189, 248, 0.1);
  border-color: rgba(56, 189, 248, 0.18);
}
.bubble.pending {
  opacity: 0.72;
}
.body {
  word-break: break-word;
  line-height: 1.35;
  font-size: 14px;
}
.meta {
  margin-top: 6px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.62);
}
.bottom {
  height: 1px;
}
/* Composer */
.composer {
  padding: 12px;
  display: flex;
  gap: 10px;
  align-items: flex-end;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: var(--panel2);
}
.inputWrap {
  flex: 1;
}
.input {
  width: 100%;
  min-height: 42px;
  max-height: 140px;
  resize: none;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: var(--glass);
  color: rgba(255, 255, 255, 0.92);
  outline: none;
  font-size: 14px;
}
/* Buttons + state */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(56, 189, 248, 0.22);
  background: rgba(56, 189, 248, 0.12);
  color: rgba(255, 255, 255, 0.92);
  padding: 10px 12px;
  border-radius: 14px;
  cursor: pointer;
  font-weight: 950;
  transition: transform 180ms ease, background 180ms ease, border-color 180ms ease;
}
.btn:hover {
  transform: translateY(-1px);
  background: rgba(56, 189, 248, 0.16);
}
.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}
.btn.ghost {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.82);
}
.btn.tiny {
  padding: 8px 10px;
  border-radius: 12px;
  font-size: 12px;
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
.state {
  padding: 16px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.72);
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  text-align: center;
}
.state.err {
  color: rgba(255, 170, 170, 0.95);
  border-color: rgba(255, 80, 80, 0.22);
  background: rgba(255, 80, 80, 0.08);
}
.state .text {
  max-width: 70%;
  overflow: hidden;
  text-overflow: ellipsis;
}
.spinner {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: rgba(255, 255, 255, 0.85);
  animation: spin 0.7s linear infinite;
}
@media (max-width: 980px) {
  .mbGrid {
    grid-template-columns: 1fr;
  }
  .left {
    max-height: 360px;
  }
  .right {
    min-height: 60vh;
  }
}
</style>
