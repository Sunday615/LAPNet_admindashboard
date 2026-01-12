<template>
  <div class="va">
    <!-- Header -->
    <div class="vaHead va-reveal">
      <div class="vaTitle">
        <div class="titleRow">
          <i class="fa-solid fa-eye"></i>
          <h1>Visitor Analytics</h1>
        </div>
        <div class="sub">
          Pageviews · Unique Visitors · Countries · Realtime
          <span v-if="lastUpdated" class="lastUpd">
            · Updated: <b>{{ fmtClock(lastUpdated) }}</b>
          </span>
        </div>
      </div>

      <!-- Range Segmented Control -->
      <div class="segWrap">
        <button
          v-for="r in ranges"
          :key="r.key"
          class="seg"
          :class="{ active: range === r.key }"
          type="button"
          @click="setRange(r.key)"
        >
          {{ r.label }}
          <span class="segPill" />
        </button>
      </div>
    </div>

    <!-- Global state -->
    <div v-if="loading" class="card stateCard va-reveal">
      <div class="stateRow">
        <span class="spinner"></span>
        Loading analytics...
      </div>
    </div>

    <div v-else-if="error" class="card stateCard err va-reveal">
      <div class="stateRow">
        <i class="fa-solid fa-triangle-exclamation"></i>
        {{ error }}
      </div>
      <button class="retryBtn" type="button" @click="reloadAll">
        Retry <i class="fa-solid fa-rotate-right"></i>
      </button>
    </div>

    <template v-else>
      <!-- KPI Cards -->
      <div class="kpis va-reveal">
        <div class="card kpi">
          <div class="kTop">
            <div class="kLabel">Pageviews</div>
            <span class="kChip">
              <i class="fa-solid fa-chart-line"></i>
              {{ rangeLabel }}
            </span>
          </div>

          <div class="kValue">{{ fmt(statsView?.totals?.pageviews) }}</div>

          <div class="kHint">
            Avg/bucket: <b>{{ fmt(avgPv) }}</b>
            <span class="sep">•</span>
            Peak: <b>{{ fmt(peakPv.value) }}</b>
            <span class="miniMuted">({{ peakPv.label }})</span>
          </div>

          <div class="kDelta" :class="{ up: pvDeltaPct > 0, down: pvDeltaPct < 0 }" v-if="pvDeltaPct !== null">
            <i class="fa-solid" :class="pvDeltaPct >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'"></i>
            {{ pvDeltaPct >= 0 ? "+" : "" }}{{ pvDeltaPct.toFixed(1) }}% vs previous bucket
          </div>
        </div>

        <div class="card kpi">
          <div class="kTop">
            <div class="kLabel">Unique Visitors</div>
            <span class="kChip kChip2">
              <i class="fa-solid fa-users"></i>
              Distinct
            </span>
          </div>

          <div class="kValue">{{ fmt(statsView?.totals?.uniqueVisitors) }}</div>

          <div class="kHint">
            Avg/bucket: <b>{{ fmt(avgUv) }}</b>
            <span class="sep">•</span>
            Peak: <b>{{ fmt(peakUv.value) }}</b>
            <span class="miniMuted">({{ peakUv.label }})</span>
          </div>

          <div class="kDelta kDelta2" v-if="ratioUvPv !== null">
            <i class="fa-solid fa-percent"></i>
            Unique/PV: <b>{{ (ratioUvPv * 100).toFixed(1) }}%</b>
          </div>
        </div>

        <div class="card kpi">
          <div class="kTop">
            <div class="kLabel">
              Realtime Active
              <span class="dot" :class="{ on: realtime.activeVisitors > 0 }"></span>
            </div>

            <button class="miniBtn" type="button" @click="loadRealtimeOnce" title="Refresh realtime">
              <i class="fa-solid fa-rotate-right"></i>
            </button>
          </div>

          <div class="kValue">{{ fmt(realtime.activeVisitors) }}</div>
          <div class="kHint">Active within {{ Math.round(windowSec / 60) }} minutes</div>

          <div class="rtSpark">
            <canvas ref="rtEl"></canvas>
            <div class="rtLabel">
              <span class="rtDot"></span> last ~2 min
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid va-reveal">
        <!-- Line Chart -->
        <div class="card chartCard">
          <div class="cardHead">
            <div class="cardTitle">
              <i class="fa-solid fa-wave-square"></i>
              Visitors Trend
            </div>
            <div class="cardRight">
              <span class="badge">PV</span>
              <span class="badge badge2">Unique</span>
              <button class="miniBtn" type="button" @click="loadStats" title="Refresh charts">
                <i class="fa-solid fa-rotate-right"></i>
              </button>
            </div>
          </div>

          <div class="chartMetaRow">
            <div class="metaPill">
              <i class="fa-regular fa-calendar-days"></i>
              <span>Buckets:</span>
              <b>{{ fmt(seriesView.length) }}</b>
            </div>
            <div class="metaPill">
              <i class="fa-solid fa-bolt"></i>
              <span>Latest:</span>
              <b>{{ fmt(lastPv) }}</b><span class="miniMuted">PV</span>
              <span class="sep2">·</span>
              <b>{{ fmt(lastUv) }}</b><span class="miniMuted">UV</span>
            </div>
            <div class="metaPill subtle" v-if="seriesView.length">
              <i class="fa-solid fa-mountain-sun"></i>
              <span>Peak PV:</span>
              <b>{{ fmt(peakPv.value) }}</b>
              <span class="miniMuted">({{ peakPv.label }})</span>
            </div>
          </div>

          <div class="chartBox">
            <canvas ref="lineEl"></canvas>

            <div v-if="!seriesView.length" class="chartOverlay">
              <i class="fa-solid fa-circle-info"></i>
              No series data
            </div>
          </div>
        </div>

        <!-- Bar Chart -->
        <div class="card chartCard">
          <div class="cardHead">
            <div class="cardTitle">
              <i class="fa-solid fa-globe"></i>
              Top Countries
            </div>
            <div class="cardRight">
              <span class="muted">Top 10</span>
            </div>
          </div>

          <div class="chartMetaRow">
            <div class="metaPill">
              <i class="fa-solid fa-flag"></i>
              <span>#1:</span>
              <b>{{ topCountryLabel }}</b>
              <span class="miniMuted">({{ fmt(topCountryPv) }} PV)</span>
            </div>
            <div class="metaPill subtle" v-if="topCountryShare !== null">
              <i class="fa-solid fa-chart-pie"></i>
              <span>Share:</span>
              <b>{{ (topCountryShare * 100).toFixed(1) }}%</b>
            </div>
          </div>

          <div class="chartBox">
            <canvas ref="barEl"></canvas>

            <div v-if="!byCountryView.length" class="chartOverlay">
              <i class="fa-solid fa-circle-info"></i>
              No country data
            </div>
          </div>
        </div>
      </div>

      <!-- Tables -->
      <div class="grid2 va-reveal">
        <div class="card tableCard">
          <div class="cardHead">
            <div class="cardTitle">
              <i class="fa-solid fa-flag"></i>
              Countries
            </div>
          </div>

          <div class="tableWrap">
            <table class="tbl">
              <thead>
                <tr>
                  <th>Country</th>
                  <th class="num">PV</th>
                  <th class="num">Unique</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in byCountryView.slice(0, 12)" :key="String(c.country_code) + String(c.country)">
                  <td>
                    <span class="country">
                      <span class="cc">{{ c.country_code || "??" }}</span>
                      <span class="cn">{{ c.country || "-" }}</span>
                    </span>
                  </td>
                  <td class="num">{{ fmt(c.pageviews) }}</td>
                  <td class="num">{{ fmt(c.uniqueVisitors) }}</td>
                </tr>
                <tr v-if="!byCountryView.length">
                  <td colspan="3" class="empty">No data</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card tableCard">
          <div class="cardHead">
            <div class="cardTitle">
              <i class="fa-solid fa-link"></i>
              Top Pages
            </div>
          </div>

          <div class="tableWrap">
            <table class="tbl">
              <thead>
                <tr>
                  <th>Path</th>
                  <th class="num">PV</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in topPagesView.slice(0, 12)" :key="p.path">
                  <td class="path">{{ p.path }}</td>
                  <td class="num">{{ fmt(p.pageviews) }}</td>
                </tr>
                <tr v-if="!topPagesView.length">
                  <td colspan="2" class="empty">No data</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="foot muted va-reveal">
        <span>Tip:</span> If the admin page stays open, Realtime will keep updating via SSE.
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import gsap from "gsap";
import Chart from "chart.js/auto"; // ✅ graph library (Chart.js)

