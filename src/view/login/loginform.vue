<template>
  <div class="loginPage">
    <!-- ✅ Video Background -->
    <video class="bgVideo" autoplay muted loop playsinline preload="auto">
      <source src="/Video/Rolebackground.mp4" type="video/mp4" />
    </video>

    <!-- ✅ Dark overlay to make text readable -->
    <div class="bgOverlay"></div>

    <!-- ✅ Login Card -->
    <div class="loginCard" ref="cardEl">
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
import { reactive, ref, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import gsap from "gsap";

const router = useRouter();
const route = useRoute();

const cardEl = ref(null);

const loading = ref(false);
const error = ref("");
const showPass = ref(false);

const form = reactive({
  username: "",
  password: "",
  remember: true,
});

/**
 * ✅ ถ้าคุณตั้ง Vite proxy ให้ /api ชี้ไป backend แล้ว
 * ใช้ "/api/auth/login" ได้เลย
 *
 * ถ้าไม่ได้ตั้ง proxy ให้ใช้ URL เต็ม: "http://localhost:3000/api/auth/login"
 */
const LOGIN_URL = "/api/auth/login";
// const LOGIN_URL = "http://localhost:3000/api/auth/login";

function saveAuth({ token, user }, remember) {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem("token", token);
  storage.setItem("user", JSON.stringify(user));
}

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

    if (!res.ok) {
      throw new Error(data?.message || "Invalid username or password.");
    }

    // ✅ expected: { token: "...", user: { id, username, role } }
    if (!data?.token || !data?.user) {
      throw new Error("Login API response invalid (missing token/user)");
    }

    saveAuth(data, form.remember);

    // ✅ redirect
    const redirect = route.query.redirect?.toString() || "/maindashboardview";
    router.push(redirect);

    // ถ้าคุณอยาก redirect ตาม role ให้ใช้แบบนี้แทน:
    // const role = data.user?.role || "viewer";
    // if (role === "admin") router.push("/dashboard");
    // else router.push("/maindashboardview");
  } catch (e) {
    error.value = e?.message || "Login failed.";
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await nextTick();
  if (!cardEl.value) return;

  gsap.fromTo(
    cardEl.value,
    { y: 14, opacity: 0, scale: 0.985 },
    { y: 0, opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" }
  );
});
</script>

<style scoped>
/* ✅ full screen center */
.loginPage {
  position: relative;
  width: 100%;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 28px;
  overflow: hidden;
  isolation: isolate;
}

/* ✅ video background */
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

/* ✅ overlay for readability */
.bgOverlay {
  position: absolute;
  inset: 0;
  z-index: -1;
  background: radial-gradient(900px 520px at 20% 14%, rgba(56, 189, 248, 0.12), transparent 60%),
    radial-gradient(900px 520px at 82% 18%, rgba(99, 102, 241, 0.12), transparent 62%),
    linear-gradient(180deg, rgba(5, 9, 20, 0.72), rgba(5, 9, 20, 0.82));
}

/* ✅ glass card */
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
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.22), transparent);
  opacity: 0.7;
  pointer-events: none;
}

.cardTop {
  position: relative;
  z-index: 1;
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
  color: var(--muted);
}

.form {
  position: relative;
  z-index: 1;
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

/* ✅ better UX on small screens */
@media (max-width: 520px) {
  .loginPage {
    padding: 18px;
  }
  .loginCard {
    border-radius: 18px;
  }
}

/* ✅ reduce motion */
@media (prefers-reduced-motion: reduce) {
  .bgVideo {
    display: none;
  }
}
</style>

