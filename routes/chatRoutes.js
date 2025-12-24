const express = require("express");
const LegalDocument = require("../models/LegalDocument");

const router = express.Router();

const upstreamURL = process.env.CHATBOT_UPSTREAM_URL || "https://luat-lao-dong.onrender.com/chat";

// node-fetch v3 (ESM) helper for CommonJS
const fetchViaNodeFetch = async (...args) => {
  const mod = await import("node-fetch");
  return mod.default(...args);
};

function normalizeForMatch(s = "") {
  // Uppercase + strip Vietnamese diacritics + normalize special letters
  return String(s)
    .toUpperCase()
    .replace(/Đ/g, "D")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSoHieuCandidates(question = "") {
  const q = normalizeForMatch(question);
  const out = new Set();

  // Strong pattern: 12/2023/NĐ-CP or 12/2023/ND-CP
  const strong = q.match(/\b\d{1,3}\/\d{4}\/(ND-?CP)\b/g);
  if (strong) strong.forEach((m) => out.add(m));

  // Also support "NGHI DINH 12/2023/ND-CP" without being too strict
  const alt = q.match(/\b\d{1,3}\/\d{4}\b/g);
  if (alt && out.size === 0) {
    // Only add weaker candidates if we didn't already detect a strong one
    alt.slice(0, 3).forEach((m) => out.add(m));
  }

  return Array.from(out);
}

function buildPublicUrl(req, doc) {
  const rel = doc?.file?.publicUrl;
  if (!rel) return "";
  if (/^https?:\/\//i.test(rel)) return rel;
  return `${req.protocol}://${req.get("host")}${rel.startsWith("/") ? "" : "/"}${rel}`;
}

function excerptAround(text = "", needle = "", maxLen = 220) {
  const t = String(text || "");
  if (!t) return "";

  const n = String(needle || "");
  if (!n) return t.slice(0, maxLen);

  const idx = normalizeForMatch(t).indexOf(normalizeForMatch(n));
  if (idx < 0) return t.slice(0, maxLen);

  const start = Math.max(0, idx - Math.floor(maxLen / 3));
  const end = Math.min(t.length, start + maxLen);
  return t.slice(start, end).replace(/\s+/g, " ").trim();
}

async function findCitations(req, question) {
  const candidates = extractSoHieuCandidates(question);
  let docs = [];
  let matchedNeedle = candidates[0] || "";

  if (candidates.length > 0) {
    // Try match by soHieu first
    docs = await LegalDocument.find({
      soHieu: { $regex: candidates[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" }
    })
      .sort({ updatedAt: -1 })
      .limit(3);
  }

  if (docs.length === 0) {
    // Fallback: full-text search
    docs = await LegalDocument.find(
      { $text: { $search: String(question || "") } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" }, updatedAt: -1 })
      .limit(2);

    matchedNeedle = "";
  }

  return docs
    .filter((d) => d && (d.file?.publicUrl || d.textContent || d.trichYeu))
    .map((d) => {
      const url = buildPublicUrl(req, d);
      return {
        id: String(d._id),
        title: d.title,
        soHieu: d.soHieu || "",
        tinhTrang: d.tinhTrang || "Không xác định",
        url,
        excerpt: excerptAround(d.textContent || d.trichYeu || "", matchedNeedle)
      };
    });
}

// POST /api/chat
// Body: { question: string }
router.post("/", async (req, res) => {
  try {
    const question = (req.body?.question || "").toString();
    if (!question.trim()) {
      return res.status(400).json({ error: "Missing question" });
    }

    // 1) Get answer from upstream chatbot (your current Render chatbot)
    const upstream = process.env.CHATBOT_UPSTREAM_URL || "https://luat-lao-dong.onrender.com/chat";

    let answer = "";
    try {
      const r = await fetchViaNodeFetch(upstream, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });
      const data = await r.json().catch(() => ({}));
      answer = data.answer || data.reply || "";
    } catch (e) {
      // keep empty; we'll return a fallback below
    }

    if (!answer) {
      answer = "Mình đã nhận được câu hỏi của bạn. Hiện hệ thống trả lời đang bận, bạn thử lại sau nhé.";
    }

    // 2) Attach citations from your own LegalDocument database
    const citations = await findCitations(req, question);

    res.json({ answer, citations });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
