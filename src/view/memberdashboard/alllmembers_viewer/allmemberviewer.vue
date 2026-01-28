<!-- src/views/MemberBanksViewer.vue  (TABLE ROW DESIGN + ✅ Products in Overlay + ✅ Crossborder Flags Mapping) -->
<template>
  <div ref="rootEl" class="mbv">
    <!-- Topbar -->
    <header ref="topbarEl" class="topbar js-reveal">
      <div class="topLeft">
        <div class="titleRow">
          <div class="titleIcon"><i class="fa-solid fa-building-columns"></i></div>
          <div class="titleText">
            <div class="pageTitle">Member Banks</div>
            <div class="pageSub">Table view • Filter • Copy name • Download logo (single / ZIP) • View products (overlay)</div>
          </div>
        </div>
      </div>

      <div class="topRight">
        <div class="searchWrap" @keydown.esc.prevent="q = ''">
          <i class="fa-solid fa-magnifying-glass searchIcon"></i>
          <input v-model.trim="q" class="search" placeholder="Search BanknameLA / BanknameEN / bankcode / id..." />
          <button v-if="q" class="clear" type="button" title="Clear" @click="q = ''">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="filters">
          <select v-model="logoFilter" class="select" title="Logo filter">
            <option value="all">All</option>
            <option value="has">Has logo</option>
            <option value="none">No logo</option>
          </select>

          <select v-model="sortMode" class="select" title="Sort">
            <option value="id_asc">Sort: ID ↑</option>
            <option value="id_desc">Sort: ID ↓</option>
            <option value="name_asc">Sort: BanknameLA A→Z</option>
          </select>
        </div>

        <button
          class="btn ghost"
          type="button"
          :disabled="loading"
          @click="fetchAll"
          @mouseenter="btnHover($event, true)"
          @mouseleave="btnHover($event, false)"
          title="Refresh"
        >
          <i class="fa-solid fa-rotate" :class="{ spin: loading }"></i>
          Refresh
        </button>
      </div>
    </header>

    <!-- Stats / Bulk actions -->
    <section class="stats js-reveal">
      <div class="statCard">
        <div class="statLabel">Total</div>
        <div class="statValue">{{ loading ? "…" : items.length }}</div>
      </div>

      <div class="statCard">
        <div class="statLabel">Showing</div>
        <div class="statValue">{{ loading ? "…" : filteredSorted.length }}</div>
      </div>

      <div class="statCard">
        <div class="statLabel">Selected</div>
        <div class="statValue">{{ selectedIds.size }}</div>
      </div>

      <div class="bulk" :class="{ on: selectedIds.size > 0 }">
        <div class="bulkLeft">
          <span class="pill soft">
            <i class="fa-solid fa-layer-group"></i>
            {{ selectedIds.size }} selected
          </span>

          <button class="chip" type="button" @click="selectAllVisible" title="Select all visible">
            <i class="fa-solid fa-check-double"></i>
            Select all
          </button>

          <button class="chip" type="button" @click="clearSelection" title="Clear selection">
            <i class="fa-solid fa-broom"></i>
            Clear
          </button>
        </div>

        <div class="bulkRight">
          <button class="btn ghost tiny" type="button" @click="copySelectedNames" :disabled="selectedIds.size === 0">
            <i class="fa-solid fa-copy"></i>
            Copy names
          </button>

          <button class="btn soft tiny" type="button" @click="downloadSelectedLogos" :disabled="selectedIds.size === 0">
            <i class="fa-solid fa-download"></i>
            Download logo{{ selectedIds.size > 1 ? "s (ZIP)" : "" }}
          </button>
        </div>
      </div>
    </section>

    <!-- TABLE -->
    <section class="tableWrap js-reveal">
      <!-- state -->
      <div v-if="loading" class="state big">
        <div class="loaderDot"></div>
        <div class="loaderDot"></div>
        <div class="loaderDot"></div>
        <div class="stateText">Loading members…</div>
      </div>

      <div v-else-if="error" class="state err">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <div class="stateText">{{ error }}</div>
        <button class="btn soft" type="button" @click="fetchAll">Try again</button>
      </div>

      <div v-else class="tableCard">
        <!-- header row -->
        <div class="tHead">
          <!-- ✅ better select-all design -->
          <button
            class="checkBtn head"
            type="button"
            @click="toggleSelectAllVisible"
            :class="{ on: allVisibleSelected }"
            :title="allVisibleSelected ? 'Unselect all' : 'Select all'"
            :aria-pressed="allVisibleSelected"
          >
            <i class="fa-solid" :class="allVisibleSelected ? 'fa-check' : 'fa-square'"></i>
          </button>

          <div class="hCell hId">ID</div>
          <div class="hCell hName">Bank</div>
          <div class="hCell hCode">Bankcode</div>
          <div class="hCell hLogo">Logo</div>
          <div class="hCell hActions">Actions</div>
        </div>

        <!-- body -->
        <div class="tBody" role="table" aria-label="Member banks table">
          <div
            v-for="m in filteredSorted"
            :key="m._key"
            class="tRow js-row"
            :class="{ selected: selectedIds.has(m.id) }"
            @mouseenter="rowHover($event, true)"
            @mouseleave="rowHover($event, false)"
          >
            <!-- ✅ better row select design -->
            <button
              class="checkBtn row"
              type="button"
              @click="toggleSelect(m.id)"
              :class="{ on: selectedIds.has(m.id) }"
              :title="selectedIds.has(m.id) ? 'Unselect' : 'Select'"
              :aria-pressed="selectedIds.has(m.id)"
            >
              <i class="fa-solid" :class="selectedIds.has(m.id) ? 'fa-check' : 'fa-square'"></i>
            </button>

            <!-- id -->
            <div class="rCell rId">
              <span class="pill">
                <i class="fa-solid fa-hashtag"></i>
                <span class="mono">{{ m.id }}</span>
              </span>
            </div>

            <!-- name -->
            <div class="rCell rName">
              <div class="nameTop">
                <div class="bankName" :title="m.nameLAUpper">{{ m.nameLAUpper }}</div>

                <button
                  class="miniBtn"
                  type="button"
                  title="Copy BanknameLA"
                  @click="copyText(m.nameLAUpper)"
                  @mouseenter="iconHover($event, true)"
                  @mouseleave="iconHover($event, false)"
                >
                  <i class="fa-solid fa-copy"></i>
                </button>
              </div>

              <div v-if="m.nameEN" class="bankNameEn" :title="m.nameEN">{{ m.nameEN }}</div>

              <!-- ✅ tiny product summary -->
              <div class="prodMini" v-if="m.products">
                <span class="miniPill">
                  <i class="fa-solid fa-credit-card"></i>
                  ລະບົບບັດທະນາຄານຮ່ວມກັນ <b>{{ m.products.cardATM.length }}</b>
                </span>
                <span class="miniPill">
                  <i class="fa-solid fa-mobile-screen"></i>
                  ລະບົບຊຳລະຂ້າມທະນາຄານເທິງມືຖື <b>{{ m.products.mbbankking.length }}</b>
                </span>
                <span class="miniPill">
                  <i class="fa-solid fa-globe"></i>
                  ລະບົບຊຳລະຂ້າມແດນຜ່ານ QR Code <b>{{ m.products.crossborder.length }}</b>
                </span>
              </div>
            </div>

            <!-- bankcode -->
            <div class="rCell rCode">
              <span v-if="m.bankcode" class="pill soft">
                <i class="fa-solid fa-barcode"></i>
                <span class="mono">{{ m.bankcode }}</span>
              </span>
              <span v-else class="muted">—</span>
            </div>

            <!-- logo -->
            <div class="rCell rLogo">
              <div v-if="m.logoUrl" class="logoCell">
                <button class="logoThumb" type="button" title="Preview details" @click="openPreview(m)">
                  <img v-if="!isPdfUrl(m.logoUrl)" :src="m.logoUrl" alt="logo" loading="lazy" />
                  <div v-else class="pdfBadge">
                    <i class="fa-solid fa-file-pdf"></i>
                    <span>PDF</span>
                  </div>
                </button>

                <div class="logoMeta">
                  <span class="pill img">
                    <i class="fa-solid" :class="isPdfUrl(m.logoUrl) ? 'fa-file-pdf' : 'fa-image'"></i>
                    {{ isPdfUrl(m.logoUrl) ? "PDF" : "IMG" }}
                  </span>

                  <button class="miniBtn" type="button" title="Download" @click="downloadOne(m)">
                    <i class="fa-solid fa-download"></i>
                  </button>

                  <button class="miniBtn" type="button" title="Open" @click="openInNewTab(m.logoUrl)">
                    <i class="fa-solid fa-up-right-from-square"></i>
                  </button>
                </div>
              </div>

              <div v-else class="noLogo">
                <i class="fa-solid fa-circle-minus"></i>
                <span>No logo</span>

                <!-- ✅ allow opening overlay even without logo -->
                <button class="miniBtn" type="button" title="View details" @click="openPreview(m)">
                  <i class="fa-solid fa-circle-info"></i>
                </button>
              </div>
            </div>

            <!-- actions -->
            <div class="rCell rActions">
              <button
                class="iconBtn"
                type="button"
                title="Preview details"
                @click="openPreview(m)"
                @mouseenter="iconHover($event, true)"
                @mouseleave="iconHover($event, false)"
              >
                <i class="fa-solid fa-eye"></i>
              </button>

              <button
                class="iconBtn"
                type="button"
                title="Download logo"
                :disabled="!m.logoUrl"
                @click="downloadOne(m)"
                @mouseenter="iconHover($event, true)"
                @mouseleave="iconHover($event, false)"
              >
                <i class="fa-solid fa-download"></i>
              </button>

              <button class="iconBtn ghost" type="button" title="Select" @click="toggleSelect(m.id)">
                <i class="fa-solid fa-check"></i>
              </button>
            </div>
          </div>

          <div v-if="!filteredSorted.length" class="state">
            <i class="fa-solid fa-inbox"></i>
            <div class="stateText">No members match your filters.</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Preview Overlay (✅ logo + ✅ products) -->
    <transition name="popup">
      <div v-if="modal.show" class="mask" @click.self="closeModal">
        <div class="modal" role="dialog" aria-modal="true" aria-label="Bank details">
          <div class="mHead">
            <div class="mTitle">
              <i class="fa-solid fa-building-columns"></i>
              Bank Details
            </div>

            <div class="mRight">
              <span class="pill soft" v-if="modal.item?.bankcode">
                <i class="fa-solid fa-barcode"></i>
                <span class="mono">{{ modal.item.bankcode }}</span>
              </span>

              <button v-if="modal.item?.logoUrl" class="btn tiny ghost" type="button" @click="openInNewTab(modal.item.logoUrl)">
                <i class="fa-solid fa-up-right-from-square"></i>
                Open logo
              </button>

              <button v-if="modal.item?.logoUrl" class="btn tiny soft" type="button" @click="downloadOne(modal.item)">
                <i class="fa-solid fa-download"></i>
                Download
              </button>

              <button class="iconClose" type="button" @click="closeModal" aria-label="Close">✕</button>
            </div>
          </div>

          <div class="mBody">
            <div class="pvTop">
              <div class="pvName">
                <b>{{ modal.item?.nameLAUpper }}</b>
                <span class="mono">#{{ modal.item?.id }}</span>
              </div>
              <div v-if="modal.item?.nameEN" class="pvNameEn">{{ modal.item?.nameEN }}</div>
            </div>

            <!-- ✅ Products grid -->
            <div class="pvProducts">
              <div class="prodCard">
                <div class="prodHead">
                  <div class="prodTitle">
                    <i class="fa-solid fa-credit-card"></i>
                    ລະບົບບັດທະນາຄານຮ່ວມກັນ
                  </div>
                  <span class="pill soft">
                    <i class="fa-solid fa-list"></i>
                    {{ (modal.item?.products?.cardATM || []).length }}
                  </span>
                </div>

                <div class="prodBody">
                  <div v-if="!(modal.item?.products?.cardATM || []).length" class="prodEmpty">
                    <i class="fa-solid fa-circle-minus"></i> No items
                  </div>

                  <ul v-else class="prodList">
                    <li v-for="(p, i) in modal.item.products.cardATM" :key="'ca' + i" class="prodRow">
                      <div class="prodMain">
                        <div class="prodName">{{ productTitle(p) }}</div>
                        <div v-if="productSub(p)" class="prodSub">{{ productSub(p) }}</div>
                      </div>

                      <button v-if="productLink(p)" class="miniBtn" type="button" title="Open link" @click="openInNewTab(productLink(p))">
                        <i class="fa-solid fa-up-right-from-square"></i>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="prodCard">
                <div class="prodHead">
                  <div class="prodTitle">
                    <i class="fa-solid fa-mobile-screen"></i>
                    ລະບົບຊຳລະຂ້າມທະນາຄານເທິງມືຖື
                  </div>
                  <span class="pill soft">
                    <i class="fa-solid fa-list"></i>
                    {{ (modal.item?.products?.mbbankking || []).length }}
                  </span>
                </div>

                <div class="prodBody">
                  <div v-if="!(modal.item?.products?.mbbankking || []).length" class="prodEmpty">
                    <i class="fa-solid fa-circle-minus"></i> No items
                  </div>

                  <ul v-else class="prodList">
                    <li v-for="(p, i) in modal.item.products.mbbankking" :key="'mb' + i" class="prodRow">
                      <div class="prodMain">
                        <div class="prodName">{{ productTitle(p) }}</div>
                        <div v-if="productSub(p)" class="prodSub">{{ productSub(p) }}</div>
                      </div>

                      <button v-if="productLink(p)" class="miniBtn" type="button" title="Open link" @click="openInNewTab(productLink(p))">
                        <i class="fa-solid fa-up-right-from-square"></i>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="prodCard">
                <div class="prodHead">
                  <div class="prodTitle">
                    <i class="fa-solid fa-globe"></i>
                    ລະບົບຊຳລະຂ້າມແດນຜ່ານ QR Code
                  </div>
                  <span class="pill soft">
                    <i class="fa-solid fa-list"></i>
                    {{ (modal.item?.products?.crossborder || []).length }}
                  </span>
                </div>

                <div class="prodBody">
                  <div v-if="!(modal.item?.products?.crossborder || []).length" class="prodEmpty">
                    <i class="fa-solid fa-circle-minus"></i> No items
                  </div>

                  <ul v-else class="prodList">
                    <li v-for="(p, i) in modal.item.products.crossborder" :key="'cb' + i" class="prodRow">
                      <div class="prodMain">
                        <!-- ✅ Crossborder route badge + flags -->
                        <div class="prodName">
                          <span v-if="crossRoute(p)" class="cbRoute" :title="crossRouteTitle(p)">
                            <span class="cbFlag">{{ crossFlagFrom(p) }}</span>
                            <span class="cbArrow">→</span>
                            <span class="cbFlag">{{ crossFlagTo(p) }}</span>
                          </span>
                          {{ productTitle(p) }}
                        </div>

                        <div v-if="productSub(p)" class="prodSub">{{ productSub(p) }}</div>
                      </div>

                      <button v-if="productLink(p)" class="miniBtn" type="button" title="Open link" @click="openInNewTab(productLink(p))">
                        <i class="fa-solid fa-up-right-from-square"></i>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Logo preview -->
            <div class="pvBox">
              <div class="pvBoxHead">
                <div class="pvBoxTitle">
                  <i class="fa-solid" :class="isPdfUrl(modal.item?.logoUrl) ? 'fa-file-pdf' : 'fa-image'"></i>
                  Logo preview
                </div>

                <span v-if="modal.item?.logoUrl" class="pill img">
                  {{ isPdfUrl(modal.item.logoUrl) ? "PDF" : "IMG" }}
                </span>
                <span v-else class="pill">
                  <i class="fa-solid fa-circle-minus"></i>
                  None
                </span>
              </div>

              <div v-if="modal.item?.logoUrl" class="pvBoxInner">
                <iframe v-if="isPdfUrl(modal.item.logoUrl)" class="pvFrame" :src="modal.item.logoUrl" />
                <img v-else class="pvImg" :src="modal.item.logoUrl" alt="" />
              </div>

              <div v-else class="pvNone">
                <i class="fa-solid fa-circle-minus"></i>
                No logo for this bank
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Toast -->
    <transition name="toast">
      <div v-if="toast.show" class="toast" :class="toast.kind">
        <div class="toastLeft">
          <div class="toastTitle">
            <i
              class="fa-solid"
              :class="toast.kind === 'ok' ? 'fa-circle-check' : toast.kind === 'err' ? 'fa-circle-xmark' : 'fa-circle-info'"
            ></i>
            {{ toast.title }}
          </div>
          <div class="toastSub">{{ toast.text }}</div>
        </div>
        <div class="toastRight">
          <button class="toastBtn ghost" type="button" @click="hideToast" aria-label="Dismiss">✕</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import gsap from "gsap";

