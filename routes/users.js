// authRoutes.js
const express = require("express");
const router = express.Router();
const twilio = require("twilio");
const pool = require("../db"); // your PostgreSQL connection
const bcrypt = require("bcrypt");

// -------------------------------------
// Twilio Setup
// -------------------------------------
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
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
  from: process.env.TWILIO_PHONE_NUMBER,
  to: phone.startsWith("+") ? phone : `+91${phone}`,
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
    latitude, longitude,
    password
  } = req.body;

  if (!password) {
    return res.status(400).json({ success: false, error: "Password is required" });
  }

  try {
    // Check if user already exists
    const existing = await pool.query(
      "SELECT * FROM users WHERE phone=$1 OR email=$2",
      [phone, email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: "User already exists"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const result = await pool.query(
      `INSERT INTO users
      (name, email, phone, address, pincode, role, latitude, longitude, password, is_verified)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)
      RETURNING *`,
      [
        name,
        email,
        phone,
        address,
        pincode,
        role,
        latitude,
        longitude,
        hashedPassword
      ]
    );

    res.json({
      success: true,
      message: "User registered successfully",
      user: result.rows[0]
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: "Registration failed" });
  }
});

// -------------------------------------
// LOGIN ROUTE (Phone + Password)
// -------------------------------------
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: "Email and password are required",
    });
  }

  try {
    // Check user in DB
    const userCheck = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (userCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: "User not found",
      });
    }

    const user = userCheck.rows[0];

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(400).json({
        success: false,
        error: "Incorrect password",
      });
    }

    // Successful login
    return res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        is_premium: user.is_premium, // ✅ ADD THIS

      },
    });
  } catch (err) {
    console.log("Login Error:", err);
    res.status(500).json({
      success: false,
      error: "Login failed",
    });
  }
});
router.post("/become-premium", async (req, res) => {
  try {
    const { userId } = req.body;

    await pool.query(
      "UPDATE users SET is_premium = true WHERE id = $1",
      [userId]
    );

    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/all", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users ORDER BY id DESC");
    res.json({ success: true, users: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch users" });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE id=$1", [req.params.id]);

    if (result.rows.length === 0)
      return res.status(404).json({ success: false, error: "User not found" });

    res.json({ success: true, user: result.rows[0] });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// ******************************************************************
// UPDATE USER
// ******************************************************************
router.put("/:id", async (req, res) => {
  const {
    name, email, phone, address,
    pincode, role, latitude, longitude
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users SET
        name=$1, email=$2, phone=$3, address=$4,
        pincode=$5, role=$6, latitude=$7, longitude=$8
       WHERE id=$9 RETURNING *`,
      [
        name, email, phone, address, pincode,
        role, latitude, longitude, req.params.id
      ]
    );

    res.json({ success: true, user: result.rows[0] });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Update failed" });
  }
});

// ******************************************************************
// DELETE USER
// ******************************************************************
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id=$1", [req.params.id]);
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// ******************************************************************
// GET PREMIUM USERS
// ******************************************************************
router.get("/list/premium", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE is_premium=true");
    res.json({ success: true, users: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch premium users" });
  }
});

// ******************************************************************
// GET NON-PREMIUM USERS
// ******************************************************************
router.get("/list/nonpremium", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE is_premium=false");
    res.json({ success: true, users: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch non-premium users" });
  }
});

// ******************************************************************
// LIST DRIVERS
// ******************************************************************
router.get("/list/drivers", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE role='driver'");
    res.json({ success: true, drivers: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
});

// ******************************************************************
// LIST CUSTOMERS
// ******************************************************************
router.get("/list/customers", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE role='customer'");
    res.json({ success: true, customers: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});
module.exports = router;
