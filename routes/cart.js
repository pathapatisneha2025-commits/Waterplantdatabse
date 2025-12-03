const express = require("express");
const router = express.Router();
const pool = require("../db");

/* ------------------ ADD TO CART ------------------ */
router.post("/add", async (req, res) => {
  try {
    const { userId, item } = req.body;

    if (!userId || !item) {
      return res.status(400).json({ message: "Missing userId or item" });
    }

    // DEFAULT QTY = 1 if not provided
    const qty = item.quantity || 1;

    const insert = await pool.query(
      `INSERT INTO user_cart (user_id, item_id, name, img, price, premium_price, qty)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        userId,
        item.id,
        item.name,
        item.img,
        item.price,
        item.premiumPrice,
        qty,
      ]
    );

    res.json({
      message: "Item added to cart",
      cartItem: insert.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
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
