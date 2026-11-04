
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
  "grocery_items"
);

// Automatically create folder
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

// ======================================================
// MULTER CONFIGURATION
// ======================================================

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG and WEBP images are allowed"));
    }
  },
});

// ======================================================
// HELPER: GET VPS IMAGE URL
// ======================================================

function getImageUrl(filename) {
  const baseUrl = (
    process.env.BASE_URL || "https://api2.ajpartyhouse.in"
  ).replace(/\/+$/, "");

  return `${baseUrl}/uploads/grocery_items/${filename}`;
}

// ======================================================
// HELPER: CLEANUP UPLOADED IMAGE
// ======================================================

function cleanupUploadedImage(file) {
  try {
    if (!file?.filename) return;

    const filePath = path.join(uploadDir, file.filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("Deleted uploaded image:", file.filename);
    }
  } catch (error) {
    console.error("Image cleanup error:", error);
  }
}
// ======================================================
// DELETE OLD VPS IMAGE
// ======================================================

function deleteOldGroceryImage(imageUrl) {
  try {
    if (!imageUrl) return;

    const baseUrl = (
      process.env.BASE_URL || "https://api2.ajpartyhouse.in"
    ).replace(/\/+$/, "");

    const imageUrlObj = new URL(imageUrl);
    const baseUrlObj = new URL(baseUrl);

    // Delete only images belonging to this VPS folder
    if (
      imageUrlObj.origin !== baseUrlObj.origin ||
      !imageUrlObj.pathname.startsWith("/uploads/grocery_items/")
    ) {
      return;
    }

    const filename = path.basename(
      decodeURIComponent(imageUrlObj.pathname)
    );

    const filePath = path.join(uploadDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("Old grocery image deleted:", filename);
    }
  } catch (error) {
    console.error("Old image deletion error:", error);
  }
}

// ======================================================
// ADD GROCERY ITEM
// POST /grocery-items/add
// ======================================================