// ====== CONFIG ======
const API_BASE = "http://localhost:3000"; // ✅ ตามที่คุณบอกให้ยิงตรงนี้
const STATS_URL = `${API_BASE}/api/visitor/stats`;
const windowSec = 300;

// ====== STATE ======
const ranges = [
  { key: "1d", label: "1 Day", api: "1d", days: 1 },
  { key: "1w", label: "1 Week", api: "7d", days: 7 },
  { key: "1m", label: "1 Month", api: "30d", days: 30 },
  { key: "3m", label: "3 Months", api: "90d", days: 90 },
];

const range = ref("1w");

const loading = ref(false);
const error = ref("");
const lastUpdated = ref(null);

const statsRaw = ref({ totals: {}, series: [], byCountry: [], topPages: [] });
const realtime = ref({ activeVisitors: 0 });

const lineEl = ref(null);
const barEl = ref(null);
const rtEl = ref(null);

let lineChart = null;
let barChart = null;
let rtChart = null;
let es = null;
let rtTimer = null;

// ✅ กัน race ตอนกดเปลี่ยนช่วงเร็ว ๆ
let statsReqId = 0;

// Realtime spark buffer
const rtPoints = ref([]); // [{t: Date, v: number}]
const RT_MAX = 24; // ~2min if push every 5s