/** =========================
 * ✅ CONFIG
 * ========================= */
const API_ORIGIN = "http://localhost:3000";
const MEMBERS_API_URL = "http://localhost:3000/api/members";

/** =========================
 * state
 * ========================= */
const rootEl = ref(null);

const loading = ref(false);
const error = ref("");
const items = ref([]);

const q = ref("");
const logoFilter = ref("all"); // all | has | none
const sortMode = ref("id_asc"); // id_asc | id_desc | name_asc

const selectedIds = ref(new Set());

/** =========================
 * helpers
 * ========================= */
function toAbsUrl(u) {
  const s = String(u || "").trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("//")) return `${window.location.protocol}${s}`;
  if (s.startsWith("/")) return `${API_ORIGIN}${s}`;
  return `${API_ORIGIN}/${s.replace(/^\.?\//, "")}`;
}
function cleanUrl(u) {
  return String(u || "").split("#")[0].split("?")[0];
}
function extFromUrl(u) {
  const c = cleanUrl(u);
  const i = c.lastIndexOf(".");
  if (i === -1) return "";
  return c.slice(i + 1).toLowerCase();
}
function isPdfUrl(u) {
  return extFromUrl(u) === "pdf";
}
function safeFileExtFromBlobType(type, fallbackExt) {
  const t = String(type || "").toLowerCase();
  if (t.includes("pdf")) return "pdf";
  if (t.includes("png")) return "png";
  if (t.includes("jpeg") || t.includes("jpg")) return "jpg";
  if (t.includes("webp")) return "webp";
  if (t.includes("gif")) return "gif";
  if (t.includes("bmp")) return "bmp";
  if (t.includes("svg")) return "svg";
  return fallbackExt || "bin";
}

