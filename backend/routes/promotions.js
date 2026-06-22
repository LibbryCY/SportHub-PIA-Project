const express = require("express");
const router = express.Router();
const { Promotion } = require("../models/index");
const { auth, requireRole } = require("../middleware/auth");

// GET /api/promotions - public, max 3 active for homepage
// router.get("/", async (req, res) => {
//   const { limit } = req.query;
//   const now = new Date();
//   const query = Promotion.find({
//     isActive: true,
//     startDate: { $lte: now },
//     endDate: { $gte: now },
//   })
//     .populate("facility", "name city")
//     .populate("sport", "name")
//     .sort({ createdAt: -1 });
//   if (limit) query.limit(parseInt(limit));
//   const promotions = await query;
//   res.json(promotions);
// });

router.get("/", async (req, res) => {
  const { limit, facility } = req.query;
  const now = new Date();
  const filter = {};
  if (facility) {
    filter.facility = facility;
  } else {
    filter.isActive = true;
    filter.startDate = { $lte: now };
    filter.endDate = { $gte: now };
  }
  const query = Promotion.find(filter)
    .populate("facility", "name city")
    .populate("sport", "name")
    .sort({ createdAt: -1 });
  if (limit) query.limit(parseInt(limit));
  const promotions = await query;
  res.json(promotions);
});

// POST /api/promotions
router.post("/", auth, requireRole("employee"), async (req, res) => {
  try {
    const promotion = new Promotion({ ...req.body });
    await promotion.save();
    res.status(201).json(promotion);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/promotions/:id
router.put("/:id", auth, requireRole("employee"), async (req, res) => {
  const promotion = await Promotion.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(promotion);
});

module.exports = router;