// ====== HELPERS ======
const rangeLabel = computed(() => ranges.find((x) => x.key === range.value)?.label || range.value);

function fmt(n) {
  const v = Number(n || 0);
  return v.toLocaleString("en-US");
}

function fmtClock(d) {
  try {
    return new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(d);
  } catch {
    return String(d);
  }
}

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function pctChange(curr, prev) {
  const c = safeNum(curr);
  const p = safeNum(prev);
  if (p === 0 && c === 0) return 0;
  if (p === 0) return 100;
  return ((c - p) / p) * 100;
}

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function toPrettyBucket(x) {
  const s = String(x || "").trim();
  const t = Date.parse(s);
  if (!Number.isNaN(t)) {
    const d = new Date(t);
    try {
      return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit" }).format(d);
    } catch {
      return s;
    }
  }
  return s;
}

function toFullBucket(x) {
  const s = String(x || "").trim();
  const t = Date.parse(s);
  if (!Number.isNaN(t)) {
    const d = new Date(t);
    try {
      return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "2-digit" }).format(d);
    } catch {
      return s;
    }
  }
  return s;
}

async function getJson(url) {
  const r = await fetch(url);
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`HTTP ${r.status}${txt ? ` • ${txt.slice(0, 180)}` : ""}`);
  }
  return await r.json();
}

function setRange(key) {
  range.value = key;
}

// ====== NORMALIZE ======
function normalizeStats(payload) {
  const p = payload?.data && typeof payload.data === "object" ? payload.data : payload;

  const totals = p?.totals && typeof p.totals === "object" ? p.totals : {};
  const series = Array.isArray(p?.series) ? p.series : Array.isArray(p?.items) ? p.items : [];
  const byCountry = Array.isArray(p?.byCountry) ? p.byCountry : Array.isArray(p?.countries) ? p.countries : [];
  const topPages = Array.isArray(p?.topPages) ? p.topPages : Array.isArray(p?.pages) ? p.pages : [];

  const sortedSeries = series.slice().sort((a, b) => {
    const ta = Date.parse(String(a?.bucket ?? ""));
    const tb = Date.parse(String(b?.bucket ?? ""));
    if (Number.isNaN(ta) || Number.isNaN(tb)) return 0;
    return ta - tb;
  });

  return { totals, series: sortedSeries, byCountry, topPages };
}

// ====== RANGE FILTER (แก้ให้แสดงครบทุกช่วง) ======
function filterSeriesByRange(series, days) {
  const arr = Array.isArray(series) ? series.slice() : [];
  if (!arr.length) return [];

  const canParse = (x) => !Number.isNaN(Date.parse(String(x?.bucket ?? "")));

  // ถ้า parse date ไม่ได้ -> fallback: เอาท้ายสุดตามจำนวน "ประมาณ"
  if (!arr.some(canParse)) {
    const take = Math.min(arr.length, Math.max(1, days * 24)); // เผื่อ bucket เป็นชั่วโมง
    return arr.slice(-take);
  }

  // ✅ rolling window: now - N days (ไม่ยึด midnight)
  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const filtered = arr.filter((x) => {
    const t = Date.parse(String(x?.bucket ?? ""));
    if (Number.isNaN(t)) return false;
    return new Date(t) >= cutoff;
  });

  // ถ้ากรองแล้วว่าง -> fallback เอาท้ายสุด
  if (!filtered.length) {
    const take = Math.min(arr.length, Math.max(1, days * 24));
    return arr.slice(-take);
  }

  return filtered;
}

function buildTotalsFromSeries(series) {
  const pv = series.reduce((acc, x) => acc + safeNum(x?.pageviews), 0);
  const uv = series.reduce((acc, x) => acc + safeNum(x?.uniqueVisitors), 0);
  return { pageviews: pv, uniqueVisitors: uv };
}

// ====== VIEW MODEL ======
const seriesView = computed(() => {
  const days = ranges.find((x) => x.key === range.value)?.days ?? 7;
  return filterSeriesByRange(statsRaw.value.series, days);
});

