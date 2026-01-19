<template>
  <div class="loginPage">
    <!-- ✅ Video Background -->
    <video class="bgVideo" autoplay muted loop playsinline preload="auto">
      <source src="/Video/test2.mp4" type="video/mp4" />
    </video>

    <!-- ✅ Dark overlay to make text readable -->
    <div class="bgOverlay"></div>

    <!-- ✅ Login Card -->
    <div class="loginCard" ref="cardEl">
      <!-- ✅ Light sweeps -->
      <div class="lightSweep sweepA" ref="sweepAEl" aria-hidden="true"></div>
      <div class="lightSweep sweepB" ref="sweepBEl" aria-hidden="true"></div>

      <div class="cardTop">
        <div class="logoWrap">
          <img src="/logolapnet/fullcircle.png" alt="LAPNet" />
        </div>

        <div class="title">ເຂົ້າສູ່ລະບົບ</div>
        <div class="sub">LAPNet Admin Console & Commercial Bank Console</div>
      </div>

      <form class="form" @submit.prevent="handleLogin">
        <label class="field">
          <span class="label">Username</span>
          <div class="inputWrap">
            <i class="fa-solid fa-user"></i>
            <input
              v-model.trim="form.username"
              type="text"
              autocomplete="username"
              placeholder="Enter username"
              :disabled="loading"
              @keydown.enter.prevent="handleLogin"
            />
          </div>
        </label>

        <label class="field">
          <span class="label">Password</span>
          <div class="inputWrap">
            <i class="fa-solid fa-lock"></i>
            <input
              v-model="form.password"
              :type="showPass ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="••••••••"
              :disabled="loading"
              @keydown.enter.prevent="handleLogin"
            />
            <button class="eyeBtn" type="button" @click="showPass = !showPass" :disabled="loading">
              <i class="fa-solid" :class="showPass ? 'fa-eye-slash' : 'fa-eye'"></i>
            </button>
          </div>
        </label>

        <div class="row">
          <label class="check">
            <input type="checkbox" v-model="form.remember" :disabled="loading" />
            <span>Remember me</span>
          </label>
        </div>

        <div v-if="error" class="error">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span>{{ error }}</span>
        </div>

        <button class="submitBtn" type="submit" :disabled="loading">
          <i class="fa-solid" :class="loading ? 'fa-spinner fa-spin' : 'fa-right-to-bracket'"></i>
          <span>{{ loading ? "Signing in..." : "Sign In" }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import gsap from "gsap";

const router = useRouter();
const route = useRoute();

const cardEl = ref(null);
const sweepAEl = ref(null);
const sweepBEl = ref(null);

const loading = ref(false);
const error = ref("");
const showPass = ref(false);

const TOKEN_KEY = "token";
const USER_KEY = "user";

const LOGIN_URL = "/api/auth/login";
// const LOGIN_URL = "http://localhost:3000/api/auth/login";

const ADMIN_HOME = "/dashboard";
const VIEWER_HOME = "/memberdashboard";

const form = reactive({
  username: "",
  password: "",
  remember: true,
});

let sweepTl = null;
let floatTl = null;

// ---------------------
// auth helpers
// ---------------------
function safeJsonParse(x) {
  try {
    return JSON.parse(String(x));
  } catch {
    return null;
  }
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

function saveAuth({ token, user }, remember) {
  const storage = remember ? localStorage : sessionStorage;
  clearAuth();
  storage.setItem(TOKEN_KEY, token);
  storage.setItem(USER_KEY, JSON.stringify(user));
}

function getAuthFromStorage() {
  const tokenL = localStorage.getItem(TOKEN_KEY);
  const userL = localStorage.getItem(USER_KEY);
  if (tokenL && userL) return { token: tokenL, user: safeJsonParse(userL), source: "local" };

  const tokenS = sessionStorage.getItem(TOKEN_KEY);
  const userS = sessionStorage.getItem(USER_KEY);
  if (tokenS && userS) return { token: tokenS, user: safeJsonParse(userS), source: "session" };

  return { token: null, user: null, source: null };
}

function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

function isViewerRole(user) {
  return normalizeRole(user?.role) === "viewer";
}

/**
 * ✅ Fallback admin path detection (ถ้าไม่ได้ใช้ meta.area)
 * ปรับเพิ่มได้ตามโปรเจค
 */
function isAdminPath(path) {
  const p = String(path || "");
  return p === ADMIN_HOME || p.startsWith("/admin") || p.startsWith("/dashboard");
}

/**
 * ✅ decide redirect target with role + query.redirect
 * - viewer => ALWAYS go VIEWER_HOME
 * - non-viewer => go query.redirect (if valid) else ADMIN_HOME
 * - if redirect points to admin zone but role is viewer => force VIEWER_HOME
 */
function getRedirectTargetForUser(user) {
  const viewer = isViewerRole(user);
  const q = route.query.redirect?.toString() || "";

  let target = q && !q.startsWith("/login") ? q : viewer ? VIEWER_HOME : ADMIN_HOME;

  // enforce separation
  if (viewer && isAdminPath(target)) target = VIEWER_HOME;
  if (!viewer && target.startsWith(VIEWER_HOME)) target = ADMIN_HOME;

  return target;
}

// ---------------------
// login
// ---------------------
async function handleLogin() {
  error.value = "";

  const u = (form.username || "").trim();
  const p = form.password || "";

  if (!u || !p) {
    error.value = "Please enter username and password.";
    return;
  }

  loading.value = true;
  try {
    const res = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u, password: p }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Invalid username or password.");
    if (!data?.token || !data?.user) throw new Error("Login API response invalid (missing token/user)");

    saveAuth(data, form.remember);

    // ✅ role-based redirect + block viewer -> admin
    router.replace(getRedirectTargetForUser(data.user));
  } catch (e) {
    error.value = e?.message || "Login failed.";
  } finally {
    loading.value = false;
  }
}

// ---------------------
// animations
// ---------------------
function initFloatingWave() {
  if (!cardEl.value) return;

  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reduce) return;

  gsap.set(cardEl.value, { willChange: "transform" });

  // ✅ wave feel: gentle up-down + micro rotate
  floatTl = gsap
    .timeline({ repeat: -1 })
    .to(cardEl.value, { y: -10, rotation: 0.12, duration: 2.6, ease: "sine.inOut" })
    .to(cardEl.value, { y: 0, rotation: -0.08, duration: 2.8, ease: "sine.inOut" });

  // pause while interacting
  const pauseFloat = () => floatTl && floatTl.pause();
  const resumeFloat = () => floatTl && floatTl.resume();

  cardEl.value.addEventListener("mouseenter", pauseFloat);
  cardEl.value.addEventListener("mouseleave", resumeFloat);
  cardEl.value.addEventListener("focusin", pauseFloat);
  cardEl.value.addEventListener("focusout", resumeFloat);

  cardEl.value.__fl_pause__ = pauseFloat;
  cardEl.value.__fl_resume__ = resumeFloat;
}

