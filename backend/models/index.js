const mongoose = require("mongoose");

// Sport
const sportSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
});
const Sport = mongoose.model("Sport", sportSchema);

// Equipment
const equipmentSchema = new mongoose.Schema({
  facility: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Facility",
    required: true,
  },
  sport: { type: mongoose.Schema.Types.ObjectId, ref: "Sport" },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
  image: String,
});
const Equipment = mongoose.model("Equipment", equipmentSchema);

// Order
const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      equipment: { type: mongoose.Schema.Types.ObjectId, ref: "Equipment" },
      name: String,
      price: Number,
      quantity: { type: Number, default: 1 },
    },
  ],
  totalPrice: Number,
  status: {
    type: String,
    enum: ["ordered", "accepted", "picked_up", "cancelled"],
    default: "ordered",
  },
  createdAt: { type: Date, default: Date.now },
});
const Order = mongoose.model("Order", orderSchema);

// Ad (saaigrači)
const adSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sport: { type: mongoose.Schema.Types.ObjectId, ref: "Sport" },
  city: String,
  date: Date,
  timeSlot: String,
  playersNeeded: { type: Number, required: true },
  requests: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
    },
  ],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});
const Ad = mongoose.model("Ad", adSchema);

// Trainer
const trainerSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  facility: { type: mongoose.Schema.Types.ObjectId, ref: "Facility" },
  sport: { type: mongoose.Schema.Types.ObjectId, ref: "Sport" },
  specialization: String,
  pricePerHour: Number,
  isActive: { type: Boolean, default: true },
  ratings: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      score: Number,
    },
  ],
});
const Trainer = mongoose.model("Trainer", trainerSchema);

// Training session
const trainingSchema = new mongoose.Schema({
  athlete: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  trainer: { type: mongoose.Schema.Types.ObjectId, ref: "Trainer" },
  facility: { type: mongoose.Schema.Types.ObjectId, ref: "Facility" },
  court: { type: mongoose.Schema.Types.ObjectId },
  courtName: String,
  startTime: Date,
  endTime: Date,
  status: {
    type: String,
    enum: ["scheduled", "completed", "cancelled"],
    default: "scheduled",
  },
  createdAt: { type: Date, default: Date.now },
});
const Training = mongoose.model("Training", trainingSchema);

// Promotion
const promotionSchema = new mongoose.Schema({
  facility: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Facility",
    required: true,
  },
  name: { type: String, required: true },
  sport: { type: mongoose.Schema.Types.ObjectId, ref: "Sport" },
  discountType: { type: String, enum: ["percent", "fixed"] },
  discountValue: Number,
  startDate: Date,
  endDate: Date,
  isActive: { type: Boolean, default: true },
});
const Promotion = mongoose.model("Promotion", promotionSchema);

// Comment/Rating
const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  facility: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Facility",
    required: true,
  },
  text: {
    type: String,
    maxlength: 500,
  },
  reaction: { type: String, enum: ["like", "dislike"] },
  createdAt: { type: Date, default: Date.now },
});
const Comment = mongoose.model("Comment", commentSchema);

module.exports = {
  Sport,
  Equipment,
  Order,
  Ad,
  Trainer,
  Training,
  Promotion,
  Comment,
};
