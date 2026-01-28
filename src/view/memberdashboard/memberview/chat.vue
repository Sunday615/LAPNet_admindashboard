<template>
  <!-- ✅ IMPORTANT: No .app/.tech wrapper because App.vue already provides it -->
  <section ref="rootEl" class="chatRoom">
    <!-- header -->
    <header ref="headEl" class="topbar js-reveal">
      <div class="headline">
        <div class="kicker">
          <span class="kDot"></span>
          Member • Chat with Admin
        </div>

        <h1 class="title">Chat Room</h1>

        <p class="subtitle">
          Bankcode <b class="mono">{{ bankcode || "-" }}</b>
          <span class="dotSep">•</span>
          Conversation <b class="mono">{{ conversationId || "-" }}</b>
          <span class="dotSep">•</span>
          Socket
          <b class="mono" :class="{ ok: socketStatus === 'connected', bad: socketStatus !== 'connected' }">
            {{ socketStatus }}
          </b>
        </p>
      </div>

      <div class="actions">
        <div class="pill" :class="{ ok: socketStatus === 'connected', bad: socketStatus !== 'connected' }">
          <span class="dot" aria-hidden="true"></span>
          <span class="mono">{{ socketStatus }}</span>
        </div>

        <button
          class="btn ghost"
          type="button"
          @click="reload"
          :disabled="loading"
          @mouseenter="btnHover($event, true)"
          @mouseleave="btnHover($event, false)"
        >
          <span class="btnIcon" :class="{ spin: loading }">⟲</span>
          Reload
        </button>
      </div>
    </header>

    <div class="grid">
      <!-- MAIN -->
      <main class="card js-reveal">
        <div class="cardTop">
          <div class="cardTitle">
            <i class="fa-solid fa-comments"></i>
            Messages
          </div>

          <div class="cardMeta">
            <span class="muted">total</span>
            <b class="mono">{{ messages.length }}</b>
          </div>
        </div>

        <div ref="listEl" class="list">
          <div v-if="error" class="state err">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <div>
              <div class="stateTitle">Error</div>
              <div class="stateMsg">{{ error }}</div>
            </div>
          </div>

          <div v-else-if="loading && messages.length === 0" class="state">
            <span class="spinner" aria-hidden="true"></span>
            Loading chat…
          </div>

          <template v-else>
            <div v-if="messages.length === 0" class="state">
              <i class="fa-regular fa-message"></i>
              No messages yet. Say hi to admin 👋
            </div>

            <div
              v-for="m in messages"
              :key="m._key"
              class="row"
              :class="{ me: isMe(m), admin: !isMe(m) }"
            >
              <div class="bubble">
                <div class="bubbleTop">
                  <span class="who">
                    <i v-if="isMe(m)" class="fa-solid fa-building-columns"></i>
                    <i v-else class="fa-solid fa-user-shield"></i>
                    {{ isMe(m) ? (bankcode || "You") : "Admin" }}
                  </span>

                  <span class="time mono">{{ formatTime(m.created_at) }}</span>
                </div>

                <div class="body">{{ m.body }}</div>

                <div v-if="m._pending" class="hint mono">sending…</div>
                <div v-else-if="m._failed" class="hint bad mono">failed — try again</div>
              </div>
            </div>
          </template>
        </div>

        <div class="composer">
          <textarea
            v-model="draft"
            class="input"
            placeholder="Type your message… (Enter to send, Shift+Enter for new line)"
            rows="2"
            :disabled="!readyToChat"
            @keydown.enter.prevent="onEnter"
          ></textarea>

          <button
            class="btn primary"
            type="button"
            @click="send"
            :disabled="!canSend"
            @mouseenter="btnHover($event, true)"
            @mouseleave="btnHover($event, false)"
          >
            <i class="fa-solid fa-paper-plane"></i>
            Send
          </button>
        </div>

        <div class="foot muted">
          Auth:
          <span class="mono">x-role: bank</span>
          <span class="dotSep">•</span>
          <span class="mono">x-bankcode: {{ bankcode || "?" }}</span>
        </div>
      </main>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { io } from "socket.io-client";
import gsap from "gsap";

const route = useRoute();
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

