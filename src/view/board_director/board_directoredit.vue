<!-- BoardDirectorEdit.vue
  ✅ ใช้ template เดิมจาก Insert แต่ปรับเป็นหน้า EDIT
  - route: /boarddirectoredit?id=123
  - GET:  /api/boarddirector/:id   (มี fallback เป็น /api/boarddirector?id=)
  - PUT:  /api/boarddirector/:id   (fallback PATCH ถ้า PUT ไม่ได้)
  - multipart/form-data (อัปโหลดรูปใหม่ได้ / หรือใช้รูปเดิมได้)
  - fields ให้ตรง table: (idboarddirector, name, role, profile, bankname, committee, createat, banklogo)
-->
<template>
  <div class="page tech">
    <div class="glow glow-a"></div>
    <div class="glow glow-b"></div>

    <!-- ✅ COOL TOAST ALERT -->
    <div class="toastWrap" aria-live="polite" aria-atomic="true">
      <div v-if="toast.show" ref="toastEl" class="toast" :class="toast.type" role="status">
        <div class="toastIcon">
          <i v-if="toast.type === 'success'" class="fa-solid fa-circle-check"></i>
          <i v-else class="fa-solid fa-triangle-exclamation"></i>
        </div>

        <div class="toastBody">
          <div class="toastTitle">
            {{ toast.type === "success" ? "Saved!" : "Error" }}
          </div>
          <div class="toastText">{{ toast.message }}</div>
        </div>

        <button class="toastClose" type="button" @click="hideToast" title="Close">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>

    <main class="layout">
      <section class="content">
        <header ref="headEl" class="head js-reveal">
          <div class="headLeft">
            <button
              class="backBtn"
              type="button"
              @click="goBack"
              @mouseenter="btnHover($event, true)"
              @mouseleave="btnHover($event, false)"
            >
              <i class="fa-solid fa-arrow-left"></i>
            </button>
            <div>
              <div class="title">Board Director</div>
              <div class="sub">
                ແກ້ໄຂຂໍ້ມູນສະພາບໍລິຫານງານ • ID:
                <b>{{ id || "-" }}</b>
              </div>
            </div>
          </div>

          <div class="headRight js-reveal">
            <span class="pill"><i class="fa-solid fa-pen-to-square"></i> Edit Mode</span>
            <span class="pillSoft mini" v-if="form.createat">
              <i class="fa-regular fa-clock"></i>
              {{ form.createat }}
            </span>
          </div>
        </header>

        <section ref="cardEl" class="card js-card">
          <div class="cardTop">
            <div class="cardTitle">
              <i class="fa-solid fa-people-group"></i>
              Edit Board Director Information
            </div>
            <div class="cardHint">
              <span v-if="loading"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</span>
              <span v-else-if="saving"><i class="fa-solid fa-spinner fa-spin"></i> Saving...</span>
              <span v-else>Update & Save changes</span>
            </div>
          </div>

          <form class="form" @submit.prevent="onSubmit">
            <!-- ===================== -->
            <!-- COMMITTEE NAVBAR -->
            <!-- ===================== -->
            <div class="sectionTitle js-reveal">
              <i class="fa-solid fa-diagram-project"></i> Committee
            </div>

            <div class="committeeBar js-reveal">
              <button
                v-for="c in committees"
                :key="c.key"
                type="button"
                class="cBtn"
                :class="{ on: form.committee === c.key }"
                @click="setCommittee(c.key)"
                @mouseenter="chipHover($event, true)"
                @mouseleave="chipHover($event, false)"
              >
                <span class="cIcon"><i :class="c.icon"></i></span>
                <span class="cLabel">{{ c.label }}</span>
                <span class="cDot" :class="{ on: form.committee === c.key }"></span>
              </button>

              <span class="committeePill">
                <i class="fa-solid fa-tag"></i>
                {{ committeeLabel(form.committee) }}
              </span>
            </div>

            <div class="divider"></div>

            <!-- ===================== -->
            <!-- SECTION: Bank -->
            <!-- ===================== -->
            <div class="row">
              <label class="label">
                <span>Bank Name</span>
                <div class="inputWrap">
                  <i class="fa-solid fa-building"></i>
                  <input v-model.trim="form.bankName" class="inp" type="text" placeholder="e.g. BCEL" />
                </div>
                <div v-if="errors.bankName" class="err">{{ errors.bankName }}</div>
              </label>

              <label class="label">
                <span>Role (Board Position)</span>
                <div class="inputWrap">
                  <i class="fa-solid fa-id-badge"></i>
                  <input
                    v-model.trim="form.role"
                    class="inp"
                    type="text"
                    placeholder="e.g. Chairman / Director / President / Vice President"
                  />
                </div>
                <div v-if="errors.role" class="err">{{ errors.role }}</div>
              </label>
            </div>

            <div class="divider"></div>

            <!-- ===================== -->
            <!-- SECTION: Person -->
            <!-- ===================== -->
            <div class="sectionTitle js-reveal">
              <i class="fa-solid fa-user-tie"></i> Person Information
            </div>

            <label class="label">
              <span>Person Name</span>
              <div class="inputWrap">
                <i class="fa-solid fa-user"></i>
                <input v-model.trim="form.personName" class="inp" type="text" placeholder="Full name..." />
              </div>
              <div v-if="errors.personName" class="err">{{ errors.personName }}</div>
            </label>

            <div class="divider"></div>

            <!-- ===================== -->
            <!-- SECTION: Uploads + Preview -->
            <!-- ===================== -->
            <div class="sectionTitle js-reveal">
              <i class="fa-regular fa-image"></i> Upload & Preview
            </div>

            <div class="dualUpload js-reveal">
              <!-- Bank logo -->
              <div class="upCard">
                <div class="upTop">
                  <div class="upTitle"><i class="fa-solid fa-circle-nodes"></i> Bank Logo</div>

                  <div style="display: flex; gap: 10px; align-items: center">
                    <span class="badge" v-if="bankLogoIsExisting && !form.bankLogo">
                      <i class="fa-solid fa-link"></i> Existing
                    </span>

                    <button
                      v-if="logoPreview || bankLogoIsExisting"
                      class="miniBtn"
                      type="button"
                      @click="clearLogo"
                      @mouseenter="btnHover($event, true)"
                      @mouseleave="btnHover($event, false)"
                    >
                      <i class="fa-solid fa-trash"></i> Remove
                    </button>
                  </div>
                </div>

                <input ref="logoEl" class="fileHidden" type="file" accept="image/*" @change="onPickLogo" />

                <div class="imgBox small clickable" @click="triggerPickLogo" title="Click to upload bank logo">
                  <img v-if="logoPreview" :src="logoPreview" alt="bank logo preview" />
                  <img v-else-if="bankLogoIsExisting" :src="existingBankLogoUrl" alt="bank logo existing" />
                  <div v-else class="imgEmpty">
                    <i class="fa-regular fa-image"></i>
                    <div>No logo</div>
                    <div class="imgHint">Click to upload</div>
                  </div>
                </div>

                <div v-if="errors.bankLogo" class="err" style="margin-top: 10px">{{ errors.bankLogo }}</div>

                <div v-if="form.bankLogoPath && !form.bankLogo" class="pathHint">
                  <i class="fa-solid fa-paperclip"></i> {{ form.bankLogoPath }}
                </div>
              </div>

              <!-- Person profile -->
              <div class="upCard">
                <div class="upTop">
                  <div class="upTitle"><i class="fa-solid fa-user-astronaut"></i> Profile Person</div>

                  <div style="display: flex; gap: 10px; align-items: center">
                    <span class="badge" v-if="profileIsExisting && !form.profileImage">
                      <i class="fa-solid fa-link"></i> Existing
                    </span>

                    <button
                      v-if="profilePreview || profileIsExisting"
                      class="miniBtn"
                      type="button"
                      @click="clearProfile"
                      @mouseenter="btnHover($event, true)"
                      @mouseleave="btnHover($event, false)"
                    >
                      <i class="fa-solid fa-trash"></i> Remove
                    </button>
                  </div>
                </div>

                <input ref="profileEl" class="fileHidden" type="file" accept="image/*" @change="onPickProfile" />

                <div class="imgBox clickable" @click="triggerPickProfile" title="Click to upload person profile">
                  <img v-if="profilePreview" :src="profilePreview" alt="profile preview" />
                  <img v-else-if="profileIsExisting" :src="existingProfileUrl" alt="profile existing" />
                  <div v-else class="imgEmpty">
                    <i class="fa-regular fa-image"></i>
                    <div>No profile</div>
                    <div class="imgHint">Click to upload</div>
                  </div>
                </div>

                <div v-if="errors.profileImage" class="err" style="margin-top: 10px">{{ errors.profileImage }}</div>

                <div v-if="form.profilePath && !form.profileImage" class="pathHint">
                  <i class="fa-solid fa-paperclip"></i> {{ form.profilePath }}
                </div>
              </div>
            </div>

            <!-- ===================== -->
            <!-- PREVIEW -->
            <!-- ===================== -->
            <div class="previewWrap js-reveal">
              <div class="previewTop">
                <div class="previewTitle">
                  <i class="fa-solid fa-wand-magic-sparkles"></i>
                  Preview
                </div>

                <div class="previewPills">
                  <span class="pillSoft">
                    <i class="fa-solid fa-tag"></i>
                    {{ committeeLabel(form.committee) }}
                  </span>

                  <span class="pillSoft">
                    <i class="fa-regular fa-clock"></i>
                    {{ form.createat || "-" }}
                  </span>
                </div>
              </div>

              <div class="previewCard">
                <div class="leftCol">
                  <div class="logoLine">
                    <div class="logoMini">
                      <img v-if="logoPreview" :src="logoPreview" alt="logo mini" />
                      <img v-else-if="bankLogoIsExisting" :src="existingBankLogoUrl" alt="logo mini existing" />
                      <div v-else class="logoEmpty"><i class="fa-solid fa-circle-nodes"></i></div>
                    </div>
                    <div class="bankText">
                      <div class="bankName">{{ form.bankName || "Bank name" }}</div>
                      <div class="bankRole">{{ form.role || "Role" }}</div>
                    </div>
                  </div>

                  <div class="personLine">
                    <div class="personName">{{ form.personName || "Person name" }}</div>
                    <div class="mutedSmall">
                      {{ committeeLabel(form.committee) }} • Board Director profile
                    </div>
                  </div>
                </div>

                <div class="rightCol">
                  <div class="avatar">
                    <img v-if="profilePreview" :src="profilePreview" alt="profile" />
                    <img v-else-if="profileIsExisting" :src="existingProfileUrl" alt="profile existing" />
                    <div v-else class="avatarEmpty">
                      <i class="fa-solid fa-user"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ===================== -->
            <!-- ACTIONS -->
            <!-- ===================== -->
            <div ref="actionsEl" class="actions js-reveal">
              <button
                class="btn ghost"
                type="button"
                :disabled="saving || loading"
                @click="resetToLoaded"
                @mouseenter="btnHover($event, true)"
                @mouseleave="btnHover($event, false)"
              >
                <i class="fa-solid fa-rotate-left"></i> Reset
              </button>

              <button
                class="btn"
                type="button"
                :disabled="saving || loading"
                @click="reload"
                @mouseenter="btnHover($event, true)"
                @mouseleave="btnHover($event, false)"
              >
                <i class="fa-solid" :class="loading ? 'fa-spinner fa-spin' : 'fa-rotate-right'"></i>
                {{ loading ? "Loading..." : "Reload" }}
              </button>

              <button
                class="btn primary"
                type="submit"
                :disabled="saving || loading"
                @mouseenter="btnHover($event, true)"
                @mouseleave="btnHover($event, false)"
              >
                <i class="fa-solid" :class="saving ? 'fa-spinner fa-spin' : 'fa-floppy-disk'"></i>
                {{ saving ? "Saving..." : "Save Changes" }}
              </button>
            </div>
          </form>
        </section>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import gsap from "gsap";

