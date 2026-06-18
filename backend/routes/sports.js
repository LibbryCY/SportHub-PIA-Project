// sports.js
const express = require('express');
const router = express.Router();
const { Sport } = require('../models/index');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', async (req, res) => {
  const sports = await Sport.find({ isActive: true });
  res.json(sports);
});

router.post('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const sport = new Sport({ name: req.body.name });
    await sport.save();
    res.status(201).json(sport);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch('/:id/deactivate', auth, requireRole('admin'), async (req, res) => {
  const sport = await Sport.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  res.json(sport);
});

module.exports = router;
