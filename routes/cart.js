const express = require("express");
const router = express.Router();
const pool = require("../db");



// =====================================================
// 🛒 ADD ITEM TO CART
// =====================================================

router.post("/add", async (req, res) => {
  const client = await pool.connect();

  try {
    const { userId, item } = req.body;

    // =====================================================
    // 1. VALIDATE REQUEST
    // =====================================================

    if (!userId || !item) {
      return res.status(400).json({
        message: "Missing userId or item",
      });
    }

    const qty = Number(item.quantity || 1);

    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({
        message: "Invalid quantity",
      });
    }

    // =====================================================
    // START TRANSACTION
    // =====================================================

    await client.query("BEGIN");

    const isWater = item.type === "water";

    // =====================================================
    // 💧 WATER FLOW
    // =====================================================

    if (isWater) {
      const insert = await client.query(
        `
        INSERT INTO user_cart
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
        RETURNING *
        `,
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

      return res.status(200).json({
        success: true,
        message: "Water can added to cart",
        cartItem: insert.rows[0],
      });
    }

    // =====================================================
    // 🛒 GROCERY FLOW
    // =====================================================

    // =====================================================
    // 2. GET USER ROLE + PREMIUM STATUS
    // =====================================================

    const userResult = await client.query(
      `
      SELECT
        id,
        role,
        is_premium
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    // =====================================================
    // USER NOT FOUND
    // =====================================================

    if (userResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = userResult.rows[0];

    const role = user.role;
    const isPremium = user.is_premium === true;

    // =====================================================
    // 3. ONLY CUSTOMER CAN ADD GROCERY
    // =====================================================

    if (role !== "customer") {
      await client.query("ROLLBACK");

      return res.status(403).json({
        success: false,
        message: "Only customers can add groceries to cart",
        role: role,
      });
    }

    // =====================================================
    // 4. GET GROCERY FROM DATABASE
    // =====================================================
    //
    // IMPORTANT:
    // grocery_items uses:
    //
    // price
    // premiumprice
    // stock
    //
    // We DO NOT trust price coming from frontend.
    // =====================================================

    if (!item.id) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Grocery item ID is required",
      });
    }

    const groceryResult = await client.query(
      `
      SELECT
        id,
        name,
        img,
        price,
        premiumprice,
        stock
      FROM grocery_items
      WHERE id = $1
      FOR UPDATE
      `,
      [item.id]
    );

    // =====================================================
    // GROCERY NOT FOUND
    // =====================================================

    if (groceryResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Grocery item not found",
      });
    }

    const grocery = groceryResult.rows[0];

    // =====================================================
    // 5. CHECK STOCK
    // =====================================================

    const currentStock = Number(grocery.stock || 0);

    if (currentStock <= 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Grocery item is out of stock",
        availableStock: 0,
      });
    }

    if (currentStock < qty) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
        availableStock: currentStock,
        requestedQuantity: qty,
      });
    }

    // =====================================================
    // 6. GET DATABASE PRICES
    // =====================================================

    const normalPrice = Number(grocery.price || 0);

    const premiumPrice = Number(
      grocery.premiumprice || 0
    );

    // =====================================================
    // 7. SELECT CORRECT PRICE
    // =====================================================
    //
    // Premium customer:
    //      premiumprice
    //
    // Normal customer:
    //      price
    //
    // IMPORTANT:
    // Frontend price is completely ignored.
    // =====================================================

    const selectedPrice = isPremium
      ? premiumPrice
      : normalPrice;

    // =====================================================
    // 8. VALIDATE SELECTED PRICE
    // =====================================================

    if (selectedPrice <= 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: isPremium
          ? "Premium price is not configured for this grocery item"
          : "Price is not configured for this grocery item",
      });
    }

    // =====================================================
    // 9. ADD GROCERY TO CART
    // =====================================================

    const insert = await client.query(
      `
      INSERT INTO user_cart
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
      RETURNING *
      `,
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

    // =====================================================
    // 10. COMMIT TRANSACTION
    // =====================================================

    await client.query("COMMIT");

    // =====================================================
    // 11. SUCCESS RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,

      message: isPremium
        ? "Grocery added with premium price"
        : "Grocery added with normal price",

      role: role,

      isPremium: isPremium,

      item: {
        id: grocery.id,
        name: grocery.name,
      },

      pricing: {
        normalPrice: normalPrice,
        premiumPrice: premiumPrice,
        selectedPrice: selectedPrice,
      },

      quantity: qty,

      cartItem: insert.rows[0],
    });
  } catch (error) {
    // =====================================================
    // ERROR → ROLLBACK
    // =====================================================

    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "Rollback Error:",
        rollbackError
      );
    }

    console.error(
      "Cart Add Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  } finally {
    // =====================================================
    // RELEASE CONNECTION
    // =====================================================

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
