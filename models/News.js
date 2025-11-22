const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    slug: { type: String, required: true, unique: true },
    img: { type: String },
    content: { type: String },
    publishedAt: { type: Date, default: Date.now },
    modifiedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model("News", newsSchema);
