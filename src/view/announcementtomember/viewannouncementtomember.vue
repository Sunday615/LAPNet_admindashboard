<template>
  <section class="panelWrap js-reveal">
    <!-- Header -->
    <header class="panelHead">
      <div class="headLeft">
        <div class="kicker">ADMIN</div>
        <h2 class="title">Announcements</h2>
        <p class="sub">Manage announcements (Create / Edit / Delete)</p>
      </div>

      <div class="headRight">
        <button class="btn primary" @click="openCreate">+ Create</button>
      </div>
    </header>

    <!-- Table -->
    <div class="tableWrap">
      <table class="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Title</th>
            <th>Status</th>
            <th>Created</th>
            <th class="right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="5" class="center">Loading...</td>
          </tr>

          <tr v-for="(row, i) in rows" :key="row.id">
            <td>{{ i + 1 }}</td>
            <td class="titleCell">{{ row.title }}</td>
            <td>
              <span :class="['badge', row.active ? 'on' : 'off']">
                {{ row.active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>{{ fmt(row.created_at) }}</td>
            <td class="right">
              <div class="actions">
                <button class="btn sm" @click="openEdit(row)">Edit</button>
                <button class="btn sm danger" @click="remove(row.id)">Delete</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <transition name="fade">
      <div v-if="modal.show" class="modal">
        <div class="modalCard">
          <h3>{{ modal.form.id ? 'Edit' : 'Create' }} Announcement</h3>

          <div class="field">
            <label>Title</label>
            <input v-model="modal.form.title" />
          </div>

          <div class="field">
            <label>Content</label>
            <textarea v-model="modal.form.content" rows="4" />
          </div>

          <div class="field check">
            <input type="checkbox" v-model="modal.form.active" />
            <span>Active</span>
          </div>

          <div class="modalActions">
            <button class="btn" @click="close">Cancel</button>
            <button class="btn primary" @click="save">Save</button>
          </div>
        </div>
      </div>
    </transition>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import gsap from 'gsap'

const API = 'http://localhost:3000/api/announcements'

const rows = ref([])
const loading = ref(false)

const modal = ref({
  show: false,
  form: { id: null, title: '', content: '', active: true },
})

async function load() {
  loading.value = true
  const res = await fetch(API)
  const data = await res.json()
  rows.value = Array.isArray(data) ? data : data?.data || []
  loading.value = false
}

function openCreate() {
  modal.value = { show: true, form: { id: null, title: '', content: '', active: true } }
}

function openEdit(row) {
  modal.value = { show: true, form: { ...row } }
}

function close() {
  modal.value.show = false
}

async function save() {
  const f = modal.value.form
  if (f.id) {
    await fetch(`${API}/${f.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(f),
    })
  } else {
    await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(f),
    })
  }
  close()
  load()
}

async function remove(id) {
  if (!confirm('Delete this announcement?')) return
  await fetch(`${API}/${id}`, { method: 'DELETE' })
  load()
}

function fmt(d) {
  return new Date(d).toLocaleDateString()
}

onMounted(async () => {
  await load()
  gsap.from('.js-reveal', { y: 12, opacity: 0, duration: 0.4, ease: 'power2.out' })
})
</script>

<style scoped>
.panelWrap {
  background: var(--panel);
  border: 1px solid var(--stroke);
  border-radius: 18px;
  padding: 18px;
}
.panelHead {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 16px;
}
.kicker { font-size: 11px; color: var(--muted); font-weight: 800; }
.title { font-size: 22px; font-weight: 900; }
.sub { font-size: 13px; color: var(--muted); }

.tableWrap { overflow-x: auto; }
.table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  padding: 12px 10px;
  border-bottom: 1px solid var(--stroke);
}
th { text-align: left; font-size: 13px; color: var(--muted); }
.center { text-align: center; }
.right { text-align: right; }
.titleCell { font-weight: 800; }

.badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
}
.badge.on { background: rgba(56,189,248,.18); }
.badge.off { background: rgba(255,255,255,.08); }

.actions { display: inline-flex; gap: 8px; }
.btn {
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid var(--stroke);
  background: var(--glass);
  color: var(--txt);
  font-weight: 800;
}
.btn.primary {
  background: linear-gradient(90deg, rgba(56,189,248,.25), rgba(99,102,241,.18));
}
.btn.danger { background: rgba(220,38,38,.25); }
.btn.sm { font-size: 12px; padding: 6px 10px; }

.modal {
  position: fixed; inset: 0;
  display: grid; place-items: center;
  background: rgba(0,0,0,.55);
}
.modalCard {
  width: 420px;
  background: rgba(8,12,28,.9);
  border: 1px solid var(--stroke);
  border-radius: 18px;
  padding: 18px;
}
.field { margin-bottom: 12px; }
.field label { font-size: 12px; color: var(--muted); }
.field input, .field textarea {
  width: 100%;
  margin-top: 4px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(255,255,255,.06);
  border: 1px solid var(--stroke);
  color: var(--txt);
}
.field.check { display: flex; gap: 8px; align-items: center; }
.modalActions { display: flex; justify-content: flex-end; gap: 8px; }

.fade-enter-active, .fade-leave-active { transition: opacity .18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>