function normalizeId(it) {
  const v = it?.idmember ?? it?.member_id ?? it?.id ?? it?._id ?? it?.uuid ?? it?.key ?? it?.bank_id ?? null;
  const n = Number(v);
  return Number.isFinite(n) ? n : String(v || "").trim();
}

/** ✅ BanknameLA + BanknameEN */
function normalizeNames(it) {
  const la =
    String(
      it?.BanknameLA ??
        it?.banknameLA ??
        it?.bankname_la ??
        it?.bankname ??
        it?.bank_name_la ??
        it?.name_la ??
        ""
    ).trim() || "";

  const en =
    String(
      it?.BanknameEN ??
        it?.banknameEN ??
        it?.bankname_en ??
        it?.bank_name_en ??
        it?.name_en ??
        it?.name ??
        ""
    ).trim() || "";

  const laUpper = la ? la.toUpperCase() : "";
  const display = laUpper || (en ? en.toUpperCase() : "") || "(UNNAMED BANK)";
  return { la, laUpper: display, en };
}

function normalizeBankcode(it) {
  return String(it?.bankcode ?? it?.bank_code ?? it?.code ?? it?.short_code ?? "").trim();
}

function normalizeLogoUrl(it) {
  const cands = [
    it?.logo_url,
    it?.logo,
    it?.logoPath,
    it?.logo_path,
    it?.image_url,
    it?.image,
    it?.photo,
    it?.avatar,
    it?.thumbnail,
    it?.thumb,
    it?.file_url,
    it?.file,
  ].filter(Boolean);

  if (cands.length) return toAbsUrl(cands[0]);
  const nested = it?.logo?.url || it?.image?.url || it?.file?.url || it?.attachment?.url || "";
  if (nested) return toAbsUrl(nested);
  return "";
}

