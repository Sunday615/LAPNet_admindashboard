<!-- CompanyStructureInsert.vue
     ✅ Sidebar removed (using global sidebar in App.vue)
     ✅ UPDATED: "Head of Department" -> "Row" (Dropdown items: 1,2,3,4)
-->
<!-- CompanyStructureInsert.vue -->
<template>
  <div class="page tech">
    <div class="glow glow-a"></div>
    <div class="glow glow-b"></div>

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
              <div class="title">Company Structure</div>
              <div class="sub">Add employee image + name + role + department + row</div>
            </div>
          </div>

          <div class="headRight js-reveal">
            <span class="pill"><i class="fa-solid fa-shield-halved"></i> Admin</span>
          </div>
        </header>

        <section ref="cardEl" class="card js-card">
          <div class="cardTop">
            <div class="cardTitle"><i class="fa-solid fa-sitemap"></i> Employee Information</div>
            <div class="cardHint"></div>
          </div>

          <form class="form" @submit.prevent="onSubmit">
            <div class="row">
              <label class="label">
                <span>Employee Name</span>
                <div class="inputWrap">
                  <i class="fa-solid fa-user"></i>
                  <input v-model.trim="form.empName" class="inp" type="text" placeholder="Full name..." />
                </div>
                <div v-if="errors.empName" class="err">{{ errors.empName }}</div>
              </label>

              <label class="label">
                <span>Role </span>
                <div class="inputWrap">
                  <i class="fa-solid fa-id-badge"></i>
                  <input v-model.trim="form.role" class="inp" type="text" placeholder="e.g. Senior Developer" />
                </div>
                <div v-if="errors.role" class="err">{{ errors.role }}</div>
              </label>
            </div>

            <div class="row single">
              <label class="label">
                <span>Department</span>
                <div class="inputWrap">
                  <i class="fa-solid fa-building-user"></i>
                  <select v-model="form.department" class="inp select">
                    <option value="" disabled>Select department</option>
                    <option v-for="d in departments" :key="d" :value="d">{{ d }}</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div v-if="errors.department" class="err">{{ errors.department }}</div>
              </label>
            </div>

            <div class="row single">
              <label class="label">
                <span>Position</span>
                <div class="inputWrap">
                  <i class="fa-solid fa-layer-group"></i>
                  <select v-model="form.row" class="inp select">
                    <option value="" disabled>ເລືອກຕຳແໜ່ງ</option>
                    <option v-for="x in rowItems" :key="x" :value="x">{{ x }}</option>
                  </select>
                </div>
                <div v-if="errors.row" class="err">{{ errors.row }}</div>
              </label>
            </div>

            <div class="divider"></div>

            <div class="sectionTitle js-reveal">
              <i class="fa-regular fa-image"></i> Upload & Preview
            </div>

            <div class="uploadRow js-reveal">
              <div class="upCard">
                <div class="upTop">
                  <div class="upTitle"><i class="fa-solid fa-user-astronaut"></i> Employee Image</div>

                  <button
                    v-if="imagePreview"
                    class="miniBtn"
                    type="button"
                    @click="clearImage"
                    @mouseenter="btnHover($event, true)"
                    @mouseleave="btnHover($event, false)"
                  >
                    <i class="fa-solid fa-trash"></i> Remove
                  </button>
                </div>

                <input ref="fileEl" class="fileHidden" type="file" accept="image/*" @change="onPickFile" />

                <div class="imgBox clickable" @click="triggerPickImage" title="Click to upload employee image">
                  <img v-if="imagePreview" :src="imagePreview" alt="employee preview" />
                  <div v-else class="imgEmpty">
                    <i class="fa-regular fa-image"></i>
                    <div>No image</div>
                    <div class="imgHint">Click to upload</div>
                  </div>
                </div>

                <div v-if="errors.image" class="err" style="margin-top: 10px">{{ errors.image }}</div>
              </div>

              <div class="previewWrap">
                <div class="previewTop">
                  <div class="previewTitle">
                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                    Preview
                  </div>

                  <span class="pillSoft">
                    <i class="fa-regular fa-clock"></i>
                    {{ form.timestamp }}
                  </span>
                </div>

                <div class="empPreviewCard">
                  <div class="empLeft">
                    <div class="avatar">
                      <img v-if="imagePreview" :src="imagePreview" alt="avatar" />
                      <div v-else class="avatarEmpty"><i class="fa-solid fa-user"></i></div>
                    </div>

                    <div class="statusPill" :class="{ head: form.row === '1' }">
                      <span class="dot"></span>
                      <span>{{ form.row ? `Row ${form.row}` : "Row" }}</span>
                    </div>
                  </div>

                  <div class="empRight">
                    <div class="pName">{{ form.empName || "Employee name" }}</div>
                    <div class="pRole">{{ form.role || "Role / Position" }}</div>

                    <div class="metaRow">
                      <span class="metaChip">
                        <i class="fa-solid fa-building-user"></i>
                        {{ form.department || "Department" }}
                      </span>

                      <span class="metaChip" :class="{ head: form.row === '1' }">
                        <i class="fa-solid fa-layer-group"></i>
                        {{ form.row ? `ຕຳແໜ່ງ ${form.row}` : "Row" }}
                      </span>
                    </div>

                    <div class="note">
                      <i class="fa-regular fa-circle"></i>
                      Company structure card preview
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div ref="actionsEl" class="actions js-reveal">
              <button
                class="btn ghost"
                type="button"
                @click="resetForm"
                @mouseenter="btnHover($event, true)"
                @mouseleave="btnHover($event, false)"
              >
                <i class="fa-solid fa-rotate-left"></i> Reset
              </button>

              <button
                class="btn primary"
                type="submit"
                :disabled="saving"
                @mouseenter="btnHover($event, true)"
                @mouseleave="btnHover($event, false)"
              >
                <i class="fa-solid fa-floppy-disk"></i>
                {{ saving ? "Saving..." : "Save Employee" }}
              </button>
            </div>
          </form>
        </section>
      </section>
    </main>

    <!-- ✅ Toast -->
    <Teleport to="body">
      <div v-if="toast.open" class="toast" :class="toast.type">
        <i v-if="toast.type === 'success'" class="fa-solid fa-circle-check"></i>
        <i v-else-if="toast.type === 'error'" class="fa-solid fa-circle-xmark"></i>
        <i v-else class="fa-solid fa-circle-info"></i>
        <div class="toastText">{{ toast.text }}</div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive, ref, nextTick } from "vue";