function initSweeps() {
  if (!cardEl.value || !sweepAEl.value || !sweepBEl.value) return;

  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reduce) return;

  gsap.set(sweepAEl.value, { xPercent: -120, yPercent: -18, rotation: 14, opacity: 0, scale: 1.02 });
  gsap.set(sweepBEl.value, { xPercent: -140, yPercent: 6, rotation: 18, opacity: 0, scale: 1.05 });

  sweepTl = gsap.timeline({ repeat: -1 });

  sweepTl
    .to(sweepAEl.value, { opacity: 0.95, duration: 0.28, ease: "sine.out" }, 0)
    .to(sweepAEl.value, { xPercent: 120, opacity: 0, duration: 2.0, ease: "sine.inOut" }, 0)
    .set(sweepAEl.value, { xPercent: -120, opacity: 0 }, ">");

  sweepTl
    .to(sweepBEl.value, { opacity: 0.85, duration: 0.24, ease: "sine.out" }, 0.65)
    .to(sweepBEl.value, { xPercent: 140, opacity: 0, duration: 2.35, ease: "sine.inOut" }, 0.65)
    .set(sweepBEl.value, { xPercent: -140, opacity: 0 }, ">");

  sweepTl.to({}, { duration: 1.15 });

  const onEnter = () => sweepTl && sweepTl.timeScale(1.35);
  const onLeave = () => sweepTl && sweepTl.timeScale(1);

  cardEl.value.addEventListener("mouseenter", onEnter);
  cardEl.value.addEventListener("mouseleave", onLeave);

  cardEl.value.__sw_enter__ = onEnter;
  cardEl.value.__sw_leave__ = onLeave;
}