function makeKey(it, i) {
  return String(normalizeId(it) ?? i);
}

function openInNewTab(url) {
  const u = String(url || "");
  if (!u) return;
  window.open(u, "_blank", "noopener,noreferrer");
}

async function copyText(text) {
  const s = String(text || "");
  if (!s) return;
  try {
    await navigator.clipboard.writeText(s);
    toastOk("Copied", "Copied to clipboard");
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = s;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      toastOk("Copied", "Copied to clipboard");
    } catch {
      toastErr("Copy failed", "Browser blocked clipboard permission");
    }
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "download";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

async function fetchAsBlob(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return await res.blob();
}

/** =========================
 * ✅ Products normalize (CardATM.items / Mbbankking.items / Crossborder.items)
 * ========================= */
function safeJson(x) {
  try {
    return JSON.parse(String(x));
  } catch {
    return null;
  }
}

function asItemsArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;

  // string may be JSON
  if (typeof v === "string") {
    const parsed = safeJson(v);
    if (!parsed) return v.trim() ? [v.trim()] : [];
    return asItemsArray(parsed);
  }

  // object may contain items/Items
  if (typeof v === "object") {
    const items = v.items ?? v.Items ?? v.ITEMS ?? null;
    if (Array.isArray(items)) return items;
    // sometimes object itself is a single item
    return Object.keys(v).length ? [v] : [];
  }

  return [];
}

function normalizeProductGroup(it, keys) {
  for (const k of keys) {
    const val = it?.[k];
    if (val != null) {
      // if group is object with items
      if (typeof val === "object" && !Array.isArray(val)) {
        const arr = asItemsArray(val.items ?? val.Items ?? val.ITEMS ?? val);
        return arr;
      }
      return asItemsArray(val);
    }
  }
  return [];
}

function normalizeProducts(it) {
  // user wants: CardATM.items, Mbbankking.items, Crossborder.items
  const cardATM = normalizeProductGroup(it, ["CardATM", "cardATM", "card_atm", "cardAtm"]);
  const mbbankking = normalizeProductGroup(it, ["Mbbankking", "Mbbanking", "mbbankking", "mbbanking", "mobileBanking", "MobileBanking"]);
  const crossborder = normalizeProductGroup(it, ["Crossborder", "crossborder", "cross_border", "CrossBorder"]);
  return { cardATM, mbbankking, crossborder };
}

function productTitle(p) {
  if (p == null) return "-";
  if (typeof p === "string") return p;

  const t =
    p.title ??
    p.name ??
    p.product ??
    p.product_name ??
    p.ProductName ??
    p.label ??
    p.code ??
    "";

  const s = String(t || "").trim();
  if (s) return s;

  // fallback: compact stringify
  try {
    return JSON.stringify(p);
  } catch {
    return "(item)";
  }
}

function productSub(p) {
  if (!p || typeof p === "string") return "";
  const s =
    p.description ??
    p.desc ??
    p.detail ??
    p.subtitle ??
    p.sub ??
    p.note ??
    "";
  const out = String(s || "").trim();
  return out;
}

function productLink(p) {
  if (!p || typeof p === "string") return "";
  const u = p.url ?? p.link ?? p.href ?? p.website ?? p.web ?? "";
  const s = String(u || "").trim();
  if (!s) return "";
  return toAbsUrl(s);
}

/** =========================
 * ✅ Crossborder flag mapping (KH-LA, LA-KH, TH-LA, LA-TH, CH-LA, VN-LA)
 * ========================= */
const CB_COUNTRIES = {
  LA: { flag: "🇱🇦", name: "Laos", la: "ລາວ" },
  KH: { flag: "🇰🇭", name: "Cambodia", la: "ກຳປູເຈຍ" },
  TH: { flag: "🇹🇭", name: "Thailand", la: "ໄທ" },
  CH: { flag: "🇨🇳", name: "China", la: "ຈີນ" }, // user wants CH
  VN: { flag: "🇻🇳", name: "Vietnam", la: "ຫວຽດນາມ" },
};

function _normTxt(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}
function _idxAny(text, variants) {
  const t = String(text || "");
  let best = -1;
  for (const v of variants) {
    const i = t.indexOf(v);
    if (i !== -1) best = best === -1 ? i : Math.min(best, i);
  }
  return best;
}
function _routeFromCodes(codeA, codeB) {
  let a = String(codeA || "").toUpperCase().trim();
  let b = String(codeB || "").toUpperCase().trim();
  // accept CN as China too, but normalize to CH for display
  if (a === "CN") a = "CH";
  if (b === "CN") b = "CH";
  if (!CB_COUNTRIES[a] || !CB_COUNTRIES[b]) return null;
  return { from: a, to: b };
}

/** Detect route from item text (title/sub) */
function detectCrossborderRoute(p) {
  const t = _normTxt(`${productTitle(p)} ${productSub(p)}`) || "";

  // 1) explicit code patterns like "KH - LA", "LA-TH", "VN→LA", "CN-LA"
  const m = t.match(/\b(KH|LA|TH|CH|VN|CN)\s*(?:-|→|->|to)\s*(KH|LA|TH|CH|VN|CN)\b/i);
  if (m?.[1] && m?.[2]) {
    const r = _routeFromCodes(m[1], m[2]);
    if (r) return r;
  }

  // 2) Lao name order mapping (use order in string)
  const iLA = _idxAny(t, ["ລາວ", " Laos", "Laos", "LAO", "Lao"]);
  const iKH = _idxAny(t, ["ກຳປູເຈຍ", "Cambodia", "Kampuchea", "KHMER"]);
  const iTH = _idxAny(t, ["ໄທ", "Thailand", "Thai"]);
  const iCH = _idxAny(t, ["ຈີນ", "China", "CN", "CH"]);
  const iVN = _idxAny(t, ["ຫວຽດນາມ", "Vietnam", "Viet"]);

  // Cambodia <-> Laos
  if (iKH !== -1 && iLA !== -1) return iKH < iLA ? { from: "KH", to: "LA" } : { from: "LA", to: "KH" };

  // Thailand <-> Laos
  if (iTH !== -1 && iLA !== -1) return iTH < iLA ? { from: "TH", to: "LA" } : { from: "LA", to: "TH" };

  // China -> Laos (per mapping)
  if (iCH !== -1 && iLA !== -1) return { from: "CH", to: "LA" };

  // Vietnam -> Laos (per mapping)
  if (iVN !== -1 && iLA !== -1) return { from: "VN", to: "LA" };

  return null;
}

