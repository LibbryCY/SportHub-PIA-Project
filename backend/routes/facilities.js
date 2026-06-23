const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Facility = require("../models/Facility");
const { Comment } = require("../models/index");
const Reservation = require("../models/Reservation");
const { auth, requireRole } = require("../middleware/auth");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/facilities");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/facilities - public search
router.get("/", async (req, res) => {
  try {
    const { name, city, sport, courtType, todayOnly } = req.query;
    const filter = { status: "active" };

    if (name) filter.name = { $regex: name, $options: "i" };
    if (city) filter.city = { $in: Array.isArray(city) ? city : [city] };
    if (sport) filter.sports = sport;
    if (courtType) filter["courts.type"] = courtType;
    if (todayOnly === "true") {
    }

    let facilities = await Facility.find(filter)
      .populate("sports", "name")
      .populate("owner", "firstName lastName");

    res.json(facilities);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/facilities/cities - distinct active cities
router.get("/cities", async (req, res) => {
  const cities = await Facility.distinct("city", { status: "active" });
  res.json(cities);
});

// GET /api/facilities/top3 - homepage top 3
router.get("/top3", async (req, res) => {
  const facilities = await Facility.find({ status: "active" })
    .populate("sports", "name")
    .sort({ likes: -1 })
    .limit(3);
  res.json(
    facilities.map((f) => ({
      _id: f._id,
      name: f.name,
      city: f.city,
      likes: f.likes.length,
      dislikes: f.dislikes.length,
      sports: f.sports,
    }))
  );
});

// GET /api/facilities/:id - facility details
router.get("/:id", async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id)
      .populate("sports", "name")
      .populate("owner", "firstName lastName");
    if (!facility)
      return res.status(404).json({ message: "Facility not found" });

    // Last 5 comments
    const comments = await Comment.find({ facility: req.params.id })
      .populate("user", "firstName lastName profileImage")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({ ...facility.toObject(), comments });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/facilities - employee creates facility
router.post(
  "/",
  auth,
  requireRole("employee"),
  upload.array("images", 10),
  async (req, res) => {
    try {
      const data = JSON.parse(req.body.facilityData || "{}");
      data.owner = req.user._id;
      data.status = "pending"; // needs admin approval
      if (req.files) data.images = req.files.map((f) => f.filename);

      const facility = new Facility(data);
      await facility.save();
      res.status(201).json(facility);
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// POST /api/facilities/import-json - import from JSON file
router.post(
  "/import-json",
  auth,
  requireRole("employee"),
  upload.single("jsonFile"),
  async (req, res) => {
    try {
      console.log("JSON backend import ", req.file.path);
      const fileContent = fs.readFileSync(req.file.path, "utf-8");
      const data = JSON.parse(fileContent);
      data.owner = req.user._id;
      data.status = "pending";

      const facility = new Facility(data);
      await facility.save();
      fs.unlinkSync(req.file.path);
      res.status(201).json(facility);
    } catch (err) {
      res
        .status(500)
        .json({ message: "Invalid JSON or server error", error: err.message });
    }
  }
);

// PUT /api/facilities/:id - update facility
router.put(
  "/:id",
  auth,
  requireRole("employee"),
  upload.array("images", 10),
  async (req, res) => {
    try {
      const facility = await Facility.findOne({
        _id: req.params.id,
        owner: req.user._id,
      });
      if (!facility)
        return res
          .status(404)
          .json({ message: "Facility not found or not yours" });

      const data = JSON.parse(req.body.facilityData || "{}");
      if (req.files?.length)
        data.images = [
          ...(facility.images || []),
          ...req.files.map((f) => f.filename),
        ];

      Object.assign(facility, data);
      await facility.save();
      res.json(facility);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// POST /api/facilities/:id/react - like/dislike
router.post("/:id/react", auth, requireRole("athlete"), async (req, res) => {
  try {
    const { reaction } = req.body; // ike/dislike
    const userId = req.user._id;

    // Check user has at least one confirmed reservation
    const confirmed = await Reservation.countDocuments({
      facility: req.params.id,
      user: userId,
      status: "confirmed",
    });
    if (!confirmed)
      return res
        .status(403)
        .json({ message: "You need at least one confirmed reservation" });

    // Count existing reactions for this user
    const existingComments = await Comment.countDocuments({
      facility: req.params.id,
      user: userId,
    });
    if (existingComments >= confirmed) {
      return res.status(403).json({ message: "Reaction limit reached" });
    }

    const facility = await Facility.findById(req.params.id);
    if (reaction === "like") {
      facility.likes.addToSet(userId);
      facility.dislikes.pull(userId);
    } else {
      facility.dislikes.addToSet(userId);
      facility.likes.pull(userId);
    }
    await facility.save();
    res.json({
      likes: facility.likes.length,
      dislikes: facility.dislikes.length,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/facilities/:id/comment
router.post("/:id/comment", auth, requireRole("athlete"), async (req, res) => {
  try {
    const userId = req.user._id;
    const confirmed = await Reservation.countDocuments({
      facility: req.params.id,
      user: userId,
      status: "confirmed",
    });
    if (!confirmed)
      return res
        .status(403)
        .json({ message: "Need confirmed reservation to comment" });

    const existingComments = await Comment.countDocuments({
      facility: req.params.id,
      user: userId,
    });
    if (existingComments >= confirmed) {
      return res.status(403).json({ message: "Comment limit reached" });
    }

    const comment = new Comment({
      user: userId,
      facility: req.params.id,
      text: req.body.text,
      reaction: req.body.reaction,
    });
    await comment.save();
    await comment.populate("user", "firstName lastName profileImage");
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/facilities/my/list - employee vidi svoje objekte (svi statusi)
router.get("/my/list", auth, requireRole("employee"), async (req, res) => {
  const facilities = await Facility.find({ owner: req.user._id }).populate(
    "sports",
    "name"
  );
  res.json(facilities);
});

// Admin

// GET /api/facilities/admin/all - admin vidi sve
router.get("/admin/all", auth, requireRole("admin"), async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;
  const facilities = await Facility.find(filter)
    .populate("sports", "name")
    .populate("owner", "firstName lastName email");
  res.json(facilities);
});

// PATCH /api/facilities/:id/approve
router.patch("/:id/approve", auth, requireRole("admin"), async (req, res) => {
  const facility = await Facility.findByIdAndUpdate(
    req.params.id,
    { status: "active" },
    { new: true }
  );
  res.json(facility);
});

// PATCH /api/facilities/:id/reject
router.patch("/:id/reject", auth, requireRole("admin"), async (req, res) => {
  const facility = await Facility.findByIdAndUpdate(
    req.params.id,
    { status: "inactive" },
    { new: true }
  );
  res.json(facility);
});

module.exports = router;