const router = useRouter();
const route = useRoute();

/** ✅ เปลี่ยน path นี้ให้ตรงกับหน้า list/view ของคุณ */
const LIST_PATH = "/board_directorview"; // <<<<<< เปลี่ยนได้ถ้าหน้าจริงไม่ใช่นี้
let redirectTimer = null;

const headEl = ref(null);
const cardEl = ref(null);
const actionsEl = ref(null);

const logoEl = ref(null);
const profileEl = ref(null);

const loading = ref(false);
const saving = ref(false);

let abortCtrl = null;

// ✅ toast state
const toastEl = ref(null);
const toast = reactive({
  show: false,
  type: "success", // success | error
  message: "",
});
let toastTimer = null;

/* ✅ API base */
const API_BASE = import.meta.env?.VITE_API_BASE_URL || import.meta.env?.VITE_API_URL || "";
const BASE_URL = API_BASE ? `${API_BASE}/api/boarddirector` : "/api/boarddirector";

const id = computed(() => {
  const v = route.query?.id;
  return v === undefined || v === null ? "" : String(v);
});

/* ===================== */
/* COMMITTEES (ใช้ของเดิมจาก insert) */
/* ===================== */
const committees = [
  { key: "ປະທານສະພາບໍລິຫານ", label: "ປະທານສະພາບໍລິຫານ", icon: "fa-solid fa-crown" },
  { key: "ຮອງປະທານສະພາບໍລິຫານ", label: "ຮອງປະທານສະພາບໍລິຫານ", icon: "fa-solid fa-chess-king" },
  { key: "ສະມາຊິກສະພາບໍລິຫານ", label: "ສະມາຊິກສະພາບໍລິຫານ", icon: "fa-solid fa-clipboard-check" },

];