function crossRoute(p) {
  return detectCrossborderRoute(p);
}
function crossFlagFrom(p) {
  const r = crossRoute(p);
  if (!r) return "";
  return CB_COUNTRIES[r.from]?.flag || "";
}
function crossFlagTo(p) {
  const r = crossRoute(p);
  if (!r) return "";
  return CB_COUNTRIES[r.to]?.flag || "";
}
function crossRouteTitle(p) {
  const r = crossRoute(p);
  if (!r) return "";
  const a = CB_COUNTRIES[r.from];
  const b = CB_COUNTRIES[r.to];
  return `${a?.la || r.from} → ${b?.la || r.to} (${r.from} - ${r.to})`;
}

/** =========================
 * Fetch members
 * ========================= */
let aborter = null;

async function fetchAll() {
  loading.value = true;
  error.value = "";
  try {
    if (aborter) aborter.abort();
    aborter = new AbortController();

    const res = await fetch(MEMBERS_API_URL, { signal: aborter.signal });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

    const data = await res.json();
    const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];

    items.value = (list || []).map((it, i) => {
      const id = normalizeId(it);
      const bankcode = normalizeBankcode(it);
      const logoUrl = normalizeLogoUrl(it);
      const names = normalizeNames(it);

      const products = normalizeProducts(it); // ✅ add products

      return {
        _raw: it,
        _key: makeKey(it, i),
        id,
        bankcode,
        logoUrl,
        nameLA: names.la,
        nameLAUpper: names.laUpper, // ✅ uppercase display
        nameEN: names.en,

        // ✅ products for overlay
        products,
      };
    });

    // keep selection only for existing ids
    const keep = new Set();
    for (const id of selectedIds.value) {
      if (items.value.some((x) => String(x.id) === String(id))) keep.add(id);
    }
    selectedIds.value = keep;

    await nextTick();
    revealRows();
  } catch (e) {
    if (e?.name === "AbortError") return;
    error.value = e?.message || "Failed to load members";
  } finally {
    loading.value = false;
  }
}

/** =========================
 * Filtering + sorting
 * (✅ PINNED removed)
 * ========================= */
const filteredSorted = computed(() => {
  const s = String(q.value || "").toLowerCase().trim();
  let list = items.value.slice();

  if (s) {
    list = list.filter((x) => {
      const idStr = String(x.id ?? "").toLowerCase();
      const laStr = String(x.nameLA ?? "").toLowerCase();
      const laUpStr = String(x.nameLAUpper ?? "").toLowerCase();
      const enStr = String(x.nameEN ?? "").toLowerCase();
      const codeStr = String(x.bankcode ?? "").toLowerCase();
      return idStr.includes(s) || laStr.includes(s) || laUpStr.includes(s) || enStr.includes(s) || codeStr.includes(s);
    });
  }

  if (logoFilter.value === "has") list = list.filter((x) => !!x.logoUrl);
  if (logoFilter.value === "none") list = list.filter((x) => !x.logoUrl);

  const nOr = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  if (sortMode.value === "name_asc") {
    list.sort((a, b) => String(a.nameLAUpper).localeCompare(String(b.nameLAUpper)));
  } else if (sortMode.value === "id_desc") {
    list.sort((a, b) => {
      const na = nOr(a.id);
      const nb = nOr(b.id);
      if (na != null && nb != null) return nb - na;
      return String(b.id ?? "").localeCompare(String(a.id ?? ""));
    });
  } else {
    list.sort((a, b) => {
      const na = nOr(a.id);
      const nb = nOr(b.id);
      if (na != null && nb != null) return na - nb;
      return String(a.id ?? "").localeCompare(String(b.id ?? ""));
    });
  }

  return list;
});

watch([q, logoFilter, sortMode], async () => {
  await nextTick();
  revealRows();
});

/** =========================
 * Selection
 * ========================= */
const allVisibleSelected = computed(() => {
  const vis = filteredSorted.value;
  if (!vis.length) return false;
  return vis.every((m) => selectedIds.value.has(m.id));
});

function toggleSelect(id) {
  const set = new Set(selectedIds.value);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  selectedIds.value = set;
}
function clearSelection() {
  selectedIds.value = new Set();
}
function selectAllVisible() {
  const set = new Set(selectedIds.value);
  for (const m of filteredSorted.value) set.add(m.id);
  selectedIds.value = set;
}
function toggleSelectAllVisible() {
  if (allVisibleSelected.value) {
    const set = new Set(selectedIds.value);
    for (const m of filteredSorted.value) set.delete(m.id);
    selectedIds.value = set;
  } else {
    selectAllVisible();
  }
}
function selectedMembers() {
  const map = new Map(items.value.map((x) => [String(x.id), x]));
  const out = [];
  for (const id of selectedIds.value) {
    const m = map.get(String(id));
    if (m) out.push(m);
  }
  const nOr = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  out.sort((a, b) => {
    const na = nOr(a.id);
    const nb = nOr(b.id);
    if (na != null && nb != null) return na - nb;
    return String(a.id ?? "").localeCompare(String(b.id ?? ""));
  });
  return out;
}

/** =========================
 * Download (single / ZIP)
 * ========================= */
async function downloadOne(m) {
  if (!m?.logoUrl) return toastErr("No logo", "This member has no logo.");
  try {
    const blob = await fetchAsBlob(m.logoUrl);
    const fallbackExt = extFromUrl(m.logoUrl) || "bin";
    const ext = safeFileExtFromBlobType(blob.type, fallbackExt);

    const safeName = String(m.nameLAUpper || "file").replace(/[^\w\-]+/g, "_").slice(0, 48);
    const idPart = String(m.id ?? "").replace(/[^\w\-]+/g, "");
    const fname = `${safeName || "file"}_${idPart || "id"}.${ext}`;

    downloadBlob(blob, fname);
    toastOk("Downloaded", fname);
  } catch (e) {
    toastErr("Download failed", e?.message || "Cannot download file (CORS?)");
    openInNewTab(m.logoUrl);
  }
}

