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

  // Remove user existence check completely
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
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user without checking for existing ones
    const result = await pool.query(
      `INSERT INTO users
      (name, email, phone, address, pincode, role, latitude, longitude, password)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
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
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({
      success: false,
      error: "Phone and password are required",
    });
  }

  try {
    // Fetch all users with this phone (could be multiple)
    const users = await pool.query(
      "SELECT * FROM users WHERE TRIM(phone) = TRIM($1)",
      [phone]
    );

    // Attempt to match password with any of the users
    let authenticatedUser = null;
    for (const user of users.rows) {
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        authenticatedUser = user;
        break;
      }
    }

    if (!authenticatedUser) {
      return res.status(400).json({
        success: false,
        error: "Incorrect phone or password",
      });
    }

    return res.json({
      success: true,
      message: "Login successful",
      user: {
        id: authenticatedUser.id,
        name: authenticatedUser.name,
        email: authenticatedUser.email,
        phone: authenticatedUser.phone,
        role: authenticatedUser.role,
        is_premium: authenticatedUser.is_premium,
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

// POST /users/request-premium
router.post("/request-premium", async (req, res) => {
  try {
    const { userId } = req.body;

    // Mark premium request as pending
    await pool.query(
      "UPDATE users SET premium_requested = true WHERE id = $1",
      [userId]
    );

    res.json({ success: true, message: "Premium request sent" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});
// POST /admin/approve-premium
router.post("/approve-premium", async (req, res) => {
  try {
    const { userId } = req.body;

    // Approve premium and remove request flag
    await pool.query(
      "UPDATE users SET is_premium = true, premium_requested = false WHERE id = $1",
      [userId]
    );

    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/get-premium-status/:id", async (req, res) => {
  const userId = req.params.id;
  const result = await pool.query("SELECT is_premium, premium_requested FROM users WHERE id=$1", [userId]);
  res.json(result.rows[0]);
});

// GET /admin/pending-premiums
router.get("/pending-premiums", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE premium_requested = true"
    );
    res.json({ users: result.rows });
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
router.get("/get-premium-status/:userId", async (req, res) => {
  const { userId } = req.params;

  const result = await pool.query(
    "SELECT is_premium FROM users WHERE id = $1",
    [userId]
  );

  res.json({ is_premium: result.rows[0].is_premium });
});
router.post("/assign-driver", async (req, res) => {
  const { customerId, driverId } = req.body;

  if (!customerId || !driverId) {
    return res.status(400).json({ success: false, message: "customerId and driverId are required" });
  }

  try {
    // Check customer
const { rows: customerRows } = await pool.query(
  "SELECT * FROM users WHERE id = $1 AND role = 'customer'",
  [customerId]
);

// Check driver
const { rows: driverRows } = await pool.query(
  "SELECT * FROM users WHERE id = $1 AND role = 'driver'",
  [driverId]
);




    if (customerRows.length === 0) return res.status(400).json({ success: false, message: "Invalid customer ID" });
    if (driverRows.length === 0) return res.status(400).json({ success: false, message: "Invalid driver ID" });

    // Assign driver directly to customer
    // Assign driver
await pool.query(
  "UPDATE users SET assigned_driver_id = $1 WHERE id = $2",
  [driverId, customerId]
);

    return res.json({
      success: true,
      message: `Driver ${driverRows[0].name} assigned to customer ${customerRows[0].name}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /customers-with-drivers
router.get("/AssignedCustomers/:driverId", async (req, res) => {
  const driverId = req.params.driverId;

  if (!driverId) {
    return res.status(400).json({ success: false, message: "driverId is required" });
  }

  try {
    // Fetch only customers assigned to this driver
    const customerQuery = `
      SELECT 
        id,
        name,
        email,
        phone,
        address,
        pincode,
        latitude,
        longitude,
        created_at,
        is_verified,
        is_premium,
        premium_requested
      FROM users
      WHERE role = 'customer' AND assigned_driver_id = $1
    `;
    const customerResult = await pool.query(customerQuery, [driverId]);

    res.json({
      success: true,
      customers: customerResult.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/deliveries/mark-delivered", async (req, res) => {
  const { customer_id, driver_id, cans_delivered, notes } = req.body;

  try {
    const result = await pool.query(
      `
      INSERT INTO deliveries
        (customer_id, driver_id, cans_delivered, notes, status)
      VALUES ($1, $2, $3, $4, 'delivered')
      ON CONFLICT (customer_id, delivery_date)
      DO UPDATE SET
        cans_delivered = EXCLUDED.cans_delivered,
        notes = EXCLUDED.notes,
        status = 'delivered'
      RETURNING *;
      `,
      [customer_id, driver_id, cans_delivered, notes]
    );

    res.json({ success: true, delivery: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});



module.exports = router;