function committeeLabel(key) {
  return committees.find((x) => x.key === key)?.label || key;
}

/* ===================== */
/* Helpers */
/* ===================== */
function resolveMediaUrl(src) {
  if (!src) return "";
  const s = String(src).trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("data:")) return s;
  if (API_BASE) {
    if (s.startsWith("/")) return `${API_BASE}${s}`;
    return `${API_BASE}/${s}`;
  }
  return s.startsWith("/") ? s : `/${s}`;
}

function parseCommitteeValue(val) {
  if (Array.isArray(val)) return String(val[0] ?? "").trim();
  return String(val ?? "").trim();
}

function unwrapApiOne(payload) {
  if (!payload) return null;
  if (Array.isArray(payload)) return payload[0] ?? null;
  if (payload?.data && typeof payload.data === "object") return payload.data;
  if (payload?.row && typeof payload.row === "object") return payload.row;
  if (typeof payload === "object") return payload;
  return null;
}

function goBack() {
  router.back();
}

function setCommittee(key) {
  form.committee = key;
  gsap.fromTo(".committeePill", { y: 2, opacity: 0.7 }, { y: 0, opacity: 1, duration: 0.18, ease: "power2.out" });
}

/* ===================== */
/* Form state */
/* ===================== */
const form = reactive({
  idboarddirector: "",
  committee: committees[0]?.key || "",
  bankName: "",
  personName: "",
  role: "",
  createat: "",
  bankLogo: null,
  profileImage: null,
  bankLogoPath: "",
  profilePath: "",
});

