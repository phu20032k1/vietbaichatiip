const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name || "",
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// Đăng ký (user thường)
router.post("/register", async (req, res) => {
  try {
    const { name = "", email, password } = req.body || {};
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanName = (name || "").toString().trim();

    if (!cleanEmail || !password) {
      return res.status(400).json({ message: "Thiếu email hoặc mật khẩu" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: "Mật khẩu phải từ 6 ký tự" });
    }

    const existed = await User.findOne({ email: cleanEmail });
    if (existed) {
      return res.status(409).json({ message: "Email đã tồn tại" });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      passwordHash: hash,
      role: "user"
    });

    const token = signToken(user);

    // set cookie để admin panel (fetch include credentials) dùng được luôn
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      message: "Đăng ký thành công",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const cleanEmail = (email || "").trim().toLowerCase();

    const user = await User.findOne({ email: cleanEmail });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Sai email hoặc mật khẩu" });
    }

    const token = signToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Đã đăng xuất" });
});

// Kiểm tra phiên đăng nhập hiện tại
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("_id name email role createdAt updatedAt");
    if (!user) return res.status(401).json({ message: "Phiên đăng nhập không hợp lệ" });
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt, updatedAt: user.updatedAt } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
