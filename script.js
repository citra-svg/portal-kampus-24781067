const USERS = [
  { username: "mahasiswa", password: "12345", name: "Citra Zainah", role: "mahasiswa" },
  { username: "dosen",     password: "12345", name: "Bpk. Budi Santoso", role: "dosen" },
  { username: "admin",     password: "admin123", name: "Admin Sistem", role: "admin" }
];

function loginRentan(u, p) {
  const fakeSQL = "SELECT * FROM users WHERE username='" + u + "' AND password='" + p + "'";

  if (/' OR '1'='1/i.test(fakeSQL) || /' OR 1=1/i.test(fakeSQL) || /admin'\s*--/i.test(fakeSQL) || /'\s*OR\s+'1'\s*=\s*'1/i.test(fakeSQL)) {
    return { ...USERS[0], __exploited: true, __sql: fakeSQL };
  }

  const user = USERS.find(x => x.username === u && x.password === p);
  return user ? { ...user, __exploited: false, __sql: fakeSQL } : null;
}

const CHAT_KEY = "p06_portal_chat";
function loadChat() {
  try { return JSON.parse(localStorage.getItem(CHAT_KEY)) || []; }
  catch(e) { return []; }
}
function saveChat(list) {
  try { localStorage.setItem(CHAT_KEY, JSON.stringify(list)); } catch(e) {}
}
function renderChatRentan() {
  const list = loadChat();
  const box = document.getElementById("chatBox");
  if (!box) return;

  box.innerHTML = list.map(m =>
    '<div class="chat-msg"><div class="meta"><span class="author">' + m.author + '</span><span>' + m.time + '</span></div><div class="body">' + m.body + '</div></div>'
  ).join("");
  box.scrollTop = box.scrollHeight;
}
function sendChat() {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();
  if (!text) return;
  const list = loadChat();
  list.push({ author: state.user.name, body: text, time: new Date().toLocaleTimeString("id-ID") });
  saveChat(list);
  input.value = "";
  renderChatRentan();
}

const state = { user: null, page: null };

const MENUS = {
  mahasiswa: [
    { id: "mhs-dashboard", icon: "🏠", label: "Dashboard" },
    { id: "mhs-nilai",     icon: "📊", label: "Nilai Saya" },
    { id: "mhs-upload",    icon: "📤", label: "Unggah Tugas" },
    { id: "mhs-diskusi",   icon: "💬", label: "Diskusi" }
  ],
  dosen: [
    { id: "dosen-dashboard", icon: "🏠", label: "Dashboard" },
    { id: "dosen-nilai",     icon: "✍️", label: "Input Nilai" }
  ],
  admin: [
    { id: "admin-dashboard", icon: "🏠", label: "Dashboard" },
    { id: "admin-users",     icon: "👥", label: "Kelola Akun" }
  ]
};

function doLogin() {
  const u = document.getElementById("username").value.trim();
  const p = document.getElementById("password").value;
  const err = document.getElementById("loginError");

  const user = loginRentan(u, p);

  if (!user) {
    err.textContent = "Username atau password salah.";
    err.classList.add("show");
    return;
  }

  if (user.__exploited) {
    console.warn("[SQLi TERDETEKSI] Query:", user.__sql);
    setTimeout(() => {
      alert("🔓 SQL Injection berhasil!\n\nPayload Anda menembus autentikasi.\nQuery: " + user.__sql);
    }, 100);
  }

  state.user = user;
  enterApp();
}

function enterApp() {
  document.getElementById("loginPage").style.display = "none";
  document.getElementById("app").classList.add("active");

  document.getElementById("userName").textContent = state.user.name;
  document.getElementById("userRole").textContent = state.user.role;
  document.getElementById("userRole").className = "role-badge role-" + state.user.role;
  document.getElementById("userInitial").textContent = state.user.name.charAt(0);

  const nav = document.getElementById("navMenu");
  nav.innerHTML = MENUS[state.user.role].map(m =>
    '<div class="nav-item" data-page="' + m.id + '" onclick="goPage(\'' + m.id + '\')"><span class="icon">' + m.icon + '</span>' + m.label + '</div>'
  ).join("");

  goPage(MENUS[state.user.role][0].id);
}

function goPage(id) {
  state.page = id;
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const el = document.getElementById("page-" + id);
  if (el) el.classList.add("active");

  document.querySelectorAll(".nav-item").forEach(n => {
    n.classList.toggle("active", n.dataset.page === id);
  });

  if (id === "mhs-diskusi") renderChatRentan();
}

function logout() {
  state.user = null;
  document.getElementById("app").classList.remove("active");
  document.getElementById("loginPage").style.display = "flex";
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  document.getElementById("loginError").classList.remove("show");
}

document.getElementById("password").addEventListener("keypress", e => {
  if (e.key === "Enter") doLogin();
});