function cleanupAll() {
  if (sweepTl) {
    sweepTl.kill();
    sweepTl = null;
  }
  if (floatTl) {
    floatTl.kill();
    floatTl = null;
  }

  if (!cardEl.value) return;

  if (cardEl.value.__sw_enter__) {
    cardEl.value.removeEventListener("mouseenter", cardEl.value.__sw_enter__);
    delete cardEl.value.__sw_enter__;
  }
  if (cardEl.value.__sw_leave__) {
    cardEl.value.removeEventListener("mouseleave", cardEl.value.__sw_leave__);
    delete cardEl.value.__sw_leave__;
  }

  if (cardEl.value.__fl_pause__) {
    cardEl.value.removeEventListener("mouseenter", cardEl.value.__fl_pause__);
    cardEl.value.removeEventListener("focusin", cardEl.value.__fl_pause__);
    delete cardEl.value.__fl_pause__;
  }
  if (cardEl.value.__fl_resume__) {
    cardEl.value.removeEventListener("mouseleave", cardEl.value.__fl_resume__);
    cardEl.value.removeEventListener("focusout", cardEl.value.__fl_resume__);
    delete cardEl.value.__fl_resume__;
  }
}

onMounted(async () => {
  await nextTick();
  if (!cardEl.value) return;

  // ✅ If already logged in, redirect by role
  const { token, user } = getAuthFromStorage();
  if (token && user) {
    router.replace(getRedirectTargetForUser(user));
    return;
  }

  // ✅ Smooth entrance
  gsap.fromTo(
    cardEl.value,
    { y: 22, opacity: 0, scale: 0.975, filter: "blur(7px)" },
    { y: 0, opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.8, ease: "power3.out" }
  );

  // ✅ start animations after settle
  gsap.delayedCall(0.35, initSweeps);
  gsap.delayedCall(0.55, initFloatingWave);
});

onBeforeUnmount(() => {
  cleanupAll();
});
</script>

<style scoped>
.loginPage {
  --muted: rgba(255, 255, 255, 0.55);
  color-scheme: dark;

  position: relative;
  width: 100%;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 28px;
  overflow: hidden;
  isolation: isolate;

  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
}

.bgVideo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.02);
  filter: saturate(1.05) contrast(1.05) brightness(0.85);
  z-index: -2;
}

.bgOverlay {
  position: absolute;
  inset: 0;
  z-index: -1;
  background: radial-gradient(900px 520px at 20% 14%, rgba(56, 189, 248, 0.12), transparent 60%),
    radial-gradient(900px 520px at 82% 18%, rgba(99, 102, 241, 0.12), transparent 62%),
    linear-gradient(180deg, rgba(5, 9, 20, 0.72), rgba(5, 9, 20, 0.82));
}

.loginCard {
  width: min(440px, 100%);
  border-radius: 22px;
  padding: 22px 20px 18px;
  position: relative;
  overflow: hidden;
  z-index: 1;

  background: rgba(255, 255, 255, 0.045);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);

  box-shadow: 0 26px 70px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(56, 189, 248, 0.06) inset;
}

.loginCard::before {
  content: "";
  position: absolute;
  inset: -2px;
  pointer-events: none;
  opacity: 0.95;
  z-index: 0;
  background: radial-gradient(520px 240px at 18% 12%, rgba(56, 189, 248, 0.18), transparent 60%),
    radial-gradient(520px 240px at 84% 22%, rgba(99, 102, 241, 0.16), transparent 62%);
}

