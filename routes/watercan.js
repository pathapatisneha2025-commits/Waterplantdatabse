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
// ADD WATER CAN PRICE
// ========================================
router.post("/add", async (req, res) => {
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

    // Prevent duplicate initial pricing records
    const existing = await pool.query(`
      SELECT *
      FROM water_can_pricing
      ORDER BY id ASC
      LIMIT 1
    `);

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Water can pricing already exists. Please update it.",
        pricing: existing.rows[0],
      });
    }

    const result = await pool.query(
      `
      INSERT INTO water_can_pricing (price)
      VALUES ($1)
      RETURNING *
      `,
      [price]
    );

    res.status(201).json({
      success: true,
      message: "Water can price added successfully",
      pricing: result.rows[0],
    });

  } catch (error) {
    console.error("ADD WATER PRICE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add water price",
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