// ---------- helpers ----------
function safeJsonParse(x) {
  try {
    return JSON.parse(String(x));
  } catch {
    return null;
  }
}

function trimStr(x) {
  return String(x ?? "").trim();
}

function readToken() {
  return trimStr(localStorage.getItem("token")) || trimStr(sessionStorage.getItem("token")) || "";
}

function readUserFromStorage() {
  const u1 = localStorage.getItem("user");
  if (u1) return safeJsonParse(u1);
  const u2 = sessionStorage.getItem("user");
  if (u2) return safeJsonParse(u2);
  return null;
}

function writeUserToStorage(user) {
  if (!user) return;
  try {
    // prefer localStorage (same behavior as your App.vue)
    localStorage.setItem("user", JSON.stringify(user));
  } catch {}
}

function getBankcodeFromUser(user) {
  return trimStr(user?.bankcode || user?.bank_code || user?.Bankcode || user?.bankCode);
}

function getUserId(user) {
  return trimStr(user?.id || user?.user_id || user?.uid);
}

function getUsername(user) {
  return trimStr(user?.username || user?.user_name || user?.name);
}

function getEmail(user) {
  return trimStr(user?.email);
}

const currentUser = ref(readUserFromStorage());

// ✅ bankcode priority:
// 1) query/params (dev override)
// 2) user.bankcode (real from login)
// 3) legacy localStorage("bankcode") (fallback)
const bankcode = computed(() => {
  const q = trimStr(route.query.bankcode);
  const p = trimStr(route.params.bankcode);
  if (q) return q;
  if (p) return p;

  const fromUser = getBankcodeFromUser(currentUser.value);
  if (fromUser) return fromUser;

  return trimStr(localStorage.getItem("bankcode"));
});

// ---------- state ----------
const conversationId = ref(0);
const socketStatus = ref("disconnected"); // connecting | connected | disconnected
const loading = ref(false);
const error = ref("");

const draft = ref("");
const listEl = ref(null);
const rootEl = ref(null);

const messages = reactive([]);
const pendingMap = new Map();
let socket = null;

const readyToChat = computed(() => !!bankcode.value && !!conversationId.value);
const canSend = computed(
  () => readyToChat.value && socketStatus.value === "connected" && draft.value.trim().length > 0
);

function makeKey(m) {
  return m.id ? `id:${m.id}` : `c:${m.client_msg_id || m._tmp || Math.random().toString(16).slice(2)}`;
}

function isMe(m) {
  return String(m.sender_role) === "bank";
}

function formatTime(dt) {
  try {
    const d = new Date(dt);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString(undefined, { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" });
  } catch {
    return "-";
  }
}

async function scrollToBottom() {
  await nextTick();
  const el = listEl.value;
  if (!el) return;
  el.scrollTop = el.scrollHeight;
}

async function animateLastRow() {
  await nextTick();
  const el = listEl.value?.querySelector?.(".row:last-child");
  if (!el) return;
  gsap.fromTo(el, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.22, ease: "power2.out" });
}

function authHeaders(extra = {}) {
  const token = readToken();
  const headers = {
    ...extra,
    "x-role": "bank",
    "x-bankcode": bankcode.value,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/**
 * ✅ If bankcode is missing in storage:
 * - Fetch /api/users/ and match by id/email/username
 * - Save bankcode back to storage
 */
async function hydrateBankcodeFromUsersApiIfMissing() {
  if (bankcode.value) return;

  const u = currentUser.value || readUserFromStorage();
  const uid = getUserId(u);
  const email = getEmail(u).toLowerCase();
  const username = getUsername(u).toLowerCase();

  if (!uid && !email && !username) return;

  try {
    const res = await fetch(`${API_BASE}/api/users/`, {
      headers: (() => {
        const token = readToken();
        const h = {};
        if (token) h.Authorization = `Bearer ${token}`;
        return h;
      })(),
    });

    if (!res.ok) return;

    const data = await res.json();
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.data)
          ? data.data
          : [];

    if (!Array.isArray(list) || !list.length) return;

    const found = list.find((x) => {
      const xid = trimStr(x?.id || x?.user_id || x?.uid);
      const xemail = trimStr(x?.email).toLowerCase();
      const xuser = trimStr(x?.username || x?.user_name || x?.name).toLowerCase();

      if (uid && xid && xid === uid) return true;
      if (email && xemail && xemail === email) return true;
      if (username && xuser && xuser === username) return true;
      return false;
    });

    const bc = getBankcodeFromUser(found);
    if (!bc) return;

    const merged = { ...(u || {}), ...(found || {}), bankcode: bc };
    currentUser.value = merged;
    writeUserToStorage(merged);
  } catch {
    // ignore
  }
}

async function ensureConversation() {
  const res = await fetch(`${API_BASE}/api/chat/conversations/ensure`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`ensure failed (${res.status}): ${t || res.statusText}`);
  }

  const data = await res.json();
  conversationId.value = Number(data.conversation_id || 0);
  if (!conversationId.value) throw new Error("ensure: conversation_id missing");
}

async function loadMessages() {
  if (!conversationId.value) return;

  const url = `${API_BASE}/api/chat/conversations/${conversationId.value}/messages?limit=200`;
  const res = await fetch(url, { headers: authHeaders() });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`load messages failed (${res.status}): ${t || res.statusText}`);
  }

  const data = await res.json();
  const items = Array.isArray(data.items) ? data.items : [];

  messages.splice(0, messages.length);
  for (const m of items) {
    messages.push({ ...m, _pending: false, _failed: false, _key: makeKey(m) });
  }

  await scrollToBottom();
}

