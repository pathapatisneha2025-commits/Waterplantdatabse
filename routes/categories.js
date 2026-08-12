
const express = require("express");
const router = express.Router();

const pool = require("../db");

// ======================================================
// GET ALL WATER PLANT CATEGORIES
// GET /water-plant-categories/all
// ======================================================
router.get("/all", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, created_at
      FROM water_plant_categories
      ORDER BY id DESC
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Get categories error:", error);

    res.status(500).json({
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
});


// ======================================================
// ADD CATEGORY
// POST /water-plant-categories/add
// ======================================================
router.post("/add", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Category name is required",
      });
    }

    const categoryName = name.trim();

    // Check duplicate
    const existing = await pool.query(
      `
      SELECT id
      FROM water_plant_categories
      WHERE LOWER(name) = LOWER($1)
      `,
      [categoryName]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        message: "Category already exists",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO water_plant_categories (name)
      VALUES ($1)
      RETURNING id, name, created_at
      `,
      [categoryName]
    );

    res.status(201).json({
      message: "Category added successfully",
      category: result.rows[0],
    });
  } catch (error) {
    console.error("Add category error:", error);

    res.status(500).json({
      message: "Failed to add category",
      error: error.message,
    });
  }
});


// ======================================================
// UPDATE CATEGORY
// PUT /water-plant-categories/update/:id
// ======================================================
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Category name is required",
      });
    }

    const categoryName = name.trim();

    // Check category exists
    const existing = await pool.query(
      `
      SELECT id
      FROM water_plant_categories
      WHERE id = $1
      `,
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    // Check duplicate name
    const duplicate = await pool.query(
      `
      SELECT id
      FROM water_plant_categories
      WHERE LOWER(name) = LOWER($1)
      AND id != $2
      `,
      [categoryName, id]
    );

    if (duplicate.rows.length > 0) {
      return res.status(409).json({
        message: "Another category with this name already exists",
      });
    }

    const result = await pool.query(
      `
      UPDATE water_plant_categories
      SET name = $1
      WHERE id = $2
      RETURNING id, name, created_at
      `,
      [categoryName, id]
    );

    res.status(200).json({
      message: "Category updated successfully",
      category: result.rows[0],
    });
  } catch (error) {
    console.error("Update category error:", error);

    res.status(500).json({
      message: "Failed to update category",
      error: error.message,
    });
  }
});


// ======================================================
// DELETE CATEGORY
// DELETE /water-plant-categories/delete/:id
// ======================================================
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check category exists
    const existing = await pool.query(
      `
      SELECT id
      FROM water_plant_categories
      WHERE id = $1
      `,
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    await pool.query(
      `
      DELETE FROM water_plant_categories
      WHERE id = $1
      `,
      [id]
    );

    res.status(200).json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error);

    res.status(500).json({
      message: "Failed to delete category",
      error: error.message,
    });
  }
});


module.exports = router;