async function downloadSelectedLogos() {
  const list = selectedMembers().filter((x) => !!x.logoUrl);
  const missingCount = selectedIds.value.size - list.length;

  if (!list.length) return toastErr("No logos", "Selected members have no logos.");

  if (list.length === 1) {
    if (missingCount > 0) toastInfo("Skipped", `${missingCount} member(s) without logo skipped.`);
    return downloadOne(list[0]);
  }

  let JSZip;
  try {
    JSZip = (await import("jszip")).default;
  } catch {
    toastErr("Missing dependency", "Please install: npm i jszip");
    return;
  }

  const zip = new JSZip();
  const folder = zip.folder("member-logos");

  toastInfo("Preparing ZIP", `Downloading ${list.length} file(s)…`);

  let okCount = 0;
  let failCount = 0;

  for (const m of list) {
    try {
      const blob = await fetchAsBlob(m.logoUrl);
      const fallbackExt = extFromUrl(m.logoUrl) || "bin";
      const ext = safeFileExtFromBlobType(blob.type, fallbackExt);

      const safeName = String(m.nameLAUpper || "file").replace(/[^\w\-]+/g, "_").slice(0, 48);
      const idPart = String(m.id ?? "").replace(/[^\w\-]+/g, "");
      const fname = `${safeName || "file"}_${idPart || "id"}.${ext}`;

      folder.file(fname, blob);
      okCount++;
    } catch {
      failCount++;
    }
  }

  if (okCount === 0) {
    toastErr("ZIP failed", "Cannot fetch files (CORS?). Try opening files in new tab.");
    return;
  }

  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, "member-logos.zip");

  const msgParts = [];
  if (missingCount > 0) msgParts.push(`skipped(no logo) ${missingCount}`);
  if (failCount > 0) msgParts.push(`failed ${failCount}`);
  toastOk("ZIP ready", msgParts.length ? `Saved • ${msgParts.join(" • ")}` : "Saved");
}

async function copySelectedNames() {
  const list = selectedMembers();
  if (!list.length) return;
  const text = list.map((x) => x.nameLAUpper).join("\n");
  await copyText(text);
}

/** =========================
 * Preview modal
 * ========================= */
const modal = ref({ show: false, item: null });

function openPreview(m) {
  modal.value = { show: true, item: m };
  gsap.fromTo(".modal", { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.18, ease: "power2.out" });
}
function closeModal() {
  modal.value = { show: false, item: null };
}

/** =========================
 * Toast
 * ========================= */
const toast = ref({ show: false, kind: "ok", title: "", text: "" });
let toastTimer = null;

function showToast(kind, title, text) {
  toast.value = { show: true, kind, title, text };
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.value.show = false), 5200);
}
function hideToast() {
  toast.value.show = false;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = null;
}
function toastOk(title, text) {
  showToast("ok", title, text);
}
function toastErr(title, text) {
  showToast("err", title, text);
}
function toastInfo(title, text) {
  showToast("info", title, text);
}

/** =========================
 * GSAP
 * ========================= */
function btnHover(e, enter) {
  gsap.to(e.currentTarget, { y: enter ? -2 : 0, duration: 0.22, ease: "power2.out" });
}
function iconHover(e, enter) {
  gsap.to(e.currentTarget, { y: enter ? -2 : 0, duration: 0.18, ease: "power2.out" });
}
function rowHover(e, enter) {
  gsap.to(e.currentTarget, { y: enter ? -2 : 0, duration: 0.18, ease: "power2.out" });
}

async function initReveal() {
  gsap.set(".js-reveal", { opacity: 0, y: 12 });
  gsap.set(".js-row", { opacity: 0, y: 10 });

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.to(".js-reveal", { opacity: 1, y: 0, stagger: 0.06, duration: 0.42 }, 0.05);
  tl.to(".js-row", { opacity: 1, y: 0, stagger: 0.03, duration: 0.42 }, 0.12);
}

function revealRows() {
  const rows = rootEl.value?.querySelectorAll?.(".js-row");
  if (!rows || !rows.length) return;
  gsap.killTweensOf(rows);
  gsap.fromTo(rows, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.42, ease: "power3.out", stagger: 0.02 });
}

/** =========================
 * Lifecycle
 * ========================= */
function onGlobalKeydown(e) {
  if (e?.key === "Escape" && modal.value.show) closeModal();
}

onMounted(async () => {
  window.addEventListener("keydown", onGlobalKeydown);
  await nextTick();
  await initReveal();
  await fetchAll();
});

onBeforeUnmount(() => {
  if (aborter) aborter.abort();
  window.removeEventListener("keydown", onGlobalKeydown);
  hideToast();
});
</script>

<style scoped>
.mbv {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 6px 2px 18px;
  color: var(--txt);
}

/* Topbar */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;

  padding: 14px 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.25);
  position: relative;
  overflow: hidden;
}
.topbar::before {
  content: "";
  position: absolute;
  inset: -1px;
  pointer-events: none;
  background: radial-gradient(560px 260px at 18% 15%, rgba(56, 189, 248, 0.12), transparent 60%),
    radial-gradient(560px 260px at 80% 35%, rgba(99, 102, 241, 0.1), transparent 62%);
  opacity: 0.9;
}

.titleRow {
  display: flex;
  align-items: center;
  gap: 12px;
}
.titleIcon {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(99, 102, 241, 0.14));
  border: 1px solid rgba(56, 189, 248, 0.18);
  box-shadow: 0 18px 46px rgba(56, 189, 248, 0.08);
}
.pageTitle {
  font-weight: 950;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.95);
}
.pageSub {
  margin-top: 2px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.62);
}

.topRight {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Search */
.searchWrap {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 10px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.08);
  min-width: min(420px, 42vw);
}
.searchIcon {
  opacity: 0.85;
}
.search {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 700;
}
.clear {
  width: 30px;
  height: 30px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
}
.clear:hover {
  border-color: rgba(56, 189, 248, 0.22);
  box-shadow: 0 14px 34px rgba(56, 189, 248, 0.08);
}