import { useRouter } from "vue-router";
import gsap from "gsap";

const router = useRouter();

const headEl = ref(null);
const cardEl = ref(null);
const actionsEl = ref(null);
const fileEl = ref(null);

const departments = ["CEO", "COO", "Administration", "Finance & Accounting", "IT", "Operation", "Internal Audit"];
const rowItems = ["ຜູ້ອຳນວຍການ", "ຮອງຜູ້ອຳນວຍການ", "ຫົວຫນ້າພະແນກ", "ຮອງຫົວໜ້າພະແນກ", "ວິຊາການ"];

const API_BASE = import.meta.env?.VITE_API_BASE_URL || "http://localhost:3000";
const EMP_API = `${API_BASE}/api/emp_lapnet`;

function pad2(n) {
  return String(n).padStart(2, "0");
}
function nowTimestamp() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(
    d.getSeconds()
  )}`;
}

const form = reactive({
  empName: "",
  role: "",
  department: "",
  row: "",
  timestamp: nowTimestamp(),
  image: null,
});

const errors = reactive({
  empName: "",
  role: "",
  department: "",
  row: "",
  image: "",
});

const saving = ref(false);

// Toast
const toast = ref({ open: false, type: "success", text: "" });
let toastTimer = null;
function showToast(type, text) {
  toast.value = { open: true, type, text };
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.value.open = false), 2200);
}

const imagePreview = ref("");
let lastObjectUrl = "";

function goBack() {
  router.back();
}

function setError(k, msg) {
  errors[k] = msg || "";
}

function validate() {
  setError("empName", form.empName ? "" : "Employee name is required.");
  setError("role", form.role ? "" : "Role is required.");
  setError("department", form.department ? "" : "Department is required.");
  setError("row", form.row ? "" : "Position is required.");
  setError("image", form.image ? "" : "Employee image is required.");
  return !Object.values(errors).some(Boolean);
}

function revoke(u) {
  if (u) URL.revokeObjectURL(u);
}

function triggerPickImage() {
  fileEl.value?.click();
}

function setPreviewFromFile(file) {
  revoke(lastObjectUrl);
  lastObjectUrl = file ? URL.createObjectURL(file) : "";
  imagePreview.value = lastObjectUrl;
}

function onPickFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  form.image = file;
  setPreviewFromFile(file);
  e.target.value = "";
}

function clearImage() {
  form.image = null;
  setPreviewFromFile(null);
  if (fileEl.value) fileEl.value.value = "";
}

function resetForm() {
  form.empName = "";
  form.role = "";
  form.department = "";
  form.row = "";
  form.timestamp = nowTimestamp();
  clearImage();
  Object.keys(errors).forEach((k) => (errors[k] = ""));
}

async function onSubmit() {
  form.timestamp = nowTimestamp();

  if (!validate()) {
    gsap.fromTo(cardEl.value, { x: -6 }, { x: 0, duration: 0.35, ease: "elastic.out(1, 0.45)" });
    showToast("error", "Please fill all required fields.");
    return;
  }

  try {
    saving.value = true;

    // ✅ map frontend -> DB fields
    const fd = new FormData();
    fd.append("name", form.empName);
    fd.append("role", form.role);
    fd.append("department", form.department);
    fd.append("position", form.row);        // DB = position
    fd.append("create_at", form.timestamp); // DB = create_at
    if (form.image) fd.append("image", form.image);

    const res = await fetch(EMP_API, { method: "POST", body: fd });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${txt}`);
    }

    const created = await res.json();
    showToast("success", `Saved: ${created?.name || "Employee"}`);

    gsap.to(actionsEl.value, { y: -2, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out" });

    // ✅ redirect to list page + highlight row (ปรับ path ตามโปรเจคคุณ)
    // ตัวอย่าง: "/company_structure_list"
    await nextTick();
    resetForm();

    router.push({ path: "/company_structure_list", query: { highlight: String(created.emp_id) } });
  } catch (e) {
    console.error(e);
    showToast("error", "Save failed. Check API / DB.");
  } finally {
    saving.value = false;
  }
}

