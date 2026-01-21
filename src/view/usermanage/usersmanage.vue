<!-- src/views/UsersManage.vue -->
<template>
  <div class="page usersPage">
    <div class="inner">
      <!-- Top bar -->
      <header ref="topbarRef" class="topbar">
        <div class="topLeft">
          <div class="titleRow">
            <div class="titleIcon"><i class="fa-solid fa-users-gear"></i></div>
            <div class="titleText">
              <div class="pageTitle">Users Management</div>
              <div class="pageSub">Create • Search • View roles • Bankcode mapping</div>
            </div>
          </div>
        </div>

        <div class="topRight">
          <div class="searchWrap">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input v-model.trim="q" type="text" placeholder="Search username / role / bankcode..." />
          </div>

          <button class="btn ghost" type="button" @click="load" :disabled="loading">
            <i class="fa-solid" :class="loading ? 'fa-spinner fa-spin' : 'fa-rotate'"></i>
            <span>{{ loading ? "Loading..." : "Refresh" }}</span>
          </button>

          <button class="btn" type="button" @click="openCreate()">
            <i class="fa-solid fa-user-plus"></i><span>Create user</span>
          </button>
        </div>
      </header>

      <!-- Card: List -->
      <section ref="cardListRef" class="card">
        <div class="cardHead">
          <div class="hTitle">Users</div>
          <div class="hint">
            Total <b>{{ filtered.length }}</b> / {{ users.length }}
            <span class="dot">•</span>
            Active <b>{{ activeCount }}</b>
            <span class="dot">•</span>
            Inactive <b>{{ inactiveCount }}</b>
          </div>
        </div>

        <div class="msgline" v-if="errorMsg">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span>{{ errorMsg }}</span>
        </div>

        <div class="tableWrap">
          <table class="table">
            <thead>
              <tr>
                <th class="colId">ID</th>
                <th>Username</th>
                <th class="colRole">Role</th>
                <th class="colBank">Bankcode</th>
                <th class="colActive">Active</th>
                <th class="colTime">Created</th>
                <th class="colTime">Updated</th>
                <th class="colActions">Actions</th>
              </tr>
            </thead>

            <tbody>
              <tr v-if="loading">
                <td colspan="8" class="emptyRow">
                  <i class="fa-solid fa-spinner fa-spin"></i> Loading...
                </td>
              </tr>

              <tr v-else-if="!filtered.length">
                <td colspan="8" class="emptyRow">No users found.</td>
              </tr>

              <tr
                v-else
                v-for="u in filtered"
                :key="u.id"
                class="row"
                :class="{ inactive: !toBool(u.is_active) }"
              >
                <td class="mono">{{ u.id }}</td>

                <td class="userCell">
                  <div class="userMain">
                    <div class="avatar" aria-hidden="true">
                      <i class="fa-solid fa-user"></i>
                    </div>
                    <div class="userMeta">
                      <div class="userName">{{ u.username }}</div>
                      <div class="userSub">#{{ u.id }}</div>
                    </div>
                  </div>
                </td>

                <td>
                  <span class="pill" :class="pillRoleClass(u.role)">
                    <i class="fa-solid" :class="roleIcon(u.role)"></i>
                    <span>{{ u.role || "viewer" }}</span>
                  </span>
                </td>

                <td class="mono">
                  <span v-if="u.bankcode" class="bankPill">
                    <i class="fa-solid fa-building-columns"></i>
                    <span>{{ u.bankcode }}</span>
                  </span>
                  <span v-else class="muted">—</span>
                </td>

                <!-- ✅ Toggle Active/Inactive in row -->
                <td>
                  <button
                    type="button"
                    class="miniSwitch"
                    :class="{ on: toBool(u.is_active) }"
                    @click="toggleActiveRow(u)"
                    :disabled="isRowBusy(u.id)"
                    :title="toBool(u.is_active) ? 'Click to set Inactive' : 'Click to set Active'"
                  >
                    <span class="knob"></span>
                    <span class="txt">{{ toBool(u.is_active) ? "Active" : "Inactive" }}</span>
                    <i
                      class="fa-solid ico"
                      :class="toBool(u.is_active) ? 'fa-circle-check' : 'fa-circle-xmark'"
                      aria-hidden="true"
                    ></i>
                  </button>
                </td>

                <td class="mono muted">{{ fmtDate(u.created_at) }}</td>
                <td class="mono muted">{{ fmtDate(u.updated_at) }}</td>

                <!-- ✅ Row actions -->
                <td class="actionsCell">
                  <button class="iconBtn" type="button" @click="openEdit(u)" :disabled="isRowBusy(u.id)" title="Edit">
                    <i class="fa-solid fa-pen-to-square"></i>
                  </button>

                  <button
                    class="iconBtn danger"
                    type="button"
                    @click="deleteUser(u)"
                    :disabled="isRowBusy(u.id)"
                    title="Delete"
                  >
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Card: Quick tips -->
      <section ref="cardTipRef" class="card tip">
        <div class="cardHead">
          <div class="hTitle">Notes</div>
          <div class="hint">Bankcode lets you map a user account to a MemberBank.</div>
        </div>

        <ul class="tips">
          <li>
            For MemberBank login (role <b>viewer</b>), you should pick a MemberBank from dropdown so system stores
            <b>member_id</b> + <b>bankcode</b>.
          </li>
          <li>Admin/Staff can still create accounts without MemberBank (optional), if you allow it in backend.</li>
          <li>
            Make sure your API is reachable. This page tries both relative and
            <span class="mono">http://localhost:3000</span>.
          </li>
        </ul>
      </section>
    </div>

    <!-- Create/Edit Overlay -->
    <div
      ref="overlayRef"
      class="overlay"
      :class="{ isOpen: overlayOpen }"
      :aria-hidden="!overlayOpen"
      @click.self="closeCreate()"
    >
      <div ref="sheetRef" class="sheet" role="dialog" aria-modal="true">
        <div class="sheetHead">
          <div class="sheetTitle">
            <i class="fa-solid" :class="isEditMode ? 'fa-user-pen' : 'fa-user-plus'"></i>
            <div>
              <div class="t1">{{ isEditMode ? "Edit user" : "Create user" }}</div>
              <div class="t2">
                {{
                  isEditMode
                    ? "Update account • role • MemberBank mapping"
                    : "Add login account • role • pick MemberBank (single select)"
                }}
              </div>
            </div>
          </div>

          <button class="iconBtn2" type="button" @click="closeCreate()" title="Close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form class="sheetBody" @submit.prevent="saveUser">
          <div class="grid2">
            <label class="field">
              <span class="label">Username <b class="req">*</b></span>
              <div class="inputWrap">
                <i class="fa-solid fa-user"></i>
                <input v-model.trim="form.username" type="text" placeholder="username" minlength="3" required />
              </div>
              <div class="miniHint">Min 3 characters</div>
            </label>

            <label class="field">
              <span class="label">
                {{ isEditMode ? "New Password" : "Password" }}
                <b class="req" v-if="!isEditMode">*</b>
              </span>
              <div class="inputWrap">
                <i class="fa-solid fa-lock"></i>
                <input
                  v-model="form.password"
                  type="password"
                  :placeholder="isEditMode ? 'leave blank to keep current' : 'password'"
                  :minlength="isEditMode ? 0 : 6"
                  :required="!isEditMode"
                />
              </div>
              <div class="miniHint">{{ isEditMode ? "Leave blank to keep current password" : "Min 6 characters" }}</div>
            </label>
          </div>

          <div class="grid2">
            <label class="field">
              <span class="label">Role</span>
              <div class="selectWrap">
                <i class="fa-solid fa-shield-halved"></i>
                <select v-model="form.role" @change="onRoleChange">
                  <option value="viewer">viewer</option>
                  <option value="staff">staff</option>
                  <option value="admin">admin</option>
                </select>
              </div>
              <div class="miniHint">Default: viewer</div>
            </label>

            <!-- ✅ MemberBank dropdown (single select) -->
            <label class="field">
              <span class="label">MemberBank <b class="req" v-if="memberRequired">*</b></span>

              <div ref="memberSelectWrapRef" class="memberSelect" :class="{ open: memberDropdownOpen }">
                <button class="memberBtn" type="button" @click="toggleMemberDropdown" :disabled="membersLoading">
                  <img
                    v-if="selectedMember?.logo"
                    class="mSelLogo"
                    :src="selectedMember.logo"
                    :alt="selectedMember.name"
                    @error="onBankLogoError"
                  />
                  <div v-else class="mSelPh" aria-hidden="true">
                    <i class="fa-solid fa-building-columns"></i>
                  </div>

                  <div class="mSelText">
                    <div class="mSelName">
                      {{
                        membersLoading ? "Loading MemberBank..." : selectedMember ? selectedMember.name : "Select MemberBank"
                      }}
                    </div>
                    <div class="mSelSub">
                      <span v-if="selectedMember?.bankcode" class="mono">{{ selectedMember.bankcode }}</span>
                      <span v-else class="muted">Choose 1 bank for this account</span>
                    </div>
                  </div>

                  <i class="fa-solid fa-chevron-down chev" :class="{ up: memberDropdownOpen }"></i>
                </button>
              </div>

              <div class="miniHint">
                Selected:
                <b>{{ selectedMember ? selectedMember.name : "—" }}</b>
                <span class="dot">•</span>
                bankcode:
                <b class="mono">{{ form.bankcode || "—" }}</b>
                <span class="dot">•</span>
                member_id:
                <b class="mono">{{ form.member_id ?? "—" }}</b>

                <button
                  v-if="form.bankcode || form.member_id != null"
                  class="miniClear"
                  type="button"
                  @click="clearMember()"
                  :disabled="memberRequired"
                  :title="memberRequired ? 'Viewer role requires MemberBank' : 'Clear selection'"
                >
                  Clear
                </button>
              </div>
            </label>
          </div>

          <label class="field inline">
            <span class="label">Active</span>
            <button type="button" class="switch" :class="{ on: form.is_active }" @click="form.is_active = !form.is_active">
              <span class="knob"></span>
              <span class="swTxt">{{ form.is_active ? "On" : "Off" }}</span>
            </button>
          </label>

          <p v-if="createErr" class="msg err">
            <i class="fa-solid fa-triangle-exclamation"></i> {{ createErr }}
          </p>

          <div class="sheetFoot">
            <button class="btn ghost" type="button" @click="resetForm" :disabled="saving">
              <i class="fa-solid fa-rotate-left"></i><span>{{ isEditMode ? "Reset" : "Reset" }}</span>
            </button>

            <button class="btn" type="submit" :disabled="saving || !canSave">
              <i class="fa-solid" :class="saving ? 'fa-spinner fa-spin' : isEditMode ? 'fa-floppy-disk' : 'fa-user-plus'"></i>
              <span>{{
                saving
                  ? isEditMode
                    ? "Saving..."
                    : "Creating..."
                  : isEditMode
                    ? "Save changes"
                    : "Create user"
              }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ✅ Floating MemberBank menu (teleport to body so it never gets clipped) -->
    <Teleport to="body">
      <Transition name="menuPop">
        <div
          v-show="memberDropdownOpen"
          ref="memberMenuRef"
          class="memberMenu floating"
          :class="{ dropUp: memberDropUp }"
          :style="memberMenuStyle"
          role="listbox"
          aria-label="MemberBank"
        >
          <div class="menuSearch">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input
              ref="memberSearchInputRef"
              v-model.trim="memberQ"
              type="text"
              placeholder="Search bank..."
              @keydown.esc.prevent="closeMemberDropdown"
            />
            <div class="menuMeta" v-if="!membersLoading && !membersError">
              <span class="badge">{{ filteredMembers.length }}</span>
            </div>
          </div>

          <div class="menuList">
            <div class="menuEmpty" v-if="membersLoading">
              <i class="fa-solid fa-spinner fa-spin"></i> Loading members...
            </div>

            <div class="menuEmpty err" v-else-if="membersError">
              <i class="fa-solid fa-triangle-exclamation"></i> {{ membersError }}
            </div>

            <div class="menuEmpty" v-else-if="!filteredMembers.length">No banks found.</div>

            <button
              v-else
              v-for="m in filteredMembers"
              :key="m.member_id ?? m.bankcode"
              type="button"
              class="opt"
              @click="chooseMember(m)"
              :class="{ active: (form.member_id ?? null) === (m.member_id ?? null) && form.bankcode === m.bankcode }"
              :title="m.name"
            >
              <img class="optLogo" :src="m.logo || defaultBankLogo" :alt="m.name" @error="onBankLogoError" />

              <div class="optMeta">
                <div class="optName">{{ m.name }}</div>
                <div class="optSub">
                  <span class="mono code">{{ m.bankcode }}</span>
                  <span class="dot2">•</span>
                  <span class="mono id">id {{ m.member_id ?? "—" }}</span>
                </div>
              </div>

              <i
                v-if="(form.member_id ?? null) === (m.member_id ?? null) && form.bankcode === m.bankcode"
                class="fa-solid fa-check okIco"
              ></i>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ✅ Beautiful Confirm Delete (GSAP) -->
    <Teleport to="body">
      <div
        ref="confirmOverlayRef"
        class="confirmOverlay"
        :class="{ isOpen: confirmOpen }"
        :aria-hidden="!confirmOpen"
        @click.self="cancelConfirm()"
      >
        <div ref="confirmCardRef" class="confirmCard" role="dialog" aria-modal="true" aria-label="Confirm delete">
          <div class="confirmHead">
            <div class="confirmIcon danger" aria-hidden="true">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>

            <div class="confirmText">
              <div class="confirmTitle">{{ confirmData.title }}</div>
              <div class="confirmMsg">{{ confirmData.message }}</div>
            </div>

            <button class="confirmClose" type="button" @click="cancelConfirm()" title="Close">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="confirmActions">
            <button
              ref="confirmCancelBtnRef"
              class="btn ghost"
              type="button"
              @click="cancelConfirm()"
              :disabled="confirmBusy"
            >
              <i class="fa-solid fa-xmark"></i><span>{{ confirmData.cancelText }}</span>
            </button>

            <button ref="confirmOkBtnRef" class="btn danger" type="button" @click="okConfirm()" :disabled="confirmBusy">
              <i class="fa-solid" :class="confirmBusy ? 'fa-spinner fa-spin' : 'fa-trash'"></i>
              <span>{{ confirmBusy ? "Working..." : confirmData.confirmText }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modern Toast -->
    <div ref="toastRef" class="toast" :class="toast.type" v-show="toast.open" role="status" aria-live="polite">
      <div class="toastIcon">
        <i class="fa-solid" :class="toast.type === 'ok' ? 'fa-circle-check' : 'fa-triangle-exclamation'"></i>
      </div>
      <div class="toastBody">
        <div class="toastTitle">{{ toast.title }}</div>
        <div class="toastMsg">{{ toast.message }}</div>
      </div>
      <button class="toastX" type="button" @click="hideToast" title="Close">
        <i class="fa-solid fa-xmark"></i>
      </button>
      <div class="toastBar"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import gsap from "gsap";

/* -----------------------------
  API base
----------------------------- */
const API_BASE = ((import.meta?.env?.VITE_API_BASE ?? "") + "").replace(/\/+$/, "");
const API = (p) => (API_BASE ? `${API_BASE}${p}` : p);

const USERS_ENDPOINTS = [API("/api/users"), "http://localhost:3000/api/users"];
const MEMBERS_ENDPOINTS = [API("/api/members"), "http://localhost:3000/api/members"];

/* -----------------------------
  State
----------------------------- */
const users = ref([]);
const loading = ref(false);
const errorMsg = ref("");
const q = ref("");

/* row busy flags */
const rowSaving = ref({});
const rowDeleting = ref({});

function setFlag(mapRef, id, val) {
  mapRef.value = { ...mapRef.value, [id]: !!val };
}
function isRowBusy(id) {
  return !!rowSaving.value[id] || !!rowDeleting.value[id];
}

/* -----------------------------
  MemberBank dropdown (single select)
  ✅ smooth + clean floating dropdown (Teleport) so it won't be clipped by modal scroll
----------------------------- */
const defaultBankLogo = "/bank-logos/default.png";
const members = ref([]);
const membersLoading = ref(false);
const membersError = ref("");
const memberDropdownOpen = ref(false);
const memberDropUp = ref(false); // used by menu animation direction
const memberQ = ref("");
const memberSelectWrapRef = ref(null);
const memberMenuRef = ref(null);
const memberSearchInputRef = ref(null);

const MENU_EST_HEIGHT = 360;
const MENU_GAP = 10;

const memberMenuPos = ref({
  left: 0,
  top: 0,
  bottom: null,
  width: 0,
  placement: "bottom", // "bottom" | "top"
});

const memberMenuStyle = computed(() => {
  const p = memberMenuPos.value;
  const base = {
    left: `${p.left}px`,
    width: `${p.width}px`,
  };
  if (p.placement === "top") return { ...base, top: "auto", bottom: `${p.bottom ?? 0}px` };
  return { ...base, bottom: "auto", top: `${p.top}px` };
});

function pickArrayFromApi(json) {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.members)) return json.members;
  if (Array.isArray(json?.result)) return json.result;
  return [];
}

