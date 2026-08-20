const express = require("express");
const router = express.Router();
const pool = require("../db");
// ======================================================
// TODAY'S DEALS
// ======================================================


// ======================================================
// GET ACTIVE TODAY'S DEALS
// Customer App
// ======================================================

router.get("/todays-deals", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        title,
        subtitle,
        image_url,
        discount_text,
        price,
        old_price,
        button_text,
        button_screen,
        product_id,
        category,
        is_active,
        start_date,
        end_date,
        created_at,
        updated_at
      FROM todays_deals
      WHERE is_active = TRUE
        AND CURRENT_DATE BETWEEN start_date AND end_date
      ORDER BY id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("GET TODAY'S DEALS ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch today's deals",
      error: error.message,
    });
  }
});


// ======================================================
// ADMIN - GET ALL DEALS
// ======================================================

router.get("/admin/todays-deals", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        title,
        subtitle,
        image_url,
        discount_text,
        price,
        old_price,
        button_text,
        button_screen,
        product_id,
        category,
        is_active,
        start_date,
        end_date,
        created_at,
        updated_at
      FROM todays_deals
      ORDER BY id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("GET ADMIN TODAY'S DEALS ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch deals",
      error: error.message,
    });
  }
});


// ======================================================
// ADMIN - GET SINGLE DEAL
// ======================================================

router.get("/admin/todays-deals/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM todays_deals
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Deal not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("GET SINGLE DEAL ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch deal",
      error: error.message,
    });
  }
});


// ======================================================
// ADMIN - CREATE DEAL
// ======================================================

router.post("/admin/todays-deals", async (req, res) => {
  try {
    const {
      title,
      subtitle,
      image_url,
      discount_text,
      price,
      old_price,
      button_text,
      button_screen,
      product_id,
      category,
      is_active,
      start_date,
      end_date,
    } = req.body;

    // ------------------------------------------
    // VALIDATION
    // ------------------------------------------

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Deal title is required",
      });
    }

    if (!start_date || !end_date) {
      return res.status(400).json({
        message: "Start date and end date are required",
      });
    }

    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({
        message: "Start date cannot be after end date",
      });
    }

    // ------------------------------------------
    // INSERT
    // ------------------------------------------

    const result = await pool.query(
      `
      INSERT INTO todays_deals (
        title,
        subtitle,
        image_url,
        discount_text,
        price,
        old_price,
        button_text,
        button_screen,
        product_id,
        category,
        is_active,
        start_date,
        end_date
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13
      )
      RETURNING *
      `,
      [
        title.trim(),
        subtitle?.trim() || null,
        image_url?.trim() || null,
        discount_text?.trim() || null,

        price !== "" && price != null
          ? Number(price)
          : null,

        old_price !== "" && old_price != null
          ? Number(old_price)
          : null,

        button_text?.trim() || "Order Now",

        button_screen?.trim() || null,

        product_id !== "" && product_id != null
          ? Number(product_id)
          : null,

        category?.trim() || null,

        is_active !== false,

        start_date,
        end_date,
      ]
    );

    res.status(201).json({
      message: "Deal created successfully",
      deal: result.rows[0],
    });
  } catch (error) {
    console.error("CREATE DEAL ERROR:", error);

    res.status(500).json({
      message: "Failed to create deal",
      error: error.message,
    });
  }
});


// ======================================================
// ADMIN - UPDATE DEAL
// ======================================================

router.put("/admin/todays-deals/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      subtitle,
      image_url,
      discount_text,
      price,
      old_price,
      button_text,
      button_screen,
      product_id,
      category,
      is_active,
      start_date,
      end_date,
    } = req.body;

    // ------------------------------------------
    // VALIDATION
    // ------------------------------------------

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Deal title is required",
      });
    }

    if (!start_date || !end_date) {
      return res.status(400).json({
        message: "Start date and end date are required",
      });
    }

    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({
        message: "Start date cannot be after end date",
      });
    }

    // ------------------------------------------
    // UPDATE
    // ------------------------------------------

    const result = await pool.query(
      `
      UPDATE todays_deals
      SET
        title = $1,
        subtitle = $2,
        image_url = $3,
        discount_text = $4,
        price = $5,
        old_price = $6,
        button_text = $7,
        button_screen = $8,
        product_id = $9,
        category = $10,
        is_active = $11,
        start_date = $12,
        end_date = $13,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
      RETURNING *
      `,
      [
        title.trim(),
        subtitle?.trim() || null,
        image_url?.trim() || null,
        discount_text?.trim() || null,

        price !== "" && price != null
          ? Number(price)
          : null,

        old_price !== "" && old_price != null
          ? Number(old_price)
          : null,

        button_text?.trim() || "Order Now",

        button_screen?.trim() || null,

        product_id !== "" && product_id != null
          ? Number(product_id)
          : null,

        category?.trim() || null,

        is_active === true,

        start_date,
        end_date,

        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Deal not found",
      });
    }

    res.json({
      message: "Deal updated successfully",
      deal: result.rows[0],
    });
  } catch (error) {
    console.error("UPDATE DEAL ERROR:", error);

    res.status(500).json({
      message: "Failed to update deal",
      error: error.message,
    });
  }
});


// ======================================================
// ADMIN - TOGGLE ACTIVE / INACTIVE
// ======================================================

router.patch("/admin/todays-deals/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE todays_deals
      SET
        is_active = NOT is_active,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Deal not found",
      });
    }

    res.json({
      message: result.rows[0].is_active
        ? "Deal activated"
        : "Deal deactivated",
      deal: result.rows[0],
    });
  } catch (error) {
    console.error("TOGGLE DEAL ERROR:", error);

    res.status(500).json({
      message: "Failed to update deal status",
      error: error.message,
    });
  }
});


// ======================================================
// ADMIN - DELETE DEAL
// ======================================================

router.delete("/admin/todays-deals/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM todays_deals
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Deal not found",
      });
    }

    res.json({
      message: "Deal deleted successfully",
      deal: result.rows[0],
    });
  } catch (error) {
    console.error("DELETE DEAL ERROR:", error);

    res.status(500).json({
      message: "Failed to delete deal",
      error: error.message,
    });
  }
});
module.exports = router;
