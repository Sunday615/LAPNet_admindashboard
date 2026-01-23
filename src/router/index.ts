import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";

import Dashboardview from "../view/homepage/main.vue";
import MemberDashboard from "../view/memberdashboard/main.vue";

import mainmember from "../view/display/member/mainmember.vue";
import newsinsert from "../view/display/news/newsinsert.vue";
import joblist from "../view/jobs/joblist.vue";
import announcement from "../view/announcement/announcement.vue";
import Board_director from "../view/board_director/board_director.vue";
import Lapnet from "../view/lapnet/lapnet.vue";

import memberbankview from "../view/display/member/memberbankview.vue";
import newsview from "../view/display/news/newsview.vue";
import jobview from "../view/display/job/jobview.vue";
import announcementviewer from "../view/announcement/announcementviewer.vue";
import Board_directorview from "../view/board_director/board_directorview.vue";
import lapnetview from "../view/lapnet/lapnetview.vue";

// ✅ FIX: path ไฟล์ผิด (.vue.vue) -> ให้เหลือ .vue
import membersedit from "../view/display/member/MembersEdit.vue.vue";
import newsedit from "../view/display/news/newsedit.vue";
import announcementedit from "../view/announcement/announcementedit.vue";
import jobedit from "../view/display/job/jobedit.vue";
import Board_directoredit from "../view/board_director/board_directoredit.vue";
import Lapnetedit from "../view/lapnet/lapnetedit.vue";

import Mainvisitors from "../view/visitors/mainvisitors.vue";
import Createform from "../view/createform/createform.vue";
import mainnotification from "../view/notification/mainnotification.vue";
import formtemplete from "../view/createform/formtemplete.vue";
import Loginform from "../view/login/loginform.vue";
import documentviewer from "../view/memberdashboard/memberview/documentviewer.vue";
import main from "../view/memberdashboard/main.vue";
import announcement_memberbank from "../view/memberdashboard/memberview/announcement_memberbank.vue";
import formmemberview from "../view/memberdashboard/memberview/formmemberview.vue";

import chat from "../view/memberdashboard/memberview/chat.vue";

import announcementtomember from "../view/announcementtomember/announcementtomember.vue";
import formmembersubmit from "../view/memberdashboard/memberview/formmembersubmit.vue";

import wordview from "../view/memberdashboard/memberview/docview/wordview.vue";
import excelview from "../view/memberdashboard/memberview/docview/excelview.vue";
import powerpointview from "../view/memberdashboard/memberview/docview/powerpointview.vue";
import txtview from "../view/memberdashboard/memberview/docview/txtview.vue";
import pdfview from "../view/memberdashboard/memberview/docview/pdfview.vue";
import usersmanage from "../view/usermanage/usersmanage.vue";
import documentupload from "../view/uploaddocument/documentupload.vue";

const TOKEN_KEY = "token";
const USER_KEY = "user";

const ADMIN_HOME = "/dashboard";
const VIEWER_HOME = "/memberdashboard";

function safeJsonParse(x: any) {
  try {
    return JSON.parse(String(x));
  } catch {
    return null;
  }
}

function getAuthFromStorage() {
  const tokenL = localStorage.getItem(TOKEN_KEY);
  const userL = localStorage.getItem(USER_KEY);
  if (tokenL && userL) return { token: tokenL, user: safeJsonParse(userL) };

  const tokenS = sessionStorage.getItem(TOKEN_KEY);
  const userS = sessionStorage.getItem(USER_KEY);
  if (tokenS && userS) return { token: tokenS, user: safeJsonParse(userS) };

  return { token: null, user: null };
}

function normalizeRole(role: any) {
  return String(role || "").trim().toLowerCase();
}

function isViewer(user: any) {
  return normalizeRole(user?.role) === "viewer";
}

function homeByRole(user: any) {
  return isViewer(user) ? VIEWER_HOME : ADMIN_HOME;
}

function hasRoleAccess(to: any, user: any) {
  const roles: string[] | undefined = to?.meta?.roles as any;
  if (!roles || roles.length === 0) return true;
  const r = normalizeRole(user?.role);
  return roles.includes(r);
}

