<!-- CreateForm.vue
     Google-Form-like "Create Form" page (Vue 3) using your global tech theme + GSAP animations
-->
<template>
  <div class="createFormPage">
    <!-- Top bar -->
    <header ref="topbarRef" class="pageTopbar">
      <div class="topLeft">
        <div class="titleRow">
          <i class="fa-solid fa-pen-to-square"></i>
          <h1 class="pageTitle">ສ້າງ Form</h1>
          <span class="pill">Builder</span>
        </div>
        <p class="pageSub">
          ສ້າງແບບຟອມແນວ Google Form • ເພີ່ມຄຳຖາມ • ຕັ້ງ Required • Export JSON
        </p>
      </div>

      <div class="topRight">
        <button class="btn ghost" type="button" @click="togglePreview" ref="btnPreviewRef">
          <i class="fa-solid" :class="isPreview ? 'fa-eye-slash' : 'fa-eye'"></i>
          <span>{{ isPreview ? "Back to Builder" : "Preview" }}</span>
        </button>

        <button class="btn" type="button" @click="saveDraft" ref="btnSaveRef">
          <i class="fa-solid fa-cloud-arrow-up"></i>
          <span>Save</span>
        </button>

        <button class="btn ghost" type="button" @click="copyJson" ref="btnCopyRef">
          <i class="fa-solid fa-copy"></i>
          <span>Copy JSON</span>
        </button>

        <button class="btn ghost" type="button" @click="downloadJson" ref="btnDownloadRef">
          <i class="fa-solid fa-file-arrow-down"></i>
          <span>Download</span>
        </button>
      </div>
    </header>

    <div class="layout">
      <!-- Main column -->
      <main class="mainCol">
        <!-- Form meta card -->
        <section ref="metaCardRef" class="card metaCard">
          <div class="metaHeader">
            <div class="metaBadge">
              <i class="fa-solid fa-wand-magic-sparkles"></i>
              <span>Form Setup</span>
            </div>

            <div class="metaActions">
              <button class="miniBtn" type="button" @click="resetAll" title="Reset">
                <i class="fa-solid fa-arrow-rotate-left"></i>
              </button>
              <button class="miniBtn" type="button" @click="addQuestion('short')" title="Add question">
                <i class="fa-solid fa-plus"></i>
              </button>
            </div>
          </div>

          <div class="metaGrid">
            <div class="field">
              <label class="label">Form title</label>
              <input
                v-model="form.title"
                class="input"
                type="text"
                placeholder="Untitled form"
                @focus="focusPop($event)"
                @blur="blurPop($event)"
              />
            </div>

            <div class="field">
              <label class="label">Description</label>
              <textarea
                v-model="form.description"
                class="textarea"
                rows="3"
                placeholder="Write a short description..."
                @focus="focusPop($event)"
                @blur="blurPop($event)"
              />
            </div>

            <div class="field fieldRow">
              <div class="switchWrap">
                <button class="switch" type="button" :class="{ on: form.collectEmail }" @click="form.collectEmail = !form.collectEmail">
                  <span class="knob"></span>
                </button>
                <div class="switchText">
                  <div class="switchTitle">Collect email</div>
                  <div class="switchSub">Ask user email at top</div>
                </div>
              </div>

              <div class="switchWrap">
                <button class="switch" type="button" :class="{ on: form.allowEditAfterSubmit }" @click="form.allowEditAfterSubmit = !form.allowEditAfterSubmit">
                  <span class="knob"></span>
                </button>
                <div class="switchText">
                  <div class="switchTitle">Edit after submit</div>
                  <div class="switchSub">Allow user to edit response</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Builder / Preview -->
        <section class="questionsWrap">
          <!-- PREVIEW MODE -->
          <div v-if="isPreview" ref="previewRef" class="preview">
            <div class="previewHeader">
              <div class="previewTitle">
                <i class="fa-solid fa-eye"></i>
                <span>Preview</span>
              </div>
              <span class="previewHint">{{ questions.length }} questions</span>
            </div>

            <div class="card previewCard">
              <div class="previewFormTitle">{{ form.title || "Untitled form" }}</div>
              <div class="previewFormDesc">{{ form.description || "No description" }}</div>

              <div v-if="form.collectEmail" class="previewEmail">
                <label class="label">Email</label>
                <input class="input" placeholder="name@example.com" />
              </div>
            </div>

            <div class="previewList">
              <div v-for="(q, idx) in questions" :key="q.id" class="card previewQ">
                <div class="previewQTitle">
                  <span class="qNum">{{ idx + 1 }}</span>
                  <span class="qText">{{ q.title || "Untitled question" }}</span>
                  <span v-if="q.required" class="req">*</span>
                </div>

                <div v-if="q.description" class="previewQDesc">{{ q.description }}</div>

                <div class="previewControl">
                  <!-- short / paragraph -->
                  <input v-if="q.type === 'short'" class="input" placeholder="Short answer" />
                  <textarea v-else-if="q.type === 'paragraph'" class="textarea" rows="3" placeholder="Long answer..." />

                  <!-- mc / checkbox / dropdown -->
                  <div v-else-if="q.type === 'mc'" class="choiceList">
                    <label v-for="(op, i) in q.options" :key="i" class="choiceRow">
                      <input type="radio" :name="q.id" />
                      <span>{{ op || `Option ${i + 1}` }}</span>
                    </label>
                  </div>

                  <div v-else-if="q.type === 'checkbox'" class="choiceList">
                    <label v-for="(op, i) in q.options" :key="i" class="choiceRow">
                      <input type="checkbox" />
                      <span>{{ op || `Option ${i + 1}` }}</span>
                    </label>
                  </div>

                  <select v-else-if="q.type === 'dropdown'" class="select">
                    <option value="" disabled selected>Select…</option>
                    <option v-for="(op, i) in q.options" :key="i" :value="op">
                      {{ op || `Option ${i + 1}` }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div class="previewFooter">
              <button class="btn" type="button">
                <i class="fa-solid fa-paper-plane"></i>
                Submit (preview)
              </button>
              <button class="btn ghost" type="button" @click="togglePreview">
                <i class="fa-solid fa-arrow-left"></i>
                Back
              </button>
            </div>
          </div>

          <!-- BUILDER MODE -->
          <div v-else ref="builderRef" class="builder">
            <div class="builderHeader">
              <div class="builderTitle">
                <i class="fa-solid fa-screwdriver-wrench"></i>
                <span>Questions</span>
              </div>
              <div class="builderHint">
                Drag & reorder (optional) • Required • Duplicate • Delete
              </div>
            </div>

            <div ref="listRef" class="qList">
              <article
                v-for="(q, idx) in questions"
                :key="q.id"
                class="card qCard"
                :data-qid="q.id"
              >
                <div class="qTop">
                  <div class="qIndex">
                    <span class="qBadge">{{ idx + 1 }}</span>
                    <span class="qTypePill">{{ typeLabel(q.type) }}</span>
                  </div>

                  <div class="qTools">
                    <button class="miniBtn" type="button" @click="duplicateQuestion(q.id)" title="Duplicate">
                      <i class="fa-solid fa-clone"></i>
                    </button>
                    <button class="miniBtn danger" type="button" @click="removeQuestion(q.id)" title="Delete">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>

                <div class="qGrid">
                  <div class="field">
                    <label class="label">Question</label>
                    <input
                      v-model="q.title"
                      class="input"
                      type="text"
                      placeholder="Question title"
                      @focus="focusPop($event)"
                      @blur="blurPop($event)"
                    />
                  </div>

                  <div class="field">
                    <label class="label">Description (optional)</label>
                    <input
                      v-model="q.description"
                      class="input"
                      type="text"
                      placeholder="Help text…"
                      @focus="focusPop($event)"
                      @blur="blurPop($event)"
                    />
                  </div>

                  <div class="field fieldRow">
                    <div class="field small">
                      <label class="label">Type</label>
                      <select v-model="q.type" class="select" @change="onTypeChange(q)">
                        <option value="short">Short answer</option>
                        <option value="paragraph">Paragraph</option>
                        <option value="mc">Multiple choice</option>
                        <option value="checkbox">Checkboxes</option>
                        <option value="dropdown">Dropdown</option>
                      </select>
                    </div>

                    <div class="switchWrap compact">
                      <button class="switch" type="button" :class="{ on: q.required }" @click="q.required = !q.required">
                        <span class="knob"></span>
                      </button>
                      <div class="switchText">
                        <div class="switchTitle">Required</div>
                        <div class="switchSub">must answer</div>
                      </div>
                    </div>
                  </div>

                  <!-- Options editor -->
                  <div v-if="needsOptions(q.type)" class="options">
                    <div class="optionsHead">
                      <div class="optionsTitle">
                        <i class="fa-solid fa-list"></i>
                        <span>Options</span>
                      </div>
                      <button class="miniBtn" type="button" @click="addOption(q)" title="Add option">
                        <i class="fa-solid fa-plus"></i>
                      </button>
                    </div>

                    <div class="optionsList">
                      <div v-for="(op, i) in q.options" :key="i" class="optionRow">
                        <span class="optionIcon">
                          <i v-if="q.type === 'mc'" class="fa-regular fa-circle"></i>
                          <i v-else-if="q.type === 'checkbox'" class="fa-regular fa-square"></i>
                          <i v-else class="fa-solid fa-caret-down"></i>
                        </span>

                        <input
                          v-model="q.options[i]"
                          class="input optionInput"
                          type="text"
                          :placeholder="`Option ${i + 1}`"
                          @focus="focusPop($event)"
                          @blur="blurPop($event)"
                        />

                        <button class="miniBtn danger" type="button" @click="removeOption(q, i)" title="Remove option">
                          <i class="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    </div>

                    <div class="optionsFoot">
                      <button class="tinyBtn" type="button" @click="normalizeOptions(q)">
                        <i class="fa-solid fa-wand-magic-sparkles"></i>
                        Clean empty options
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            <!-- bottom add -->
            <div class="bottomAdd">
              <button class="btn" type="button" @click="addQuestion('short')" ref="btnAddRef">
                <i class="fa-solid fa-plus"></i>
                Add question
              </button>

              <button class="btn ghost" type="button" @click="togglePreview">
                <i class="fa-solid fa-eye"></i>
                Preview
              </button>
            </div>
          </div>
        </section>
      </main>

      <!-- Right toolbar (builder only) -->
      <aside v-if="!isPreview" ref="sideToolsRef" class="sideTools">
        <div class="toolCard">
          <div class="toolTitle">
            <i class="fa-solid fa-bolt"></i>
            Quick add
          </div>

          <button class="toolBtn" type="button" @click="addQuestion('short')">
            <i class="fa-solid fa-i-cursor"></i>
            <span>Short answer</span>
          </button>
          <button class="toolBtn" type="button" @click="addQuestion('paragraph')">
            <i class="fa-solid fa-align-left"></i>
            <span>Paragraph</span>
          </button>
          <button class="toolBtn" type="button" @click="addQuestion('mc')">
            <i class="fa-solid fa-list-ul"></i>
            <span>Multiple choice</span>
          </button>
          <button class="toolBtn" type="button" @click="addQuestion('checkbox')">
            <i class="fa-regular fa-square-check"></i>
            <span>Checkboxes</span>
          </button>
          <button class="toolBtn" type="button" @click="addQuestion('dropdown')">
            <i class="fa-solid fa-caret-down"></i>
            <span>Dropdown</span>
          </button>
        </div>

        <div class="toolCard">
          <div class="toolTitle">
            <i class="fa-solid fa-code"></i>
            Output
          </div>

          <div class="jsonBox">
            <div class="jsonHead">
              <span class="jsonTitle">Form JSON</span>
              <span class="jsonMeta">{{ prettyBytes(jsonText.length) }}</span>
            </div>
            <pre class="jsonPre">{{ jsonText }}</pre>
          </div>
        </div>
      </aside>
    </div>

    <!-- Toast -->
    <div ref="toastRef" class="toast" :class="{ show: toast.show, danger: toast.type === 'danger' }" aria-live="polite">
      <i class="fa-solid" :class="toast.type === 'danger' ? 'fa-triangle-exclamation' : 'fa-circle-check'"></i>
      <span>{{ toast.text }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from "vue";
import gsap from "gsap";

/** =========================
 * State
 * ========================= */
const form = reactive({
  title: "",
  description: "",
  collectEmail: true,
  allowEditAfterSubmit: false,
});

const uid = () => `q_${Math.random().toString(16).slice(2)}_${Date.now()}`;

const makeQuestion = (type = "short") => {
  const base = {
    id: uid(),
    type,
    title: "",
    description: "",
    required: false,
    options: [],
  };
  if (type === "mc" || type === "checkbox" || type === "dropdown") {
    base.options = ["Option 1", "Option 2"];
  }
  return base;
};

const questions = ref([makeQuestion("short")]);
const isPreview = ref(false);

/** =========================
 * Refs (GSAP)
 * ========================= */
const topbarRef = ref(null);
const metaCardRef = ref(null);
const builderRef = ref(null);
const previewRef = ref(null);
const listRef = ref(null);
const sideToolsRef = ref(null);

const btnPreviewRef = ref(null);
const btnSaveRef = ref(null);
const btnCopyRef = ref(null);
const btnDownloadRef = ref(null);
const btnAddRef = ref(null);

const toastRef = ref(null);

/** =========================
 * Toast
 * ========================= */
const toast = reactive({
  show: false,
  text: "",
  type: "ok", // ok | danger
});

let toastTimer = null;
function showToast(text, type = "ok") {
  toast.text = text;
  toast.type = type;
  toast.show = true;

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.show = false), 2200);

  // GSAP pop
  if (toastRef.value) {
    gsap.killTweensOf(toastRef.value);
    gsap.fromTo(
      toastRef.value,
      { y: 10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.22, ease: "power2.out" }
    );
  }
}

