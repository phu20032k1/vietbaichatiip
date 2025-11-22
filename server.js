require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");

const User = require("./models/User");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: ["http://localhost:3000", "https://chatiip.com"],
  credentials: true
}));

// ====== ROUTES ======
const authRoutes = require("./routes/authRoutes");
const newsRoutes = require("./routes/newsRoutes");

// ====== STATIC FILES (ADMIN PANEL) ======
app.use("/admin", express.static(path.join(__dirname, "public/admin")));

// ====== API ======
app.use("/api/auth", authRoutes);
app.use("/api/news", newsRoutes);

// ===== CONNECT TO MONGODB =====
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✔ MongoDB connected");

    // tạo admin tự động nếu chưa có
    await User.createAdminIfNotExists(
      process.env.ADMIN_DEFAULT_EMAIL,
      process.env.ADMIN_DEFAULT_PASSWORD
    );
  })
  .catch(err => {
    console.error("MongoDB connection error:", err);
  });

// ===== START SERVER =====
app.listen(process.env.PORT, () => {
  console.log("✔ Server running on port", process.env.PORT);
});