const routes: RouteRecordRaw[] = [
  // ✅ smart home redirect ตาม role
  {
    path: "/",
    redirect: () => {
      const { token, user } = getAuthFromStorage();
      if (!token || !user) return "/login";
      return homeByRole(user);
    },
  },

  // ✅ login
  { path: "/login", name: "login", component: Loginform, meta: { public: true } },

  // ✅ dashboards
  { path: "/dashboard", name: "dashboard", component: Dashboardview, meta: { roles: ["admin"] } },
  { path: "/memberdashboard", name: "memberdashboard", component: MemberDashboard, meta: { roles: ["viewer"] } },

  // -------------------------
  // ADMIN: insert/edit (admin only)
  // -------------------------
  { path: "/memberinsert", name: "memberinsert", component: mainmember, meta: { roles: ["admin"] } },
  { path: "/newinsert", name: "newinsert", component: newsinsert, meta: { roles: ["admin"] } },
  { path: "/joblist", name: "joblist", component: joblist, meta: { roles: ["admin"] } },
  { path: "/announcement", name: "announcement", component: announcement, meta: { roles: ["admin"] } },
  { path: "/board_director", name: "board_director", component: Board_director, meta: { roles: ["admin"] } },
  { path: "/lapnet_employee", name: "lapnet", component: Lapnet, meta: { roles: ["admin"] } },
  { path: "/visitors", name: "visitors", component: Mainvisitors, meta: { roles: ["admin"] } },
  { path: "/createform", name: "createform", component: Createform, meta: { roles: ["admin"] } },
  { path: "/notifications", name: "notifications", component: mainnotification, meta: { roles: ["admin"] } },
  { path: "/announcementtomember", name: "announcementtomember", component: announcementtomember, meta: { roles: ["admin"] } },

  // edit pages (admin only)
  { path: "/membersedit", name: "membersedit", component: membersedit, meta: { roles: ["admin"] } },
  { path: "/newsedit", name: "newsedit", component: newsedit, meta: { roles: ["admin"] } },
  { path: "/jobedit", name: "jobedit", component: jobedit, meta: { roles: ["admin"] } },
  { path: "/announcementedit", name: "announcementedit", component: announcementedit, meta: { roles: ["admin"] } },
  { path: "/boarddirectoredit", name: "board_directoredit", component: Board_directoredit, meta: { roles: ["admin"] } },
  { path: "/lapnetedit", name: "lapnetedit", component: Lapnetedit, meta: { roles: ["admin"] } },

  // -------------------------
  // ADMIN VIEW PAGES (admin only) - 
  // -------------------------
  { path: "/members", name: "members", component: memberbankview, meta: { roles: ["admin"] } },
  { path: "/newsviewer", name: "newsviewer", component: newsview, meta: { roles: ["admin"] } },
  { path: "/jobview", name: "jobview", component: jobview, meta: { roles: ["admin"] } },
  { path: "/announcementviewer", name: "announcementviewer", component: announcementviewer, meta: { roles: ["admin"] } },
  { path: "/board_directorview", name: "board_directorview", component: Board_directorview, meta: { roles: ["admin"] } },
  { path: "/lapnetview", name: "lapnetview", component: lapnetview, meta: { roles: ["admin"] } },
  { path: "/usersmanage", name: "usersmanage", component: usersmanage, meta: { roles: ["admin"] } },

  // (ถ้าจะให้ viewer ดู formtemplates ด้วย ให้ทำ viewer path แยกอีกอัน)
  { path: "/formtemplates", name: "formtemplates", component: formtemplete, meta: { roles: ["admin"] } },
  { path: "/adddocument", name: "adddocument", component: documentupload, meta: { roles: ["admin"] } },

  // -------------------------
  // VIEWER VIEW PAGES (viewer only) - path แยกชัดเจน /v/...
  // -------------------------
  { path: "/v/view_document", name: "v_view_member", component: main, meta: { roles: ["viewer"] } },

  // ✅ FIX: documentviewer ต้องรับ :id (แก้ error Missing template id / viewer/:id)
  // - ใส่ :id? ให้ลิงก์เก่า (/v/documentviewer) ยังไม่พัง
  { path: "/v/documentviewer/:id?", name: "v_documentviewer", component: documentviewer, meta: { roles: ["viewer"] } },

  // ✅ เพิ่ม route ตามข้อความ error ที่คุณเจอ: /viewer/:id -> ชี้ไป /v/documentviewer/:id
  { path: "/viewer/:id", redirect: (to) => `/v/documentviewer/${encodeURIComponent(String(to.params.id))}` },

  { path: "/v/announcement_member", name: "v_jobs", component: announcement_memberbank, meta: { roles: ["viewer"] } },
  { path: "/v/formmemberview", name: "formmemberview", component: formmemberview, meta: { roles: ["viewer"] } },
  { path: "/v/chat", name: "chat", component: chat, meta: { roles: ["viewer"] } },
  { path: "/v/lapnet", name: "v_lapnet", component: lapnetview, meta: { roles: ["viewer"] } },
  {
    path: "/v/formsubmit/:id",
    name: "v_formmembersubmit",
    component: formmembersubmit,
    meta: { roles: ["viewer"] }
  },


   { path: "/v/docs", name: "v_docs", component: wordview, meta: { roles: ["viewer"] } },
   { path: "/v/excel", name: "v_excel", component: excelview, meta: { roles: ["viewer"] } },
   { path: "/v/presentation", name: "v_presentation", component: powerpointview, meta: { roles: ["viewer"] } },
   { path: "/v/pdf", name: "v_pdf", component: pdfview, meta: { roles: ["viewer"] } },
   { path: "/v/txt", name: "v_txt", component: txtview, meta: { roles: ["viewer"] } },



  

  // 404 -> smart home
  {
    path: "/:pathMatch(.*)*",
    redirect: () => {
      const { token, user } = getAuthFromStorage();
      if (!token || !user) return "/login";
      return homeByRole(user);
    },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to) => {
  const { token, user } = getAuthFromStorage();
  const isLoggedIn = !!token && !!user;

  // public route
  if (to.meta?.public) {
    if (isLoggedIn) return homeByRole(user);
    return true;
  }

  // not logged in -> force login
  if (!isLoggedIn) {
    return { path: "/login", query: { redirect: to.fullPath } };
  }

  // role not allowed -> send to home by role
  if (!hasRoleAccess(to, user)) {
    return homeByRole(user);
  }

  return true;
});

export default router;
