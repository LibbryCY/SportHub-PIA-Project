const express = require('express');
const router = express.Router();
const { Ad } = require('../models/index');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', async (req, res) => {
  const ads = await Ad.find({ isActive: true })
    .populate('author', 'firstName lastName')
    .populate('sport', 'name')
    .sort({ createdAt: -1 });
  res.json(ads);
});

router.post('/', auth, requireRole('athlete'), async (req, res) => {
  try {
    const ad = new Ad({ ...req.body, author: req.user._id });
    await ad.save();
    res.status(201).json(ad);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST join request
router.post('/:id/join', auth, requireRole('athlete'), async (req, res) => {
  const ad = await Ad.findById(req.params.id);
  if (!ad || !ad.isActive) return res.status(404).json({ message: 'Ad not found or inactive' });
  if (String(ad.author) === String(req.user._id))
    return res.status(400).json({ message: 'Cannot join your own ad' });

  const alreadyRequested = ad.requests.find(r => String(r.user) === String(req.user._id));
  if (alreadyRequested) return res.status(400).json({ message: 'Already requested' });

  ad.requests.push({ user: req.user._id });
  await ad.save();
  res.json({ message: 'Join request sent' });
});

// PATCH approve/reject request
router.patch('/:id/requests/:userId', auth, requireRole('athlete'), async (req, res) => {
  const ad = await Ad.findOne({ _id: req.params.id, author: req.user._id });
  if (!ad) return res.status(404).json({ message: 'Not found or not your ad' });

  const request = ad.requests.find(r => String(r.user) === req.params.userId);
  if (!request) return res.status(404).json({ message: 'Request not found' });

  request.status = req.body.status; // 'approved' or 'rejected'

  const approvedCount = ad.requests.filter(r => r.status === 'approved').length;
  if (approvedCount >= ad.playersNeeded) ad.isActive = false;

  await ad.save();
  res.json(ad);
});

// PATCH close ad
router.patch('/:id/close', auth, requireRole('athlete'), async (req, res) => {
  const ad = await Ad.findOne({ _id: req.params.id, author: req.user._id });
  if (!ad) return res.status(404).json({ message: 'Not found' });
  ad.isActive = false;
  await ad.save();
  res.json({ message: 'Ad closed' });
});

module.exports = router;
