const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  profileImage: { type: String, default: "default-avatar.png" },
  role: {
    type: String,
    enum: ["athlete", "employee", "admin"],
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "active", "blocked", "rejected"],
    default: "pending",
  },
  favoriteSports: [{ type: mongoose.Schema.Types.ObjectId, ref: "Sport" }],

  facilityPenalties: [
    {
      facility: { type: mongoose.Schema.Types.ObjectId, ref: "Facility" },
      noShows: { type: Number, default: 0 },
      blocked: { type: Boolean, default: false },
    },
  ],

  // Employee-specific
  facilityName: String,
  facilityAddress: String,
  registrationNumber: {
    // matični broj - 8 cifara, jedinstven
    type: String,
    validate: { validator: (v) => !v || /^\d{8}$/.test(v) },
  },
  pib: {
    // 9 cifara, ne počinje nulom
    type: String,
    validate: { validator: (v) => !v || /^[1-9]\d{8}$/.test(v) },
  },

  // Password reset
  resetToken: String,
  resetTokenExpiry: Date,

  createdAt: { type: Date, default: Date.now },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
