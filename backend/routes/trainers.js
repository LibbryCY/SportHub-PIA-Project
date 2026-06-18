const express = require('express');
const router = express.Router();
const { Trainer, Training } = require('../models/index');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', async (req, res) => {
  const { facilityId, sportId } = req.query;
  const filter = { isActive: true };
  if (facilityId) filter.facility = facilityId;
  if (sportId) filter.sport = sportId;
  const trainers = await Trainer.find(filter).populate('sport', 'name').populate('facility', 'name');
  res.json(trainers.map(t => ({
    ...t.toObject(),
    avgRating: t.ratings.length ? (t.ratings.reduce((s, r) => s + r.score, 0) / t.ratings.length).toFixed(1) : null
  })));
});

router.post('/', auth, requireRole('admin'), async (req, res) => {
  const trainer = new Trainer(req.body);
  await trainer.save();
  res.status(201).json(trainer);
});

router.patch('/:id/deactivate', auth, requireRole('admin'), async (req, res) => {
  const trainer = await Trainer.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  res.json(trainer);
});

// Schedule training
router.post('/trainings', auth, requireRole('athlete'), async (req, res) => {
  try {
    const training = new Training({ ...req.body, athlete: req.user._id });
    await training.save();
    res.status(201).json(training);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// My trainings
router.get('/trainings/my', auth, requireRole('athlete'), async (req, res) => {
  const trainings = await Training.find({ athlete: req.user._id })
    .populate('trainer').populate('facility', 'name city').sort({ startTime: -1 });
  res.json(trainings);
});

// Facility trainings (employee)
router.get('/trainings/facility/:facilityId', auth, requireRole('employee'), async (req, res) => {
  const trainings = await Training.find({ facility: req.params.facilityId })
    .populate('athlete', 'firstName lastName').populate('trainer').sort({ startTime: 1 });
  res.json(trainings);
});

module.exports = router;
