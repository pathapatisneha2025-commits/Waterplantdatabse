
const express = require("express");
const router = express.Router();
const pool = require("../db");

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// ======================================================
// VPS IMAGE STORAGE
// ======================================================

const uploadDir = path.join(
  process.cwd(),
  "uploads",
  "water_plant_categories"
);

// Create folder automatically
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const uniqueName =
      Date.now() + "-" + crypto.randomUUID() + extension;

    cb(null, uniqueName);
  },
});

// Allow only image files
const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG and WEBP images are allowed"));
    }
  },
});

// ======================================================
// HELPER: GET IMAGE URL
// ======================================================

function getImageUrl(filename) {
  const baseUrl = (
    process.env.BASE_URL || "https://api2.ajpartyhouse.in"
  ).replace(/\/+$/, "");

  return `${baseUrl}/uploads/water_plant_categories/${filename}`;
}

// ======================================================
// HELPER: DELETE LOCAL VPS IMAGE
// ======================================================

function deleteLocalImage(imageUrl) {
  try {
    if (!imageUrl) return;

    const url = new URL(imageUrl);

    // Only delete images belonging to this backend
    const baseUrl = (
      process.env.BASE_URL || "https://api2.ajpartyhouse.in"
    ).replace(/\/+$/, "");

    const expectedOrigin = new URL(baseUrl).origin;

    if (url.origin !== expectedOrigin) return;

    const prefix = "/uploads/water_plant_categories/";

    if (!url.pathname.startsWith(prefix)) return;

    const filename = path.basename(
      decodeURIComponent(url.pathname.slice(prefix.length))
    );

    // Prevent directory traversal
    if (
      !filename ||
      filename === "." ||
      filename === ".." ||
      filename !== path.basename(filename)
    ) {
      return;
    }

    const filePath = path.join(uploadDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("Deleted VPS image:", filename);
    }

  } catch (error) {
    console.error("VPS image deletion error:", error);
  }
}

// ======================================================
// HELPER: DELETE NEWLY UPLOADED IMAGE IF REQUEST FAILS
// ======================================================

function cleanupUploadedImage(file) {
  if (file?.filename) {
    const filePath = path.join(uploadDir, file.filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

// ======================================================
// GET ALL WATER PLANT CATEGORIES
// GET /water-plant-categories/all
// ======================================================

router.get("/all", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, image_url, created_at
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

router.post("/add", upload.single("image"), async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      cleanupUploadedImage(req.file);

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
      cleanupUploadedImage(req.file);

      return res.status(409).json({
        message: "Category already exists",
      });
    }

    const imageUrl = req.file
      ? getImageUrl(req.file.filename)
      : null;

    const result = await pool.query(
      `
      INSERT INTO water_plant_categories (name, image_url)
      VALUES ($1, $2)
      RETURNING id, name, image_url, created_at
      `,
      [categoryName, imageUrl]
    );

    res.status(201).json({
      message: "Category added successfully",
      category: result.rows[0],
    });

  } catch (error) {
    console.error("Add category error:", error);

    cleanupUploadedImage(req.file);

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

router.put("/update/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      cleanupUploadedImage(req.file);

      return res.status(400).json({
        message: "Category name is required",
      });
    }

    const categoryName = name.trim();

    // Check category exists
    const existing = await pool.query(
      `
      SELECT id, image_url
      FROM water_plant_categories
      WHERE id = $1
      `,
      [id]
    );

    if (existing.rows.length === 0) {
      cleanupUploadedImage(req.file);

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
      cleanupUploadedImage(req.file);

      return res.status(409).json({
        message: "Another category with this name already exists",
      });
    }

    const oldImageUrl = existing.rows[0].image_url;

    // New image if uploaded, otherwise keep old image
    const imageUrl = req.file
      ? getImageUrl(req.file.filename)
      : oldImageUrl;

    const result = await pool.query(
      `
      UPDATE water_plant_categories
      SET name = $1,
          image_url = $2
      WHERE id = $3
      RETURNING id, name, image_url, created_at
      `,
      [categoryName, imageUrl, id]
    );

    // Delete old VPS image after successful update
    if (req.file && oldImageUrl) {
      deleteLocalImage(oldImageUrl);
    }

    res.status(200).json({
      message: "Category updated successfully",
      category: result.rows[0],
    });

  } catch (error) {
    console.error("Update category error:", error);

    cleanupUploadedImage(req.file);

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

    const existing = await pool.query(
      `
      SELECT id, image_url
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

    const imageUrl = existing.rows[0].image_url;

    await pool.query(
      `
      DELETE FROM water_plant_categories
      WHERE id = $1
      `,
      [id]
    );

    // Delete image from VPS
    deleteLocalImage(imageUrl);

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