const statsView = computed(() => {
  const totals = buildTotalsFromSeries(seriesView.value);
  return { ...statsRaw.value, totals };
});

// ✅ sort ให้ Top #1 ถูกต้องเสมอ
const byCountryView = computed(() => {
  const arr = Array.isArray(statsRaw.value.byCountry) ? statsRaw.value.byCountry.slice() : [];
  return arr.sort((a, b) => safeNum(b?.pageviews) - safeNum(a?.pageviews));
});
const topPagesView = computed(() => {
  const arr = Array.isArray(statsRaw.value.topPages) ? statsRaw.value.topPages.slice() : [];
  return arr.sort((a, b) => safeNum(b?.pageviews) - safeNum(a?.pageviews));
});

// KPI details
const lastPv = computed(() => safeNum(seriesView.value[seriesView.value.length - 1]?.pageviews));
const lastUv = computed(() => safeNum(seriesView.value[seriesView.value.length - 1]?.uniqueVisitors));

const pvDeltaPct = computed(() => {
  const s = seriesView.value;
  if (s.length < 2) return null;
  return pctChange(safeNum(s[s.length - 1]?.pageviews), safeNum(s[s.length - 2]?.pageviews));
});

const ratioUvPv = computed(() => {
  const pv = safeNum(statsView.value?.totals?.pageviews);
  const uv = safeNum(statsView.value?.totals?.uniqueVisitors);
  if (!pv) return null;
  return uv / pv;
});

function peakBy(key) {
  const s = seriesView.value;
  let best = { value: 0, label: "-" };
  for (const row of s) {
    const v = safeNum(row?.[key]);
    if (v >= best.value) best = { value: v, label: toPrettyBucket(row?.bucket) || "-" };
  }
  return best;
}

const peakPv = computed(() => peakBy("pageviews"));
const peakUv = computed(() => peakBy("uniqueVisitors"));

const avgPv = computed(() => {
  const n = Math.max(1, seriesView.value.length);
  return Math.round(safeNum(statsView.value?.totals?.pageviews) / n);
});
const avgUv = computed(() => {
  const n = Math.max(1, seriesView.value.length);
  return Math.round(safeNum(statsView.value?.totals?.uniqueVisitors) / n);
});

// Top country
const topCountry = computed(() => byCountryView.value?.[0] || null);
const topCountryLabel = computed(() => {
  const c = topCountry.value;
  if (!c) return "-";
  const cc = String(c.country_code || "").trim();
  const cn = String(c.country || "").trim();
  return cc && cn ? `${cc} · ${cn}` : cn || cc || "-";
});
const topCountryPv = computed(() => safeNum(topCountry.value?.pageviews));
const topCountryShare = computed(() => {
  const total = safeNum(statsView.value?.totals?.pageviews);
  if (!total) return null;
  return topCountryPv.value / total;
});

// ====== LOAD STATS (แก้ให้กราฟแสดงทุกช่วง) ======
async function loadStats() {
  const reqId = ++statsReqId;

  // ✅ สำคัญ: ถอด chart เก่าก่อน เพราะตอน loading มันถอด canvas ออกจาก DOM
  destroyCharts();

  loading.value = true;
  error.value = "";

  try {
    const apiRange = ranges.find((x) => x.key === range.value)?.api || "7d";
    let payload;

    try {
      payload = await getJson(`${STATS_URL}?range=${encodeURIComponent(apiRange)}`);
    } catch {
      payload = await getJson(STATS_URL);
    }

    if (reqId !== statsReqId) return;

    statsRaw.value = normalizeStats(payload);
    lastUpdated.value = new Date();
  } catch (e) {
    if (reqId !== statsReqId) return;
    console.error("[loadStats]", e);
    error.value = String(e?.message || e || "Failed to load stats");
  } finally {
    if (reqId !== statsReqId) return;

    // ✅ ต้อง set loading=false ก่อน แล้วค่อย nextTick เพื่อให้ canvas กลับมาใน DOM
    loading.value = false;
    await nextTick();

    // ✅ ค่อย render หลัง DOM มี canvas แล้ว (แก้กราฟไม่ขึ้นทุก range)
    if (!error.value) renderOrUpdateCharts();
  }
}

// ====== REALTIME ======
function pushRtPoint(v) {
  const arr = rtPoints.value.slice();
  arr.push({ t: new Date(), v: safeNum(v) });
  while (arr.length > RT_MAX) arr.shift();
  rtPoints.value = arr;
}

async function loadRealtimeOnce() {
  try {
    const data = await getJson(`${API_BASE}/api/visitor/realtime?windowSec=${encodeURIComponent(windowSec)}`);
    if (data?.activeVisitors != null) {
      realtime.value = { activeVisitors: safeNum(data.activeVisitors) };
      pushRtPoint(realtime.value.activeVisitors);
      renderOrUpdateRealtimeSpark();
    }
  } catch {}
}

