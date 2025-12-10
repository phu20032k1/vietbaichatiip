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

app.use(
  cors({
    origin: [
      "https://chatiip.com",
      "http://localhost:3000",
      "http://127.0.0.1:5500",
      "http://localhost:5500",
      "null" 
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);




// ⭐ Nếu truy cập admin.chatiip.com → load admin panel luôn
app.use((req, res, next) => {
  const host = req.headers.host;

  if (host && host.startsWith("admin.chatiip.com")) {
    return express.static(path.join(__dirname, "public/admin"))(req, res, next);
  }

  next();
});

// ⭐ STATIC FILES

app.use("/admin", express.static(path.join(__dirname, "public/admin"), { redirect: false }));


// ⭐ API
const authRoutes = require("./routes/authRoutes");
const newsRoutes = require("./routes/newsRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/news", newsRoutes);
const News = require("./models/News");

// SITEMAP.XML
app.get("/sitemap.xml", async (req, res) => {
  const list = await News.find().sort({ publishedAt: -1 });

  const pages = list.map(item => `
    <url>
      <loc>https://chatiip.com/article.html?slug=${item.slug}</loc>
      <lastmod>${new Date(item.modifiedAt).toISOString()}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.8</priority>
    </url>
  `).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
      <loc>https://chatiip.com/</loc>
      <changefreq>daily</changefreq>
      <priority>1.0</priority>
    </url>
    <url>
      <loc>https://chatiip.com/news.html</loc>
      <changefreq>daily</changefreq>
      <priority>0.9</priority>
    </url>
    ${pages}
  </urlset>`;

  res.header("Content-Type", "application/xml");
  res.send(xml);
});


// ⭐ CONNECT MONGODB
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✔ MongoDB connected");

    await User.createAdminIfNotExists(
      process.env.ADMIN_DEFAULT_EMAIL,
      process.env.ADMIN_DEFAULT_PASSWORD
    );
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// ⭐ START SERVER
app.listen(process.env.PORT, () => {
  console.log("✔ Server running on port", process.env.PORT);
});



app.get("/rss.xml", async (req, res) => {
  const list = await News.find().sort({ publishedAt: -1 }).limit(50);

  const rssItems = list.map(item => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>https://chatiip.com/article.html?slug=${item.slug}</link>
      <guid>https://chatiip.com/article.html?slug=${item.slug}</guid>
      <pubDate>${new Date(item.publishedAt).toUTCString()}</pubDate>
      <description><![CDATA[${item.subtitle || ""}]]></description>
    </item>
  `).join("");

  const xml = `
  <rss version="2.0">
    <channel>
      <title>ChatIIP News</title>
      <link>https://chatiip.com</link>
      <description>Tin tức từ ChatIIP</description>
      ${rssItems}
    </channel>
  </rss>`;

  res.header("Content-Type", "application/xml");
  res.send(xml);
});