const errors = reactive({
  bankName: "",
  personName: "",
  role: "",
  bankLogo: "",
  profileImage: "",
});

function setError(k, msg) {
  errors[k] = msg || "";
}

/* ===================== */
/* Preview URLs */
/* ===================== */
const logoPreview = ref("");
const profilePreview = ref("");
let logoUrl = "";
let profileUrl = "";

function revoke(u) {
  if (u) URL.revokeObjectURL(u);
}

const bankLogoIsExisting = computed(() => !!String(form.bankLogoPath || "").trim());
const profileIsExisting = computed(() => !!String(form.profilePath || "").trim());

const existingBankLogoUrl = computed(() => resolveMediaUrl(form.bankLogoPath));
const existingProfileUrl = computed(() => resolveMediaUrl(form.profilePath));

function triggerPickLogo() {
  logoEl.value?.click();
}
function triggerPickProfile() {
  profileEl.value?.click();
}

function setLogoPreview(file) {
  revoke(logoUrl);
  logoUrl = file ? URL.createObjectURL(file) : "";
  logoPreview.value = logoUrl;
}
function setProfilePreview(file) {
  revoke(profileUrl);
  profileUrl = file ? URL.createObjectURL(file) : "";
  profilePreview.value = profileUrl;
}

function onPickLogo(e) {
  const f = e.target.files?.[0];
  if (!f) return;
  form.bankLogo = f;
  setLogoPreview(f);
  e.target.value = "";
}
function onPickProfile(e) {
  const f = e.target.files?.[0];
  if (!f) return;
  form.profileImage = f;
  setProfilePreview(f);
  e.target.value = "";
}

function clearLogo() {
  form.bankLogo = null;
  setLogoPreview(null);
  form.bankLogoPath = "";
  if (logoEl.value) logoEl.value.value = "";
}
function clearProfile() {
  form.profileImage = null;
  setProfilePreview(null);
  form.profilePath = "";
  if (profileEl.value) profileEl.value.value = "";
}