/* GSAP hover helpers */
function btnHover(e, enter) {
  gsap.to(e.currentTarget, { y: enter ? -2 : 0, duration: 0.22, ease: "power2.out" });
}

onMounted(() => {
  gsap.set(".js-card", { opacity: 0, y: 14, scale: 0.985 });
  gsap.set(".js-reveal", { opacity: 0, y: 10 });

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.to(".js-card", { opacity: 1, y: 0, scale: 1, duration: 0.55 }, 0).to(
    ".js-reveal",
    { opacity: 1, y: 0, stagger: 0.06, duration: 0.45 },
    0.08
  );
});

onBeforeUnmount(() => {
  revoke(lastObjectUrl);
  if (toastTimer) clearTimeout(toastTimer);
});
</script>

<style scoped>

 
/* =========================
   TECH THEME (DARK BLUE)
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

/* Layout (sidebar removed) */
.layout {
  width: 100%;
}

/* Content */
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
  0% { transform: translateX(-16%); }
  100% { transform: translateX(16%); }
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
.row.single {
  grid-template-columns: 1fr;
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
.select {
  appearance: none;
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
  background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.12), rgba(255,255,255,0));
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

/* Upload + Preview Layout */
.uploadRow {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 12px;
  align-items: start;
}

/* Upload card */
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
  height: 260px;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
  display: grid;
  place-items: center;
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

.empPreviewCard {
  display: grid;
  grid-template-columns: 230px 1fr;
  gap: 12px;
  align-items: stretch;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.14);
  overflow: hidden;
}
.empLeft {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}
.empRight {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.avatar {
  width: 200px;
  height: 200px;
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

.toast {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 11000;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(7, 14, 35, 0.92);
  backdrop-filter: blur(10px);
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.55);
  font-weight: 950;
  animation: toastIn 0.24s ease-out;
}
@keyframes toastIn {
  from { transform: translateY(8px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.toast.success { border-color: rgba(34, 197, 94, 0.22); }
.toast.success i { color: rgba(34, 197, 94, 0.95); }
.toast.error { border-color: rgba(239, 68, 68, 0.25); }
.toast.error i { color: rgba(239, 68, 68, 0.95); }
.toast.info { border-color: rgba(56, 189, 248, 0.22); }
.toast.info i { color: rgba(56, 189, 248, 0.95); }
.toastText { color: rgba(255, 255, 255, 0.9); font-size: 13px; }


.statusPill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.82);
  font-weight: 900;
  font-size: 12px;
}
.statusPill .dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.95);
  box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.12);
}
.statusPill.head {
  border-color: rgba(34, 197, 94, 0.25);
  background: linear-gradient(90deg, rgba(34, 197, 94, 0.14), rgba(56, 189, 248, 0.08));
}
.statusPill.head .dot {
  background: rgba(34, 197, 94, 0.95);
  box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.12);
}

.pName {
  font-weight: 900;
  font-size: 18px;
  letter-spacing: 0.2px;
}
.pRole {
  font-weight: 900;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.88);
}

.metaRow {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.metaChip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid rgba(56, 189, 248, 0.22);
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.18), rgba(99, 102, 241, 0.12));
  color: rgba(255, 255, 255, 0.92);
  font-size: 12px;
  font-weight: 900;
}
.metaChip.head {
  border-color: rgba(34, 197, 94, 0.25);
  background: linear-gradient(90deg, rgba(34, 197, 94, 0.16), rgba(56, 189, 248, 0.1));
}

.note {
  margin-top: 2px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  color: rgba(255, 255, 255, 0.65);
  font-weight: 800;
  font-size: 12px;
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

/* responsive */
@media (max-width: 980px) {
  .row {
    grid-template-columns: 1fr;
  }
  .uploadRow {
    grid-template-columns: 1fr;
  }
  .empPreviewCard {
    grid-template-columns: 1fr;
  }
  .avatar {
    width: 100%;
    height: 240px;
    border-radius: 18px;
  }
}
</style>
