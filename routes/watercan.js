const express = require("express");
const router = express.Router();
const pool = require("../db");

// ========================================
// GET WATER CAN PRICE
// ========================================
router.get("/all", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM water_can_pricing
      ORDER BY id ASC
      LIMIT 1
    `);

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Water pricing not found",
      });
    }

    res.json({
      success: true,
      pricing: result.rows[0],
    });

  } catch (error) {
    console.error("GET WATER PRICE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch water price",
    });
  }
});


// ========================================
// UPDATE WATER CAN PRICE (ADMIN)
// ========================================
router.put("/update/", async (req, res) => {
  try {
    const price = Number(req.body.price);

    if (
      req.body.price === undefined ||
      req.body.price === null ||
      req.body.price === "" ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid water can price",
      });
    }

    const result = await pool.query(
      `
      UPDATE water_can_pricing
      SET
        price = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = (
        SELECT id
        FROM water_can_pricing
        ORDER BY id ASC
        LIMIT 1
      )
      RETURNING *
      `,
      [price]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Water pricing not found",
      });
    }

    res.json({
      success: true,
      message: "Water can price updated successfully",
      pricing: result.rows[0],
    });

  } catch (error) {
    console.error("UPDATE WATER PRICE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update water price",
    });
  }
});

module.exports = router;