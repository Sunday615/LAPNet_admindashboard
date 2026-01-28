<template>
  <!-- ✅ IMPORTANT: ไม่ต้องมี .app/.tech wrapper เพราะ App.vue ทำให้แล้ว -->
  <section ref="rootEl" class="chatAdmin">
    <!-- header -->
    <header ref="headEl" class="topbar js-reveal">
      <div class="headline">
        <div class="kicker">
          <span class="kDot"></span>
          Admin • MemberBank Chat
        </div>

        <h1 class="title">Inbox</h1>

        <p class="subtitle">
          Realtime chat with each bankcode
          <span class="dotSep">•</span>
          total <b class="mono">{{ filteredBanks.length }}</b>
          <span class="dotSep">•</span>
          unread <b class="mono">{{ totalUnread }}</b>
          <span class="dotSep">•</span>
          socket
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
          @click="reloadAll(true)"
          :disabled="loading"
          @mouseenter="btnHover($event, true)"
          @mouseleave="btnHover($event, false)"
        >
          <span class="btnIcon" :class="{ spin: loading }">⟲</span>
          Refresh
        </button>
      </div>
    </header>

    <div class="grid">
      <!-- LEFT: list -->
      <aside class="left js-reveal">
        <div class="leftTop">
          <div class="field">
            <div class="label">Search bankcode</div>

            <div class="searchRow">
              <input v-model.trim="q" class="input" placeholder="Search…" @keydown.enter.prevent />
              <button
                v-if="q"
                class="btn tiny"
                type="button"
                @click="q = ''"
                title="Clear"
                @mouseenter="btnHover($event, true)"
                @mouseleave="btnHover($event, false)"
              >
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>

          <div class="miniRow">
            <div class="mini">
              <span class="muted">Unread</span>
              <b class="mono">{{ totalUnread }}</b>
            </div>
            <div class="mini">
              <span class="muted">Active</span>
              <b class="mono">{{ active?.bankcode || "-" }}</b>
            </div>
          </div>
        </div>

        <div class="list">
          <div v-if="bankError" class="state err">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <div>
              <div class="stateTitle">Load inbox failed</div>
              <div class="stateMsg">{{ bankError }}</div>
            </div>
          </div>

          <div v-else-if="loading && banks.length === 0" class="state">
            <span class="spinner" aria-hidden="true"></span>
            Loading inbox…
          </div>

          <template v-else>
            <div v-if="filteredBanks.length === 0" class="state">
              <i class="fa-regular fa-folder-open"></i>
              No conversations
            </div>

            <button
              v-for="b in filteredBanks"
              :key="b._key"
              type="button"
              class="item"
              :class="{ active: active?.conversation_id === b.conversation_id }"
              @click="openConversation(b)"
              @mouseenter="itemHover($event, true, b)"
              @mouseleave="itemHover($event, false, b)"
            >
              <div class="itemTop">
                <div class="bank">
                  <i class="fa-solid fa-building-columns"></i>
                  <span class="mono">{{ b.bankcode }}</span>
                </div>

                <div v-if="Number(b.unread_count) > 0" class="badge mono">
                  {{ b.unread_count > 99 ? "99+" : b.unread_count }}
                </div>
              </div>

              <div class="preview">
                {{ b.last_preview || "—" }}
              </div>

              <div class="meta">
                <span class="muted mono">#{{ b.conversation_id || "-" }}</span>
                <span class="dotSep">•</span>
                <span class="muted">{{ formatTime(b.last_message_at || b.updated_at) }}</span>
              </div>
            </button>
          </template>
        </div>
      </aside>

      <!-- RIGHT: chat room -->
      <main class="right js-reveal">
        <div class="roomTop">
          <div class="roomTitle">
            <i class="fa-solid fa-comments"></i>
            <span>ChatRoom</span>
          </div>

          <div class="roomMeta">
            <span class="muted">Bankcode</span>
            <b class="mono">{{ active?.bankcode || "-" }}</b>
            <span class="dotSep">•</span>
            <span class="muted">Conversation</span>
            <b class="mono">{{ active?.conversation_id || "-" }}</b>
          </div>

          <button
            class="btn tiny ghost"
            type="button"
            @click="reloadActive"
            :disabled="!active || msgLoading"
            @mouseenter="btnHover($event, true)"
            @mouseleave="btnHover($event, false)"
          >
            <i class="fa-solid fa-arrows-rotate"></i>
          </button>
        </div>

        <div ref="msgListEl" class="msgs">
          <div v-if="msgError" class="state err big">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <div>
              <div class="stateTitle">Load messages failed</div>
              <div class="stateMsg">{{ msgError }}</div>
            </div>
          </div>

          <div v-else-if="!active" class="state big">
            <i class="fa-regular fa-message"></i>
            Select a bank on the left to start chatting
          </div>

          <div v-else-if="msgLoading && messages.length === 0" class="state big">
            <span class="spinner" aria-hidden="true"></span>
            Loading messages…
          </div>

          <template v-else>
            <div v-if="messages.length === 0" class="state big">
              <i class="fa-regular fa-message"></i>
              No messages yet
            </div>

            <div
              v-for="m in messages"
              :key="m._key"
              class="row"
              :class="{ me: isMe(m), bank: !isMe(m) }"
            >
              <div class="bubble">
                <div class="bubbleTop">
                  <span class="who">
                    <i v-if="isMe(m)" class="fa-solid fa-user-shield"></i>
                    <i v-else class="fa-solid fa-building-columns"></i>
                    {{ isMe(m) ? "Admin" : (active?.bankcode || "Bank") }}
                  </span>
                  <span class="time mono">{{ formatTime(m.created_at) }}</span>
                </div>

                <div class="body">{{ m.body }}</div>

                <div v-if="m._pending" class="hint mono">sending…</div>
                <div v-else-if="m._failed" class="hint bad mono">failed — retry</div>
              </div>
            </div>
          </template>
        </div>

        <div class="composer">
          <textarea
            v-model="draft"
            class="input"
            placeholder="Type message to bank… (Enter to send, Shift+Enter new line)"
            rows="2"
            :disabled="!active"
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
          Dev auth:
          <span class="mono">x-role: admin</span>
          <span class="dotSep">•</span>
          socket auth: <span class="mono">role=admin</span>
        </div>
      </main>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { io } from "socket.io-client";
