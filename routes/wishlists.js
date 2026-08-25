const express = require("express");
const router = express.Router();
const db = require("../db");

// ============================================================
// CREATE TABLE
// ============================================================

const createWishlistTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS waterplantwishlist (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL,
        product_id BIGINT NOT NULL,
        product_name VARCHAR(255),
        image TEXT,
        price NUMERIC(12,2),
        premium_price NUMERIC(12,2),
        is_premium BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        UNIQUE(user_id, product_id)
      );
    `);

    console.log(
      "waterplantwishlist table ready"
    );
  } catch (error) {
    console.error(
      "Create waterplantwishlist table error:",
      error
    );
  }
};

createWishlistTable();


// ============================================================
// ADD TO WISHLIST
// POST /wishlist/add
// ============================================================

router.post("/add", async (req, res) => {
  try {
    const {
      user_id,
      product_id,
      product_name,
      image,
      price,
      premium_price,
      is_premium,
    } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      });
    }

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: "product_id is required",
      });
    }

    // Check if already exists
    const existing = await db.query(
      `
      SELECT *
      FROM waterplantwishlist
      WHERE user_id = $1
      AND product_id = $2
      LIMIT 1
      `,
      [
        user_id,
        product_id,
      ]
    );

    if (existing.rows.length > 0) {
      return res.status(200).json({
        success: true,
        alreadyExists: true,
        wishlisted: true,
        message:
          "Product is already in wishlist",
        wishlist:
          existing.rows[0],
      });
    }

    // Insert wishlist
    const result = await db.query(
      `
      INSERT INTO waterplantwishlist (
        user_id,
        product_id,
        product_name,
        image,
        price,
        premium_price,
        is_premium
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7
      )
      RETURNING *
      `,
      [
        user_id,
        product_id,
        product_name || null,
        image || null,
        Number(price || 0),
        Number(premium_price || 0),
        Boolean(is_premium),
      ]
    );

    return res.status(201).json({
      success: true,
      wishlisted: true,
      message:
        "Product added to wishlist",
      wishlist:
        result.rows[0],
    });

  } catch (error) {
    console.error(
      "Add wishlist error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to add product to wishlist",
      error:
        error.message,
    });
  }
});


// ============================================================
// GET USER WISHLIST
// GET /wishlist/:userId
// ============================================================

router.get("/:userId", async (req, res) => {
  try {
    const {
      userId,
    } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message:
          "userId is required",
      });
    }

    const result = await db.query(
      `
      SELECT *
      FROM waterplantwishlist
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    return res.status(200).json({
      success: true,
      wishlist:
        result.rows,
      count:
        result.rows.length,
    });

  } catch (error) {
    console.error(
      "Get wishlist error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch wishlist",
      error:
        error.message,
    });
  }
});


// ============================================================
// CHECK PRODUCT WISHLIST
// GET /wishlist/:userId/check/:productId
// ============================================================

router.get(
  "/:userId/check/:productId",
  async (req, res) => {
    try {
      const {
        userId,
        productId,
      } = req.params;

      const result = await db.query(
        `
        SELECT id
        FROM waterplantwishlist
        WHERE user_id = $1
        AND product_id = $2
        LIMIT 1
        `,
        [
          userId,
          productId,
        ]
      );

      return res.status(200).json({
        success: true,
        isWishlisted:
          result.rows.length > 0,
      });

    } catch (error) {
      console.error(
        "Check wishlist error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to check wishlist",
        error:
          error.message,
      });
    }
  }
);


// ============================================================
// TOGGLE WISHLIST
// POST /wishlist/toggle
//
// If product doesn't exist:
//     ADD
//
// If product exists:
//     REMOVE
// ============================================================

router.post(
  "/toggle",
  async (req, res) => {
    try {
      const {
        user_id,
        product_id,
        product_name,
        image,
        price,
        premium_price,
        is_premium,
      } = req.body;

      if (!user_id) {
        return res.status(400).json({
          success: false,
          message:
            "user_id is required",
        });
      }

      if (!product_id) {
        return res.status(400).json({
          success: false,
          message:
            "product_id is required",
        });
      }

      // ======================================================
      // CHECK EXISTING
      // ======================================================

      const existing =
        await db.query(
          `
          SELECT *
          FROM waterplantwishlist
          WHERE user_id = $1
          AND product_id = $2
          LIMIT 1
          `,
          [
            user_id,
            product_id,
          ]
        );

      // ======================================================
      // REMOVE
      // ======================================================

      if (
        existing.rows.length > 0
      ) {
        await db.query(
          `
          DELETE FROM waterplantwishlist
          WHERE user_id = $1
          AND product_id = $2
          `,
          [
            user_id,
            product_id,
          ]
        );

        return res.status(200).json({
          success: true,
          wishlisted: false,
          message:
            "Product removed from wishlist",
        });
      }

      // ======================================================
      // ADD
      // ======================================================

      const result =
        await db.query(
          `
          INSERT INTO waterplantwishlist (
            user_id,
            product_id,
            product_name,
            image,
            price,
            premium_price,
            is_premium
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7
          )
          RETURNING *
          `,
          [
            user_id,
            product_id,
            product_name || null,
            image || null,
            Number(
              price || 0
            ),
            Number(
              premium_price || 0
            ),
            Boolean(
              is_premium
            ),
          ]
        );

      return res.status(201).json({
        success: true,
        wishlisted: true,
        message:
          "Product added to wishlist",
        wishlist:
          result.rows[0],
      });

    } catch (error) {
      console.error(
        "Toggle wishlist error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update wishlist",
        error:
          error.message,
      });
    }
  }
);


// ============================================================
// REMOVE FROM WISHLIST
// DELETE /wishlist/:userId/:productId
// ============================================================

router.delete(
  "/:userId/:productId",
  async (req, res) => {
    try {
      const {
        userId,
        productId,
      } = req.params;

      const result =
        await db.query(
          `
          DELETE FROM waterplantwishlist
          WHERE user_id = $1
          AND product_id = $2
          RETURNING *
          `,
          [
            userId,
            productId,
          ]
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Product not found in wishlist",
        });
      }

      return res.status(200).json({
        success: true,
        wishlisted: false,
        message:
          "Product removed from wishlist",
        wishlist:
          result.rows[0],
      });

    } catch (error) {
      console.error(
        "Remove wishlist error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to remove product from wishlist",
        error:
          error.message,
      });
    }
  }
);


// ============================================================
// CLEAR USER WISHLIST
// DELETE /wishlist/clear/:userId
// ============================================================

router.delete(
  "/clear/:userId",
  async (req, res) => {
    try {
      const {
        userId,
      } = req.params;

      const result =
        await db.query(
          `
          DELETE FROM waterplantwishlist
          WHERE user_id = $1
          `,
          [userId]
        );

      return res.status(200).json({
        success: true,
        message:
          "Wishlist cleared",
        deletedCount:
          result.rowCount,
      });

    } catch (error) {
      console.error(
        "Clear wishlist error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to clear wishlist",
        error:
          error.message,
      });
    }
  }
);


module.exports = router;