.loginCard::after {
  content: "";
  position: absolute;
  left: 14px;
  right: 14px;
  top: 12px;
  height: 1px;
  z-index: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.22), transparent);
  opacity: 0.7;
  pointer-events: none;
}

/* ✅ Light sweeps */
.lightSweep {
  position: absolute;
  inset: -55%;
  z-index: 1;
  pointer-events: none;
  opacity: 0;

  background: linear-gradient(
    115deg,
    transparent 36%,
    rgba(56, 189, 248, 0.12) 44%,
    rgba(255, 255, 255, 0.26) 50%,
    rgba(99, 102, 241, 0.14) 56%,
    transparent 64%
  );

  filter: blur(1.1px) saturate(1.05);
  mix-blend-mode: screen;
}

.sweepA {
  filter: blur(1px) saturate(1.06);
}

.sweepB {
  inset: -62%;
  background: linear-gradient(
    120deg,
    transparent 34%,
    rgba(56, 189, 248, 0.09) 43%,
    rgba(255, 255, 255, 0.18) 50%,
    rgba(99, 102, 241, 0.1) 57%,
    transparent 66%
  );
  filter: blur(1.6px) saturate(1.03);
}

.cardTop {
  position: relative;
  z-index: 2;
  display: grid;
  justify-items: center;
  gap: 8px;
  padding-bottom: 14px;
}

.logoWrap {
  width: 56px;
  height: 56px;
  border-radius: 999px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 18px 46px rgba(56, 189, 248, 0.12);
}
.logoWrap img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 999px;
}

.title {
  font-weight: 950;
  letter-spacing: 0.2px;
  color: rgba(255, 255, 255, 0.96);
  font-size: 18px;
}
.sub {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
}

.form {
  position: relative;
  z-index: 2;
  display: grid;
  gap: 12px;
  padding-top: 6px;
}

.field {
  display: grid;
  gap: 7px;
}
.label {
  font-size: 12px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.72);
}

.inputWrap {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 12px;
  border-radius: 16px;

  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);

  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease, background 160ms ease;
}

.inputWrap:focus-within {
  border-color: rgba(56, 189, 248, 0.28);
  box-shadow: 0 16px 42px rgba(56, 189, 248, 0.12);
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.045);
}

.inputWrap i {
  opacity: 0.92;
  width: 18px;
  text-align: center;
}

.inputWrap input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.92);
  font-weight: 700;
  font-size: 14px;
}

.inputWrap input::placeholder {
  color: rgba(255, 255, 255, 0.38);
  font-weight: 700;
}

.eyeBtn {
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.72);
  cursor: pointer;
  padding: 6px 6px;
  border-radius: 12px;
  transition: background 160ms ease, color 160ms ease;
}
.eyeBtn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.92);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 2px 2px 4px;
}

.check {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  user-select: none;
  color: rgba(255, 255, 255, 0.72);
  font-weight: 750;
  font-size: 12px;
}
.check input {
  width: 16px;
  height: 16px;
}

.error {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: rgba(255, 255, 255, 0.92);
  font-weight: 750;
  font-size: 12.5px;
}

.submitBtn {
  margin-top: 4px;
  border: 1px solid rgba(56, 189, 248, 0.22);
  border-radius: 16px;
  padding: 12px 12px;
  cursor: pointer;

  background: linear-gradient(90deg, rgba(56, 189, 248, 0.24), rgba(99, 102, 241, 0.16));
  color: rgba(255, 255, 255, 0.95);
  font-weight: 900;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, background 160ms ease;
}

.submitBtn:hover {
  transform: translateY(-1px);
  border-color: rgba(56, 189, 248, 0.28);
  box-shadow: 0 18px 46px rgba(56, 189, 248, 0.14);
}

.submitBtn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

@media (max-width: 520px) {
  .loginPage {
    padding: 18px;
  }
  .loginCard {
    border-radius: 18px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .bgVideo {
    display: none;
  }
  .lightSweep {
    display: none;
  }
}
</style>
