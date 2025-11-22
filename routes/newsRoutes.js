const express = require("express");
const News = require("../models/News");
const auth = require("../middleware/auth");

const router = express.Router();

// PUBLIC: Lấy danh sách tin
router.get("/", async (req, res) => {
  const list = await News.find().sort({ publishedAt: -1 });
  res.json(list);
});

// PUBLIC: Lấy tin theo slug
router.get("/:slug", async (req, res) => {
  const item = await News.findOne({ slug: req.params.slug });
  if (!item) return res.status(404).json({ message: "Không tìm thấy bài viết" });
  res.json(item);
});

// ADMIN: Thêm tin
router.post("/", auth, async (req, res) => {
  const { title, subtitle, slug, img, content } = req.body;
  if (!title || !slug) return res.status(400).json({ message: "Thiếu dữ liệu" });

  const existed = await News.findOne({ slug });
  if (existed) return res.status(400).json({ message: "Slug đã tồn tại" });

  const now = new Date();

  const news = await News.create({
    title,
    subtitle,
    slug,
    img,
    content,
    publishedAt: now,
    modifiedAt: now
  });

  res.status(201).json(news);
});

// ADMIN: Sửa tin
router.put("/:id", auth, async (req, res) => {
  const item = await News.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Không tìm thấy bài viết" });

  const { title, subtitle, slug, img, content } = req.body;

  if (slug && slug !== item.slug) {
    const existed = await News.findOne({ slug });
    if (existed) return res.status(400).json({ message: "Slug đã tồn tại" });
    item.slug = slug;
  }

  if (title) item.title = title;
  item.subtitle = subtitle;
  item.img = img;
  item.content = content;
  item.modifiedAt = new Date();

  await item.save();
  res.json(item);
});

// ADMIN: Xoá tin
router.delete("/:id", auth, async (req, res) => {
  const item = await News.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Không tìm thấy bài" });

  await item.deleteOne();
  res.json({ message: "Đã xoá" });
});

module.exports = router;
