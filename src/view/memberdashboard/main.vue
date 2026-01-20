<template>
  <div class="memberDash">
    <div class="wrap">
      <div class="head">
        <div class="h1">MemberBank Dashboard</div>
        <div class="sub">View-only console</div>
      </div>

      <div class="grid">
        <RouterLink class="card" to="/member/members">
          <div class="icon"><i class="fa-solid fa-building-columns"></i></div>
          <div class="t">ເບິ່ງທະນາຄານສະມາຊິກ</div>
          <div class="d">View member banks</div>
        </RouterLink>

        <RouterLink class="card" to="/member/news">
          <div class="icon"><i class="fa-solid fa-newspaper"></i></div>
          <div class="t">ເບິ່ງຂ່າວສານ & ກິດຈະກຳ</div>
          <div class="d">View news & activities</div>
        </RouterLink>

        <RouterLink class="card" to="/member/jobs">
          <div class="icon"><i class="fa-solid fa-user-plus"></i></div>
          <div class="t">ເບິ່ງຮັບສະໝັກພະນັກງານ</div>
          <div class="d">View job posts</div>
        </RouterLink>

        <RouterLink class="card" to="/member/announcements">
          <div class="icon"><i class="fa-solid fa-bullhorn"></i></div>
          <div class="t">ເບິ່ງປະກາດແຈ້ງການ</div>
          <div class="d">View announcements</div>
        </RouterLink>

        <RouterLink class="card" to="/member/board">
          <div class="icon"><i class="fa-solid fa-users"></i></div>
          <div class="t">ເບິ່ງສະພາບໍລິຫານ</div>
          <div class="d">View board directors</div>
        </RouterLink>

        <RouterLink class="card" to="/member/lapnet">
          <div class="icon"><i class="fa-solid fa-circle-user"></i></div>
          <div class="t">ເບິ່ງພະນັກງານ LAPNet</div>
          <div class="d">View LAPNet employees</div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup></script>

<style scoped>
.memberDash {
  padding: 18px;
}
.wrap {
  max-width: 1100px;
  margin: 0 auto;
}
.head {
  margin-bottom: 14px;
}
.h1 {
  font-size: 20px;
  font-weight: 950;
  letter-spacing: 0.2px;
}
.sub {
  opacity: 0.65;
  font-weight: 750;
  margin-top: 4px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.card {
  text-decoration: none;
  border-radius: 18px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.92);
  display: grid;
  gap: 8px;
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, background 160ms ease;
}
.card:hover {
  transform: translateY(-2px);
  border-color: rgba(56, 189, 248, 0.22);
  box-shadow: 0 18px 46px rgba(56, 189, 248, 0.12);
  background: rgba(255, 255, 255, 0.055);
}
.icon {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.22), rgba(99, 102, 241, 0.14));
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.t {
  font-weight: 900;
}
.d {
  opacity: 0.65;
  font-weight: 750;
  font-size: 13px;
}
@media (max-width: 980px) {
  .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 620px) {
  .grid { grid-template-columns: 1fr; }
}
</style>