router.post(
  "/add",
  upload.single("image"),
  async (req, res) => {
    try {
      const {
        name,
        brand,
        category,
        subcategory,
        description,
        discount,
        premiumDiscount,
        quantity,
        unit,
        stock,
        mrp,
        price,
        premiumPrice,

        // RETURN SETTINGS
        return_allowed,
        return_days,
      } = req.body;

      const file = req.file;

      // ==================================================
      // IMAGE VALIDATION
      // ==================================================

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "Image is required",
        });
      }

      // VPS IMAGE URL
      const imgUrl = getImageUrl(file.filename);

      // ==================================================
      // CONVERT RETURN ALLOWED
      // ==================================================

      const returnAllowed =
        return_allowed === true ||
        return_allowed === "true";

      // ==================================================
      // RETURN DAYS
      // ==================================================

      let returnDays = 0;

      if (returnAllowed) {
        returnDays = parseInt(return_days, 10);

        if (
          isNaN(returnDays) ||
          returnDays < 1
        ) {
          cleanupUploadedImage(file);

          return res.status(400).json({
            success: false,
            message:
              "Return days must be at least 1 when returns are enabled",
          });
        }

        if (returnDays > 365) {
          cleanupUploadedImage(file);

          return res.status(400).json({
            success: false,
            message:
              "Return days cannot be more than 365",
          });
        }
      }

      // ==================================================
      // INSERT GROCERY ITEM
      // ==================================================

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
          img,
          return_allowed,
          return_days
        )
        VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8,
          $9, $10, $11, $12,
          $13, $14, $15, $16
        )
        RETURNING *
      `;

      // ==================================================
      // VALUES
      // ==================================================

      const values = [
        name,
        brand,
        category,
        subcategory,
        description,

        // Discounts
        discount,
        premiumDiscount,

        // Stock
        quantity,
        unit,
        stock,

        // Prices
        mrp,
        price,
        premiumPrice,

        // VPS IMAGE URL
        imgUrl,

        // RETURN SETTINGS
        returnAllowed,
        returnDays,
      ];

      // ==================================================
      // EXECUTE INSERT
      // ==================================================

      const result = await pool.query(
        insertQuery,
        values
      );

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(201).json({
        success: true,
        message: "Grocery Item Added Successfully",
        item: result.rows[0],
      });

    } catch (error) {
      console.error("Add Grocery Error:", error);

      // Remove uploaded image if database insert fails
      cleanupUploadedImage(req.file);

      return res.status(500).json({
        success: false,
        message: "Server Error",
        error: error.message,
      });
    }
  }
);


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
// ===============================
// UPDATE Grocery Item
// PUT /grocery-items/update/:id
// ===============================

router.put(
  "/update/:id",
  upload.single("image"),
  async (req, res) => {
    const { id } = req.params;

    const {
      name,
      brand,
      category,
      subcategory,
      description,
      discount,
      premiumDiscount,
      quantity,
      unit,
      stock,
      mrp,
      price,
      premiumPrice,
      return_allowed,
      return_days,
    } = req.body;

    const file = req.file;

    try {
      // 1. GET EXISTING ITEM
      const existing = await pool.query(
        "SELECT * FROM grocery_items WHERE id = $1",
        [id]
      );

      if (existing.rows.length === 0) {
        cleanupUploadedImage(file);

        return res.status(404).json({
          success: false,
          message: "Item not found",
        });
      }

      const existingItem = existing.rows[0];

      // 2. IMAGE URL
      // New image uploaded -> generate public VPS URL
      // No new image -> retain existing image

      const imgUrl = file
        ? getImageUrl(file.filename)
        : existingItem.img;

      console.log("New uploaded file:", file?.filename);
      console.log("Image URL to save:", imgUrl);

      // 3. RETURN ALLOWED

      let returnAllowed;

      if (
        return_allowed === true ||
        return_allowed === "true"
      ) {
        returnAllowed = true;
      } else if (
        return_allowed === false ||
        return_allowed === "false"
      ) {
        returnAllowed = false;
      } else {
        returnAllowed =
          existingItem.return_allowed ?? false;
      }

      // 4. RETURN DAYS

      let returnDays = 0;

      if (returnAllowed) {
        const parsedReturnDays = parseInt(return_days, 10);

        if (
          isNaN(parsedReturnDays) ||
          parsedReturnDays < 1 ||
          parsedReturnDays > 365
        ) {
          cleanupUploadedImage(file);

          return res.status(400).json({
            success: false,
            message: "Return days must be between 1 and 365",
          });
        }

        returnDays = parsedReturnDays;
      }

      // 5. UPDATE DATABASE

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
          return_allowed = $15,
          return_days = $16,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $17
        RETURNING *
      `;

      const values = [
        name ?? existingItem.name,
        brand ?? existingItem.brand,
        category ?? existingItem.category,
        subcategory ?? existingItem.subcategory,
        description ?? existingItem.description,
        discount ?? existingItem.discount,
        premiumDiscount ?? existingItem.premiumdiscount,
        quantity ?? existingItem.quantity,
        unit ?? existingItem.unit,
        stock ?? existingItem.stock,
        mrp ?? existingItem.mrp,
        price ?? existingItem.price,
        premiumPrice ?? existingItem.premiumprice,
        imgUrl,
        returnAllowed,
        returnDays,
        id,
      ];

      const result = await pool.query(updateQuery, values);

      // 6. DELETE OLD IMAGE ONLY AFTER DATABASE UPDATE SUCCEEDS
      if (file && existingItem.img) {
        deleteOldGroceryImage(existingItem.img);
      }

      // 7. RESPONSE

      return res.status(200).json({
        success: true,
        message: "Item Updated Successfully",
        item: result.rows[0],
      });

    } catch (error) {
      console.error("Update Grocery Error:", error);

      // Remove newly uploaded image if update fails
      cleanupUploadedImage(file);

      return res.status(500).json({
        success: false,
        message: "Server Error",
        error: error.message,
      });
    }
  }
);
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
