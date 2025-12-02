// authRoutes.js
const express = require("express");
const router = express.Router();
const twilio = require("twilio");
const pool = require("../db"); // your PostgreSQL connection

// -------------------------------------
// Twilio Setup
// -------------------------------------
const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH
);

// In-memory OTP store (no DB)
const otpStore = new Map();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// -------------------------------------
// SEND OTP
// -------------------------------------
router.post("/send-otp", async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ success: false, error: "Phone number required" });
  }

  try {
    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(phone, { otp, expiresAt });

    await client.messages.create({
      from: process.env.TWILIO_PHONE,
      to: phone,
      body: `Your OTP is: ${otp}`
    });

    res.json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: "OTP sending failed" });
  }
});

// -------------------------------------
// VERIFY OTP + CHECK IF USER EXISTS
// -------------------------------------
router.post("/verify-otp", async (req, res) => {
  const { phone, otp } = req.body;

  const stored = otpStore.get(phone);
  if (!stored)
    return res.status(400).json({ success: false, error: "OTP expired or not found" });

  if (Date.now() > stored.expiresAt)
    return res.status(400).json({ success: false, error: "OTP expired" });

  if (stored.otp !== otp)
    return res.status(400).json({ success: false, error: "Invalid OTP" });

  // OTP success → remove from store
  otpStore.delete(phone);

  // Check if user already exists
  const user = await pool.query("SELECT * FROM users WHERE phone=$1", [phone]);

  if (user.rows.length > 0) {
    return res.json({ success: true, user: user.rows[0], newUser: false });
  }

  return res.json({ success: true, newUser: true });
});

// -------------------------------------
// COMPLETE SIGNUP (after OTP verified)
// -------------------------------------
router.post("/register", async (req, res) => {
  const {
    name, email, phone,
    address, pincode, role,
    latitude, longitude
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO users
      (name, email, phone, address, pincode, role, latitude, longitude, is_verified)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true)
      RETURNING *`,
      [name, email, phone, address, pincode, role, latitude, longitude]
    );

    res.json({
      success: true,
      message: "User registered successfully",
      user: result.rows[0]
    });

  } catch (err) {
    console.log(err);
    res.status(400).json({ success: false, error: "Registration failed" });
  }
});

module.exports = router;