/* ===================== */
/* Validation */
/* ===================== */
function validate() {
  setError("bankName", form.bankName ? "" : "Bank name is required.");
  setError("personName", form.personName ? "" : "Person name is required.");
  setError("role", form.role ? "" : "Role is required.");

  const hasLogo = !!form.bankLogo || !!String(form.bankLogoPath || "").trim();
  const hasProfile = !!form.profileImage || !!String(form.profilePath || "").trim();

  setError("bankLogo", hasLogo ? "" : "Bank logo is required (upload or keep existing).");
  setError("profileImage", hasProfile ? "" : "Profile image is required (upload or keep existing).");

  return !Object.values(errors).some(Boolean);
}

/* ===================== */
/* Toast */
/* ===================== */
async function showToast(type, message) {
  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }

  toast.type = type;
  toast.message = message;
  toast.show = true;

  await nextTick();

  if (toastEl.value) {
    gsap.killTweensOf(toastEl.value);
    gsap.fromTo(
      toastEl.value,
      { y: -10, x: 8, opacity: 0, scale: 0.98, filter: "blur(4px)" },
      { y: 0, x: 0, opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.28, ease: "power3.out" }
    );
  }

  toastTimer = setTimeout(() => {
    hideToast();
  }, 3000);
}

function hideToast() {
  if (!toast.show) return;

  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }

  const el = toastEl.value;
  if (!el) {
    toast.show = false;
    return;
  }

  gsap.killTweensOf(el);
  gsap.to(el, {
    y: -8,
    opacity: 0,
    scale: 0.985,
    duration: 0.22,
    ease: "power2.in",
    onComplete: () => {
      toast.show = false;
    },
  });
}

/* ===================== */
/* Load existing record */
/* ===================== */
const loadedSnapshot = ref(null);

function snapshotCurrent() {
  return {
    idboarddirector: form.idboarddirector,
    committee: form.committee,
    bankName: form.bankName,
    personName: form.personName,
    role: form.role,
    createat: form.createat,
    bankLogoPath: form.bankLogoPath,
    profilePath: form.profilePath,
  };
}

function applySnapshot(s) {
  if (!s) return;

  form.idboarddirector = s.idboarddirector || "";
  form.committee = s.committee || (committees[0]?.key || "");
  form.bankName = s.bankName || "";
  form.personName = s.personName || "";
  form.role = s.role || "";
  form.createat = s.createat || "";
  form.bankLogoPath = s.bankLogoPath || "";
  form.profilePath = s.profilePath || "";

  form.bankLogo = null;
  form.profileImage = null;
  setLogoPreview(null);
  setProfilePreview(null);

  Object.keys(errors).forEach((k) => (errors[k] = ""));
}

