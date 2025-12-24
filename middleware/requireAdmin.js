module.exports = function requireAdmin(req, res, next) {
  // req.user được set từ middleware/auth.js (decoded JWT)
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Chỉ admin mới có quyền truy cập" });
  }
  next();
};
