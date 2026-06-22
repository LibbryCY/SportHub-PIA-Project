const express = require("express");
const router = express.Router();
const { Trainer, Training } = require("../models/index");
const { auth, requireRole } = require("../middleware/auth");

router.get("/", async (req, res) => {
  const { facilityId, sportId } = req.query;
  const filter = { isActive: true };
  if (facilityId) filter.facility = facilityId;
  if (sportId) filter.sport = sportId;
  const trainers = await Trainer.find(filter)
    .populate("sport", "name")
    .populate("facility", "name");
  res.json(
    trainers.map((t) => ({
      ...t.toObject(),
      avgRating: t.ratings.length
        ? (
            t.ratings.reduce((s, r) => s + r.score, 0) / t.ratings.length
          ).toFixed(1)
        : null,
    }))
  );
});

router.post("/", auth, requireRole("admin"), async (req, res) => {
  const trainer = new Trainer(req.body);
  await trainer.save();
  res.status(201).json(trainer);
});

router.patch(
  "/:id/deactivate",
  auth,
  requireRole("admin"),
  async (req, res) => {
    const trainer = await Trainer.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    res.json(trainer);
  }
);

// Schedule training
router.post("/trainings", auth, requireRole("athlete"), async (req, res) => {
  try {
    const training = new Training({ ...req.body, athlete: req.user._id });
    await training.save();
    res.status(201).json(training);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// My trainings
router.get("/trainings/my", auth, requireRole("athlete"), async (req, res) => {
  const trainings = await Training.find({ athlete: req.user._id })
    .populate("trainer")
    .populate("facility", "name city")
    .sort({ startTime: -1 });
  res.json(trainings);
});

// Facility trainings (employee)
router.get(
  "/trainings/facility/:facilityId",
  auth,
  requireRole("employee"),
  async (req, res) => {
    try {
      const trainings = await Training.find({ facility: req.params.facilityId })
        .populate("athlete", "firstName lastName phone")
        .populate("trainer", "firstName lastName")
        .populate("facility", "name")
        .sort({ startTime: 1 });
      res.json(trainings);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

router.patch(
  "/trainings/:id/move",
  auth,
  requireRole("employee"),
  async (req, res) => {
    try {
      const { newStartTime, newEndTime } = req.body;
      const training = await Training.findById(req.params.id).populate(
        "facility"
      );
      if (!training) return res.status(404).json({ message: "Not found" });

      const facility = training.facility;
      const [openH] = facility.workingHours.open.split(":").map(Number);
      const [closeH] = facility.workingHours.close.split(":").map(Number);
      const newStart = new Date(newStartTime);
      const newEnd = new Date(newEndTime);
      const dayOpen = new Date(newStart);
      dayOpen.setHours(openH, 0, 0, 0);
      const dayClose = new Date(newStart);
      dayClose.setHours(closeH, 0, 0, 0);

      if (newStart < dayOpen || newEnd > dayClose) {
        return res.status(400).json({
          message: `Termin mora biti unutar radnog vremena (${facility.workingHours.open} - ${facility.workingHours.close})`,
        });
      }

      training.startTime = newStart;
      training.endTime = newEnd;
      await training.save();
      res.json(training);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;