function resolveBankLogo(val) {
  const s = (val ?? "").toString().trim();
  if (!s) return "";
  if (/^(https?:|data:|blob:)/i.test(s)) return s;
  if (s.startsWith("/")) return `http://localhost:3000${s}`;
  return `http://localhost:3000/${s.replace(/^\/+/, "")}`;
}

function onBankLogoError(e) {
  const img = e?.target;
  if (img && img.src !== defaultBankLogo) img.src = defaultBankLogo;
}

async function fetchJsonTry(url, opts) {
  const res = await fetch(url, opts);
  const ct = (res.headers.get("content-type") || "").toLowerCase();

  if (!res.ok) {
    if (ct.includes("application/json")) {
      const j = await res.json().catch(() => null);
      throw new Error(j?.message || `Request failed (${res.status})`);
    }
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Request failed (${res.status})`);
  }

  if (ct.includes("application/json")) return res.json();
  const txt = await res.text().catch(() => "");
  try {
    return JSON.parse(txt);
  } catch {
    return txt;
  }
}

function readMemberId(r) {
  const raw =
    r?.idmember ?? r?.IdMember ?? r?.IDMEMBER ?? r?.memberId ?? r?.MemberId ?? r?.idMember ?? r?.member_id ?? null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

async function loadMembers() {
  membersLoading.value = true;
  membersError.value = "";

  try {
    let json = null;
    let lastErr = null;

    for (const url of MEMBERS_ENDPOINTS) {
      try {
        json = await fetchJsonTry(url);
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
      }
    }
    if (!json) throw lastErr || new Error("Fetch members failed.");

    const raw = pickArrayFromApi(json);

    const mapped = (raw || [])
      .map((r) => {
        const bankcode = (r?.Bankcode ?? r?.BankCode ?? r?.bankcode ?? r?.code ?? r?.id ?? "").toString().trim();
        const name = (r?.BanknameLA ?? r?.BankNameLA ?? r?.banknameLA ?? r?.name ?? "").toString().trim();
        const logo = resolveBankLogo(r?.image ?? r?.Image ?? r?.bankLogo ?? r?.logo ?? r?.bank_logo ?? "");
        const member_id = readMemberId(r);
        return { member_id, bankcode, name, logo };
      })
      .filter((m) => m.bankcode && m.name);

    if (!mapped.length) throw new Error("Members API returned no usable rows.");

    // ✅ Sort by member_id ASC (member_id = 1 will be on top), nulls last
    mapped.sort((a, b) => {
      const aa = Number.isFinite(a.member_id) ? a.member_id : Number.POSITIVE_INFINITY;
      const bb = Number.isFinite(b.member_id) ? b.member_id : Number.POSITIVE_INFINITY;

      if (aa !== bb) return aa - bb;

      // tie-breaker: bankcode then name (stable + clean)
      const bc = String(a.bankcode || "").localeCompare(String(b.bankcode || ""), undefined, { sensitivity: "base" });
      if (bc !== 0) return bc;

      return String(a.name || "").localeCompare(String(b.name || ""), undefined, { sensitivity: "base" });
    });

    members.value = mapped;

    // keep selection valid
    if (form.value.bankcode) {
      const found = members.value.find((m) => m.bankcode === form.value.bankcode);
      if (!found) {
        form.value.member_id = null;
        form.value.bankcode = "";
      }
    }
  } catch (err) {
    membersError.value = (err?.message || "Fetch members failed.").toString();
    members.value = [];
  } finally {
    membersLoading.value = false;
  }
}

const filteredMembers = computed(() => {
  const s = memberQ.value.trim().toLowerCase();
  if (!s) return members.value;
  return members.value.filter((m) => m.name.toLowerCase().includes(s) || m.bankcode.toLowerCase().includes(s));
});

const selectedMember = computed(() => {
  if (!form.value.bankcode) return null;
  return members.value.find((m) => m.bankcode === form.value.bankcode) || null;
});

function updateMemberMenuPos() {
  const wrap = memberSelectWrapRef.value;
  const btn = wrap?.querySelector?.(".memberBtn");
  if (!btn) return;

  const r = btn.getBoundingClientRect();

  const width = Math.max(320, r.width);
  const pad = 12;

  let left = r.left;
  // clamp within viewport
  left = Math.min(Math.max(left, pad), window.innerWidth - pad - width);

  const spaceBelow = window.innerHeight - r.bottom;
  const spaceAbove = r.top;

  const preferTop = spaceBelow < MENU_EST_HEIGHT && spaceAbove > spaceBelow;
  const placement = preferTop ? "top" : "bottom";

  memberDropUp.value = placement === "top";

  if (placement === "top") {
    memberMenuPos.value = {
      left,
      width,
      placement,
      top: 0,
      bottom: window.innerHeight - r.top + MENU_GAP,
    };
  } else {
    memberMenuPos.value = {
      left,
      width,
      placement,
      top: r.bottom + MENU_GAP,
      bottom: null,
    };
  }
}

let floatingBound = false;
function bindFloatingEvents() {
  if (floatingBound) return;
  floatingBound = true;
  window.addEventListener("resize", updateMemberMenuPos, { passive: true });
  window.addEventListener("scroll", updateMemberMenuPos, { passive: true, capture: true });
}
function unbindFloatingEvents() {
  if (!floatingBound) return;
  floatingBound = false;
  window.removeEventListener("resize", updateMemberMenuPos);
  window.removeEventListener("scroll", updateMemberMenuPos, true);
}

function toggleMemberDropdown() {
  if (membersLoading.value) return;

  memberDropdownOpen.value = !memberDropdownOpen.value;

  if (memberDropdownOpen.value) {
    if (!members.value.length && !membersLoading.value) loadMembers();

    nextTick(() => {
      bindFloatingEvents();
      updateMemberMenuPos();
      // focus search quickly for smooth UX
      setTimeout(() => memberSearchInputRef.value?.focus?.(), 0);
    });
  } else {
    unbindFloatingEvents();
  }
}

function closeMemberDropdown() {
  memberDropdownOpen.value = false;
  unbindFloatingEvents();
}

function chooseMember(m) {
  form.value.bankcode = m.bankcode;
  form.value.member_id = m.member_id; // ✅ store member_id
  closeMemberDropdown();
}

function clearMember() {
  if (memberRequired.value) return;
  form.value.bankcode = "";
  form.value.member_id = null;
}

/* -----------------------------
  Toast (modern)
----------------------------- */
const toastRef = ref(null);
const toast = ref({ open: false, type: "ok", title: "", message: "" });
let toastTl = null;

function showToast({ type = "ok", title = "Success", message = "" }) {
  toast.value = { open: true, type, title, message };

  nextTick(() => {
    const el = toastRef.value;
    if (!el) return;

    gsap.killTweensOf(el);
    toastTl?.kill();

    gsap.set(el, { autoAlpha: 0, y: -10, scale: 0.985 });

    toastTl = gsap.timeline();
    toastTl
      .to(el, { autoAlpha: 1, y: 0, scale: 1, duration: 0.22, ease: "power3.out" }, 0)
      .fromTo(
        el.querySelector(".toastBar"),
        { scaleX: 1 },
        { scaleX: 0, duration: 3.2, ease: "none", transformOrigin: "0% 50%" },
        0.05
      )
      .to(el, { autoAlpha: 0, y: -10, scale: 0.985, duration: 0.2, ease: "power2.in" }, 3.25)
      .add(() => {
        toast.value.open = false;
      });
  });
}

function hideToast() {
  const el = toastRef.value;
  if (!el) {
    toast.value.open = false;
    return;
  }
  toastTl?.kill();
  gsap.to(el, {
    autoAlpha: 0,
    y: -10,
    scale: 0.985,
    duration: 0.18,
    ease: "power2.in",
    onComplete: () => (toast.value.open = false),
  });
}

/* -----------------------------
  ✅ Confirm Dialog (GSAP) - for Delete
----------------------------- */
const confirmOverlayRef = ref(null);
const confirmCardRef = ref(null);
const confirmCancelBtnRef = ref(null);
const confirmOkBtnRef = ref(null);

const confirmOpen = ref(false);
const confirmBusy = ref(false);
const confirmData = ref({
  title: "Delete user?",
  message: "",
  confirmText: "Delete",
  cancelText: "Cancel",
});

let confirmTl = null;
let confirmResolver = null;

async function openConfirm(opts = {}) {
  confirmBusy.value = false;
  confirmData.value = {
    title: opts.title ?? "Confirm",
    message: opts.message ?? "",
    confirmText: opts.confirmText ?? "Confirm",
    cancelText: opts.cancelText ?? "Cancel",
  };

  confirmOpen.value = true;
  await nextTick();

  const overlay = confirmOverlayRef.value;
  const card = confirmCardRef.value;

  if (!overlay || !card) {
    confirmOpen.value = false;
    return false;
  }

  gsap.killTweensOf([overlay, card]);
  confirmTl?.kill();

  gsap.set(overlay, { display: "flex", autoAlpha: 0, pointerEvents: "auto" });
  gsap.set(card, { autoAlpha: 0, y: 18, scale: 0.985 });

  confirmTl = gsap.timeline();
  confirmTl
    .to(overlay, { autoAlpha: 1, duration: 0.16, ease: "power2.out" }, 0)
    .to(card, { autoAlpha: 1, y: 0, scale: 1, duration: 0.22, ease: "power3.out" }, 0.02);

  // focus safe button
  nextTick(() => confirmCancelBtnRef.value?.focus?.());

  return new Promise((resolve) => {
    confirmResolver = resolve;
  });
}

function closeConfirm(immediate = false) {
  const overlay = confirmOverlayRef.value;
  const card = confirmCardRef.value;

  confirmOpen.value = false;

  if (!overlay || !card) return;

  gsap.killTweensOf([overlay, card]);
  confirmTl?.kill();

  if (immediate) {
    gsap.set(overlay, { display: "none", autoAlpha: 0, pointerEvents: "none" });
    gsap.set(card, { autoAlpha: 0, y: 12, scale: 0.985 });
    return;
  }

  gsap.set(overlay, { pointerEvents: "none" });

  confirmTl = gsap.timeline({
    onComplete: () => gsap.set(overlay, { display: "none" }),
  });

  confirmTl
    .to(card, { autoAlpha: 0, y: 12, scale: 0.985, duration: 0.14, ease: "power2.in" }, 0)
    .to(overlay, { autoAlpha: 0, duration: 0.14, ease: "power2.in" }, 0.02);
}

function cancelConfirm() {
  if (confirmBusy.value) return;
  if (typeof confirmResolver === "function") confirmResolver(false);
  confirmResolver = null;
  closeConfirm();
}

function okConfirm() {
  if (confirmBusy.value) return;
  if (typeof confirmResolver === "function") confirmResolver(true);
  confirmResolver = null;
  closeConfirm();
}

/* -----------------------------
  Helpers
----------------------------- */
function toBool(v) {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  const s = String(v ?? "").trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(s);
}

function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

function roleIcon(role) {
  const r = String(role || "viewer").toLowerCase();
  if (r === "admin") return "fa-crown";
  if (r === "staff") return "fa-user-shield";
  return "fa-eye";
}

function pillRoleClass(role) {
  const r = String(role || "viewer").toLowerCase();
  if (r === "admin") return "roleAdmin";
  if (r === "staff") return "roleStaff";
  return "roleViewer";
}

/* -----------------------------
  API helpers for update/delete
----------------------------- */
function userIdEndpoints(id) {
  const clean = (s) => String(s || "").replace(/\/+$/, "");
  return USERS_ENDPOINTS.map((u) => `${clean(u)}/${id}`);
}

async function requestFirstSuccess(requests) {
  let lastErr = null;
  for (const r of requests) {
    try {
      const json = await fetchJsonTry(r.url, r.opts);
      return json;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("Request failed.");
}

async function apiUpdateUser(id, payload) {
  // try /api/users/:id first (PATCH then PUT)
  const idUrls = userIdEndpoints(id);
  const headers = { "Content-Type": "application/json" };

  const reqs = [
    ...idUrls.map((url) => ({
      url,
      opts: { method: "PATCH", headers, body: JSON.stringify(payload) },
    })),
    ...idUrls.map((url) => ({
      url,
      opts: { method: "PUT", headers, body: JSON.stringify(payload) },
    })),

    // fallback: base /api/users with id in body
    ...USERS_ENDPOINTS.map((url) => ({
      url,
      opts: { method: "PATCH", headers, body: JSON.stringify({ id, ...payload }) },
    })),
    ...USERS_ENDPOINTS.map((url) => ({
      url,
      opts: { method: "PUT", headers, body: JSON.stringify({ id, ...payload }) },
    })),
  ];

  return requestFirstSuccess(reqs);
}

async function apiDeleteUser(id) {
  const idUrls = userIdEndpoints(id);

  const reqs = [
    ...idUrls.map((url) => ({ url, opts: { method: "DELETE" } })),
    // fallback: base delete with body
    ...USERS_ENDPOINTS.map((url) => ({
      url,
      opts: { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) },
    })),
  ];

  return requestFirstSuccess(reqs);
}

/* -----------------------------
  Load users
----------------------------- */
async function load() {
  loading.value = true;
  errorMsg.value = "";

  try {
    let json = null;
    let lastErr = null;

    for (const url of USERS_ENDPOINTS) {
      try {
        json = await fetchJsonTry(url);
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
      }
    }
    if (!json) throw lastErr || new Error("Failed to fetch users.");

    const raw = pickArrayFromApi(json);

    users.value = (raw || []).map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      bankcode: u.bankcode ?? null,
      member_id: u.member_id ?? u.memberId ?? null,
      is_active: u.is_active,
      created_at: u.created_at,
      updated_at: u.updated_at,
    }));

    await nextTick();
    animateRows();
  } catch (err) {
    errorMsg.value = (err?.message || "Failed to fetch users.").toString();
  } finally {
    loading.value = false;
  }
}

/* -----------------------------
  Filter
----------------------------- */
const filtered = computed(() => {
  const s = q.value.trim().toLowerCase();
  if (!s) return users.value;

  return users.value.filter((u) => {
    const a = String(u.username || "").toLowerCase();
    const b = String(u.role || "").toLowerCase();
    const c = String(u.bankcode || "").toLowerCase();
    const id = String(u.id ?? "");
    return a.includes(s) || b.includes(s) || c.includes(s) || id.includes(s);
  });
});

const activeCount = computed(() => filtered.value.filter((u) => toBool(u.is_active)).length);
const inactiveCount = computed(() => filtered.value.filter((u) => !toBool(u.is_active)).length);

/* -----------------------------
  Row actions: toggle / edit / delete
----------------------------- */
async function toggleActiveRow(u) {
  if (!u?.id) return;
  if (isRowBusy(u.id)) return;

  const nextVal = toBool(u.is_active) ? 0 : 1;

  setFlag(rowSaving, u.id, true);
  try {
    await apiUpdateUser(u.id, { is_active: nextVal });

    showToast({
      type: "ok",
      title: "Updated",
      message: `${u.username} • ${nextVal ? "Active" : "Inactive"}`,
    });

    await load();
  } catch (err) {
    showToast({ type: "bad", title: "Update failed", message: (err?.message || "Update failed.").toString() });
  } finally {
    setFlag(rowSaving, u.id, false);
  }
}

async function deleteUser(u) {
  if (!u?.id) return;
  if (isRowBusy(u.id)) return;

  // ✅ Beautiful confirm dialog (GSAP)
  const ok = await openConfirm({
    title: "Delete user?",
    message: `Delete "${u.username}" (ID ${u.id})? This action cannot be undone.`,
    confirmText: "Delete",
    cancelText: "Cancel",
  });
  if (!ok) return;

  setFlag(rowDeleting, u.id, true);
  try {
    await apiDeleteUser(u.id);
    showToast({ type: "ok", title: "Deleted", message: `Deleted ${u.username}` });
    await load();
  } catch (err) {
    showToast({ type: "bad", title: "Delete failed", message: (err?.message || "Delete failed.").toString() });
  } finally {
    setFlag(rowDeleting, u.id, false);
  }
}

/* -----------------------------
  Create/Edit user overlay
----------------------------- */
const overlayRef = ref(null);
const sheetRef = ref(null);
const overlayOpen = ref(false);
let overlayTl = null;

const saving = ref(false);
const createErr = ref("");

const editingId = ref(null);
const isEditMode = computed(() => editingId.value != null);

const form = ref({
  username: "",
  password: "",
  role: "viewer",
  bankcode: "",
  member_id: null,
  is_active: true,
});

const originalEditSnapshot = ref(null);

const memberRequired = computed(() => form.value.role === "viewer");

function onRoleChange() {
  // viewer requires member selection (validated by canSave)
}

const canSave = computed(() => {
  const uOk = form.value.username.trim().length >= 3;
  const passOk = isEditMode.value ? true : (form.value.password || "").length >= 6;
  const memberOk = !memberRequired.value || (!!form.value.bankcode && (form.value.member_id ?? null) !== null);
  return uOk && passOk && memberOk && !saving.value;
});

function setBodyLock(lock) {
  document.documentElement.style.overflow = lock ? "hidden" : "";
  document.body.style.overflow = lock ? "hidden" : "";
}

async function openOverlayCommon() {
  createErr.value = "";
  overlayOpen.value = true;
  setBodyLock(true);

  await nextTick();

  // Load members when opening overlay (so dropdown is ready)
  if (!members.value.length && !membersLoading.value) loadMembers();

  const overlay = overlayRef.value;
  const sheet = sheetRef.value;
  if (!overlay || !sheet) return;

  gsap.killTweensOf([overlay, sheet]);
  overlayTl?.kill();

  gsap.set(overlay, { display: "flex", autoAlpha: 0, pointerEvents: "auto" });
  gsap.set(sheet, { autoAlpha: 0, y: 24, scale: 0.98 });

  overlayTl = gsap.timeline();
  overlayTl
    .to(overlay, { autoAlpha: 1, duration: 0.18, ease: "power2.out" }, 0)
    .to(sheet, { autoAlpha: 1, y: 0, scale: 1, duration: 0.24, ease: "power3.out" }, 0.02);

  nextTick(() => {
    const input = sheet.querySelector("input");
    input?.focus?.();
  });
}

async function openCreate() {
  editingId.value = null;
  originalEditSnapshot.value = null;
  resetForm(true);
  await openOverlayCommon();
}

async function openEdit(u) {
  if (!u?.id) return;

  editingId.value = u.id;
  form.value = {
    username: String(u.username || ""),
    password: "",
    role: String(u.role || "viewer"),
    bankcode: u.bankcode ?? "",
    member_id: u.member_id ?? null,
    is_active: toBool(u.is_active),
  };

  originalEditSnapshot.value = JSON.parse(JSON.stringify(form.value));

  await openOverlayCommon();
}

function closeCreate(immediate = false) {
  const overlay = overlayRef.value;
  const sheet = sheetRef.value;

  overlayOpen.value = false;
  setBodyLock(false);
  closeMemberDropdown();

  if (!overlay || !sheet) return;

  gsap.killTweensOf([overlay, sheet]);
  overlayTl?.kill();

  if (immediate) {
    gsap.set(overlay, { display: "none", autoAlpha: 0, pointerEvents: "none" });
    gsap.set(sheet, { autoAlpha: 0, y: 16, scale: 0.985 });
    return;
  }

  gsap.set(overlay, { pointerEvents: "none" });

  overlayTl = gsap.timeline({
    onComplete: () => gsap.set(overlay, { display: "none" }),
  });

  overlayTl
    .to(sheet, { autoAlpha: 0, y: 16, scale: 0.985, duration: 0.16, ease: "power2.in" }, 0)
    .to(overlay, { autoAlpha: 0, duration: 0.16, ease: "power2.in" }, 0.02);
}

function resetForm(keepEdit = false) {
  if (isEditMode.value && !keepEdit && originalEditSnapshot.value) {
    form.value = JSON.parse(JSON.stringify(originalEditSnapshot.value));
  } else if (!isEditMode.value) {
    form.value = {
      username: "",
      password: "",
      role: "viewer",
      bankcode: "",
      member_id: null,
      is_active: true,
    };
  }
  createErr.value = "";
  memberQ.value = "";
  closeMemberDropdown();
}

async function saveUser() {
  createErr.value = "";

  if (!canSave.value) {
    if (memberRequired.value && (!form.value.bankcode || form.value.member_id == null)) {
      createErr.value = "Please select a MemberBank (required for viewer).";
      return;
    }
    if (!isEditMode.value && (form.value.password || "").length < 6) {
      createErr.value = "Password must be at least 6 characters.";
      return;
    }
    createErr.value = "Please fill required fields.";
    return;
  }

  saving.value = true;

  try {
    let lastErr = null;
    let json = null;

    // CREATE
    if (!isEditMode.value) {
      const payload = {
        username: form.value.username.trim(),
        password: form.value.password,
        role: form.value.role,
        is_active: form.value.is_active ? 1 : 0,
        bankcode: form.value.bankcode || null,
        member_id: form.value.member_id ?? null,
        memberId: form.value.member_id ?? null,
      };

      for (const url of USERS_ENDPOINTS) {
        try {
          json = await fetchJsonTry(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          lastErr = null;
          break;
        } catch (e) {
          lastErr = e;
        }
      }
      if (!json) throw lastErr || new Error("Create user failed.");

      showToast({
        type: "ok",
        title: "User created",
        message: `Created ${payload.username}${payload.bankcode ? ` • ${payload.bankcode}` : ""}${
          payload.member_id != null ? ` • member_id ${payload.member_id}` : ""
        }`,
      });

      closeCreate();
      resetForm(true);
      await load();
      return;
    }

    // EDIT
    const id = editingId.value;
    const payload = {
      username: form.value.username.trim(),
      role: form.value.role,
      is_active: form.value.is_active ? 1 : 0,
      bankcode: form.value.bankcode || null,
      member_id: form.value.member_id ?? null,
      memberId: form.value.member_id ?? null,
    };

    // password optional for edit
    const pwd = (form.value.password || "").trim();
    if (pwd) payload.password = pwd;

    await apiUpdateUser(id, payload);

    showToast({
      type: "ok",
      title: "Saved",
      message: `Updated ${payload.username}${payload.bankcode ? ` • ${payload.bankcode}` : ""}`,
    });

    closeCreate();
    await load();
  } catch (err) {
    const msg = (err?.message || "Save failed.").toString();
    createErr.value = msg;
    showToast({ type: "bad", title: "Save failed", message: msg });
  } finally {
    saving.value = false;
  }
}

/* -----------------------------
  GSAP entrance
----------------------------- */
const topbarRef = ref(null);
const cardListRef = ref(null);
const cardTipRef = ref(null);
let ctx;

function animateRows() {
  const rows = document.querySelectorAll("tbody .row");
  if (!rows?.length) return;
  gsap.fromTo(rows, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.24, ease: "power2.out", stagger: 0.03 });
}

function onKeydown(e) {
  if (e.key === "Escape") {
    // ✅ priority: confirm dialog first
    const overlayEl = confirmOverlayRef.value;
    const isConfirmVisible = overlayEl && window.getComputedStyle(overlayEl).display !== "none";
    if (isConfirmVisible) {
      cancelConfirm();
      return;
    }

    if (memberDropdownOpen.value) closeMemberDropdown();
    else if (overlayOpen.value) closeCreate();
  }
}

function onDocPointerDown(e) {
  if (!memberDropdownOpen.value) return;

  const wrap = memberSelectWrapRef.value;
  const menu = memberMenuRef.value;

  // ✅ allow clicks inside button OR inside floating menu
  if (wrap?.contains?.(e.target)) return;
  if (menu?.contains?.(e.target)) return;

  closeMemberDropdown();
}

function onResize() {
  if (memberDropdownOpen.value) updateMemberMenuPos();
}

onMounted(() => {
  load();

  ctx = gsap.context(() => {
    gsap.set([cardListRef.value, cardTipRef.value], { autoAlpha: 0, y: 18 });

    gsap.fromTo(topbarRef.value, { autoAlpha: 0, y: -14 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out" });

    gsap.to([cardListRef.value, cardTipRef.value], {
      autoAlpha: 1,
      y: 0,
      duration: 0.5,
      ease: "power3.out",
      stagger: 0.08,
      delay: 0.08,
    });

    if (overlayRef.value) gsap.set(overlayRef.value, { display: "none", autoAlpha: 0, pointerEvents: "none" });
    if (confirmOverlayRef.value) gsap.set(confirmOverlayRef.value, { display: "none", autoAlpha: 0, pointerEvents: "none" });
  });

  document.addEventListener("keydown", onKeydown);
  document.addEventListener("pointerdown", onDocPointerDown, true);
  window.addEventListener("resize", onResize);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKeydown);
  document.removeEventListener("pointerdown", onDocPointerDown, true);
  window.removeEventListener("resize", onResize);

  closeMemberDropdown();
  closeCreate(true);
  closeConfirm(true);
  ctx?.revert();
});

watch(
  () => q.value,
  async () => {
    await nextTick();
    animateRows();
  }
);

watch(
  () => memberDropdownOpen.value,
  async (open) => {
    if (!open) return;
    await nextTick();
    updateMemberMenuPos();
  }
);
</script>

<style scoped>
/* ===== Layout ===== */
.page.usersPage {
  padding: 18px 18px 28px;
  min-height: calc(100vh - 12px);
}
.inner {
  width: 100%;
  max-width: 100%;
  margin: 0;
}

/* ===== Topbar ===== */
.topbar {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 14px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(8, 16, 38, 0.55);
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.28);
  margin-bottom: 14px;
}
.topLeft {
  min-width: 220px;
}
.topRight {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.titleRow {
  display: flex;
  align-items: center;
  gap: 12px;
}
.titleIcon {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 30% 30%, rgba(90, 180, 255, 0.25), rgba(0, 0, 0, 0));
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.titleIcon i {
  font-size: 18px;
  color: rgba(210, 235, 255, 0.95);
}
.pageTitle {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.2px;
  color: rgba(240, 250, 255, 0.98);
}
.pageSub {
  font-size: 12px;
  color: rgba(210, 235, 255, 0.7);
  margin-top: 2px;
}
.searchWrap {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(10, 20, 45, 0.42);
  min-width: min(520px, 72vw);
}
.searchWrap input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: rgba(240, 250, 255, 0.95);
  font-size: 12px;
}

/* ===== Cards ===== */
.card {
  width: 100%;
  border-radius: 18px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(8, 16, 38, 0.45);
  backdrop-filter: blur(10px);
  box-shadow: 0 12px 34px rgba(0, 0, 0, 0.25);
  margin-bottom: 14px;
}
.card.tip {
  background: rgba(8, 16, 38, 0.38);
}
.cardHead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}
.hTitle {
  font-size: 13px;
  font-weight: 900;
  color: rgba(240, 250, 255, 0.95);
}
.hint {
  font-size: 12px;
  color: rgba(210, 235, 255, 0.65);
}
.dot {
  margin: 0 8px;
  opacity: 0.6;
}

/* ===== Buttons ===== */
.btn {
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(90, 180, 255, 0.18);
  color: rgba(240, 250, 255, 0.95);
  padding: 10px 12px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-weight: 900;
  font-size: 12px;
}
.btn:hover {
  background: rgba(90, 180, 255, 0.24);
}
.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.btn.ghost {
  background: rgba(255, 255, 255, 0.06);
}
.btn.ghost:hover {
  background: rgba(255, 255, 255, 0.1);
}
/* ✅ Danger button (for confirm delete) */
.btn.danger {
  background: rgba(255, 90, 90, 0.12);
  border-color: rgba(255, 90, 90, 0.22);
}
.btn.danger:hover {
  background: rgba(255, 90, 90, 0.18);
}

/* ===== Messages ===== */
.msgline {
  margin-bottom: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  font-weight: 800;
  background: rgba(255, 90, 90, 0.08);
  color: rgba(255, 210, 210, 0.95);
}

/* ===== Table ===== */
.tableWrap {
  overflow: auto;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(10, 20, 45, 0.32);
}
.table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1040px;
}
thead th {
  text-align: left;
  font-size: 11px;
  color: rgba(210, 235, 255, 0.7);
  padding: 12px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: sticky;
  top: 0;
  background: rgba(10, 20, 45, 0.65);
  backdrop-filter: blur(10px);
  z-index: 1;
}
tbody td {
  padding: 12px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  color: rgba(240, 250, 255, 0.92);
  font-size: 12px;
}
tbody tr:hover td {
  background: rgba(90, 180, 255, 0.06);
}
tbody tr.inactive td {
  opacity: 0.78;
}
.emptyRow {
  text-align: center;
  padding: 18px 12px;
  color: rgba(210, 235, 255, 0.7);
}
.colId {
  width: 70px;
}
.colRole {
  width: 140px;
}
.colBank {
  width: 170px;
}
.colActive {
  width: 180px;
}
.colTime {
  width: 170px;
}
.colActions {
  width: 120px;
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
.muted {
  color: rgba(210, 235, 255, 0.65);
}

/* User cell */
.userCell .userMain {
  display: flex;
  align-items: center;
  gap: 10px;
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 30% 30%, rgba(90, 180, 255, 0.18), rgba(0, 0, 0, 0));
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.userName {
  font-weight: 900;
  color: rgba(240, 250, 255, 0.95);
}
.userSub {
  margin-top: 2px;
  font-size: 11px;
  color: rgba(210, 235, 255, 0.62);
}

/* Pills */
.pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(90, 180, 255, 0.11);
  color: rgba(240, 250, 255, 0.95);
  font-weight: 900;
  font-size: 12px;
}
.pill.roleAdmin {
  background: rgba(255, 215, 90, 0.12);
}
.pill.roleStaff {
  background: rgba(180, 140, 255, 0.12);
}
.pill.roleViewer {
  background: rgba(90, 180, 255, 0.12);
}
.bankPill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(90, 180, 255, 0.09);
}

/* ✅ mini switch in table */
.miniSwitch {
  width: 100%;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(240, 250, 255, 0.95);
  padding: 8px 10px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-weight: 900;
  font-size: 12px;
  justify-content: space-between;
}
.miniSwitch:hover {
  background: rgba(255, 255, 255, 0.09);
}
.miniSwitch:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.miniSwitch .knob {
  width: 34px;
  height: 18px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  position: relative;
  background: rgba(255, 255, 255, 0.08);
  flex: 0 0 auto;
}
.miniSwitch .knob::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 2px;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: rgba(240, 250, 255, 0.95);
  transition: left 0.18s ease;
}
.miniSwitch.on {
  background: rgba(80, 255, 180, 0.08);
  border-color: rgba(80, 255, 180, 0.2);
}
.miniSwitch.on .knob {
  background: rgba(80, 255, 180, 0.16);
}
.miniSwitch.on .knob::after {
  left: 18px;
}
.miniSwitch .txt {
  opacity: 0.92;
}
.miniSwitch .ico {
  opacity: 0.9;
}

/* ✅ Row action buttons */
.actionsCell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.iconBtn {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(90, 180, 255, 0.08);
  color: rgba(240, 250, 255, 0.92);
  cursor: pointer;
  display: grid;
  place-items: center;
}
.iconBtn:hover {
  background: rgba(90, 180, 255, 0.14);
}
.iconBtn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.iconBtn.danger {
  background: rgba(255, 90, 90, 0.07);
  border-color: rgba(255, 90, 90, 0.2);
}
.iconBtn.danger:hover {
  background: rgba(255, 90, 90, 0.12);
}

/* Tips */
.tips {
  margin: 0;
  padding-left: 18px;
  color: rgba(210, 235, 255, 0.75);
  font-size: 12px;
  line-height: 1.55;
}
.tips li {
  margin: 8px 0;
}

/* ===== Overlay ===== */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: none; /* GSAP set to flex */
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(0, 0, 0, 0.52);
  backdrop-filter: blur(10px);
  pointer-events: none;
}
.overlay.isOpen {
  pointer-events: auto;
}
.sheet {
  width: min(820px, 96vw);
  max-height: min(760px, 88vh);
  display: flex;
  flex-direction: column;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(8, 16, 38, 0.86);
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}
.sheetHead {
  padding: 14px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.sheetTitle {
  display: flex;
  align-items: center;
  gap: 12px;
  color: rgba(240, 250, 255, 0.95);
}
.sheetTitle i {
  width: 42px;
  height: 42px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: rgba(90, 180, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.t1 {
  font-size: 13px;
  font-weight: 900;
}
.t2 {
  font-size: 12px;
  color: rgba(210, 235, 255, 0.68);
  margin-top: 2px;
}
.iconBtn2 {
  width: 40px;
  height: 40px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 90, 90, 0.08);
  color: rgba(240, 250, 255, 0.92);
  cursor: pointer;
}
.iconBtn2:hover {
  background: rgba(255, 90, 90, 0.14);
}

.sheetBody {
  padding: 12px 14px 14px;
  overflow: auto;
  flex: 1;
}
.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}
.field .label {
  display: inline-block;
  font-size: 12px;
  font-weight: 800;
  color: rgba(230, 245, 255, 0.88);
  margin-bottom: 6px;
}
.req {
  color: rgba(255, 120, 120, 0.95);
}
.inputWrap {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(10, 20, 45, 0.42);
}
.inputWrap input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: rgba(240, 250, 255, 0.95);
  font-size: 13px;
}
.selectWrap {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(10, 20, 45, 0.42);
}
.selectWrap select {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: rgba(240, 250, 255, 0.95);
  font-size: 13px;
}
.miniHint {
  margin-top: 6px;
  font-size: 11px;
  color: rgba(210, 235, 255, 0.62);
}
.miniClear {
  margin-left: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(240, 250, 255, 0.92);
  border-radius: 999px;
  padding: 4px 10px;
  font-weight: 900;
  font-size: 11px;
  cursor: pointer;
}
.miniClear:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ✅ MemberBank custom dropdown (button only; menu is floating teleported) */
.memberSelect {
  position: relative;
}
.memberBtn {
  width: 100%;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(10, 20, 45, 0.42);
  color: rgba(240, 250, 255, 0.95);
  padding: 10px 12px;
  display: grid;
  grid-template-columns: 32px 1fr 16px;
  gap: 10px;
  align-items: center;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;
}
.memberSelect.open .memberBtn {
  border-color: rgba(90, 180, 255, 0.22);
  background: rgba(90, 180, 255, 0.07);
}
.memberBtn:hover {
  background: rgba(10, 20, 45, 0.55);
}
.memberBtn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.mSelLogo {
  width: 30px;
  height: 30px;
  border-radius: 12px;
  object-fit: contain;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
}
.mSelPh {
  width: 30px;
  height: 30px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(90, 180, 255, 0.08);
}
.mSelText {
  min-width: 0;
}
.mSelName {
  font-size: 13px;
  font-weight: 900;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mSelSub {
  margin-top: 2px;
  font-size: 11px;
  color: rgba(210, 235, 255, 0.65);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.chev {
  opacity: 0.85;
  transition: transform 0.18s ease;
}
.chev.up {
  transform: rotate(180deg);
}

/* ✅ Smooth floating menu */
.menuPop-enter-active,
.menuPop-leave-active {
  transition: opacity 0.14s ease, transform 0.16s ease;
  will-change: opacity, transform;
}
.menuPop-enter-from,
.menuPop-leave-to {
  opacity: 0;
  transform: translateY(var(--menu-shift, 8px)) scale(0.985);
}
.menuPop-enter-to,
.menuPop-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.memberMenu {
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(8, 16, 38, 0.92);
  backdrop-filter: blur(12px);
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.55);
  overflow: hidden;
}
.memberMenu.floating {
  position: fixed;
  z-index: 10080;
  --menu-shift: 10px;
  transform-origin: 50% 0%;
}
.memberMenu.floating.dropUp {
  --menu-shift: -10px;
  transform-origin: 50% 100%;
}

.menuSearch {
  padding: 10px 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(10, 20, 45, 0.4);
}
.menuSearch input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: rgba(240, 250, 255, 0.95);
  font-size: 12px;
}
.menuMeta {
  flex: 0 0 auto;
}
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(90, 180, 255, 0.12);
  color: rgba(240, 250, 255, 0.92);
  font-weight: 900;
  font-size: 11px;
}

.menuList {
  max-height: 260px;
  overflow: auto;
  padding: 6px;
}
.opt {
  width: 100%;
  border: 0;
  background: transparent;
  color: rgba(240, 250, 255, 0.95);
  padding: 10px 10px;
  border-radius: 14px;
  display: grid;
  grid-template-columns: 30px 1fr 18px;
  gap: 10px;
  align-items: center;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s ease, transform 0.12s ease;
}
.opt:hover {
  background: rgba(90, 180, 255, 0.12);
  transform: translateY(-1px);
}
.opt:active {
  transform: translateY(0px);
}
.opt.active {
  background: rgba(90, 180, 255, 0.18);
}
.optLogo {
  width: 28px;
  height: 28px;
  border-radius: 12px;
  object-fit: contain;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
}
.optMeta {
  min-width: 0;
}
.optName {
  font-size: 12px;
  font-weight: 900;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.optSub {
  margin-top: 2px;
  font-size: 11px;
  color: rgba(210, 235, 255, 0.65);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.optSub .dot2 {
  margin: 0 6px;
  opacity: 0.6;
}
.okIco {
  opacity: 0.95;
}

.menuEmpty {
  padding: 14px 10px;
  text-align: center;
  font-size: 12px;
  color: rgba(210, 235, 255, 0.68);
}
.menuEmpty.err {
  color: rgba(255, 210, 210, 0.95);
}

.field.inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 6px;
}
.switch {
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(240, 250, 255, 0.95);
  padding: 8px 10px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-weight: 900;
  font-size: 12px;
}
.switch .knob {
  width: 34px;
  height: 18px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  position: relative;
  background: rgba(255, 255, 255, 0.08);
}
.switch .knob::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 2px;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: rgba(240, 250, 255, 0.95);
  transition: left 0.18s ease;
}
.switch.on {
  background: rgba(90, 180, 255, 0.12);
}
.switch.on .knob {
  background: rgba(90, 180, 255, 0.2);
}
.switch.on .knob::after {
  left: 18px;
}
.swTxt {
  opacity: 0.9;
}

.sheetFoot {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.msg {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  font-weight: 800;
}
.msg.err {
  background: rgba(255, 90, 90, 0.08);
  color: rgba(255, 210, 210, 0.95);
}

/* ===== ✅ Confirm Dialog ===== */
.confirmOverlay {
  position: fixed;
  inset: 0;
  z-index: 10120;
  display: none; /* GSAP set to flex */
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(10px);
  pointer-events: none;
}
.confirmOverlay.isOpen {
  pointer-events: auto;
}
.confirmCard {
  width: min(560px, 94vw);
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(8, 16, 38, 0.92);
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.55);
  overflow: hidden;
}
.confirmHead {
  display: grid;
  grid-template-columns: 44px 1fr 40px;
  gap: 12px;
  align-items: center;
  padding: 14px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.confirmIcon {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 90, 90, 0.1);
  color: rgba(255, 220, 220, 0.98);
}
.confirmText {
  min-width: 0;
}
.confirmTitle {
  font-size: 13px;
  font-weight: 950;
  color: rgba(240, 250, 255, 0.96);
}
.confirmMsg {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(210, 235, 255, 0.7);
  line-height: 1.4;
}
.confirmClose {
  width: 40px;
  height: 40px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(240, 250, 255, 0.92);
  cursor: pointer;
  display: grid;
  place-items: center;
}
.confirmClose:hover {
  background: rgba(255, 255, 255, 0.1);
}
.confirmActions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 14px 14px;
}

/* ===== Toast ===== */
.toast {
  position: fixed;
  right: 18px;
  top: 18px;
  z-index: 10050;
  width: min(420px, calc(100vw - 36px));
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(8, 16, 38, 0.88);
  backdrop-filter: blur(10px);
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.55);
  display: grid;
  grid-template-columns: 44px 1fr 40px;
  gap: 12px;
  padding: 12px 12px;
  overflow: hidden;
}
.toast.ok {
  border-color: rgba(80, 255, 180, 0.25);
}
.toast.bad {
  border-color: rgba(255, 90, 90, 0.25);
}
.toastIcon {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(90, 180, 255, 0.1);
}
.toastTitle {
  font-size: 13px;
  font-weight: 900;
  color: rgba(240, 250, 255, 0.95);
}
.toastMsg {
  margin-top: 2px;
  font-size: 12px;
  color: rgba(210, 235, 255, 0.72);
  line-height: 1.35;
}
.toastX {
  width: 40px;
  height: 40px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(240, 250, 255, 0.92);
  cursor: pointer;
}
.toastX:hover {
  background: rgba(255, 255, 255, 0.1);
}
.toastBar {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  width: 100%;
  background: rgba(90, 180, 255, 0.5);
  transform-origin: 0% 50%;
}

/* ===== Responsive ===== */
@media (max-width: 980px) {
  .searchWrap {
    min-width: min(520px, 92vw);
  }
}
@media (max-width: 900px) {
  .topbar {
    flex-direction: column;
    align-items: stretch;
  }
  .topRight {
    width: 100%;
    justify-content: flex-start;
  }
  .grid2 {
    grid-template-columns: 1fr;
  }
}
</style>