/** =========================
 * Computed JSON
 * ========================= */
const jsonText = computed(() => {
  const payload = {
    meta: { ...form },
    questions: questions.value.map((q) => ({
      id: q.id,
      type: q.type,
      title: q.title,
      description: q.description,
      required: q.required,
      options: needsOptions(q.type) ? (q.options || []) : [],
    })),
    updatedAt: new Date().toISOString(),
  };
  return JSON.stringify(payload, null, 2);
});

function prettyBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** =========================
 * Helpers
 * ========================= */
function needsOptions(type) {
  return type === "mc" || type === "checkbox" || type === "dropdown";
}
function typeLabel(type) {
  switch (type) {
    case "short":
      return "Short";
    case "paragraph":
      return "Paragraph";
    case "mc":
      return "Multiple";
    case "checkbox":
      return "Checkbox";
    case "dropdown":
      return "Dropdown";
    default:
      return type;
  }
}

/** =========================
 * Anim helpers
 * ========================= */
function focusPop(e) {
  const el = e.currentTarget;
  gsap.to(el, { scale: 1.01, duration: 0.18, ease: "power2.out" });
}
function blurPop(e) {
  const el = e.currentTarget;
  gsap.to(el, { scale: 1, duration: 0.18, ease: "power2.out" });
}

