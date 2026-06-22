const express = require("express");
const router = express.Router();
const Reservation = require("../models/Reservation");
const Facility = require("../models/Facility");
const { auth, requireRole } = require("../middleware/auth");

// GET /api/reservations/my - athlete's reservations
router.get("/my", auth, requireRole("athlete"), async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.user._id })
      .populate("facility", "name city")
      .populate("sport", "name")
      .sort({ startTime: -1 });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/reservations/facility/:facilityId - employee sees all
router.get(
  "/facility/:facilityId",
  auth,
  requireRole("employee"),
  async (req, res) => {
    try {
      const facility = await Facility.findOne({
        _id: req.params.facilityId,
        owner: req.user._id,
      });
      if (!facility)
        return res.status(403).json({ message: "Not your facility" });

      // ooznaci kao no-show rezervacije kojima je isteklo 10 minuta od pocetka, a nisu potvrdjene
      const cutoff = new Date(Date.now() - 10 * 60 * 1000);
      await Reservation.updateMany(
        {
          facility: req.params.facilityId,
          status: "pending",
          startTime: { $lt: cutoff },
        },
        { $set: { status: "no-show" } }
      );

      const reservations = await Reservation.find({
        facility: req.params.facilityId,
      })
        .populate("user", "firstName lastName phone")
        .populate("sport", "name")
        .sort({ startTime: 1 });
      res.json(reservations);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// GET /api/reservations/calendar/:facilityId/:courtId - get reservations for calendar
router.get("/calendar/:facilityId/:courtId", async (req, res) => {
  try {
    const { start, end } = req.query;
    const filter = {
      facility: req.params.facilityId,
      court: req.params.courtId,
      status: { $nin: ["cancelled"] },
    };
    if (start) filter.startTime = { $gte: new Date(start) };
    if (end) filter.endTime = { ...filter.endTime, $lte: new Date(end) };

    const reservations = await Reservation.find(filter)
      .populate("user", "firstName lastName")
      .populate("sport", "name");
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/reservations - create reservation
router.post("/", auth, requireRole("athlete"), async (req, res) => {
  try {
    const { facilityId, courtId, courtName, sportId, startTime, endTime } =
      req.body;

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Must start on the hour
    if (start.getMinutes() !== 0 || start.getSeconds() !== 0) {
      return res
        .status(400)
        .json({ message: "Reservations must start on the hour" });
    }

    // Min 1 hour
    const diffHours = (end - start) / (1000 * 60 * 60);
    if (diffHours < 1)
      return res.status(400).json({ message: "Minimum 1 hour reservation" });

    // Check for conflicts
    const conflict = await Reservation.findOne({
      facility: facilityId,
      court: courtId,
      status: { $nin: ["cancelled"] },
      $or: [{ startTime: { $lt: end }, endTime: { $gt: start } }],
    });
    if (conflict)
      return res.status(409).json({ message: "Time slot already taken" });

    // Check if user is blocked in this facility
    const facility = await Facility.findById(facilityId);
    if (!facility)
      return res.status(404).json({ message: "Facility not found" });

    const noShows = await Reservation.countDocuments({
      user: req.user._id,
      facility: facilityId,
      status: "no-show",
    });
    if (noShows >= facility.maxNoShows) {
      return res.status(403).json({
        message:
          "Ne mozes da rezervises termin zbog predjasnjih nepojavljivanja",
      });
    }

    const reservation = new Reservation({
      user: req.user._id,
      facility: facilityId,
      court: courtId,
      courtName,
      sport: sportId,
      startTime: start,
      endTime: end,
    });
    await reservation.save();
    res.status(201).json(reservation);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PATCH /api/reservations/:id/cancel - athlete cancels
router.patch("/:id/cancel", auth, requireRole("athlete"), async (req, res) => {
  try {
    const reservation = await Reservation.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!reservation)
      return res.status(404).json({ message: "Reservation not found" });
    if (reservation.status === "cancelled")
      return res.status(400).json({ message: "Already cancelled" });

    const hoursUntilStart =
      (reservation.startTime - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilStart < 12) {
      return res
        .status(400)
        .json({ message: "Cannot cancel less than 12 hours before start" });
    }

    reservation.status = "cancelled";
    await reservation.save();
    res.json({ message: "Reservation cancelled" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/reservations/:id/confirm - employee confirms (user showed up)
router.patch(
  "/:id/confirm",
  auth,
  requireRole("employee"),
  async (req, res) => {
    try {
      const reservation = await Reservation.findById(req.params.id).populate(
        "facility"
      );
      if (!reservation) return res.status(404).json({ message: "Not found" });
      if (String(reservation.facility.owner) !== String(req.user._id))
        return res.status(403).json({ message: "Not your facility" });

      const minutesSinceStart =
        (Date.now() - reservation.startTime) / (1000 * 60);
      if (minutesSinceStart > 10)
        return res
          .status(400)
          .json({ message: "Confirmation window passed (10 min)" });

      reservation.status = "confirmed";
      await reservation.save();
      res.json({ message: "Confirmed" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// PATCH /api/reservations/:id/no-show - employee marks no-show
router.patch(
  "/:id/no-show",
  auth,
  requireRole("employee"),
  async (req, res) => {
    try {
      const reservation = await Reservation.findById(req.params.id).populate(
        "facility"
      );
      if (!reservation) return res.status(404).json({ message: "Not found" });
      if (String(reservation.facility.owner) !== String(req.user._id))
        return res.status(403).json({ message: "Not your facility" });

      reservation.status = "no-show";
      await reservation.save();
      res.json({ message: "Marked as no-show" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// PATCH /api/reservations/:id/move - drag-and-drop (employee)
router.patch("/:id/move", auth, requireRole("employee"), async (req, res) => {
  try {
    const { newStartTime, newEndTime } = req.body;
    const reservation = await Reservation.findById(req.params.id).populate(
      "facility"
    );
    if (!reservation) return res.status(404).json({ message: "Not found" });
    if (String(reservation.facility.owner) !== String(req.user._id))
      return res.status(403).json({ message: "Not your facility" });

    const newStart = new Date(newStartTime);
    const newEnd = new Date(newEndTime);

    // Provera radnog vremena objekta
    const facility = reservation.facility;
    const [openH, openM] = facility.workingHours.open.split(":").map(Number);
    const [closeH, closeM] = facility.workingHours.close.split(":").map(Number);

    const dayOpen = new Date(newStart);
    dayOpen.setHours(openH, openM, 0, 0);
    const dayClose = new Date(newStart);
    dayClose.setHours(closeH, closeM, 0, 0);

    if (newStart < dayOpen || newEnd > dayClose) {
      return res.status(400).json({
        message: `Termin mora biti unutar radnog vremena objekta (${facility.workingHours.open} - ${facility.workingHours.close})`,
      });
    }

    // Check for conflicts at new time
    const conflict = await Reservation.findOne({
      _id: { $ne: reservation._id },
      facility: reservation.facility._id,
      court: reservation.court,
      status: { $nin: ["cancelled"] },
      $or: [{ startTime: { $lt: newEnd }, endTime: { $gt: newStart } }],
    });
    if (conflict)
      return res
        .status(409)
        .json({ message: "Konflikt sa drugim terminom u to vreme" });

    reservation.startTime = newStart;
    reservation.endTime = newEnd;
    await reservation.save();
    res.json(reservation);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