async function fetchOne() {
  if (!id.value) {
    await showToast("error", "Missing id in URL (use /boarddirectoredit?id=...)");
    return;
  }

  loading.value = true;
  try {
    if (abortCtrl) abortCtrl.abort();
    abortCtrl = new AbortController();

    let res = await fetch(`${BASE_URL}/${encodeURIComponent(id.value)}`, {
      method: "GET",
      signal: abortCtrl.signal,
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      res = await fetch(`${BASE_URL}?id=${encodeURIComponent(id.value)}`, {
        method: "GET",
        signal: abortCtrl.signal,
        headers: { Accept: "application/json" },
      });
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const one = unwrapApiOne(data);
    if (!one) throw new Error("No record found");

    const snap = {
      idboarddirector: String(one.idboarddirector ?? id.value),
      committee: parseCommitteeValue(one.committee) || (committees[0]?.key || ""),
      bankName: String(one.bankname ?? ""),
      personName: String(one.name ?? ""),
      role: String(one.role ?? ""),
      createat: String(one.createat ?? ""),
      bankLogoPath: String(one.banklogo ?? ""),
      profilePath: String(one.profile ?? ""),
    };

    applySnapshot(snap);
    loadedSnapshot.value = snap;

    await showToast("success", "Loaded successfully");
  } catch (err) {
    if (err?.name === "AbortError") return;
    console.error(err);
    await showToast("error", err?.message || "Failed to load data");
  } finally {
    loading.value = false;
  }
}

function resetToLoaded() {
  applySnapshot(loadedSnapshot.value);
  gsap.fromTo(cardEl.value, { x: -6 }, { x: 0, duration: 0.35, ease: "elastic.out(1, 0.45)" });
}

async function reload() {
  await fetchOne();
}

/* ===================== */
/* Save (multipart/form-data) */
/* ===================== */
async function onSubmit() {
  if (!id.value) {
    await showToast("error", "Missing id");
    return;
  }

  if (!validate()) {
    gsap.fromTo(cardEl.value, { x: -6 }, { x: 0, duration: 0.35, ease: "elastic.out(1, 0.45)" });
    return;
  }

  const fd = new FormData();

  fd.append("idboarddirector", String(form.idboarddirector || id.value));
  fd.append("committee", form.committee);
  fd.append("bankname", form.bankName);
  fd.append("name", form.personName);
  fd.append("role", form.role);

  if (form.createat) fd.append("createat", form.createat);

  if (form.bankLogo) fd.append("banklogo", form.bankLogo);
  else fd.append("banklogo", form.bankLogoPath || "");

  if (form.profileImage) fd.append("profile", form.profileImage);
  else fd.append("profile", form.profilePath || "");

  saving.value = true;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 20000);

    let res = await fetch(`${BASE_URL}/${encodeURIComponent(id.value)}`, {
      method: "PUT",
      body: fd,
      signal: controller.signal,
    });

    if (!res.ok && (res.status === 404 || res.status === 405 || res.status === 415)) {
      res = await fetch(`${BASE_URL}/${encodeURIComponent(id.value)}`, {
        method: "PATCH",
        body: fd,
        signal: controller.signal,
      });
    }

    clearTimeout(t);

    let data = null;
    try {
      data = await res.json();
    } catch (_) {
      data = null;
    }

    if (!res.ok) {
      throw new Error(data?.message || `Update failed (HTTP ${res.status})`);
    }

    await showToast("success", data?.message || "Board Director updated successfully!");

    // refresh snapshot
    if (data) {
      const one = unwrapApiOne(data) || null;
      if (one) {
        const snap = {
          idboarddirector: String(one.idboarddirector ?? form.idboarddirector ?? id.value),
          committee: parseCommitteeValue(one.committee) || form.committee,
          bankName: String(one.bankname ?? form.bankName),
          personName: String(one.name ?? form.personName),
          role: String(one.role ?? form.role),
          createat: String(one.createat ?? form.createat),
          bankLogoPath: String(one.banklogo ?? form.bankLogoPath),
          profilePath: String(one.profile ?? form.profilePath),
        };
        loadedSnapshot.value = snap;
        applySnapshot(snap);
      } else {
        loadedSnapshot.value = snapshotCurrent();
      }
    } else {
      loadedSnapshot.value = snapshotCurrent();
    }

    gsap.to(actionsEl.value, { y: -2, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out" });

    /** ✅ NEW: redirect กลับหน้า view/list แล้ว highlight แถวที่แก้ */
    if (redirectTimer) clearTimeout(redirectTimer);
    redirectTimer = setTimeout(() => {
      router.push({
        path: LIST_PATH,
        query: {
          highlight: String(id.value),
          ts: String(Date.now()),
        },
      });
    }, 450);
  } catch (err) {
    const msg =
      err?.name === "AbortError"
        ? "Request timeout. Server slow or route not responding."
        : err?.message || "Something went wrong.";

    await showToast("error", msg);
  } finally {
    saving.value = false;
  }
}

/* GSAP hover helpers */
function btnHover(e, enter) {
  gsap.to(e.currentTarget, { y: enter ? -2 : 0, duration: 0.22, ease: "power2.out" });
}
function chipHover(e, enter) {
  gsap.to(e.currentTarget, { scale: enter ? 1.02 : 1, duration: 0.18, ease: "power2.out" });
}

onMounted(async () => {
  gsap.set(".js-card", { opacity: 0, y: 14, scale: 0.985 });
  gsap.set(".js-reveal", { opacity: 0, y: 10 });

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.to(".js-card", { opacity: 1, y: 0, scale: 1, duration: 0.55 }, 0).to(
    ".js-reveal",
    { opacity: 1, y: 0, stagger: 0.06, duration: 0.45 },
    0.08
  );

  await fetchOne();
});

onBeforeUnmount(() => {
  if (toastTimer) clearTimeout(toastTimer);
  if (abortCtrl) abortCtrl.abort();
  if (redirectTimer) clearTimeout(redirectTimer);
  revoke(logoUrl);
  revoke(profileUrl);
});
</script>
<style scoped>
/* =========================
   TECH THEME (DARK BLUE) - SAME AS INSERT
   ========================= */
.page.tech {
  --bg0: #050914;
  --bg1: #070e23;
  --glass2: rgba(255, 255, 255, 0.04);

  --txt: rgba(255, 255, 255, 0.92);
  --muted: rgba(255, 255, 255, 0.56);
  --danger: rgba(248, 113, 113, 0.95);

  min-height: 100vh;
  padding: 18px;
  color: var(--txt);
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
  background: radial-gradient(1100px 620px at 18% 14%, rgba(56, 189, 248, 0.16), transparent 58%),
    radial-gradient(900px 520px at 82% 18%, rgba(99, 102, 241, 0.14), transparent 60%),
    radial-gradient(800px 520px at 70% 90%, rgba(14, 165, 233, 0.1), transparent 62%),
    linear-gradient(180deg, var(--bg1), var(--bg0));
  position: relative;
  overflow: hidden;
}
.page.tech::before {
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

/* ✅ Toast */
.toastWrap {
  position: fixed;
  top: 18px;
  right: 18px;
  z-index: 9999;
  pointer-events: none;
}
.toast {
  pointer-events: auto;
  min-width: 320px;
  max-width: 420px;
  display: grid;
  grid-template-columns: 44px 1fr 36px;
  gap: 10px;
  align-items: center;

  padding: 12px 12px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
  overflow: hidden;
  position: relative;
}
.toast::before {
  content: "";
  position: absolute;
  inset: -2px;
  opacity: 0.18;
  filter: blur(14px);
  pointer-events: none;
}
.toast.success {
  border-color: rgba(34, 197, 94, 0.28);
}
.toast.success::before {
  background: linear-gradient(90deg, rgba(34, 197, 94, 0.55), rgba(56, 189, 248, 0.22), rgba(34, 197, 94, 0.55));
}
.toast.error {
  border-color: rgba(248, 113, 113, 0.28);
}
.toast.error::before {
  background: linear-gradient(
    90deg,
    rgba(248, 113, 113, 0.55),
    rgba(99, 102, 241, 0.18),
    rgba(248, 113, 113, 0.55)
  );
}

.toastIcon {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.18);
  font-size: 18px;
}
.toast.success .toastIcon {
  color: rgba(34, 197, 94, 0.95);
}
.toast.error .toastIcon {
  color: rgba(248, 113, 113, 0.95);
}
.toastBody {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.toastTitle {
  font-weight: 1000;
  letter-spacing: 0.2px;
  color: rgba(255, 255, 255, 0.92);
  font-size: 13px;
}
.toastText {
  color: rgba(255, 255, 255, 0.72);
  font-weight: 800;
  font-size: 12px;
  line-height: 1.35;
}
.toastClose {
  width: 36px;
  height: 36px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.82);
  cursor: pointer;
}
.toastClose:hover {
  border-color: rgba(56, 189, 248, 0.25);
  box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.08);
}

/* Layout */
.layout {
  width: 100%;
}
.content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Header */
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}
.headLeft {
  display: flex;
  align-items: center;
  gap: 12px;
}
.title {
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 0.2px;
}
.sub {
  margin-top: 4px;
  font-size: 13px;
  color: var(--muted);
}
.backBtn {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.88);
  cursor: pointer;
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.86);
  font-weight: 700;
}
.pillSoft.mini {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.78);
  font-weight: 800;
  font-size: 12px;
}

