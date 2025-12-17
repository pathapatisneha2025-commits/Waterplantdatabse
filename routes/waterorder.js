const express = require("express");
const router = express.Router();
const pool = require("../db");

/* ----------------------------------------------------
    PLACE WATER ORDER (cans + slot)
---------------------------------------------------- */
router.post("/place-order", async (req, res) => {
  try {
    const { user_id, cans, slot, isPremium } = req.body;

    if (!user_id || !cans || !slot) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const insertOrder = await pool.query(
      `INSERT INTO water_orders (user_id, cans, slot, is_premium)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user_id, cans, slot, isPremium]
    );

    res.json({
      success: true,
      message: "Water order placed successfully",
      order: insertOrder.rows[0],
    });
  } catch (error) {
    console.error("Place water order error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/* ----------------------------------------------------
    GET ALL WATER ORDERS
---------------------------------------------------- */
router.get("/all", async (req, res) => {
  try {
    const orders = await pool.query(
      `SELECT * FROM water_orders ORDER BY created_at DESC`
    );

    res.json(orders.rows);
  } catch (error) {
    console.error("Get all water orders error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/* ----------------------------------------------------
    GET WATER ORDER BY ID
---------------------------------------------------- */
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const order = await pool.query(
      `SELECT * FROM water_orders WHERE id = $1`,
      [id]
    );

    if (order.rowCount === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order.rows[0]);
  } catch (error) {
    console.error("Get water order error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/* ----------------------------------------------------
    GET WATER ORDERS BY USER
---------------------------------------------------- */
router.get("/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const orders = await pool.query(
      `SELECT * FROM water_orders WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    res.json(orders.rows);
  } catch (error) {
    console.error("Get water orders by user error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/* ----------------------------------------------------
    UPDATE WATER ORDER STATUS
---------------------------------------------------- */
router.put("/status/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const update = await pool.query(
      `UPDATE water_orders SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (update.rowCount === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      message: "Status updated",
      order: update.rows[0],
    });
  } catch (error) {
    console.error("Water order status update error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/* ----------------------------------------------------
    DELETE WATER ORDER
---------------------------------------------------- */
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const del = await pool.query(
      `DELETE FROM water_orders WHERE id = $1 RETURNING *`,
      [id]
    );

    if (del.rowCount === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Water order deleted successfully" });
  } catch (error) {
    console.error("Delete water order error:", error);
    res.status(500).json({ error: "Server error" });
  }
});
router.get("/history/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const query = `
      SELECT *,
        created_at::date = CURRENT_DATE AS is_today,
        created_at >= NOW() - INTERVAL '7 days' AS is_week,
        created_at >= NOW() - INTERVAL '30 days' AS is_month
      FROM water_orders
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    const rows = result.rows;

    res.json({
      daily: rows.filter(r => r.is_today),
      weekly: rows.filter(r => r.is_week),
      monthly: rows.filter(r => r.is_month),
    });

  } catch (err) {
    console.error("History API error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
router.post("/assign-driver", async (req, res) => {
  const { orderId, driverId } = req.body;

  if (!orderId || !driverId) {
    return res.status(400).json({ success: false, message: "orderId and driverId are required" });
  }

  try {
    // Check order
    const { rows: orderRows } = await pool.query(
      "SELECT * FROM water_orders WHERE id = $1",
      [orderId]
    );

    if (orderRows.length === 0) return res.status(400).json({ success: false, message: "Invalid order ID" });

    // Check driver
    const { rows: driverRows } = await pool.query(
      "SELECT * FROM users WHERE id = $1 AND role = 'driver'",
      [driverId]
    );

    if (driverRows.length === 0) return res.status(400).json({ success: false, message: "Invalid driver ID" });

    // Assign driver to order
    await pool.query(
      "UPDATE water_orders SET driver_id = $1 WHERE id = $2",
      [driverId, orderId]
    );

    return res.json({
      success: true,
      message: `Driver ${driverRows[0].name} assigned to order #${orderRows[0].id}`,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


module.exports = router;