function connectSocket() {
  if (socket) {
    try { socket.disconnect(); } catch {}
    socket = null;
  }

  socketStatus.value = "connecting";

  socket = io(API_BASE, {
    transports: ["websocket"],
    auth: {
      role: "bank",
      bankcode: bankcode.value,
      user_id: getUserId(currentUser.value),
    },
  });

  socket.on("connect", () => {
    socketStatus.value = "connected";
    socket.emit("chat:join", { conversation_id: conversationId.value }, (ack) => {
      if (!ack?.ok) error.value = `socket join failed: ${ack?.error || "unknown"}`;
    });
  });

  socket.on("disconnect", () => {
    socketStatus.value = "disconnected";
  });

  socket.on("chat:error", (e) => {
    console.warn("chat:error", e);
  });

  socket.on("chat:new_message", async (msg) => {
    if (Number(msg?.conversation_id) !== Number(conversationId.value)) return;

    const clientId = msg?.client_msg_id ? String(msg.client_msg_id) : null;

    if (clientId && pendingMap.has(clientId)) {
      const idx = pendingMap.get(clientId);
      if (typeof idx === "number" && messages[idx]) {
        messages[idx] = { ...msg, _pending: false, _failed: false, _key: makeKey(msg) };
      } else {
        messages.push({ ...msg, _pending: false, _failed: false, _key: makeKey(msg) });
      }
      pendingMap.delete(clientId);
      await scrollToBottom();
      return;
    }

    const exists = messages.some((m) => (m.id && m.id === msg.id) || (clientId && m.client_msg_id === clientId));
    if (exists) return;

    messages.push({ ...msg, _pending: false, _failed: false, _key: makeKey(msg) });
    await animateLastRow();
    await scrollToBottom();
  });
}

