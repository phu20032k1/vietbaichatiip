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
  origin: ["http://localhost:3000", "https://chatiip.com","https://dynamic-babka-d17d5a.netlify.app"],
  credentials: true
}));

// ====== ROUTES ======
const authRoutes = require("./routes/authRoutes");
const newsRoutes = require("./routes/newsRoutes");


// Serve admin panel directly when using admin.chatiip.com
app.use((req, res, next) => {
  const host = req.headers.host;

  if (host && host.startsWith("admin.chatiip.com")) {
    return express.static(path.join(__dirname, "public/admin"))(req, res, next);
  }

  next();
});


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