/* Filters */
.filters {
  display: inline-flex;
  gap: 10px;
  align-items: center;
}
.select {
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.88);
  outline: none;
  padding: 10px 12px;
  font-weight: 900;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border-radius: 14px;
  font-weight: 900;
  cursor: pointer;

  border: 1px solid rgba(56, 189, 248, 0.22);
  background: rgba(56, 189, 248, 0.12);
  color: rgba(255, 255, 255, 0.92);
}
.btn.ghost {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.82);
}
.btn.soft {
  border-color: rgba(56, 189, 248, 0.16);
  background: rgba(56, 189, 248, 0.08);
}
.btn.tiny {
  padding: 8px 10px;
  border-radius: 12px;
  font-weight: 900;
  font-size: 12px;
}
.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.spin {
  animation: spin 0.9s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Stats */
.stats {
  display: grid;
  grid-template-columns: 180px 180px 180px 1fr;
  gap: 12px;
  align-items: stretch;
}
.statCard {
  padding: 12px 12px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 46px rgba(0, 0, 0, 0.18);
}
.statLabel {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.62);
  font-weight: 800;
}
.statValue {
  margin-top: 6px;
  font-size: 18px;
  font-weight: 950;
  color: rgba(255, 255, 255, 0.92);
}

/* Bulk bar */
.bulk {
  padding: 10px 10px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.07);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  opacity: 0.55;
  pointer-events: none;
}
.bulk.on {
  opacity: 1;
  pointer-events: auto;
}
.bulkLeft,
.bulkRight {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  font-weight: 900;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.84);
}

/* Pills */
.pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.82);
}
.pill.soft {
  border-color: rgba(56, 189, 248, 0.16);
  background: rgba(56, 189, 248, 0.08);
}
.pill.img {
  border-color: rgba(56, 189, 248, 0.18);
  background: rgba(56, 189, 248, 0.08);
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

/* Table wrapper */
.tableWrap {
  border-radius: 18px;
  overflow: hidden;
}
.tableCard {
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  position: relative;
}
.tableCard::before {
  content: "";
  position: absolute;
  inset: -1px;
  pointer-events: none;
  opacity: 0.75;
  background: radial-gradient(620px 280px at 10% 0%, rgba(56, 189, 248, 0.1), transparent 60%),
    radial-gradient(620px 280px at 90% 10%, rgba(99, 102, 241, 0.08), transparent 62%);
}

/* header */
.tHead {
  position: sticky;
  top: 0;
  z-index: 2;
  display: grid;
  grid-template-columns: 54px 160px 1fr 200px 240px 220px;
  gap: 10px;
  align-items: center;
  padding: 12px 12px;

  background: rgba(8, 12, 28, 0.62);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.hCell {
  font-weight: 950;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
  letter-spacing: 0.2px;
}

/* ✅ NEW: Stronger, clearer selection buttons */
.checkBtn {
  width: 46px;
  height: 40px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.055);
  color: rgba(255, 255, 255, 0.75);
  cursor: pointer;

  display: grid;
  place-items: center;
  position: relative;
  overflow: hidden;

  transition: transform 120ms ease, background 180ms ease, border-color 180ms ease, box-shadow 180ms ease, color 180ms ease;
}
.checkBtn::before {
  content: "";
  position: absolute;
  inset: -1px;
  pointer-events: none;
  opacity: 0;
  background: radial-gradient(220px 120px at 30% 30%, rgba(56, 189, 248, 0.22), transparent 60%),
    radial-gradient(220px 120px at 80% 70%, rgba(99, 102, 241, 0.18), transparent 62%);
  transition: opacity 180ms ease;
}
.checkBtn i {
  position: relative;
  z-index: 1;
  font-size: 16px;
}
.checkBtn:hover {
  transform: translateY(-1px);
  border-color: rgba(56, 189, 248, 0.22);
  box-shadow: 0 14px 34px rgba(56, 189, 248, 0.10);
}
.checkBtn:active {
  transform: translateY(0px) scale(0.98);
}
.checkBtn.on {
  border-color: rgba(56, 189, 248, 0.35);
  background: rgba(56, 189, 248, 0.14);
  color: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 46px rgba(56, 189, 248, 0.14);
}
.checkBtn.on::before {
  opacity: 1;
}
.checkBtn.head {
  margin-left: 2px;
}
.checkBtn.row {
  background: rgba(255, 255, 255, 0.05);
}
.checkBtn.row.on {
  background: rgba(56, 189, 248, 0.16);
}

/* body */
.tBody {
  padding: 10px 12px 12px;
  display: grid;
  gap: 10px;
  max-height: calc(100vh - 320px);
  overflow: auto;
}
.tBody::-webkit-scrollbar {
  width: 10px;
}
.tBody::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
}

.tRow {
  display: grid;
  grid-template-columns: 54px 160px 1fr 200px 240px 220px;
  gap: 10px;
  align-items: center;

  padding: 12px 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.07);
  transition: background 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}
.tRow:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(56, 189, 248, 0.18);
  box-shadow: 0 18px 46px rgba(56, 189, 248, 0.08);
}
.tRow.selected {
  border-color: rgba(56, 189, 248, 0.22);
  box-shadow: 0 22px 60px rgba(56, 189, 248, 0.10);
}

.rCell {
  min-width: 0;
}

.rId {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.rName {
  display: grid;
  gap: 6px;
}
.nameTop {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.bankName {
  font-weight: 950;
  color: rgba(255, 255, 255, 0.94);
  line-height: 1.2;
  font-size: 14px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bankNameEn {
  font-size: 12px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.62);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ✅ tiny product summary */
.prodMini {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 2px;
}
.miniPill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 900;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(0, 0, 0, 0.18);
  color: rgba(255, 255, 255, 0.78);
}
.miniPill b {
  color: rgba(255, 255, 255, 0.92);
}

.muted {
  color: rgba(255, 255, 255, 0.55);
  font-weight: 800;
}

.miniBtn {
  width: 34px;
  height: 34px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.86);
  cursor: pointer;
  flex: 0 0 auto;
}
.miniBtn:hover {
  border-color: rgba(56, 189, 248, 0.22);
  box-shadow: 0 14px 34px rgba(56, 189, 248, 0.08);
}

.rLogo .logoCell {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* กรอบโลโก้ */
.logoThumb {
  width: 88px;
  height: 56px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.18);
  overflow: hidden;
  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: center;
}

/* รูปโลโก้ */
.logoThumb img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  padding: 6px;
  display: block;
}

/* PDF badge */
.pdfBadge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  width: 100%;
  height: 100%;
  font-weight: 950;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.9);
  background: linear-gradient(135deg, rgba(255, 80, 80, 0.25), rgba(120, 20, 20, 0.25));
}

