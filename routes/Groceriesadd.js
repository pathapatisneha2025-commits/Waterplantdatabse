const express = require("express");
const router = express.Router();
const pool = require("../db");
const multer = require("multer");
const path = require("path");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../cloudinary");

// ===============================
// CLOUDINARY STORAGE (same style)
// ===============================
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "grocery_items",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    public_id: (req, file) => {
      const nameWithoutExt = path.parse(file.originalname).name;
      return Date.now() + "-" + nameWithoutExt;
    },
  },
});

const upload = multer({ storage });

// ===============================
// ADD Grocery Item
// ===============================
router.post("/add", upload.single("image"), async (req, res) => {
  try {
    const {
      name,
      brand,
      category,
      subcategory,
      description,
      discount,
      quantity,
      unit,
      stock,
      price,
      premiumPrice,
    } = req.body;

    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    const imgUrl = file.path; // cloudinary image URL

    const insertQuery = `
      INSERT INTO grocery_items (
        name, brand, category, subcategory, description,
        discount, quantity, unit, stock, price, premiumPrice, img
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *
    `;

    const values = [
      name,
      brand,
      category,
      subcategory,
      description,
      discount,
      quantity,
      unit,
      stock,
      price,
      premiumPrice,
      imgUrl,
    ];

    const result = await pool.query(insertQuery, values);

    return res.status(201).json({
      success: true,
      message: "Grocery Item Added",
      item: result.rows[0],
    });
  } catch (error) {
    console.error("Add Grocery Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ===============================
// FETCH All Grocery Items
// ===============================
router.get("/all", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM grocery_items ORDER BY id DESC");

    res.status(200).json({
      success: true,
      groceries: result.rows,
    });
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ===============================
// Fetch Grocery By ID
// ===============================
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("SELECT * FROM grocery_items WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    res.status(200).json({
      success: true,
      item: result.rows[0],
    });
  } catch (error) {
    console.error("Fetch by ID Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ===============================
// UPDATE Grocery Item
// ===============================
router.put("/update/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;

  const {
    name,
    brand,
    category,
    subcategory,
    description,
    discount,
    quantity,
    unit,
    stock,
    price,
    premiumPrice,
  } = req.body;

  const file = req.file;

  try {
    // Get existing item
    const existing = await pool.query(
      "SELECT * FROM grocery_items WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    const existingItem = existing.rows[0];

    // If new image uploaded, use it; else keep old one
    const imgUrl = file ? file.path : existingItem.img;

    const updateQuery = `
      UPDATE grocery_items SET
        name = $1,
        brand = $2,
        category = $3,
        subcategory = $4,
        description = $5,
        discount = $6,
        quantity = $7,
        unit = $8,
        stock = $9,
        price = $10,
        premiumPrice = $11,
        img = $12
      WHERE id = $13
      RETURNING *
    `;

    const values = [
      name || existingItem.name,
      brand || existingItem.brand,
      category || existingItem.category,
      subcategory || existingItem.subcategory,
      description || existingItem.description,
      discount || existingItem.discount,
      quantity || existingItem.quantity,
      unit || existingItem.unit,
      stock || existingItem.stock,
      price || existingItem.price,
      premiumPrice || existingItem.premiumprice,
      imgUrl,
      id,
    ];

    const result = await pool.query(updateQuery, values);

    return res.json({
      success: true,
      message: "Item Updated Successfully",
      item: result.rows[0],
    });
  } catch (error) {
    console.error("Update Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ===============================
// DELETE Grocery Item
// ===============================
router.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await pool.query(
      "SELECT * FROM grocery_items WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    await pool.query("DELETE FROM grocery_items WHERE id = $1", [id]);

    res.json({
      success: true,
      message: "Item Deleted Successfully",
    });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ===============================
// EXPORT
// ===============================
module.exports = router;