/* Card */
.card {
  position: relative;
  background: var(--glass2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 22px;
  padding: 14px;
  backdrop-filter: blur(12px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}
.card::before {
  content: "";
  position: absolute;
  inset: -2px;
  background: linear-gradient(
    90deg,
    rgba(56, 189, 248, 0.4),
    rgba(99, 102, 241, 0.22),
    rgba(14, 165, 233, 0.18),
    rgba(56, 189, 248, 0.4)
  );
  opacity: 0.18;
  filter: blur(14px);
  pointer-events: none;
  animation: holo 7s linear infinite;
}
@keyframes holo {
  0% {
    transform: translateX(-16%);
  }
  100% {
    transform: translateX(16%);
  }
}
.cardTop {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}
.cardTitle {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 900;
}
.cardHint {
  font-size: 12px;
  color: var(--muted);
  text-align: right;
}

/* Form */
.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.label > span {
  display: block;
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 8px;
}
.inputWrap {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}
.inputWrap i {
  opacity: 0.75;
}
.inp {
  width: 100%;
  border: 0;
  outline: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.92);
  font-size: 14px;
}
.inputWrap:focus-within {
  border-color: rgba(56, 189, 248, 0.25);
  box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.08);
}
.err {
  margin-top: 8px;
  font-size: 12px;
  color: var(--danger);
}

