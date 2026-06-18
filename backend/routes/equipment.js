const express = require('express');
const router = express.Router();
const { Equipment, Order } = require('../models/index');
const { auth, requireRole } = require('../middleware/auth');

// GET catalog
router.get('/', async (req, res) => {
  const { facilityId, sportId } = req.query;
  const filter = {};
  if (facilityId) filter.facility = facilityId;
  if (sportId) filter.sport = sportId;
  const equipment = await Equipment.find(filter).populate('sport', 'name').populate('facility', 'name');
  res.json(equipment);
});

router.post('/', auth, requireRole('employee'), async (req, res) => {
  const eq = new Equipment(req.body);
  await eq.save();
  res.status(201).json(eq);
});

router.put('/:id', auth, requireRole('employee'), async (req, res) => {
  const eq = await Equipment.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(eq);
});

// Orders
router.post('/orders', auth, requireRole('athlete'), async (req, res) => {
  try {
    const { items } = req.body;
    let totalPrice = 0;
    for (const item of items) {
      const eq = await Equipment.findById(item.equipment);
      if (!eq || eq.stock < item.quantity) return res.status(400).json({ message: `Insufficient stock for ${eq?.name}` });
      item.name = eq.name;
      item.price = eq.price;
      totalPrice += eq.price * item.quantity;
      eq.stock -= item.quantity;
      await eq.save();
    }
    const order = new Order({ user: req.user._id, items, totalPrice });
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/orders/my', auth, requireRole('athlete'), async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

router.patch('/orders/:id/cancel', auth, requireRole('athlete'), async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return res.status(404).json({ message: 'Not found' });
  if (order.status !== 'ordered') return res.status(400).json({ message: 'Cannot cancel' });
  order.status = 'cancelled';
  await order.save();
  res.json(order);
});

router.get('/orders/facility', auth, requireRole('employee'), async (req, res) => {
  // orders for equipment from employee's facilities
  const orders = await Order.find().populate('user', 'firstName lastName').sort({ createdAt: -1 });
  res.json(orders);
});

router.patch('/orders/:id/status', auth, requireRole('employee'), async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  res.json(order);
});

module.exports = router;
