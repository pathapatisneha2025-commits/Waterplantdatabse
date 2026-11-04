
const express = require("express");
const router = express.Router();
const pool = require("../db");

const multer = require("multer");
const path = require("path");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../cloudinary");

// ======================================================
// CLOUDINARY STORAGE
// ======================================================
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "water_plant_categories",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    public_id: (req, file) => {
      const nameWithoutExt = path.parse(file.originalname).name;
      return Date.now() + "-" + nameWithoutExt;
    },
  },
});

const upload = multer({ storage });


// ======================================================
// HELPER: EXTRACT CLOUDINARY PUBLIC ID FROM IMAGE URL
// ======================================================
function getCloudinaryPublicId(imageUrl) {
  try {
    const url = new URL(imageUrl);

    if (!url.hostname.endsWith("cloudinary.com")) {
      return null;
    }

    const parts = url.pathname.split("/");
    const uploadIndex = parts.indexOf("upload");

    if (uploadIndex === -1) return null;

    let publicIdParts = parts.slice(uploadIndex + 1);

    // Remove version number
    if (/^v\d+$/.test(publicIdParts[0])) {
      publicIdParts.shift();
    }

    return publicIdParts.join("/").replace(/\.[^/.]+$/, "");

  } catch (error) {
    console.error("Public ID extraction error:", error);
    return null;
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
      if (req.file?.filename) {
        await cloudinary.uploader.destroy(req.file.filename);
      }

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
      if (req.file?.filename) {
        await cloudinary.uploader.destroy(req.file.filename);
      }

      return res.status(409).json({
        message: "Category already exists",
      });
    }

    const imageUrl = req.file ? req.file.path : null;

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

    if (req.file?.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (deleteError) {
        console.error("Cloudinary cleanup error:", deleteError);
      }
    }

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
      if (req.file?.filename) {
        await cloudinary.uploader.destroy(req.file.filename);
      }

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
      if (req.file?.filename) {
        await cloudinary.uploader.destroy(req.file.filename);
      }

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
      if (req.file?.filename) {
        await cloudinary.uploader.destroy(req.file.filename);
      }

      return res.status(409).json({
        message: "Another category with this name already exists",
      });
    }

    const oldImageUrl = existing.rows[0].image_url;

    // Keep old image if no new image is uploaded
    const imageUrl = req.file
      ? req.file.path
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

    // Delete old Cloudinary image after successful update
    if (req.file && oldImageUrl) {
      try {
        const oldPublicId = getCloudinaryPublicId(oldImageUrl);

        if (oldPublicId) {
          await cloudinary.uploader.destroy(oldPublicId);
        }
      } catch (deleteError) {
        console.error("Old image deletion error:", deleteError);
      }
    }

    res.status(200).json({
      message: "Category updated successfully",
      category: result.rows[0],
    });

  } catch (error) {
    console.error("Update category error:", error);

    if (req.file?.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (deleteError) {
        console.error("Cloudinary cleanup error:", deleteError);
      }
    }

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

    // Delete image from Cloudinary
    if (imageUrl) {
      try {
        const publicId = getCloudinaryPublicId(imageUrl);

        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (deleteError) {
        console.error("Cloudinary image deletion error:", deleteError);
      }
    }

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
