const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { auth, requireRole } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/profiles");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// GET /api/users/me
router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-password")
    .populate("favoriteSports");
  res.json(user);
});

// PUT /api/users/me - update profile
router.put("/me", auth, upload.single("profileImage"), async (req, res) => {
  try {
    const updates = req.body;
    delete updates.username; // cannot change username
    delete updates.password;
    delete updates.role;
    if (req.file) updates.profileImage = req.file.filename;
    if (updates.favoriteSports)
      updates.favoriteSports = JSON.parse(updates.favoriteSports);

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
    })
      .select("-password")
      .populate("favoriteSports");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ---- ADMIN routes ----

// GET /api/users - admin lists all users
router.get("/", auth, requireRole("admin"), async (req, res) => {
  const { status, role } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (role) filter.role = role;
  const users = await User.find(filter)
    .select("-password")
    .populate("favoriteSports");
  res.json(users);
});

// GET /api/users/pending - registration requests
router.get("/pending", auth, requireRole("admin"), async (req, res) => {
  const users = await User.find({
    status: "pending",
    role: { $ne: "admin" },
  }).select("-password");
  res.json(users);
});

// PATCH /api/users/:id/approve
router.patch("/:id/approve", auth, requireRole("admin"), async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status: "active" },
    { new: true }
  ).select("-password");
  res.json(user);
});

// PATCH /api/users/:id/reject
router.patch("/:id/reject", auth, requireRole("admin"), async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status: "rejected" },
    { new: true }
  ).select("-password");
  res.json(user);
});

// DELETE /api/users/:id
router.delete("/:id", auth, requireRole("admin"), async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
});

// PATCH /api/users/:id - admin edits user
router.patch("/:id", auth, requireRole("admin"), async (req, res) => {
  const updates = req.body;
  delete updates.password;
  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
  }).select("-password");
  res.json(user);
});

module.exports = router;
