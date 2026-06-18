const mongoose = require("mongoose");

const courtSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["outdoor", "indoor", "hall"], required: true },
  capacity: { type: Number, required: true, min: 1 },
  sports: [{ type: mongoose.Schema.Types.ObjectId, ref: "Sport" }],
  equipment: { type: String, maxlength: 300 },
  isActive: { type: Boolean, default: true },
});

const facilitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String, required: true },
  address: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  courts: [courtSchema],
  sports: [{ type: mongoose.Schema.Types.ObjectId, ref: "Sport" }],
  pricePerHour: { type: Number, required: true },
  workingHours: {
    open: { type: String, default: "08:00" },
    close: { type: String, default: "22:00" },
  },
  maxNoShows: { type: Number, default: 3 },
  images: [String],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  status: {
    type: String,
    enum: ["pending", "active", "inactive"],
    default: "pending",
  },
  description: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Facility", facilitySchema);
