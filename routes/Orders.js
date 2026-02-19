const express = require("express");
const router = express.Router();
const pool = require("../db");

/* ------------------ PLACE ORDER ------------------ */
router.post("/place", async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      user_id,
      customer_name,
      mobile,
      address,
      landmark,
      pincode,
      payment_mode,
      is_premium,
      total_amount,
      items,
    } = req.body;

    if (!user_id || !customer_name || !mobile || !address || !pincode || !items) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    await client.query("BEGIN");

 for (const item of items) {
  const quantity = parseInt(item.qty, 10);

  if (isNaN(quantity) || quantity <= 0) {
    throw new Error(`Invalid quantity for ${item.item_name}`);
  }

  const result = await client.query(
    `UPDATE grocery_items
     SET stock = stock - $1
     WHERE id = $2 AND stock >= $1
     RETURNING stock`,
    [quantity, item.item_id]
  );

  if (result.rowCount === 0) {
    throw new Error(`Not enough stock for ${item.item_name}`);
  }
}



    // 🔹 2️⃣ INSERT ORDER
    const insertOrder = await client.query(
      `INSERT INTO groceriesorders
        (user_id, customer_name, mobile, address, landmark, pincode,
         payment_mode, total_amount, is_premium, items)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        user_id,
        customer_name,
        mobile,
        address,
        landmark,
        pincode,
        payment_mode,
        total_amount,
        is_premium,
        JSON.stringify(items),
      ]
    );

    // 🔹 3️⃣ CLEAR CART
    await client.query(
      "DELETE FROM user_cart WHERE user_id = $1",
      [user_id]
    );

    await client.query("COMMIT");

    res.json({
      message: "Order placed successfully",
      order: insertOrder.rows[0],
      cartCleared: true,
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Place order error:", error);
    res.status(400).json({ error: error.message || "Server error" });
  } finally {
    client.release();
  }
});



/* ------------------ GET ALL ORDERS ------------------ */
router.get("/all", async (req, res) => {
  try {
    const orders = await pool.query(
      `SELECT * FROM groceriesorders ORDER BY created_at DESC`
    );

    res.json(orders.rows);
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/* ------------------ GET ORDER BY ID ------------------ */
router.get("/:id", async (req, res) => {
  try {
    const orderId = req.params.id;

    const order = await pool.query(
      `SELECT * FROM groceriesorders WHERE id = $1`,
      [orderId]
    );

    if (order.rowCount === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order.rows[0]);
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/* ------------------ GET ORDERS BY USER ID ------------------ */
router.get("/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const orders = await pool.query(
      `SELECT * FROM groceriesorders WHERE user_id = $1`,
      [userId]
    );

    res.json(orders.rows);
  } catch (error) {
    console.error("Get orders by user_id error:", error);
    res.status(500).json({ error: "Server error" });
  }
});



/* ------------------ UPDATE ORDER STATUS ------------------ */
router.put("/status/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const update = await pool.query(
      `UPDATE groceriesorders SET status = $1 WHERE id = $2 RETURNING *`,
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
    console.error("Update status error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/* ------------------ DELETE ORDER ------------------ */
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const del = await pool.query(
      `DELETE FROM groceriesorders WHERE id = $1 RETURNING *`,
      [id]
    );

    if (del.rowCount === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Delete order error:", error);
    res.status(500).json({ error: "Server error" });
  }
});
/* ------------------ ASSIGN DRIVER ------------------ */
router.post("/assign-driver", async (req, res) => {
  const { orderId, driverId } = req.body;

  if (!orderId || !driverId) {
    return res
      .status(400)
      .json({ success: false, message: "orderId and driverId are required" });
  }

  try {
    // Check if order exists
    const { rows: orderRows } = await pool.query(
      "SELECT * FROM groceriesorders WHERE id = $1",
      [orderId]
    );

    if (orderRows.length === 0)
      return res.status(404).json({ success: false, message: "Order not found" });

    // Check if driver exists and has role = driver
    const { rows: driverRows } = await pool.query(
      "SELECT * FROM users WHERE id = $1 AND role = 'driver'",
      [driverId]
    );

    if (driverRows.length === 0)
      return res.status(404).json({ success: false, message: "Driver not found" });

    // Assign driver to order
    const { rows: updatedOrder } = await pool.query(
      `UPDATE groceriesorders 
       SET driver_id = $1, status = 'Assigned' 
       WHERE id = $2 
       RETURNING *`,
      [driverId, orderId]
    );

    res.json({
      success: true,
      message: `Driver ${driverRows[0].name} assigned to order #${orderId}`,
      order: updatedOrder[0],
    });
  } catch (error) {
    console.error("Assign driver error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ------------------ GET ORDERS BY DRIVER ------------------ */
router.get("/driver/:driverId", async (req, res) => {
  try {
    const driverId = req.params.driverId;

    if (!driverId) {
      return res
        .status(400)
        .json({ success: false, message: "Driver ID is required" });
    }

    const { rows: orders } = await pool.query(
      `SELECT * FROM groceriesorders 
       WHERE driver_id = $1
       ORDER BY created_at DESC`,
      [driverId]
    );

    res.json({
      success: true,
      driverId,
      orders,
    });
  } catch (error) {
    console.error("Get orders by driver error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});



module.exports = router;
