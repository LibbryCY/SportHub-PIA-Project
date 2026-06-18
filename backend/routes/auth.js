const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const User = require("../models/User");

// Multer setup for profile images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/profiles");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(
        file.originalname
      )}`
    );
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/image\/(jpeg|jpg|png|gif|webp|svg\+xml)/.test(file.mimetype))
      cb(null, true);
    else cb(null, false); // nastavi bez slikee
  },
});

// POST /api/auth/register
router.post("/register", upload.single("profileImage"), async (req, res) => {
  try {
    const {
      username,
      password,
      firstName,
      lastName,
      phone,
      email,
      role,
      favoriteSports,
      facilityName,
      facilityAddress,
      registrationNumber,
      pib,
    } = req.body;

    // Password regex: 8-12 chars, 1 uppercase, 1 number, 1 special, starts with letter
    const pwRegex =
      /^(?=[A-Za-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,12}$/;
    if (!pwRegex.test(password)) {
      return res.status(400).json({ message: "Invalid password format" });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser)
      return res
        .status(400)
        .json({ message: "Username or email already exists" });

    // Employee-specific validations
    if (role === "employee") {
      if (!registrationNumber || !/^\d{8}$/.test(registrationNumber))
        return res
          .status(400)
          .json({ message: "Registration number must be exactly 8 digits" });
      if (!pib || !/^[1-9]\d{8}$/.test(pib))
        return res.status(400).json({
          message: "PIB must be exactly 9 digits and not start with 0",
        });

      const existingReg = await User.findOne({ registrationNumber });
      if (existingReg)
        return res
          .status(400)
          .json({ message: "Registration number already exists" });

      // Check max 2 employees per facility
      const sameCompany = await User.countDocuments({
        pib,
        role: "employee",
        status: { $ne: "rejected" },
      });
      if (sameCompany >= 2)
        return res
          .status(400)
          .json({ message: "Maximum 2 employees per facility" });
    }

    const userData = {
      username,
      password,
      firstName,
      lastName,
      phone,
      email,
      role,
      status: "pending",
      favoriteSports: favoriteSports ? JSON.parse(favoriteSports) : [],
    };

    if (req.file) userData.profileImage = req.file.filename;
    if (role === "employee")
      Object.assign(userData, {
        facilityName,
        facilityAddress,
        registrationNumber,
        pib,
      });

    const user = new User(userData);
    await user.save();

    res.status(201).json({
      message: "Registration request submitted. Awaiting admin approval.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("Login attempt:", username, password);
    const user = await User.findOne({ username }).populate("favoriteSports");
    if (!user) return res.status(409).json({ message: "Invalid credentials" });
    console.log("User status:", user.password, password);

    if (user.status === "pending")
      return res.status(403).json({ message: "Account pending approval" });
    if (user.status === "rejected")
      return res.status(403).json({ message: "Account rejected" });
    if (user.status === "blocked")
      return res.status(403).json({ message: "Account blocked" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );

    const userObj = user.toObject();
    delete userObj.password;
    res.json({ token, user: userObj });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/admin-login  (hidden route)
router.post("/admin-login", async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("Admin login attempt:", username);
    console.log("User password:", password);

    const user = await User.findOne({ username, role: "admin" });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );

    const userObj = user.toObject();
    delete userObj.password;
    res.json({ token, user: userObj });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { usernameOrEmail } = req.body;
    const user = await User.findOne({
      $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 min
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    // TODO: send email with resetLink (configure nodemailer)
    console.log("Reset link:", resetLink);

    res.json({ message: "Password reset link sent to your email" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });
    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    const pwRegex =
      /^[A-Za-z](?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{7,11}$/;
    if (!pwRegex.test(newPassword))
      return res.status(400).json({ message: "Invalid password format" });

    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