function startRealtimeSSE() {
  if (es) {
    try { es.close(); } catch {}
    es = null;
  }
  if (rtTimer) {
    clearInterval(rtTimer);
    rtTimer = null;
  }

  try {
    es = new EventSource(`${API_BASE}/api/visitor/realtime/stream?windowSec=${encodeURIComponent(windowSec)}`);
    es.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        if (payload?.activeVisitors != null) {
          realtime.value = { activeVisitors: safeNum(payload.activeVisitors) };
          pushRtPoint(realtime.value.activeVisitors);
          renderOrUpdateRealtimeSpark();
        }
      } catch {}
    };
    es.onerror = () => {
      try { es.close(); } catch {}
      es = null;
      if (!rtTimer) rtTimer = setInterval(() => loadRealtimeOnce(), 5000);
    };
  } catch {
    rtTimer = setInterval(() => loadRealtimeOnce(), 5000);
  }
}

function reloadAll() {
  loadStats();
  loadRealtimeOnce();
  startRealtimeSSE();
}

// ====== CHARTS ======
function makeGradient(ctx, from, to) {
  const g = ctx.createLinearGradient(0, 0, 0, 320);
  g.addColorStop(0, from);
  g.addColorStop(1, to);
  return g;
}

function hoverLinePlugin() {
  return {
    id: "hoverLine",
    afterDatasetsDraw(chart) {
      const tooltip = chart.tooltip;
      if (!tooltip || !tooltip.getActiveElements || !tooltip.getActiveElements().length) return;

      const { ctx, chartArea } = chart;
      const act = tooltip.getActiveElements()[0];
      const x = act.element.x;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, chartArea.top);
      ctx.lineTo(x, chartArea.bottom);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.setLineDash([5, 6]);
      ctx.stroke();
      ctx.restore();
    },
  };
}