import gsap from "gsap";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

// state
const loading = ref(false);
const bankError = ref("");
const msgLoading = ref(false);
const msgError = ref("");

const q = ref("");
const banks = reactive([]); // list of conversations
const active = ref(null); // { bankcode, conversation_id, unread_count, ... }
const messages = reactive([]); // current room messages

const draft = ref("");
const msgListEl = ref(null);
const rootEl = ref(null);

const socketStatus = ref("disconnected"); // connecting | connected | disconnected
let socket = null;

// best effort pending map
const pendingMap = new Map(); // client_msg_id -> index

const filteredBanks = computed(() => {
  const s = q.value.trim().toLowerCase();
  if (!s) return banks;
  return banks.filter((b) => String(b.bankcode || "").toLowerCase().includes(s));
});

const totalUnread = computed(() => banks.reduce((sum, b) => sum + Number(b.unread_count || 0), 0));

const canSend = computed(() => !!active.value && socketStatus.value === "connected" && draft.value.trim().length > 0);

// helpers
function makeKey(obj) {
  return obj?.id ? `id:${obj.id}` : `c:${obj.client_msg_id || obj._tmp || Math.random().toString(16).slice(2)}`;
}
function isMe(m) {
  return String(m.sender_role) === "admin";
}
function formatTime(dt) {
  try {
    if (!dt) return "-";
    const d = new Date(dt);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString(undefined, { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" });
  } catch {
    return "-";
  }
}
async function scrollToBottom() {
  await nextTick();
  const el = msgListEl.value;
  if (!el) return;
  el.scrollTop = el.scrollHeight;
}
async function animateLastRow() {
  await nextTick();
  const el = msgListEl.value?.querySelector?.(".row:last-child");
  if (!el) return;
  gsap.fromTo(el, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.22, ease: "power2.out" });
}
function uuid() {
  try {
    return crypto.randomUUID();
  } catch {
    return `c_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}
function bumpConversationToTop(conversationId) {
  const idx = banks.findIndex((b) => Number(b.conversation_id) === Number(conversationId));
  if (idx <= 0) return;
  const [it] = banks.splice(idx, 1);
  banks.unshift(it);
}

// -------- GSAP UI helpers --------
function btnHover(e, enter) {
  gsap.to(e.currentTarget, { y: enter ? -2 : 0, duration: 0.22, ease: "power2.out" });
}
function itemHover(e, enter, b) {
  if (b && active.value?.conversation_id === b.conversation_id) return;
  gsap.to(e.currentTarget, { y: enter ? -1 : 0, duration: 0.18, ease: "power2.out" });
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

// -------- REST --------
async function fetchBanks() {
  const res = await fetch(`${API_BASE}/api/chat/admin/banks`, {
    headers: { "x-role": "admin" },
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`admin/banks failed (${res.status}): ${t || res.statusText}`);
  }
  const data = await res.json();
  const items = Array.isArray(data.items) ? data.items : [];

  banks.splice(0, banks.length);
  for (const it of items) {
    banks.push({
      bankcode: it.bankcode,
      conversation_id: Number(it.conversation_id || it.id || 0),
      unread_count: Number(it.unread_count || it.admin_unread || 0),
      last_preview: it.last_preview || it.last_message || "",
      last_message_at: it.last_message_at || it.last_at || null,
      updated_at: it.updated_at || null,
      _key: `${it.bankcode || "?"}:${it.conversation_id || it.id || Math.random()}`,
    });
  }
}

async function ensureConversationByBankcode(bankcode) {
  const res = await fetch(`${API_BASE}/api/chat/conversations/ensure`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-role": "admin" },
    body: JSON.stringify({ bankcode }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`ensure failed (${res.status}): ${t || res.statusText}`);
  }
  const data = await res.json();
  const id = Number(data.conversation_id || 0);
  if (!id) throw new Error("ensure: conversation_id missing");
  return id;
}

async function loadMessages(conversationId) {
  const res = await fetch(`${API_BASE}/api/chat/conversations/${conversationId}/messages?limit=200`, {
    headers: { "x-role": "admin" },
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`messages failed (${res.status}): ${t || res.statusText}`);
  }
  const data = await res.json();
  const items = Array.isArray(data.items) ? data.items : [];

  messages.splice(0, messages.length);
  for (const m of items) {
    messages.push({ ...m, _pending: false, _failed: false, _key: makeKey(m) });
  }
  await scrollToBottom();
}

// -------- Socket --------
function connectSocket() {
  if (socket) {
    try { socket.disconnect(); } catch {}
    socket = null;
  }

  socketStatus.value = "connecting";

  socket = io(API_BASE, {
    transports: ["websocket"],
    auth: { role: "admin" },
  });

  socket.on("connect", () => {
    socketStatus.value = "connected";
    if (active.value?.conversation_id) {
      socket.emit("chat:join", { conversation_id: active.value.conversation_id }, () => {});
    }
  });

  socket.on("disconnect", () => {
    socketStatus.value = "disconnected";
  });

  socket.on("chat:error", (e) => {
    console.warn("chat:error", e);
  });

  // realtime message (เฉพาะห้องที่ admin join)
  socket.on("chat:new_message", async (msg) => {
    const cid = Number(msg?.conversation_id || 0);
    if (!cid) return;

    // update inbox list (preview/time + bump)
    const bi = banks.find((b) => Number(b.conversation_id) === cid);
    if (bi) {
      bi.last_preview = String(msg?.body || bi.last_preview || "");
      bi.last_message_at = msg?.created_at || bi.last_message_at || null;
      bumpConversationToTop(cid);
    }

    // ถ้าเป็นห้องที่เปิดอยู่ -> append/replace
    if (active.value?.conversation_id === cid) {
      const clientId = msg?.client_msg_id ? String(msg.client_msg_id) : null;

      if (clientId && pendingMap.has(clientId)) {
        const idx = pendingMap.get(clientId);
        if (typeof idx === "number" && messages[idx]) {
          messages[idx] = { ...msg, _pending: false, _failed: false, _key: makeKey(msg) };
        } else {
          messages.push({ ...msg, _pending: false, _failed: false, _key: makeKey(msg) });
        }
        pendingMap.delete(clientId);
      } else {
        const exists = messages.some(
          (m) => (m.id && m.id === msg.id) || (clientId && m.client_msg_id === clientId)
        );
        if (!exists) messages.push({ ...msg, _pending: false, _failed: false, _key: makeKey(msg) });
      }

      if (bi) bi.unread_count = 0;
      await animateLastRow();
      await scrollToBottom();
      return;
    }

    // ห้องอื่น: เพิ่ม unread
    if (bi) bi.unread_count = Number(bi.unread_count || 0) + 1;
  });

  // inbox update สำหรับ admin ทุกคน (ถ้า backend ส่ง event นี้)
  socket.on("chat:inbox_update", (u) => {
    const cid = Number(u?.conversation_id || 0);
    if (!cid) return;

    const bi = banks.find((b) => Number(b.conversation_id) === cid);
    if (bi) {
      bi.last_preview = String(u.last_preview || bi.last_preview || "");
      bi.last_message_at = u.last_at || bi.last_message_at || null;
      bumpConversationToTop(cid);

      if (active.value?.conversation_id !== cid) bi.unread_count = Number(bi.unread_count || 0) + 1;
      else bi.unread_count = 0;
    } else {
      fetchBanks().catch(() => {});
    }
  });
}

// -------- actions --------
async function reloadAll(refreshActiveToo = false) {
  bankError.value = "";
  msgError.value = "";
  loading.value = true;

  try {
    await fetchBanks();

    if (refreshActiveToo && active.value?.conversation_id) {
      // keep selection + clear unread
      const cid = Number(active.value.conversation_id);
      const bi = banks.find((b) => Number(b.conversation_id) === cid);
      if (bi) {
        active.value = { ...active.value, ...bi, unread_count: 0 };
        bi.unread_count = 0;
      }
      await loadMessages(cid);
      if (socket && socketStatus.value === "connected") socket.emit("chat:join", { conversation_id: cid }, () => {});
    }
  } catch (e) {
    bankError.value = e?.message || String(e);
  } finally {
    loading.value = false;
  }
}

async function openConversation(item) {
  msgError.value = "";
  msgLoading.value = true;

  try {
    const bankcode = String(item.bankcode || "").trim();
    let conversation_id = Number(item.conversation_id || 0);

    if (!conversation_id && bankcode) {
      conversation_id = await ensureConversationByBankcode(bankcode);
    }

    // leave previous room (best-effort)
    const prevCid = Number(active.value?.conversation_id || 0);
    if (socket && socketStatus.value === "connected" && prevCid && prevCid !== conversation_id) {
      socket.emit("chat:leave", { conversation_id: prevCid }, () => {});
    }

    active.value = { ...item, bankcode, conversation_id, unread_count: 0 };

    // set list unread = 0
    const bi =
      banks.find((b) => b.bankcode === bankcode) ||
      banks.find((b) => Number(b.conversation_id) === Number(conversation_id));

    if (bi) {
      bi.conversation_id = conversation_id;
      bi.unread_count = 0;
      bumpConversationToTop(conversation_id);
    }

    await loadMessages(conversation_id);

    // join socket room
    if (socket && socketStatus.value === "connected") {
      socket.emit("chat:join", { conversation_id }, () => {});
    }
  } catch (e) {
    msgError.value = e?.message || String(e);
  } finally {
    msgLoading.value = false;
  }
}

async function reloadActive() {
  if (!active.value?.conversation_id) return;
  msgError.value = "";
  msgLoading.value = true;
  try {
    await loadMessages(Number(active.value.conversation_id));
  } catch (e) {
    msgError.value = e?.message || String(e);
  } finally {
    msgLoading.value = false;
  }
}

async function send() {
  if (!canSend.value) return;

  const text = draft.value.trim();
  draft.value = "";

  const conversation_id = Number(active.value.conversation_id);
  const client_msg_id = uuid();

  const optimistic = {
    id: null,
    conversation_id,
    sender_role: "admin",
    sender_bankcode: null,
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

  socket?.emit("chat:send", { conversation_id, body: text, client_msg_id }, (ack) => {
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

  // update preview in inbox immediately (best effort)
  const bi = banks.find((b) => Number(b.conversation_id) === conversation_id);
  if (bi) {
    bi.last_preview = text;
    bi.last_message_at = new Date().toISOString();
    bumpConversationToTop(conversation_id);
  }
}

function onEnter(e) {
  if (e.shiftKey) return;
  send();
}

// lifecycle
onMounted(async () => {
  await nextTick();
  revealIn();
  await reloadAll(false);
  connectSocket();
});

onBeforeUnmount(() => {
  try { socket?.disconnect(); } catch {}
  socket = null;
});
</script>

<style scoped>
/* ใช้ theme vars จาก App.vue: --panel --stroke --txt --muted --blueA --blueB ... */
.mono{
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
.muted{ color: var(--muted); }
.dotSep{ margin: 0 10px; opacity: .5; }

.ok{ color: rgba(60,255,170,.95); }
.bad{ color: rgba(255,120,120,.95); }

.chatAdmin{
  display:flex;
  flex-direction: column;
  gap: 14px;
  min-height: calc(100vh - 40px);
}

/* header */
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

/* buttons */
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
.btn:disabled{ opacity:.55; cursor:not-allowed; }
.btn.ghost{ background: rgba(0,0,0,.18); }
.btn.primary{
  background: linear-gradient(90deg, rgba(56,189,248,.16), rgba(99,102,241,.12));
  border-color: rgba(56,189,248,.22);
}
.btn.tiny{
  padding: 9px 10px;
  border-radius: 12px;
}
.btnIcon.spin{ animation: spin .9s linear infinite; }
@keyframes spin{ to{ transform: rotate(360deg); } }

/* layout */
.grid{
  display:grid;
  grid-template-columns: 360px 1fr;
  gap: 14px;
  align-items: start;
}

/* left panel */
.left, .right{
  border-radius: 18px;
  background: var(--panel);
  border: 1px solid var(--stroke);
  overflow: hidden;
  box-shadow: 0 18px 44px rgba(0,0,0,.26);
}

.left{
  display:flex;
  flex-direction: column;
  min-height: 72vh;
}

.leftTop{
  padding: 12px 12px 10px;
  border-bottom: 1px solid rgba(255,255,255,.08);
  background: rgba(0,0,0,.14);
}

.field .label{
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 6px;
}

.searchRow{
  display:flex;
  gap: 8px;
  align-items:center;
}

.input{
  width: 100%;
  border-radius: 14px;
  padding: 10px 12px;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.10);
  color: rgba(255,255,255,.92);
  outline: none;
  box-sizing: border-box;
}
.input:focus{
  border-color: rgba(56,189,248,.28);
  box-shadow: 0 0 0 4px rgba(56,189,248,.10);
}

.miniRow{
  display:flex;
  gap: 10px;
  margin-top: 10px;
}
.mini{
  flex:1;
  border-radius: 14px;
  padding: 10px 12px;
  background: rgba(0,0,0,.16);
  border: 1px solid rgba(255,255,255,.08);
  display:flex;
  justify-content:space-between;
  align-items:center;
}

/* inbox list */
.list{
  padding: 10px;
  overflow: auto;
}
.list::-webkit-scrollbar{ width: 10px; }
.list::-webkit-scrollbar-thumb{ background: rgba(255,255,255,.08); border-radius: 999px; }

.item{
  width: 100%;
  text-align: left;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,.08);
  background: rgba(0,0,0,.16);
  color: rgba(255,255,255,.9);
  cursor:pointer;
  margin-bottom: 10px;
  transition: border-color .18s ease, background .18s ease;
}
.item:hover{
  border-color: rgba(56,189,248,.18);
  background: rgba(0,0,0,.20);
}
.item.active{
  border-color: rgba(56,189,248,.24);
  background: linear-gradient(90deg, rgba(56,189,248,.12), rgba(99,102,241,.08));
}

.itemTop{
  display:flex;
  align-items:center;
  justify-content:space-between;
  margin-bottom: 8px;
}
.bank{
  display:flex;
  align-items:center;
  gap: 10px;
  font-weight: 950;
}
.badge{
  min-width: 28px;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  background: rgba(255,93,93,.14);
  border: 1px solid rgba(255,93,93,.25);
  display:flex;
  align-items:center;
  justify-content:center;
  font-weight: 950;
}
.preview{
  color: rgba(255,255,255,.75);
  font-size: 13px;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.meta{
  margin-top: 8px;
  font-size: 12px;
  color: rgba(255,255,255,.62);
}

/* right panel */
.right{
  display:flex;
  flex-direction: column;
  min-height: 72vh;
}

.roomTop{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255,255,255,.08);
  background: rgba(0,0,0,.14);
}
.roomTitle{
  display:flex;
  align-items:center;
  gap: 10px;
  font-weight: 950;
}
.roomMeta{
  font-size: 12px;
  color: rgba(255,255,255,.72);
  margin-left: auto;
}

/* messages */
.msgs{
  flex: 1;
  padding: 14px;
  overflow: auto;
  scroll-behavior: smooth;
}
.msgs::-webkit-scrollbar{ width: 10px; }
.msgs::-webkit-scrollbar-thumb{ background: rgba(255,255,255,.08); border-radius: 999px; }

.row{ display:flex; margin: 10px 0; }
.row.me{ justify-content:flex-end; }
.row.bank{ justify-content:flex-start; }

.bubble{
  max-width: min(760px, 86%);
  border-radius: 16px;
  padding: 10px 12px;
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(0,0,0,.22);
  box-shadow: 0 10px 30px rgba(0,0,0,.25);
}
.row.me .bubble{
  background: linear-gradient(135deg, rgba(99,102,241,.14), rgba(0,0,0,.16));
  border-color: rgba(99,102,241,.22);
}
.row.bank .bubble{
  background: linear-gradient(135deg, rgba(56,189,248,.14), rgba(0,0,0,.16));
  border-color: rgba(56,189,248,.22);
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
  font-weight: 950;
}
.time{ font-size: 12px; color: rgba(255,255,255,.55); }
.body{
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.42;
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
  background: rgba(0,0,0,.14);
}

/* state */
.state{
  padding: 18px;
  border-radius: 14px;
  background: rgba(0,0,0,.14);
  border: 1px dashed rgba(255,255,255,.14);
  display:flex;
  gap: 12px;
  align-items:flex-start;
  color: rgba(255,255,255,.82);
}
.state.big{ padding: 20px; }
.state.err{
  border-style: solid;
  border-color: rgba(255,93,93,.25);
  background: rgba(255,93,93,.06);
}
.stateTitle{ font-weight: 950; margin-bottom: 2px; }
.stateMsg{ color: rgba(255,255,255,.75); }

.spinner{
  width: 14px; height: 14px;
  border-radius: 999px;
  border: 2px solid rgba(255,255,255,.25);
  border-top-color: rgba(255,255,255,.85);
  display:inline-block;
  animation: spin .8s linear infinite;
}

/* footer */
.foot{
  padding: 10px 12px 12px;
  font-size: 12px;
  border-top: 1px solid rgba(255,255,255,.06);
  background: rgba(0,0,0,.10);
}

@media (max-width: 980px){
  .grid{ grid-template-columns: 1fr; }
}
</style>
