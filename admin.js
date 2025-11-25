// Dùng local khi chạy trên localhost, còn lại dùng cùng domain admin.chatiip.com
const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:4000/api"
    : "/api";

// ====== SEO INPUT ======
const pageTitleInput = document.getElementById("pageTitleInput");
const pageHeadingInput = document.getElementById("pageHeadingInput");
const pageDescriptionInput = document.getElementById("pageDescriptionInput");
const pageKeywordsInput = document.getElementById("pageKeywordsInput");
const ogImageInput = document.getElementById("ogImageInput");
const canonicalInput = document.getElementById("canonicalInput");

// ====== LOGIN ELEMENTS ======
const loginView = document.getElementById("loginView");
const cmsView = document.getElementById("cmsView");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");
const loginMessage = document.getElementById("loginMessage");
const logoutBtn = document.getElementById("logoutBtn");

// ====== FORM INPUT ======
const titleInput = document.getElementById("titleInput");
const subtitleInput = document.getElementById("subtitleInput");
const slugInput = document.getElementById("slugInput");
const imgInput = document.getElementById("imgInput");
const contentInput = document.getElementById("contentInput");
const categoryInput = document.getElementById("categoryInput");

const editingIdInput = document.getElementById("editingId");
const saveNewsBtn = document.getElementById("saveNewsBtn");
const resetFormBtn = document.getElementById("resetFormBtn");
const newsListAdmin = document.getElementById("newsListAdmin");
const saveMessage = document.getElementById("saveMessage");

// RADIO + CHECKBOX
const approvedYes = document.querySelector('input[name="approved"]:first-child');
const approvedNo = document.querySelectorAll('input[name="approved"]')[1];
const scheduleInput = document.querySelector('input[type="datetime-local"]');

function slugify(str) {
  return str.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

// ====== LOGIN ======
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
  await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
  cmsView.classList.add("hidden");
  loginView.classList.remove("hidden");
});

// ====== LOAD NEWS LIST ======
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

      // ====== NÚT SỬA ======
      div.querySelector(".btn-edit").addEventListener("click", () => {
        editingIdInput.value = n._id;

        titleInput.value = n.title;
        subtitleInput.value = n.subtitle || "";
        slugInput.value = n.slug;
        imgInput.value = n.img || "";

        // TinyMCE
        tinymce.get("contentInput").setContent(n.content || "");

        // Category
        categoryInput.value = n.category || "Root";

        // SEO fields
        pageTitleInput.value = n.pageTitle || "";
        pageHeadingInput.value = n.pageHeading || "";
        pageDescriptionInput.value = n.pageDescription || "";
        pageKeywordsInput.value = n.pageKeywords || "";
        ogImageInput.value = n.ogImage || "";
        canonicalInput.value = n.canonical || "";

        // Approved
        if (n.approved === true) approvedYes.checked = true;
        else approvedNo.checked = true;

        // Scheduled At
        scheduleInput.value = n.scheduledAt ? n.scheduledAt.slice(0,16) : "";
      });

      // ====== NÚT XOÁ ======
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

// ====== LƯU BÀI VIẾT ======
saveNewsBtn.addEventListener("click", async () => {
  saveMessage.textContent = "";

  const id = editingIdInput.value;
  const title = titleInput.value.trim();
  const subtitle = subtitleInput.value.trim();
  let slug = slugInput.value.trim();
  const img = imgInput.value.trim();
  const content = tinymce.get("contentInput").getContent();
  const category = categoryInput.value;

  if (!title) {
    saveMessage.textContent = "Vui lòng nhập tiêu đề.";
    return;
  }

  if (!slug) slug = slugify(title);

  const body = {
    title, subtitle, slug, img, content, category,
    pageTitle: pageTitleInput.value,
    pageHeading: pageHeadingInput.value,
    pageDescription: pageDescriptionInput.value,
    pageKeywords: pageKeywordsInput.value,
    ogImage: ogImageInput.value,
    canonical: canonicalInput.value,
    approved: approvedYes.checked,
    scheduledAt: scheduleInput.value || null
  };

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

  showToast("Đã lưu bài viết ✔");

  // ====== RESET FORM ======
  editingIdInput.value = "";
  titleInput.value = "";
  subtitleInput.value = "";
  slugInput.value = "";
  imgInput.value = "";
  tinymce.get("contentInput").setContent("");
  categoryInput.value = "Root";

  pageTitleInput.value = "";
  pageHeadingInput.value = "";
  pageDescriptionInput.value = "";
  pageKeywordsInput.value = "";
  ogImageInput.value = "";
  canonicalInput.value = "";

  approvedYes.checked = true;
  approvedNo.checked = false;

  scheduleInput.value = "";

  loadNewsAdmin();
});

// ====== RESET FORM BUTTON ======
resetFormBtn.addEventListener("click", () => {
  editingIdInput.value = "";
  titleInput.value = "";
  subtitleInput.value = "";
  slugInput.value = "";
  imgInput.value = "";

  tinymce.get("contentInput").setContent("");

  categoryInput.value = "Root";

  pageTitleInput.value = "";
  pageHeadingInput.value = "";
  pageDescriptionInput.value = "";
  pageKeywordsInput.value = "";
  ogImageInput.value = "";
  canonicalInput.value = "";

  approvedYes.checked = true;
  approvedNo.checked = false;

  scheduleInput.value = "";
});

// ====== TOAST ======
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.style.display = "block";
  setTimeout(() => (t.style.display = "none"), 3000);
}
