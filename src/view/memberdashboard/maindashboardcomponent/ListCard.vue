<!-- src/components/dashboard/ListCard.vue -->
<template>
  <div class="list-card">
    <div class="header">
      <div class="title">
        <slot name="icon" />
        <span>{{ title }}</span>
      </div>

      <button class="btn" type="button" @click="$emit('viewAll')">
        View all
      </button>
    </div>

    <div v-if="loading" class="body">
      <div v-for="i in 5" :key="i" class="row">
        <span class="skeleton w-60"></span>
        <span class="skeleton w-40"></span>
      </div>
    </div>

    <div v-else class="body">
      <div v-if="items.length === 0" class="empty">
        ไม่มีข้อมูล
      </div>

      <div
        v-for="(it, idx) in items"
        :key="idx"
        class="row row-hover"
        @click="onClickItem(it)"
      >
        <div class="left">
          <div class="name">{{ getTitle(it) }}</div>
          <div class="sub">{{ getSub(it) }}</div>
        </div>
        <div class="right">{{ formatDate(getDate(it)) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  title: { type: String, required: true },
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },

  // functions to map fields (so it works with any backend shape)
  getTitle: { type: Function, required: true },
  getSub: { type: Function, required: true },
  getDate: { type: Function, required: true },

  onItemClick: { type: Function, default: null },
});

defineEmits(["viewAll"]);

function onClickItem(item) {
  if (props.onItemClick) props.onItemClick(item);
}

function formatDate(d) {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString();
}
</script>

<style scoped>
.list-card {
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.03));
  border: 1px solid rgba(255, 255, 255, 0.10);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.22);
  padding: 14px;
  backdrop-filter: blur(10px);
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}
.title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.btn {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.92);
  padding: 8px 10px;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
  transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
}
.btn:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.18);
}
.body {
  display: grid;
  gap: 8px;
}
.row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 10px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.08);
}
.row-hover {
  cursor: pointer;
  transition: transform 160ms ease, border-color 160ms ease;
}
.row-hover:hover {
  transform: translateY(-1px);
  border-color: rgba(255, 255, 255, 0.16);
}
.left {
  min-width: 0;
}
.name {
  font-size: 13px;
  font-weight: 650;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sub {
  font-size: 12px;
  opacity: 0.72;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.right {
  font-size: 12px;
  opacity: 0.75;
  white-space: nowrap;
}
.empty {
  padding: 14px;
  text-align: center;
  opacity: 0.75;
  border-radius: 14px;
  border: 1px dashed rgba(255, 255, 255, 0.18);
}

.skeleton {
  display: inline-block;
  height: 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.10);
  position: relative;
  overflow: hidden;
}
.skeleton::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.14),
    transparent
  );
  animation: shimmer 1.1s infinite;
}
.w-60 {
  width: 60%;
}
.w-40 {
  width: 40%;
}
@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>