.divider {
  height: 1px;
  width: 100%;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0));
  margin: 6px 0 2px;
}
.sectionTitle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.9);
  padding: 6px 0;
}

/* =========================
   COMMITTEE NAVBAR
   ========================= */
.committeeBar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  align-items: center;
}
.cBtn {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.82);
  padding: 10px 12px;
  border-radius: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 900;
  font-size: 12px;
  position: relative;
}
.cBtn.on {
  border-color: rgba(56, 189, 248, 0.28);
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.22), rgba(99, 102, 241, 0.12));
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 16px 34px rgba(56, 189, 248, 0.12);
}

.cIcon {
  width: 18px;
  display: grid;
  place-items: center;
  opacity: 0.9;
}
.cLabel {
  line-height: 1.1;
}
.cDot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  margin-left: 4px;
}
.cDot.on {
  background: rgba(56, 189, 248, 0.95);
  box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.12);
}

.committeePill {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.86);
  font-weight: 900;
  font-size: 12px;
}

/* Upload cards */
.dualUpload {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-items: start;
}
.upCard {
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  padding: 12px;
}
.upTop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}
.upTitle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 900;
}

.fileHidden {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.imgBox {
  width: 100%;
  height: 220px;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
  display: grid;
  place-items: center;
}
.imgBox.small {
  height: 160px;
}
.imgBox img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.imgBox.clickable {
  cursor: pointer;
}
.imgBox.clickable:hover {
  border-color: rgba(56, 189, 248, 0.3);
  box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.08);
}
.imgEmpty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.65);
  font-size: 12px;
}
.imgHint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
}

/* Buttons */
.miniBtn {
  border-radius: 12px;
  padding: 8px 10px;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.86);
  display: inline-flex;
  gap: 8px;
  align-items: center;
  font-weight: 900;
  font-size: 12px;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 6px;
  flex-wrap: wrap;
}
.btn {
  border-radius: 14px;
  padding: 12px 14px;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.9);
  font-weight: 900;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.btn.primary {
  border-color: rgba(56, 189, 248, 0.3);
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.28), rgba(99, 102, 241, 0.14));
}
.btn.ghost {
  background: rgba(255, 255, 255, 0.03);
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Preview */
.previewWrap {
  width: 100%;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  padding: 12px;
}
.previewTop {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.previewTitle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 900;
}
.previewPills {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.pillSoft {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.82);
  font-weight: 800;
  font-size: 12px;
}
.previewCard {
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 12px;
  align-items: stretch;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.14);
  overflow: hidden;
}
.leftCol {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.logoLine {
  display: flex;
  align-items: center;
  gap: 10px;
}
.logoMini {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  overflow: hidden;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.03);
}
.logoMini img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.logoEmpty {
  color: rgba(255, 255, 255, 0.65);
}
.bankName {
  font-weight: 900;
  letter-spacing: 0.2px;
}
.bankRole {
  margin-top: 2px;
  font-size: 12px;
  color: var(--muted);
  font-weight: 800;
}
.personLine .personName {
  font-weight: 900;
  font-size: 16px;
}
.mutedSmall {
  margin-top: 4px;
  font-size: 12px;
  color: var(--muted);
  font-weight: 700;
}
.rightCol {
  display: grid;
  place-items: center;
  padding: 12px;
}
.avatar {
  width: 180px;
  height: 180px;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.03);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.35);
  display: grid;
  place-items: center;
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatarEmpty {
  color: rgba(255, 255, 255, 0.7);
  font-size: 34px;
}

/* small badge + path hint */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid rgba(56, 189, 248, 0.22);
  background: rgba(56, 189, 248, 0.12);
  color: rgba(255, 255, 255, 0.9);
  font-weight: 900;
  font-size: 12px;
}
.pathHint {
  margin-top: 10px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  font-weight: 800;
  display: flex;
  gap: 8px;
  align-items: center;
  word-break: break-all;
}

/* responsive */
@media (max-width: 980px) {
  .row {
    grid-template-columns: 1fr;
  }
  .dualUpload {
    grid-template-columns: 1fr;
  }
  .previewCard {
    grid-template-columns: 1fr;
  }
  .avatar {
    width: 100%;
    height: 240px;
    border-radius: 18px;
  }
  .committeePill {
    margin-left: 0;
  }
  .toast {
    min-width: 280px;
  }
}
</style>