async function animateNewQuestionCard(qid) {
  await nextTick();
  const card = listRef.value?.querySelector?.(`[data-qid="${qid}"]`);
  if (!card) return;

  gsap.killTweensOf(card);
  gsap.fromTo(
    card,
    { y: 14, opacity: 0, scale: 0.99 },
    { y: 0, opacity: 1, scale: 1, duration: 0.28, ease: "power3.out" }
  );

  // gentle glow pulse
  gsap.fromTo(
    card,
    { boxShadow: "0 0 0 rgba(56,189,248,0)" },
    { boxShadow: "0 18px 40px rgba(56,189,248,0.12)", duration: 0.35, yoyo: true, repeat: 1, ease: "power2.out" }
  );

  // scroll into view
  card.scrollIntoView({ behavior: "smooth", block: "center" });
}

/** =========================
 * Actions
 * ========================= */
async function addQuestion(type) {
  const q = makeQuestion(type);
  questions.value.push(q);
  showToast("Added question");
  await animateNewQuestionCard(q.id);
}

function removeQuestion(id) {
  if (questions.value.length <= 1) {
    showToast("Need at least 1 question", "danger");
    return;
  }
  const idx = questions.value.findIndex((q) => q.id === id);
  if (idx < 0) return;

  const card = listRef.value?.querySelector?.(`[data-qid="${id}"]`);
  if (card) {
    gsap.to(card, {
      y: -8,
      opacity: 0,
      duration: 0.18,
      ease: "power2.in",
      onComplete: () => {
        questions.value.splice(idx, 1);
        showToast("Deleted");
      },
    });
  } else {
    questions.value.splice(idx, 1);
    showToast("Deleted");
  }
}