function uuid() {
  try {
    return crypto.randomUUID();
  } catch {
    return `c_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}

async function send() {
  if (!canSend.value) return;

  const text = draft.value.trim();
  draft.value = "";

  const client_msg_id = uuid();

  const optimistic = {
    id: null,
    conversation_id: conversationId.value,
    sender_role: "bank",
    sender_bankcode: bankcode.value,
    body: text,
    client_msg_id,
    created_at: new Date().toISOString(),
    _pending: true,
    _failed: false,
    _tmp: client_msg_id,
  };
  optimistic._key = makeKey(optimistic);

  const idx = messages.push(optimistic) - 1;
  pendingMap.set(client_msg_id, idx);

  await animateLastRow();
  await scrollToBottom();

  socket?.emit("chat:send", { conversation_id: conversationId.value, body: text, client_msg_id }, (ack) => {
    if (!ack?.ok) {
      const i = pendingMap.get(client_msg_id);
      if (typeof i === "number" && messages[i]) {
        messages[i]._pending = false;
        messages[i]._failed = true;
        messages[i]._key = makeKey(messages[i]);
      }
      pendingMap.delete(client_msg_id);
    }
  });
}

function onEnter(e) {
  if (e.shiftKey) return;
  send();
}

async function reload() {
  error.value = "";
  loading.value = true;

  try {
    currentUser.value = readUserFromStorage();
    await hydrateBankcodeFromUsersApiIfMissing();

    if (!bankcode.value) {
      throw new Error(
        "Missing bankcode from login user. (Ensure user.bankcode is saved in storage or accessible via /api/users/)."
      );
    }

    await ensureConversation();
    await loadMessages();
    connectSocket();
  } catch (e) {
    error.value = e?.message || String(e);
  } finally {
    loading.value = false;
  }
}

// ---------- GSAP ----------
function btnHover(e, enter) {
  gsap.to(e.currentTarget, { y: enter ? -2 : 0, duration: 0.22, ease: "power2.out" });
}

function revealIn() {
  const root = rootEl.value;
  if (!root) return;

  const q = gsap.utils.selector(root);
  const nodes = q(".js-reveal");
  gsap.killTweensOf(nodes);

  gsap.set(nodes, { opacity: 0, y: 12 });
  gsap.to(nodes, { opacity: 1, y: 0, stagger: 0.07, duration: 0.45, ease: "power3.out" });
}

onMounted(async () => {
  await nextTick();
  revealIn();
  await reload();
});

watch(
  () => bankcode.value,
  async (nv, ov) => {
    if (!nv || nv === ov) return;
    await reload();
  }
);

onBeforeUnmount(() => {
  try { socket?.disconnect(); } catch {}
  socket = null;
});
</script>

<style scoped>
/* uses theme vars from App.vue: --panel --stroke --txt --muted --blueA --blueB ... */
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
.muted { color: var(--muted); }
.dotSep { margin: 0 10px; opacity: 0.5; }

.chatRoom{
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: calc(100vh - 40px);
}

/* header style consistent with your dashboards */
.topbar{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap: 14px;

  padding: 14px 16px;
  border-radius: 18px;
  background: var(--panel);
  border: 1px solid var(--stroke);
  backdrop-filter: blur(14px);
  box-shadow: 0 18px 44px rgba(0,0,0,.28);
}

.headline .kicker{
  display:flex;
  align-items:center;
  gap:10px;
  font-size: 12px;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--muted);
}
.kDot{
  width: 10px; height: 10px;
  border-radius: 999px;
  background: radial-gradient(circle at 30% 30%, rgba(255,255,255,.9), rgba(56,189,248,.95));
  box-shadow: 0 0 18px rgba(56,189,248,.25);
}
.title{
  margin: 6px 0 2px;
  font-size: 26px;
  line-height: 1.12;
  letter-spacing: .2px;
}
.subtitle{
  margin: 0;
  font-size: 13px;
  color: rgba(255,255,255,.72);
}

.actions{
  display:flex;
  align-items:center;
  gap: 10px;
}

.pill{
  display:flex;
  align-items:center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(0,0,0,.22);
  border: 1px solid rgba(255,255,255,.10);
}
.pill .dot{
  width: 10px; height: 10px; border-radius: 999px;
  background: rgba(255,255,255,.35);
}
.pill.ok .dot{ background: rgba(60,255,170,.9); box-shadow: 0 0 18px rgba(60,255,170,.18); }
.pill.bad .dot{ background: rgba(255,93,93,.9); box-shadow: 0 0 18px rgba(255,93,93,.18); }

.ok{ color: rgba(60,255,170,.95); }
.bad{ color: rgba(255,120,120,.95); }

.btn{
  display:inline-flex;
  align-items:center;
  gap:10px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(255,255,255,.06);
  color: rgba(255,255,255,.90);
  cursor:pointer;
  transition: background .18s ease, border-color .18s ease;
}
.btn:hover{
  background: rgba(255,255,255,.08);
  border-color: rgba(56,189,248,.22);
}
.btn:disabled{
  opacity:.55;
  cursor:not-allowed;
}
.btn.ghost{
  background: rgba(0,0,0,.18);
}
.btn.primary{
  background: linear-gradient(90deg, rgba(56,189,248,.16), rgba(99,102,241,.12));
  border-color: rgba(56,189,248,.22);
}
.btnIcon.spin{ animation: spin .9s linear infinite; }
@keyframes spin{ to{ transform: rotate(360deg); } }

.grid{
  display:grid;
  grid-template-columns: 1fr;
  gap: 14px;
  align-items: start;
}

/* main card */
.card{
  border-radius: 18px;
  background: var(--panel);
  border: 1px solid var(--stroke);
  overflow: hidden;
  display:flex;
  flex-direction: column;
  min-height: calc(100vh - 140px);
  box-shadow: 0 18px 44px rgba(0,0,0,.28);
}

.cardTop{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255,255,255,.08);
  background: rgba(0,0,0,.16);
}
.cardTitle{
  display:flex;
  align-items:center;
  gap: 10px;
  font-weight: 900;
  color: rgba(255,255,255,.92);
}
.cardMeta{
  font-size: 12px;
  display:flex;
  align-items:center;
  gap: 8px;
  color: rgba(255,255,255,.78);
}

.list{
  flex: 1;
  padding: 14px;
  overflow: auto;
  scroll-behavior: smooth;
}
.list::-webkit-scrollbar{ width: 10px; }
.list::-webkit-scrollbar-thumb{
  background: rgba(255,255,255,.08);
  border-radius: 999px;
}

/* empty / error states */
.state{
  padding: 18px;
  border-radius: 14px;
  background: rgba(0,0,0,.16);
  border: 1px dashed rgba(255,255,255,.14);
  display:flex;
  gap:12px;
  align-items:flex-start;
  color: rgba(255,255,255,.82);
}
.state.err{
  border-style: solid;
  border-color: rgba(255,93,93,.25);
  background: rgba(255,93,93,.06);
}
.stateTitle{ font-weight: 900; margin-bottom: 2px; }
.stateMsg{ color: rgba(255,255,255,.75); }
.spinner{
  width: 14px; height: 14px;
  border-radius: 999px;
  border: 2px solid rgba(255,255,255,.25);
  border-top-color: rgba(255,255,255,.85);
  display:inline-block;
  animation: spin .8s linear infinite;
}

/* message rows */
.row{ display:flex; margin: 10px 0; }
.row.me{ justify-content: flex-end; }
.row.admin{ justify-content: flex-start; }

.bubble{
  max-width: min(760px, 82%);
  border-radius: 16px;
  padding: 10px 12px;
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(0,0,0,.22);
  box-shadow: 0 10px 30px rgba(0,0,0,.25);
}
.row.me .bubble{
  background: linear-gradient(135deg, rgba(56,189,248,.16), rgba(0,0,0,.16));
  border-color: rgba(56,189,248,.22);
}
.row.admin .bubble{
  background: linear-gradient(135deg, rgba(99,102,241,.14), rgba(0,0,0,.16));
  border-color: rgba(99,102,241,.20);
}

.bubbleTop{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap: 10px;
  margin-bottom: 6px;
}
.who{
  display:inline-flex;
  align-items:center;
  gap: 8px;
  font-weight: 900;
  color: rgba(255,255,255,.88);
}
.time{ font-size: 12px; color: rgba(255,255,255,.55); }

.body{
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.4;
  color: rgba(255,255,255,.92);
}

.hint{
  margin-top: 6px;
  font-size: 12px;
  color: rgba(255,255,255,.55);
}
.hint.bad{ color: rgba(255,120,120,.9); }

/* composer */
.composer{
  display:flex;
  gap: 10px;
  padding: 12px;
  border-top: 1px solid rgba(255,255,255,.08);
  background: rgba(0,0,0,.16);
}
.input{
  flex: 1;
  resize: none;
  border-radius: 14px;
  padding: 10px 12px;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.10);
  color: rgba(255,255,255,.92);
  outline: none;
}
.input:focus{
  border-color: rgba(56,189,248,.28);
  box-shadow: 0 0 0 4px rgba(56,189,248,.10);
}

.foot{
  padding: 10px 12px 12px;
  font-size: 12px;
  border-top: 1px solid rgba(255,255,255,.06);
  background: rgba(0,0,0,.10);
}
</style>