/* ปรับ column width ให้เหมาะ */
.tHead,
.tRow {
  grid-template-columns: 54px 160px 1fr 200px 300px 220px;
}
.logoMeta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.noLogo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.62);
  font-weight: 900;
}

.rActions {
  display: inline-flex;
  gap: 8px;
  justify-content: flex-end;
}
.iconBtn {
  width: 40px;
  height: 38px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
}
.iconBtn.ghost {
  background: rgba(255, 255, 255, 0.04);
}
.iconBtn:hover {
  border-color: rgba(56, 189, 248, 0.22);
  box-shadow: 0 14px 34px rgba(56, 189, 248, 0.10);
}
.iconBtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* States */
.state {
  padding: 18px 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.025);
  border: 1px dashed rgba(255, 255, 255, 0.14);
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  color: rgba(255, 255, 255, 0.75);
}
.state.big {
  flex-direction: column;
  gap: 12px;
}
.state.err {
  border-style: solid;
  border-color: rgba(255, 80, 80, 0.22);
  background: rgba(255, 80, 80, 0.08);
}
.stateText {
  font-weight: 800;
}
.loaderDot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.06);
  animation: ld 0.9s ease-in-out infinite;
}
.loaderDot:nth-child(2) {
  animation-delay: 0.12s;
}
.loaderDot:nth-child(3) {
  animation-delay: 0.24s;
}
@keyframes ld {
  0% {
    transform: translateY(0);
    opacity: 0.55;
  }
  50% {
    transform: translateY(-5px);
    opacity: 1;
  }
  100% {
    transform: translateY(0);
    opacity: 0.55;
  }
}

/* Modal */
.mask {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(10px);
}
.modal {
  width: min(980px, 96vw);
  max-height: min(88vh, 980px);
  overflow: hidden;
  border-radius: 18px;
  background: rgba(8, 12, 28, 0.86);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.52);
  backdrop-filter: blur(14px);
  display: grid;
  grid-template-rows: auto 1fr;
}
.mHead {
  padding: 14px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.mTitle {
  font-weight: 950;
  display: inline-flex;
  gap: 10px;
  align-items: center;
  color: rgba(255, 255, 255, 0.92);
}
.mRight {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.iconClose {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
}
.iconClose:hover {
  border-color: rgba(56, 189, 248, 0.22);
  box-shadow: 0 14px 34px rgba(56, 189, 248, 0.10);
}
.mBody {
  padding: 12px 14px 14px;
  overflow: auto;
}
.mBody::-webkit-scrollbar {
  width: 10px;
}
.mBody::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
}

.pvTop {
  padding: 2px 0 10px;
}
.pvName {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.9);
}
.pvNameEn {
  margin-top: 6px;
  font-size: 12px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.62);
}

/* ✅ Products */
.pvProducts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 8px;
}
.prodCard {
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}
.prodHead {
  padding: 12px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.14);
}
.prodTitle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 950;
  color: rgba(255, 255, 255, 0.92);
}
.prodBody {
  padding: 10px 10px 12px;
}
.prodEmpty {
  padding: 14px 10px;
  border-radius: 14px;
  border: 1px dashed rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-weight: 900;
}
.prodList {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 10px;
}
.prodRow {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.07);
}
.prodRow:hover {
  border-color: rgba(56, 189, 248, 0.18);
  background: rgba(255, 255, 255, 0.04);
}
.prodMain {
  min-width: 0;
  display: grid;
  gap: 4px;
}
.prodName {
  font-weight: 950;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.92);
  word-break: break-word;
}
.prodSub {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.66);
  word-break: break-word;
}

/* ✅ Crossborder flags badge */
.cbRoute {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 999px;
  margin-right: 8px;

  border: 1px solid rgba(56, 189, 248, 0.18);
  background: rgba(56, 189, 248, 0.08);
  box-shadow: 0 10px 26px rgba(56, 189, 248, 0.06);
}
.cbFlag {
  font-size: 23px;
  line-height: 1;
}
.cbArrow {
  opacity: 0.85;
  font-size: 11px;
}

/* Logo preview box */
.pvBox {
  margin-top: 12px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(0, 0, 0, 0.12);
}
.pvBoxHead {
  padding: 12px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.14);
}
.pvBoxTitle {
  font-weight: 950;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.92);
}
.pvBoxInner {
  padding: 12px;
}
.pvImg {
  width: 100%;
  height: min(48vh, 520px);
  object-fit: contain;
  display: block;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.10);
}
.pvFrame {
  width: 100%;
  height: min(62vh, 680px);
  border: none;
  display: block;
  border-radius: 14px;
  background: #0b1024;
}
.pvNone {
  padding: 18px 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.72);
  font-weight: 900;
}

/* Toast */
.toast {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 9999;

  display: flex;
  align-items: center;
  gap: 14px;

  padding: 12px 12px;
  border-radius: 16px;
  background: rgba(8, 12, 28, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.10);
  backdrop-filter: blur(14px);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.38);
  max-width: min(460px, 92vw);
}
.toast.ok {
  border-color: rgba(56, 189, 248, 0.18);
}
.toast.err {
  border-color: rgba(255, 80, 80, 0.22);
}
.toast.info {
  border-color: rgba(255, 255, 255, 0.14);
}

.toastLeft {
  display: grid;
  gap: 4px;
  min-width: 0;
}
.toastTitle {
  font-weight: 950;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.92);
}
.toastSub {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.65);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.toastRight {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}
.toastBtn {
  padding: 9px 10px;
  border-radius: 12px;
  font-weight: 900;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.82);
}
.toastBtn.ghost {
  border-color: rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.06);
}

/* Transitions */
.popup-enter-active,
.popup-leave-active {
  transition: transform 180ms ease, opacity 180ms ease;
}
.popup-enter-from,
.popup-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.99);
}
.toast-enter-active,
.toast-leave-active {
  transition: transform 180ms ease, opacity 180ms ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Responsive */
@media (max-width: 1100px) {
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .bulk {
    grid-column: 1 / -1;
  }
  .searchWrap {
    min-width: min(340px, 40vw);
  }

  /* allow horizontal scroll for the table */
  .tableCard {
    overflow: auto;
  }
  .tHead,
  .tRow {
    min-width: 980px;
  }

  .pvProducts {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 720px) {
  .topbar {
    flex-direction: column;
    align-items: stretch;
  }
  .topRight {
    flex-direction: column;
    align-items: stretch;
  }
  .searchWrap {
    min-width: 100%;
  }
  .filters {
    width: 100%;
  }
  .select {
    width: 100%;
  }

  .pvProducts {
    grid-template-columns: 1fr;
  }
}
</style>
