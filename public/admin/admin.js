const API_BASE = "/api";

const loginView = document.getElementById("loginView");
const cmsView = document.getElementById("cmsView");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");
const loginMessage = document.getElementById("loginMessage");
const logoutBtn = document.getElementById("logoutBtn");

// Form fields
const titleInput = document.getElementById("titleInput");
const subtitleInput = document.getElementById("subtitleInput");
const slugInput = document.getElementById("slugInput");
const imgInput = document.getElementById("imgInput");
const contentInput = document.getElementById("contentInput");
const editingIdInput = document.getElementById("editingId");
const saveNewsBtn = document.getElementById("saveNewsBtn");
const resetFormBtn = document.getElementById("resetFormBtn");
const newsListAdmin = document.getElementById("newsListAdmin");
const saveMessage = document.getElementById("saveMessage");

function slugify(str) {
  return str.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

async function login() {
  loginMessage.textContent = "";
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: loginEmail.value.trim(),
        password: loginPassword.value.trim()
      })
    });

    const data = await res.json();
    if (!res.ok) {
      loginMessage.textContent = data.message || "Đăng nhập thất bại";
      return;
    }

    loginView.classList.add("hidden");
    cmsView.classList.remove("hidden");
    loadNewsAdmin();

  } catch (e) {
    loginMessage.textContent = "Lỗi kết nối server";
  }
}

loginBtn.addEventListener("click", login);

logoutBtn.addEventListener("click", async () => {
  await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    credentials: "include"
  });

  cmsView.classList.add("hidden");
  loginView.classList.remove("hidden");
});

async function loadNewsAdmin() {
  newsListAdmin.innerHTML = "Đang tải...";

  try {
    const res = await fetch(`${API_BASE}/news`);
    const data = await res.json();

    newsListAdmin.innerHTML = "";

    data.forEach(n => {
      const div = document.createElement("div");
      div.className = "news-item";
      div.innerHTML = `
        <div class="news-item-title">${n.title} <span class='tag'>${n.slug}</span></div>
        <div class="news-item-subtitle">${n.subtitle || ""}</div>
        <div class="actions">
          <button class="btn-secondary btn-edit">Sửa</button>
          <button class="btn-danger btn-delete">Xoá</button>
        </div>
      `;

      div.querySelector(".btn-edit").addEventListener("click", () => {
        editingIdInput.value = n._id;
        titleInput.value = n.title;
        subtitleInput.value = n.subtitle || "";
        slugInput.value = n.slug;
        imgInput.value = n.img || "";
        contentInput.value = n.content || "";
      });

      div.querySelector(".btn-delete").addEventListener("click", async () => {
        if (!confirm("Xoá bài này?")) return;

        await fetch(`${API_BASE}/news/${n._id}`, {
          method: "DELETE",
          credentials: "include"
        });

        loadNewsAdmin();
      });

      newsListAdmin.appendChild(div);
    });

  } catch (e) {
    newsListAdmin.textContent = "Lỗi tải dữ liệu";
  }
}

saveNewsBtn.addEventListener("click", async () => {
  saveMessage.textContent = "";

  const id = editingIdInput.value;
  const title = titleInput.value.trim();
  const subtitle = subtitleInput.value.trim();
  let slug = slugInput.value.trim();
  const img = imgInput.value.trim();
  const content = contentInput.value.trim();

  if (!title) {
    saveMessage.textContent = "Vui lòng nhập tiêu đề.";
    return;
  }

  if (!slug) slug = slugify(title);

  const body = { title, subtitle, slug, img, content };

  let url = `${API_BASE}/news`;
  let method = "POST";

  if (id) {
    url = `${API_BASE}/news/${id}`;
    method = "PUT";
  }

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (!res.ok) {
    saveMessage.textContent = data.message || "Lỗi lưu bài viết";
    return;
  }

  saveMessage.textContent = "Đã lưu bài viết.";
  editingIdInput.value = "";
  titleInput.value = "";
  subtitleInput.value = "";
  slugInput.value = "";
  imgInput.value = "";
  contentInput.value = "";

  loadNewsAdmin();
});

resetFormBtn.addEventListener("click", () => {
  editingIdInput.value = "";
  titleInput.value = "";
  subtitleInput.value = "";
  slugInput.value = "";
  imgInput.value = "";
  contentInput.value = "";
});
