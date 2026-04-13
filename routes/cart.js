const express = require("express");
const router = express.Router();
const pool = require("../db");

/* ------------------ ADD TO CART ------------------ */
router.post("/add", async (req, res) => {
  const client = await pool.connect();

  try {
    const { userId, item } = req.body;

    if (!userId || !item) {
      return res.status(400).json({ message: "Missing userId or item" });
    }

    const qty = item.quantity || 1;

    await client.query("BEGIN");

    // ✅ FORCE TYPE SAFETY
    const isWater = item.type === "water";
    const itemType = isWater ? "water" : "grocery";

    // =========================
    // 💧 WATER FLOW
    // =========================
    if (isWater) {
      const insert = await client.query(
        `INSERT INTO user_cart 
         (user_id, item_id, name, img, price, premium_price, qty, item_type, slot)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING *`,
        [
          userId,
          null,
          item.name,
          item.img || "water.png",
          item.price,
          item.premiumPrice,
          qty,
          "water",
          item.slot || null,
        ]
      );

      // ✅ SET FLAG: FIRST WATER BOOKING
      await client.query(
        `UPDATE users 
         SET has_booked_water_cans = TRUE
         WHERE id = $1 AND has_booked_water_cans = FALSE`,
        [userId]
      );

      await client.query("COMMIT");

      return res.json({
        message: "Water can added to cart",
        cartItem: insert.rows[0],
      });
    }

    // =========================
    // 🛒 GROCERY FLOW
    // =========================

    const stockCheck = await client.query(
      `SELECT stock 
       FROM grocery_items 
       WHERE id = $1 
       FOR UPDATE`,
      [item.id]
    );

    if (stockCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Grocery item not found" });
    }

    const currentStock = stockCheck.rows[0].stock;

    if (currentStock < qty) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Insufficient stock" });
    }

    // Reduce stock
    await client.query(
      `UPDATE grocery_items
       SET stock = stock - $1
       WHERE id = $2`,
      [qty, item.id]
    );

    // Insert grocery cart item
    const insert = await client.query(
      `INSERT INTO user_cart 
       (user_id, item_id, name, img, price, premium_price, qty, item_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        userId,
        item.id,
        item.name,
        item.img,
        item.price,
        item.premiumPrice,
        qty,
        "grocery",
      ]
    );

    await client.query("COMMIT");

    return res.json({
      message: "Grocery item added to cart and stock reduced",
      cartItem: insert.rows[0],
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Cart Add Error:", error);

    return res.status(500).json({
      message: "Server error",
    });

  } finally {
    client.release();
  }
});

/* ------------------ GET CART ------------------ */
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await pool.query(
      "SELECT * FROM user_cart WHERE user_id=$1 ORDER BY id DESC",
      [userId]
    );

    res.json(cart.rows);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

/* ------------------ UPDATE QTY ------------------ */
router.put("/update/:itemId", async (req, res) => {
  try {
    const { itemId } = req.params;
    const { userId, qty } = req.body;

    if (!userId || !itemId || !qty) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (qty <= 0) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const update = await pool.query(
      "UPDATE user_cart SET qty=$1 WHERE user_id=$2 AND item_id=$3 RETURNING *",
      [qty, userId, itemId]
    );

    res.json({
      message: "Quantity updated",
      updatedItem: update.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

/* ------------------ DELETE ITEM ------------------ */
router.delete("/delete/:itemId/:userId", async (req, res) => {
  try {
    const { itemId, userId } = req.params;

    await pool.query(
      "DELETE FROM user_cart WHERE user_id=$1 AND item_id=$2",
      [userId, itemId]
    );

    res.json({ message: "Item removed from cart" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