async function duplicateQuestion(id) {
  const q = questions.value.find((x) => x.id === id);
  if (!q) return;

  const copy = {
    id: uid(),
    type: q.type,
    title: q.title,
    description: q.description,
    required: q.required,
    options: Array.isArray(q.options) ? [...q.options] : [],
  };

  const idx = questions.value.findIndex((x) => x.id === id);
  questions.value.splice(idx + 1, 0, copy);

  showToast("Duplicated");
  await animateNewQuestionCard(copy.id);
}

function onTypeChange(q) {
  if (needsOptions(q.type)) {
    if (!Array.isArray(q.options) || q.options.length === 0) {
      q.options = ["Option 1", "Option 2"];
    }
  } else {
    q.options = [];
  }
}

function addOption(q) {
  if (!needsOptions(q.type)) return;
  if (!Array.isArray(q.options)) q.options = [];
  q.options.push(`Option ${q.options.length + 1}`);

  // micro anim
  nextTick(() => {
    const card = listRef.value?.querySelector?.(`[data-qid="${q.id}"]`);
    if (!card) return;
    gsap.fromTo(card, { scale: 1 }, { scale: 1.01, duration: 0.12, yoyo: true, repeat: 1, ease: "power2.out" });
  });
}

function removeOption(q, i) {
  if (!needsOptions(q.type)) return;
  if (!Array.isArray(q.options)) return;
  q.options.splice(i, 1);
  if (q.options.length === 0) q.options = ["Option 1"];
}

