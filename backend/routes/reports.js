const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Reservation = require('../models/Reservation');
const Facility = require('../models/Facility');
const { Order } = require('../models/index');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/reports/occupancy/:facilityId?month=YYYY-MM
router.get('/occupancy/:facilityId', auth, requireRole('employee'), async (req, res) => {
  try {
    const { month } = req.query; // e.g. "2025-06"
    const [year, mon] = month.split('-').map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 1);

    const facility = await Facility.findOne({ _id: req.params.facilityId, owner: req.user._id });
    if (!facility) return res.status(403).json({ message: 'Not your facility' });

    const reservations = await Reservation.find({
      facility: req.params.facilityId,
      startTime: { $gte: start, $lt: end },
      status: { $in: ['confirmed', 'pending'] }
    });

    // Calculate occupancy per court
    const workingHoursPerDay = parseInt(facility.workingHours.close) - parseInt(facility.workingHours.open);
    const daysInMonth = new Date(year, mon, 0).getDate();
    const totalHoursPerCourt = workingHoursPerDay * daysInMonth;

    const courtStats = {};
    facility.courts.forEach(court => {
      courtStats[court.name] = { total: totalHoursPerCourt, used: 0 };
    });

    reservations.forEach(r => {
      const hours = (r.endTime - r.startTime) / (1000 * 60 * 60);
      if (courtStats[r.courtName]) courtStats[r.courtName].used += hours;
    });

    // Generate PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="occupancy-${month}.pdf"`);

    const doc = new PDFDocument();
    doc.pipe(res);

    doc.fontSize(18).text(`Occupancy Report - ${facility.name}`, { align: 'center' });
    doc.fontSize(12).text(`Month: ${month}`, { align: 'center' });
    doc.moveDown();

    Object.entries(courtStats).forEach(([name, stats]) => {
      const pct = ((stats.used / stats.total) * 100).toFixed(1);
      doc.text(`${name}: ${stats.used}h / ${stats.total}h (${pct}%)`);
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/reports/equipment/:facilityId?month=YYYY-MM
router.get('/equipment/:facilityId', auth, requireRole('employee'), async (req, res) => {
  try {
    const { month } = req.query;
    const [year, mon] = month.split('-').map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 1);

    const orders = await Order.find({
      createdAt: { $gte: start, $lt: end },
      status: { $in: ['accepted', 'picked_up'] }
    }).populate('user', 'firstName lastName');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="equipment-${month}.pdf"`);

    const doc = new PDFDocument();
    doc.pipe(res);

    doc.fontSize(18).text(`Equipment Sales Report - ${month}`, { align: 'center' });
    doc.moveDown();

    let total = 0;
    orders.forEach(order => {
      doc.text(`Order #${order._id} - ${order.user.firstName} ${order.user.lastName} - ${order.totalPrice} RSD`);
      total += order.totalPrice;
    });

    doc.moveDown();
    doc.fontSize(14).text(`Total revenue: ${total} RSD`);
    doc.end();
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
