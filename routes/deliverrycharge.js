
const express = require("express");
const router = express.Router();
const pool = require("../db");

// ======================================
// GET DELIVERY CHARGE
// ======================================
router.get("/all", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM delivery_charge_settings
       ORDER BY id DESC LIMIT 1`
    );

    if (result.rows.length === 0) {
      return res.json({
        delivery_charge: 30,
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("GET DELIVERY CHARGE:", error);

    res.status(500).json({
      error: "Failed to fetch delivery charge",
    });
  }
});

// ======================================
// ADD DELIVERY CHARGE
// ======================================
router.post("/add", async (req, res) => {
  try {
    const charge = Number(req.body.delivery_charge);

    if (
      req.body.delivery_charge === undefined ||
      req.body.delivery_charge === null ||
      req.body.delivery_charge === "" ||
      !Number.isFinite(charge) ||
      charge < 0
    ) {
      return res.status(400).json({
        error: "Enter a valid delivery charge",
      });
    }

    const existing = await pool.query(
      `SELECT id FROM delivery_charge_settings
       ORDER BY id DESC LIMIT 1`
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: "Delivery charge already exists. Use PUT to update it.",
      });
    }

    const result = await pool.query(
      `INSERT INTO delivery_charge_settings
       (delivery_charge)
       VALUES ($1)
       RETURNING *`,
      [charge]
    );

    res.status(201).json({
      message: "Delivery charge added successfully",
      settings: result.rows[0],
    });
  } catch (error) {
    console.error("ADD DELIVERY CHARGE:", error);

    res.status(500).json({
      error: "Failed to add delivery charge",
    });
  }
});

// ======================================
// UPDATE DELIVERY CHARGE
// ======================================
router.put("/update", async (req, res) => {
  try {
    const charge = Number(req.body.delivery_charge);

    if (
      req.body.delivery_charge === undefined ||
      req.body.delivery_charge === null ||
      req.body.delivery_charge === "" ||
      !Number.isFinite(charge) ||
      charge < 0
    ) {
      return res.status(400).json({
        error: "Enter a valid delivery charge",
      });
    }

    const existing = await pool.query(
      `SELECT id FROM delivery_charge_settings
       ORDER BY id DESC LIMIT 1`
    );

    let result;

    if (existing.rows.length > 0) {
      result = await pool.query(
        `UPDATE delivery_charge_settings
         SET delivery_charge = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [charge, existing.rows[0].id]
      );
    } else {
      result = await pool.query(
        `INSERT INTO delivery_charge_settings
         (delivery_charge)
         VALUES ($1)
         RETURNING *`,
        [charge]
      );
    }

    res.json({
      message: "Delivery charge updated successfully",
      settings: result.rows[0],
    });
  } catch (error) {
    console.error("UPDATE DELIVERY CHARGE:", error);

    res.status(500).json({
      error: "Failed to update delivery charge",
    });
  }
});

module.exports = router;
