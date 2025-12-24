const express = require("express");
const auth = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");
const User = require("../models/User");

const router = express.Router();

// GET /api/admin/users?page=1&limit=20&q=...
router.get("/users", auth, requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "20", 10)));
    const q = (req.query.q || "").toString().trim();

    const filter = {};
    if (q) {
      const r = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ email: r }, { name: r }];
    }

    const total = await User.countDocuments(filter);
    const items = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("_id name email role createdAt updatedAt");

    res.json({ items, page, limit, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// GET /api/admin/users/:id
router.get("/users/:id", auth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("_id name email role createdAt updatedAt");
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
