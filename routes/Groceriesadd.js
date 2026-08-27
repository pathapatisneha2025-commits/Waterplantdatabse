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
      premiumDiscount, // ✅ ADDED
      quantity,
      unit,
      stock,
      mrp,
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

    const imgUrl = file.path;

    // ==========================================
    // INSERT GROCERY ITEM
    // ==========================================
    const insertQuery = `
      INSERT INTO grocery_items (
        name,
        brand,
        category,
        subcategory,
        description,
        discount,
        premiumdiscount,
        quantity,
        unit,
        stock,
        mrp,
        price,
        premiumprice,
        img
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
        $13,
        $14
      )
      RETURNING *
    `;

    const values = [
      name,
      brand,
      category,
      subcategory,
      description,

      // Normal discount
      discount,

      // Premium discount
      premiumDiscount,

      quantity,
      unit,
      stock,

      // Prices
      mrp,
      price,
      premiumPrice,

      // Cloudinary image URL
      imgUrl,
    ];

    const result = await pool.query(
      insertQuery,
      values
    );

    return res.status(201).json({
      success: true,
      message: "Grocery Item Added",
      item: result.rows[0],
    });

  } catch (error) {
    console.error(
      "Add Grocery Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
});// ===============================
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
    premiumDiscount, // ✅ ADDED
    quantity,
    unit,
    stock,
    mrp,
    price,
    premiumPrice,
  } = req.body;

  const file = req.file;

  try {
    // ==========================================
    // GET EXISTING ITEM
    // ==========================================
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

    // ==========================================
    // IMAGE
    // Keep old image if new image is not uploaded
    // ==========================================
    const imgUrl = file
      ? file.path
      : existingItem.img;

    // ==========================================
    // UPDATE QUERY
    // ==========================================
    const updateQuery = `
      UPDATE grocery_items SET
        name = $1,
        brand = $2,
        category = $3,
        subcategory = $4,
        description = $5,
        discount = $6,
        premiumdiscount = $7,
        quantity = $8,
        unit = $9,
        stock = $10,
        mrp = $11,
        price = $12,
        premiumprice = $13,
        img = $14,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $15
      RETURNING *
    `;

    // ==========================================
    // VALUES
    // ==========================================
    const values = [
      name ?? existingItem.name,
      brand ?? existingItem.brand,
      category ?? existingItem.category,
      subcategory ?? existingItem.subcategory,
      description ?? existingItem.description,

      // Normal discount
      discount ?? existingItem.discount,

      // Premium discount
      premiumDiscount ??
        existingItem.premiumdiscount,

      quantity ?? existingItem.quantity,
      unit ?? existingItem.unit,
      stock ?? existingItem.stock,

      // Prices
      mrp ?? existingItem.mrp,
      price ?? existingItem.price,
      premiumPrice ??
        existingItem.premiumprice,

      // Image
      imgUrl,

      // ID
      id,
    ];

    const result = await pool.query(
      updateQuery,
      values
    );

    return res.json({
      success: true,
      message: "Item Updated Successfully",
      item: result.rows[0],
    });

  } catch (error) {
    console.error(
      "Update Grocery Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
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