function normalizeOptions(q) {
  if (!needsOptions(q.type)) return;
  q.options = (q.options || []).map((x) => (x ?? "").trim()).filter((x) => x.length > 0);
  if (q.options.length === 0) q.options = ["Option 1"];
  showToast("Cleaned options");
}

function togglePreview() {
  isPreview.value = !isPreview.value;

  // animate switch
  nextTick(() => {
    const root = isPreview.value ? previewRef.value : builderRef.value;
    if (!root) return;
    gsap.killTweensOf(root);
    gsap.fromTo(root, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: "power2.out" });
  });
}

function saveDraft() {
  try {
    localStorage.setItem("lapnet_create_form_draft", jsonText.value);
    showToast("Saved (localStorage)");
    if (btnSaveRef.value) {
      gsap.fromTo(btnSaveRef.value, { scale: 1 }, { scale: 1.05, duration: 0.12, yoyo: true, repeat: 1, ease: "power2.out" });
    }
  } catch (e) {
    showToast("Save failed", "danger");
  }
}

function resetAll() {
  form.title = "";
  form.description = "";
  form.collectEmail = true;
  form.allowEditAfterSubmit = false;
  questions.value = [makeQuestion("short")];
  showToast("Reset");
}

async function copyJson() {
  try {
    await navigator.clipboard.writeText(jsonText.value);
    showToast("Copied JSON");
    if (btnCopyRef.value) {
      gsap.fromTo(btnCopyRef.value, { scale: 1 }, { scale: 1.05, duration: 0.12, yoyo: true, repeat: 1, ease: "power2.out" });
    }
  } catch (e) {
    showToast("Copy failed", "danger");
  }
}

function downloadJson() {
  try {
    const blob = new Blob([jsonText.value], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(form.title || "form").replace(/\s+/g, "_").toLowerCase()}_draft.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("Downloaded JSON");
    if (btnDownloadRef.value) {
      gsap.fromTo(btnDownloadRef.value, { scale: 1 }, { scale: 1.05, duration: 0.12, yoyo: true, repeat: 1, ease: "power2.out" });
    }
  } catch (e) {
    showToast("Download failed", "danger");
  }
}

/** =========================
 * Mount animations + load draft
 * ========================= */