function renderOrUpdateCharts() {
  // ---- LINE ----
  const s = seriesView.value;

  const labelsPretty = s.map((x) => toPrettyBucket(x.bucket));
  const labelsFull = s.map((x) => toFullBucket(x.bucket));
  const pv = s.map((x) => safeNum(x.pageviews));
  const uv = s.map((x) => safeNum(x.uniqueVisitors));

  const txt = cssVar("--txt", "rgba(255,255,255,0.92)");
  const muted = cssVar("--muted", "rgba(255,255,255,0.55)");
  const stroke = cssVar("--stroke", "rgba(255,255,255,0.08)");

  if (lineEl.value) {
    const ctx = lineEl.value.getContext("2d");
    const pvFill = makeGradient(ctx, "rgba(56,189,248,0.22)", "rgba(56,189,248,0.02)");
    const uvFill = makeGradient(ctx, "rgba(99,102,241,0.18)", "rgba(99,102,241,0.02)");

    const pvStroke = ctx.createLinearGradient(0, 0, 420, 0);
    pvStroke.addColorStop(0, "rgba(56,189,248,0.95)");
    pvStroke.addColorStop(1, "rgba(56,189,248,0.45)");

    const uvStroke = ctx.createLinearGradient(0, 0, 420, 0);
    uvStroke.addColorStop(0, "rgba(99,102,241,0.95)");
    uvStroke.addColorStop(1, "rgba(99,102,241,0.45)");

    const commonLine = {
      fill: true,
      tension: 0.42,
      cubicInterpolationMode: "monotone",
      pointRadius: 3,
      pointHoverRadius: 7,
      pointHitRadius: 14,
      borderWidth: 3,
    };

    // ✅ เรา destroy ก่อนโหลดเสมอ ดังนั้นปกติจะเป็น null และสร้างใหม่ได้ชัวร์
    if (!lineChart) {
      lineChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: labelsPretty,
          datasets: [
            {
              label: "Pageviews",
              data: pv,
              borderColor: pvStroke,
              backgroundColor: pvFill,
              pointBackgroundColor: "rgba(56,189,248,0.95)",
              pointBorderColor: "rgba(0,0,0,0.35)",
              pointBorderWidth: 2,
              ...commonLine,
            },
            {
              label: "Unique",
              data: uv,
              borderColor: uvStroke,
              backgroundColor: uvFill,
              pointBackgroundColor: "rgba(99,102,241,0.95)",
              pointBorderColor: "rgba(0,0,0,0.35)",
              pointBorderWidth: 2,
              ...commonLine,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: {
              labels: { color: muted, boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: "circle" },
            },
            tooltip: {
              backgroundColor: "rgba(7, 14, 35, 0.92)",
              borderColor: stroke,
              borderWidth: 1,
              titleColor: txt,
              bodyColor: txt,
              padding: 12,
              displayColors: true,
              callbacks: {
                title(items) {
                  const i = items?.[0]?.dataIndex ?? 0;
                  return labelsFull[i] || labelsPretty[i] || "";
                },
                label(ctx2) {
                  const idx = ctx2.dataIndex;
                  const label = ctx2.dataset.label;
                  const val = safeNum(ctx2.parsed.y);
                  const prev = idx > 0 ? safeNum(ctx2.dataset.data[idx - 1]) : null;
                  const d = prev == null ? null : pctChange(val, prev);
                  const deltaTxt = d == null ? "" : `  (${d >= 0 ? "+" : ""}${d.toFixed(1)}%)`;
                  return `${label}: ${fmt(val)}${deltaTxt}`;
                },
                footer(items) {
                  const idx = items?.[0]?.dataIndex ?? 0;
                  const pvVal = safeNum(pv[idx]);
                  const uvVal = safeNum(uv[idx]);
                  const ratio = pvVal ? (uvVal / pvVal) * 100 : 0;
                  return `Unique/PV: ${ratio.toFixed(1)}%`;
                },
              },
            },
          },
          scales: {
            x: {
              ticks: { color: muted, maxRotation: 0, autoSkip: true },
              grid: { color: "rgba(255,255,255,0.05)" },
            },
            y: {
              ticks: { color: muted, precision: 0 },
              grid: { color: "rgba(255,255,255,0.05)" },
              beginAtZero: true,
            },
          },
          elements: { line: { borderJoinStyle: "round", borderCapStyle: "round" } },
        },
        plugins: [hoverLinePlugin()],
      });
    } else {
      lineChart.data.labels = labelsPretty;
      lineChart.data.datasets[0].data = pv;
      lineChart.data.datasets[1].data = uv;
      lineChart.update();
    }
  }

  // ---- BAR (Top 10 countries by PV) ----
  const bc = byCountryView.value.slice(0, 10);
  const bLabels = bc.map((x) => String(x.country_code || "??"));
  const bNames = bc.map((x) => String(x.country || ""));
  const bData = bc.map((x) => safeNum(x.pageviews));

  if (barEl.value) {
    const ctx = barEl.value.getContext("2d");
    const barFill = makeGradient(ctx, "rgba(56,189,248,0.22)", "rgba(56,189,248,0.06)");

    if (!barChart) {
      barChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: bLabels,
          datasets: [
            {
              label: "PV",
              data: bData,
              borderColor: "rgba(56,189,248,0.55)",
              backgroundColor: barFill,
              borderWidth: 1,
              borderRadius: 12,
              barThickness: 22,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "rgba(7, 14, 35, 0.92)",
              borderColor: stroke,
              borderWidth: 1,
              titleColor: txt,
              bodyColor: txt,
              padding: 12,
              callbacks: {
                title(items) {
                  const i = items?.[0]?.dataIndex ?? 0;
                  const cc = bLabels[i] || "??";
                  const cn = bNames[i] || "";
                  return cn ? `${cc} · ${cn}` : cc;
                },
                label(ctx2) {
                  return `PV: ${fmt(safeNum(ctx2.parsed.y))}`;
                },
              },
            },
          },
          scales: {
            x: { ticks: { color: muted }, grid: { color: "rgba(255,255,255,0.05)" } },
            y: { ticks: { color: muted, precision: 0 }, grid: { color: "rgba(255,255,255,0.05)" }, beginAtZero: true },
          },
        },
      });
    } else {
      barChart.data.labels = bLabels;
      barChart.data.datasets[0].data = bData;
      barChart.update();
    }
  }

  // GSAP pop
  gsap.fromTo(
    ".chartCard",
    { y: 8, opacity: 0.0 },
    { y: 0, opacity: 1, duration: 0.35, ease: "power2.out", stagger: 0.06, overwrite: true }
  );
}

function renderOrUpdateRealtimeSpark() {
  if (!rtEl.value) return;

  const ctx = rtEl.value.getContext("2d");
  const pts = rtPoints.value;
  const labels = pts.map((p) => {
    try {
      return new Intl.DateTimeFormat("en-US", { minute: "2-digit", second: "2-digit" }).format(p.t);
    } catch {
      return "";
    }
  });
  const vals = pts.map((p) => safeNum(p.v));

  const fill = makeGradient(ctx, "rgba(56,189,248,0.18)", "rgba(56,189,248,0.01)");

  if (!rtChart) {
    rtChart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Active",
            data: vals,
            borderColor: "rgba(56,189,248,0.75)",
            backgroundColor: fill,
            fill: true,
            tension: 0.42,
            cubicInterpolationMode: "monotone",
            borderWidth: 2,
            pointRadius: 0,
            pointHitRadius: 10,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } },
        elements: { line: { borderJoinStyle: "round", borderCapStyle: "round" } },
      },
    });
  } else {
    rtChart.data.labels = labels;
    rtChart.data.datasets[0].data = vals;
    rtChart.update();
  }
}

