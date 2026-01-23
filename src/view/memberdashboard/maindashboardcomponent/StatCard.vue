<!-- src/components/dashboard/StatCard.vue -->
<template>
  <div class="stat-card" :class="{ clickable: !!to }" @click="handleClick">
    <div class="row">
      <div class="icon-wrap">
        <slot name="icon" />
      </div>

      <div class="meta">
        <div class="label">{{ label }}</div>
        <div class="value">
          <span v-if="loading" class="skeleton w-90"></span>
          <span v-else>{{ value }}</span>
        </div>
      </div>
    </div>

    <div v-if="hint" class="hint">{{ hint }}</div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], default: "-" },
  hint: { type: String, default: "" },
  loading: { type: Boolean, default: false },
  to: { type: [String, Object], default: "" },
});

const router = useRouter();

function handleClick() {
  if (!props.to) return;
  router.push(props.to);
}
</script>

<style scoped>
.stat-card {
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.03));
  border: 1px solid rgba(255, 255, 255, 0.10);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.22);
  padding: 16px 16px 14px;
  backdrop-filter: blur(10px);
  transform: translateZ(0);
}
.stat-card.clickable {
  cursor: pointer;
  transition: transform 160ms ease, border-color 160ms ease;
}
.stat-card.clickable:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.18);
}
.row {
  display: flex;
  gap: 12px;
  align-items: center;
}
.icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.label {
  font-size: 13px;
  opacity: 0.82;
}
.value {
  font-size: 26px;
  font-weight: 750;
  letter-spacing: -0.02em;
  margin-top: 2px;
}
.hint {
  margin-top: 10px;
  font-size: 12px;
  opacity: 0.72;
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
.w-90 {
  width: 90px;
}
@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>