onMounted(async () => {
  // load draft if exists
  try {
    const draft = localStorage.getItem("lapnet_create_form_draft");
    if (draft) {
      const parsed = JSON.parse(draft);
      if (parsed?.meta) {
        form.title = parsed.meta.title || "";
        form.description = parsed.meta.description || "";
        form.collectEmail = !!parsed.meta.collectEmail;
        form.allowEditAfterSubmit = !!parsed.meta.allowEditAfterSubmit;
      }
      if (Array.isArray(parsed?.questions) && parsed.questions.length) {
        questions.value = parsed.questions.map((q) => ({
          id: q.id || uid(),
          type: q.type || "short",
          title: q.title || "",
          description: q.description || "",
          required: !!q.required,
          options: Array.isArray(q.options) ? [...q.options] : [],
        }));
        // fix options based on type
        questions.value.forEach((q) => onTypeChange(q));
      }
    }
  } catch {
    // ignore
  }

  await nextTick();

  // entrance timeline
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  if (topbarRef.value) {
    tl.fromTo(topbarRef.value, { y: -14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45 }, 0);
  }
  if (metaCardRef.value) {
    tl.fromTo(metaCardRef.value, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.42 }, 0.08);
  }
  if (builderRef.value) {
    tl.fromTo(builderRef.value, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.42 }, 0.12);
  }
  if (sideToolsRef.value) {
    tl.fromTo(sideToolsRef.value, { x: 14, opacity: 0 }, { x: 0, opacity: 1, duration: 0.42 }, 0.16);
  }

  // animate first cards
  const cards = listRef.value?.querySelectorAll?.(".qCard");
  if (cards?.length) {
    tl.fromTo(cards, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.06 }, 0.2);
  }
});
</script>

<style scoped>
/* Use your GLOBAL theme vars (from .app.tech). This page just consumes them. */
.createFormPage {
  width: 100%;
  height: 100%;
  padding: 10px 6px;
  color: var(--txt);
}

/* Topbar */
.pageTopbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 14px 10px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.22);
  margin-bottom: 12px;
}

.titleRow {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pageTitle {
  margin: 0;
  font-size: 18px;
  font-weight: 950;
  letter-spacing: 0.2px;
}
.pill {
  font-size: 11px;
  font-weight: 900;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.18);
  color: rgba(255, 255, 255, 0.9);
}
.pageSub {
  margin: 6px 0 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.4;
}

.topRight {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

/* Layout */
.layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 12px;
}

@media (max-width: 1100px) {
  .layout {
    grid-template-columns: 1fr;
  }
}

/* Card */
.card {
  position: relative;
  border-radius: 18px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.25);
}

/* Buttons */
.btn {
  border: 1px solid rgba(56, 189, 248, 0.22);
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.18), rgba(99, 102, 241, 0.10));
  color: rgba(255, 255, 255, 0.92);
  border-radius: 14px;
  padding: 10px 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 900;
  transition: background 180ms ease, transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}
.btn:hover {
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.24), rgba(99, 102, 241, 0.14));
  border-color: rgba(56, 189, 248, 0.28);
  box-shadow: 0 14px 28px rgba(56, 189, 248, 0.10);
  transform: translateY(-1px);
}
.btn.ghost {
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.03);
}
.btn.ghost:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(56, 189, 248, 0.22);
}

/* mini buttons */
.miniBtn {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
}
.miniBtn:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(56, 189, 248, 0.18);
}
.miniBtn.danger {
  border-color: rgba(248, 113, 113, 0.18);
}
.miniBtn.danger:hover {
  border-color: rgba(248, 113, 113, 0.35);
  background: rgba(248, 113, 113, 0.08);
}

/* Inputs */
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.label {
  font-size: 12px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.72);
}
.input,
.textarea,
.select {
  width: 100%;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(0, 0, 0, 0.18);
  color: rgba(255, 255, 255, 0.92);
  padding: 10px 12px;
  outline: none;
  transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}
.input:focus,
.textarea:focus,
.select:focus {
  border-color: rgba(56, 189, 248, 0.35);
  box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.10);
}
.textarea {
  resize: vertical;
}
.select {
  appearance: none;
}

/* Switch */
.switchWrap {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.switchWrap.compact {
  padding: 10px 10px;
}
.switch {
  width: 44px;
  height: 26px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  position: relative;
  transition: background 160ms ease, border-color 160ms ease;
}
.switch .knob {
  position: absolute;
  top: 50%;
  left: 4px;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  transition: left 160ms ease;
}
.switch.on {
  background: rgba(56, 189, 248, 0.22);
  border-color: rgba(56, 189, 248, 0.30);
}
.switch.on .knob {
  left: 20px;
}

.switchText {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.switchTitle {
  font-weight: 900;
  font-size: 12px;
}
.switchSub {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
}

/* Meta card */
.metaCard {
  overflow: hidden;
}
.metaHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.metaBadge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 900;
  font-size: 12px;
  padding: 8px 10px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.10);
  border: 1px solid rgba(56, 189, 248, 0.16);
}
.metaActions {
  display: inline-flex;
  gap: 8px;
}
.metaGrid {
  display: grid;
  gap: 10px;
}
.fieldRow {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.field.small .select {
  padding-right: 34px;
}
@media (max-width: 900px) {
  .fieldRow {
    grid-template-columns: 1fr;
  }
}

/* Builder/Preview headers */
.builderHeader,
.previewHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 4px 8px;
  margin: 0 6px 8px;
}
.builderTitle,
.previewTitle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 950;
}
.builderHint,
.previewHint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
}