function destroyCharts() {
  if (lineChart) { lineChart.destroy(); lineChart = null; }
  if (barChart) { barChart.destroy(); barChart = null; }
  if (rtChart) { rtChart.destroy(); rtChart = null; }
}

// ====== ANIMATIONS ======
function reveal() {
  gsap.set(".va-reveal", { opacity: 0, y: 12 });
  gsap.to(".va-reveal", { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: 0.07 });
}

// ====== LIFECYCLE ======
watch(range, async () => {
  await loadStats(); // ✅ ตอนเลือกช่วง กราฟจะ destroy + render ใหม่ให้ถูกต้อง
});

onMounted(async () => {
  reveal();

  await loadStats(); // ✅ ตอนแรกจะ render กราฟหลัง loading=false + nextTick แล้ว
  await loadRealtimeOnce();
  startRealtimeSSE();

  if (!rtPoints.value.length) {
    pushRtPoint(realtime.value.activeVisitors || 0);
    renderOrUpdateRealtimeSpark();
  }
});

onBeforeUnmount(() => {
  destroyCharts();
  if (es) {
    try { es.close(); } catch {}
    es = null;
  }
  if (rtTimer) {
    clearInterval(rtTimer);
    rtTimer = null;
  }
});
</script>

<style scoped>
/* (CSS เหมือนเดิมทั้งหมด) */
.va {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 10px 6px 18px;
}

/* ===== card system ===== */
.card {
  background: var(--panel);
  border: 1px solid var(--stroke);
  border-radius: 18px;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(14px);
  position: relative;
  overflow: hidden;
}
.card::before {
  content: "";
  position: absolute;
  inset: -1px;
  pointer-events: none;
  background: radial-gradient(560px 220px at 20% 20%, rgba(56, 189, 248, 0.09), transparent 60%),
    radial-gradient(520px 220px at 80% 40%, rgba(99, 102, 241, 0.08), transparent 62%);
  opacity: 0.9;
}

.vaHead {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 14px;
}
.vaTitle h1 {
  margin: 0;
  font-size: 22px;
  letter-spacing: 0.2px;
}
.titleRow {
  display: flex;
  align-items: center;
  gap: 10px;
}
.sub {
  margin-top: 6px;
  color: var(--muted);
  font-size: 13px;
}
.lastUpd b {
  color: rgba(255, 255, 255, 0.9);
}

/* range segmented control */
.segWrap {
  display: inline-flex;
  gap: 8px;
  padding: 8px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.25);
}
.seg {
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.025);
  color: rgba(255, 255, 255, 0.78);
  padding: 10px 12px;
  border-radius: 14px;
  font-weight: 850;
  cursor: pointer;
  transition: transform 180ms ease, border-color 180ms ease, background 180ms ease, color 180ms ease;
  min-width: 92px;
}
.seg:hover {
  transform: translateY(-1px);
  border-color: rgba(56, 189, 248, 0.25);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.92);
}
.seg.active {
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.2), rgba(99, 102, 241, 0.12));
  border-color: rgba(56, 189, 248, 0.24);
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 18px 40px rgba(56, 189, 248, 0.08);
}
.segPill {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0);
}
.seg.active .segPill {
  background: rgba(56, 189, 248, 0.95);
  box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.14);
}

/* loading / error card */
.stateCard {
  padding: 14px 14px;
}
.stateRow {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.8);
}
.stateCard.err .stateRow {
  color: rgba(239, 68, 68, 0.95);
}
.retryBtn {
  margin-top: 10px;
  position: relative;
  z-index: 1;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.9);
  padding: 10px 12px;
  border-radius: 14px;
  font-weight: 900;
  cursor: pointer;
}
.retryBtn:hover {
  border-color: rgba(56, 189, 248, 0.22);
  transform: translateY(-1px);
}

/* spinner */
.spinner {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.18);
  border-top-color: rgba(56, 189, 248, 0.75);
  animation: spin 0.85s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* KPI */
