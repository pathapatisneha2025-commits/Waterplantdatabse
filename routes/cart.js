const express = require("express");
const router = express.Router();
const pool = require("../db");

/* ------------------ ADD TO CART ------------------ */
// =========================
// 🛒 ADD ITEM TO CART
// =========================

router.post("/add", async (req, res) => {
  const client = await pool.connect();

  try {
    const { userId, item } = req.body;

    if (!userId || !item) {
      return res.status(400).json({
        message: "Missing userId or item",
      });
    }

    const qty = Number(item.quantity || 1);

    if (qty <= 0) {
      return res.status(400).json({
        message: "Invalid quantity",
      });
    }

    await client.query("BEGIN");

    const isWater = item.type === "water";

    // =====================================================
    // 💧 WATER FLOW
    // =====================================================

    if (isWater) {
      const insert = await client.query(
        `INSERT INTO user_cart
        (
          user_id,
          item_id,
          name,
          img,
          price,
          premium_price,
          qty,
          item_type,
          slot
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING *`,
        [
          userId,
          null,
          item.name,
          item.img || "water.png",
          Number(item.price || 0),
          Number(item.premiumPrice || 0),
          qty,
          "water",
          item.slot || null,
        ]
      );

      await client.query("COMMIT");

      return res.json({
        message: "Water can added to cart",
        cartItem: insert.rows[0],
      });
    }

    // =====================================================
    // 🛒 GROCERY FLOW
    // =====================================================

    // -----------------------------------------------------
    // 1️⃣ GET USER PREMIUM STATUS
    // -----------------------------------------------------

    const userResult = await client.query(
      `SELECT is_premium
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "User not found",
      });
    }

    const isPremium = userResult.rows[0].is_premium === true;

    // -----------------------------------------------------
    // 2️⃣ GET GROCERY FROM DATABASE
    // -----------------------------------------------------
    // FOR UPDATE locks the row while the cart operation
    // is being processed.

    const groceryResult = await client.query(
      `SELECT
        id,
        name,
        img,
        price,
        premium_price,
        stock
       FROM grocery_items
       WHERE id = $1
       FOR UPDATE`,
      [item.id]
    );

    if (groceryResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Grocery item not found",
      });
    }

    const grocery = groceryResult.rows[0];

    // -----------------------------------------------------
    // 3️⃣ CHECK STOCK
    // -----------------------------------------------------

    const currentStock = Number(grocery.stock || 0);

    if (currentStock < qty) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Insufficient stock",
        availableStock: currentStock,
        requestedQuantity: qty,
      });
    }

    // -----------------------------------------------------
    // 4️⃣ GET PRICES FROM DATABASE
    // -----------------------------------------------------

    const normalPrice = Number(grocery.price || 0);
    const premiumPrice = Number(grocery.premium_price || 0);

    // -----------------------------------------------------
    // 5️⃣ SELECT CORRECT PRICE
    // -----------------------------------------------------
    //
    // Premium user     -> premium_price
    // Non-premium user -> normal price
    //
    // IMPORTANT:
    // We use DATABASE prices, not frontend prices.
    // -----------------------------------------------------

    const selectedPrice = isPremium
      ? premiumPrice
      : normalPrice;

    // -----------------------------------------------------
    // 6️⃣ INSERT INTO CART
    // -----------------------------------------------------

    const insert = await client.query(
      `INSERT INTO user_cart
      (
        user_id,
        item_id,
        name,
        img,
        price,
        premium_price,
        qty,
        item_type
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *`,
      [
        userId,
        grocery.id,
        grocery.name,
        grocery.img,
        selectedPrice,
        premiumPrice,
        qty,
        "grocery",
      ]
    );

    // -----------------------------------------------------
    // 7️⃣ COMMIT
    // -----------------------------------------------------

    await client.query("COMMIT");

    // -----------------------------------------------------
    // 8️⃣ RESPONSE
    // -----------------------------------------------------

    return res.json({
      message: isPremium
        ? "Grocery added with premium price"
        : "Grocery added with normal price",

      isPremium,

      normalPrice,

      premiumPrice,

      selectedPrice,

      cartItem: insert.rows[0],
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Rollback Error:", rollbackError);
    }

    console.error("Cart Add Error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
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
router.delete("/delete/:id/:userId", async (req, res) => {
  try {
    const { id, userId } = req.params;

    const result = await pool.query(
      `
      DELETE FROM user_cart
      WHERE id = $1
      AND user_id = $2
      RETURNING *
      `,
      [
        id,
        userId
      ]
    );


    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found"
      });
    }


    res.json({
      success: true,
      message: "Item removed from cart",
      deleted: result.rows[0]
    });


  } catch (error) {

    console.error("Delete cart error:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }
});

module.exports = router;