/* Question list */
.qList {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.qCard {
  overflow: hidden;
}
.qTop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.qIndex {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.qBadge {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-weight: 950;
  background: rgba(56, 189, 248, 0.16);
  border: 1px solid rgba(56, 189, 248, 0.18);
}
.qTypePill {
  font-size: 11px;
  font-weight: 900;
  padding: 5px 9px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.82);
}
.qTools {
  display: inline-flex;
  gap: 8px;
}
.qGrid {
  display: grid;
  gap: 10px;
}

/* options editor */
.options {
  margin-top: 6px;
  padding: 10px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.optionsHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.optionsTitle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 950;
  font-size: 12px;
}
.optionsList {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.optionRow {
  display: grid;
  grid-template-columns: 26px 1fr 34px;
  gap: 10px;
  align-items: center;
}
.optionIcon {
  width: 26px;
  height: 26px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.85);
}
.optionInput {
  width: 100%;
}
.optionsFoot {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}
.tinyBtn {
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.86);
  border-radius: 12px;
  padding: 8px 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 900;
  font-size: 12px;
}
.tinyBtn:hover {
  border-color: rgba(56, 189, 248, 0.18);
  background: rgba(255, 255, 255, 0.05);
}

/* bottom add */
.bottomAdd {
  display: flex;
  gap: 10px;
  padding: 12px 6px 4px;
  flex-wrap: wrap;
}

/* Right tools */
.sideTools {
  position: sticky;
  top: 14px;
  align-self: start;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.toolCard {
  border-radius: 18px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.22);
}
.toolTitle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 950;
  margin-bottom: 10px;
}
.toolBtn {
  width: 100%;
  border-radius: 14px;
  padding: 10px 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 900;
  transition: background 180ms ease, border-color 180ms ease, transform 180ms ease;
  margin-bottom: 8px;
}
.toolBtn:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(56, 189, 248, 0.18);
  transform: translateY(-1px);
}

/* JSON preview */
.jsonBox {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.18);
}
.jsonHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.jsonTitle {
  font-weight: 950;
  font-size: 12px;
}
.jsonMeta {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 900;
}
.jsonPre {
  margin: 0;
  padding: 10px;
  font-size: 11px;
  line-height: 1.4;
  max-height: 360px;
  overflow: auto;
  color: rgba(255, 255, 255, 0.78);
}
.jsonPre::-webkit-scrollbar {
  width: 10px;
}
.jsonPre::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
}

/* Preview */
.previewList {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.previewCard {
  margin-bottom: 10px;
}
.previewFormTitle {
  font-size: 18px;
  font-weight: 950;
}
.previewFormDesc {
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  line-height: 1.5;
}
.previewEmail {
  margin-top: 12px;
}
.previewQTitle {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 950;
}
.qNum {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 12px;
  background: rgba(56, 189, 248, 0.14);
  border: 1px solid rgba(56, 189, 248, 0.16);
}
.req {
  margin-left: auto;
  color: rgba(248, 113, 113, 0.95);
}
.previewQDesc {
  margin-top: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.58);
}
.previewControl {
  margin-top: 12px;
}
.choiceList {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.choiceRow {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
}
.previewFooter {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  padding: 10px 6px 4px;
}

/* Toast */
.toast {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 99999;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(56, 189, 248, 0.22);
  background: rgba(8, 12, 28, 0.72);
  backdrop-filter: blur(12px);
  color: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
  opacity: 0;
  pointer-events: none;
  transform: translateY(6px);
}
.toast.show {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}
.toast.danger {
  border-color: rgba(248, 113, 113, 0.28);
}
</style>