.kpis {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.kpi {
  padding: 14px 14px 12px;
}
.kTop {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.kLabel {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.82);
  font-weight: 950;
}
.kChip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(56, 189, 248, 0.22);
  background: rgba(56, 189, 248, 0.08);
  color: rgba(255, 255, 255, 0.9);
  font-weight: 900;
  font-size: 12px;
}
.kChip2 {
  border-color: rgba(99, 102, 241, 0.22);
  background: rgba(99, 102, 241, 0.08);
}
.kValue {
  position: relative;
  z-index: 1;
  margin-top: 10px;
  font-size: 28px;
  font-weight: 950;
  letter-spacing: 0.2px;
}
.kHint {
  position: relative;
  z-index: 1;
  margin-top: 6px;
  color: var(--muted);
  font-size: 12px;
}
.sep {
  margin: 0 8px;
  opacity: 0.6;
}
.miniMuted {
  color: rgba(255, 255, 255, 0.58);
  font-weight: 850;
}
.kDelta {
  position: relative;
  z-index: 1;
  margin-top: 8px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 900;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
  padding: 8px 10px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
}
.kDelta.up {
  border-color: rgba(34, 197, 94, 0.22);
  background: rgba(34, 197, 94, 0.08);
}
.kDelta.down {
  border-color: rgba(239, 68, 68, 0.22);
  background: rgba(239, 68, 68, 0.08);
}
.kDelta2 {
  border-color: rgba(99, 102, 241, 0.22);
  background: rgba(99, 102, 241, 0.08);
}

/* realtime dot */
.dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.04);
}
.dot.on {
  background: rgba(56, 189, 248, 0.95);
  box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.14);
  animation: pulse 1.2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.12); opacity: 0.85; }
}

/* small buttons */
.miniBtn {
  position: relative;
  z-index: 1;
  width: 36px;
  height: 36px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  color: rgba(255, 255, 255, 0.84);
  cursor: pointer;
}
.miniBtn:hover {
  border-color: rgba(56, 189, 248, 0.2);
  transform: translateY(-1px);
}

/* realtime spark */
.rtSpark {
  position: relative;
  z-index: 1;
  margin-top: 10px;
  height: 70px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.015);
  overflow: hidden;
}
.rtSpark canvas {
  width: 100% !important;
  height: 100% !important;
  display: block;
}
.rtLabel {
  position: absolute;
  left: 10px;
  bottom: 8px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.62);
}
.rtDot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.85);
  box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.12);
}

/* charts */
.grid {
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  gap: 12px;
}
.chartCard {
  padding: 12px 12px 10px;
}
.cardHead {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 6px 10px;
}
.cardTitle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 950;
}
.cardRight {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}
.badge {
  font-size: 12px;
  font-weight: 850;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.82);
}
.badge2 {
  border-color: rgba(99, 102, 241, 0.25);
  background: rgba(99, 102, 241, 0.08);
}
.chartMetaRow {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 0 6px 10px;
}
.metaPill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 9px 11px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  color: rgba(255, 255, 255, 0.76);
  font-weight: 900;
  font-size: 12px;
}
.metaPill.subtle { opacity: 0.9; }
.sep2 { opacity: 0.6; margin: 0 8px; }

.chartBox {
  position: relative;
  z-index: 1;
  height: 320px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: radial-gradient(circle at 25% 20%, rgba(56, 189, 248, 0.06), transparent 55%),
    radial-gradient(circle at 80% 25%, rgba(99, 102, 241, 0.05), transparent 58%),
    rgba(255, 255, 255, 0.01);
  overflow: hidden;
}
.chartBox canvas {
  width: 100% !important;
  height: 100% !important;
  display: block;
}
.chartOverlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.78);
  font-weight: 950;
  background: rgba(7, 14, 35, 0.45);
  backdrop-filter: blur(10px);
}

/* tables */
.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.tableCard { padding: 12px; }
.tableWrap {
  position: relative;
  z-index: 1;
  overflow: auto;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.07);
}
.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.tbl thead th {
  text-align: left;
  padding: 10px 10px;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  position: sticky;
  top: 0;
}
.tbl td {
  padding: 10px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.78);
}
.tbl tr:hover td { background: rgba(255, 255, 255, 0.03); }
.num { text-align: right; }
.empty { text-align: center; color: var(--muted); padding: 18px 10px; }

.country { display: inline-flex; align-items: center; gap: 10px; }
.cc {
  font-weight: 950;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(56, 189, 248, 0.2);
  background: rgba(56, 189, 248, 0.1);
  color: rgba(255, 255, 255, 0.92);
}
.cn { color: rgba(255, 255, 255, 0.72); }

.path {
  max-width: 420px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.muted { color: var(--muted); }
.foot { padding-top: 4px; font-size: 12px; }
@media (max-width: 1100px) {
  .kpis { grid-template-columns: 1fr; }
  .grid { grid-template-columns: 1fr; }
  .grid2 { grid-template-columns: 1fr; }
  .segWrap { flex-wrap: wrap; justify-content: flex-end; }
}
</style>
