
const express = require("express");
const router = express.Router();
const pool = require("../db");

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ======================================================
// VPS IMAGE STORAGE
// ======================================================

const uploadDir = path.join(
  __dirname,
  "../uploads/todays_deals"
);

// Create folder automatically
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

const BASE_URL =
  process.env.BASE_URL ||
  "https://api2.ajpartyhouse.in";

// ======================================================
// MULTER DISK STORAGE
// ======================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    const safeName = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9_-]/g, "-");

    const filename =
      Date.now() +
      "-" +
      safeName +
      extension;

    cb(null, filename);
  },
});

// ======================================================
// FILE FILTER
// ======================================================

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new Error(
        "Only JPG, JPEG, PNG and WEBP images are allowed"
      ),
      false
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter,
});

// ======================================================
// VPS IMAGE URL HELPER
// ======================================================

const getImageUrl = (filename) => {
  return (
    BASE_URL +
    "/uploads/todays_deals/" +
    filename
  );
};

// ======================================================
// DELETE LOCAL VPS IMAGE
// Only delete images inside today's deals folder.
// ======================================================

const deleteLocalImage = (imageUrl) => {
  try {
    if (!imageUrl) return;

    const imagePrefix =
      BASE_URL + "/uploads/todays_deals/";

    if (!imageUrl.startsWith(imagePrefix)) {
      return;
    }

    const filename = path.basename(
      imageUrl.split("?")[0]
    );

    const imagePath = path.join(
      uploadDir,
      filename
    );

    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);

      console.log(
        "VPS IMAGE DELETED:",
        imagePath
      );
    }
  } catch (error) {
    console.error(
      "IMAGE DELETE ERROR:",
      error
    );
  }
};

// ======================================================
// DATE VALIDATION
// ======================================================

const validateDates = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return "Start date and end date are required";
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return "Invalid start date or end date";
  }

  if (start > end) {
    return "Start date cannot be after end date";
  }

  return null;
};

// ======================================================
// NUMBER HELPER
// ======================================================

const nullableNumber = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return number;
};

// ======================================================
// BOOLEAN HELPER
// ======================================================

const parseBoolean = (value, defaultValue = true) => {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true" || value === "1") {
    return true;
  }

  if (value === "false" || value === "0") {
    return false;
  }

  return defaultValue;
};

// ======================================================
// GET ACTIVE TODAY'S DEALS
// CUSTOMER APP
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
    console.error(
      "GET TODAY'S DEALS ERROR:",
      error
    );

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
    console.error(
      "GET ADMIN TODAY'S DEALS ERROR:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch deals",
      error: error.message,
    });
  }
});

// ======================================================
// ADMIN - GET SINGLE DEAL
// ======================================================

router.get(
  "/admin/todays-deals/:id",
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `
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
      console.error(
        "GET SINGLE DEAL ERROR:",
        error
      );

      res.status(500).json({
        message: "Failed to fetch deal",
        error: error.message,
      });
    }
  }
);

// ======================================================
// ADMIN - CREATE DEAL
// IMAGE -> VPS
// DATABASE -> image_url
// ======================================================

router.post(
  "/admin/todays-deals",
  upload.single("image"),
  async (req, res) => {
    try {
      const {
        title,
        subtitle,
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

      // VALIDATION

      if (!title || !title.trim()) {
        return res.status(400).json({
          message: "Deal title is required",
        });
      }

      const dateError = validateDates(
        start_date,
        end_date
      );

      if (dateError) {
        return res.status(400).json({
          message: dateError,
        });
      }

      // PRICE VALIDATION

      if (
        price !== undefined &&
        price !== null &&
        price !== "" &&
        !Number.isFinite(Number(price))
      ) {
        return res.status(400).json({
          message: "Invalid price",
        });
      }

      if (
        old_price !== undefined &&
        old_price !== null &&
        old_price !== "" &&
        !Number.isFinite(Number(old_price))
      ) {
        return res.status(400).json({
          message: "Invalid old price",
        });
      }

      if (
        product_id !== undefined &&
        product_id !== null &&
        product_id !== "" &&
        !Number.isFinite(Number(product_id))
      ) {
        return res.status(400).json({
          message: "Product ID must be a number",
        });
      }

      // VPS IMAGE URL

      let imageUrl = null;

      if (req.file) {
        imageUrl = getImageUrl(req.file.filename);

        console.log(
          "TODAY'S DEAL VPS IMAGE:",
          imageUrl
        );
      }

      // INSERT DATABASE

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
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13
        )
        RETURNING *
        `,
        [
          title.trim(),
          subtitle?.trim() || null,
          imageUrl,
          discount_text?.trim() || null,
          nullableNumber(price),
          nullableNumber(old_price),
          button_text?.trim() || "Order Now",
          button_screen?.trim() || null,
          nullableNumber(product_id),
          category?.trim() || null,
          parseBoolean(is_active, true),
          start_date,
          end_date,
        ]
      );

      return res.status(201).json({
        message: "Deal created successfully",
        deal: result.rows[0],
      });

    } catch (error) {
      console.error(
        "CREATE DEAL ERROR:",
        error
      );

      // Remove newly uploaded file if DB insert fails
      if (req.file) {
        deleteLocalImage(
          getImageUrl(req.file.filename)
        );
      }

      return res.status(500).json({
        message: "Failed to create deal",
        error: error.message,
      });
    }
  }
);

// ======================================================
// ADMIN - UPDATE DEAL
// NEW IMAGE -> VPS
// OLD IMAGE -> PRESERVED IF NO NEW IMAGE
// ======================================================

router.put(
  "/admin/todays-deals/:id",
  upload.single("image"),
  async (req, res) => {
    let newImageUrl = null;

    try {
      const { id } = req.params;

      const {
        title,
        subtitle,
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

      // VALIDATION

      if (!title || !title.trim()) {
        return res.status(400).json({
          message: "Deal title is required",
        });
      }

      const dateError = validateDates(
        start_date,
        end_date
      );

      if (dateError) {
        return res.status(400).json({
          message: dateError,
        });
      }

      // GET EXISTING DEAL

      const existingResult = await pool.query(
        `
        SELECT *
        FROM todays_deals
        WHERE id = $1
        `,
        [id]
      );

      if (existingResult.rows.length === 0) {
        return res.status(404).json({
          message: "Deal not found",
        });
      }

      const existingDeal = existingResult.rows[0];

      // KEEP OLD IMAGE BY DEFAULT

      let imageUrl = existingDeal.image_url || null;

      // NEW VPS IMAGE

      if (req.file) {
        newImageUrl = getImageUrl(req.file.filename);
        imageUrl = newImageUrl;

        console.log(
          "UPDATED DEAL VPS IMAGE:",
          imageUrl
        );
      }

      // UPDATE DATABASE

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
          imageUrl,
          discount_text?.trim() || null,
          nullableNumber(price),
          nullableNumber(old_price),
          button_text?.trim() || "Order Now",
          button_screen?.trim() || null,
          nullableNumber(product_id),
          category?.trim() || null,
          parseBoolean(is_active, false),
          start_date,
          end_date,
          id,
        ]
      );

      // DELETE OLD LOCAL IMAGE AFTER SUCCESSFUL UPDATE
      if (
        newImageUrl &&
        existingDeal.image_url &&
        existingDeal.image_url !== newImageUrl
      ) {
        deleteLocalImage(existingDeal.image_url);
      }

      return res.json({
        message: "Deal updated successfully",
        deal: result.rows[0],
      });

    } catch (error) {
      console.error(
        "UPDATE DEAL ERROR:",
        error
      );

      // Remove newly uploaded file if update fails
      if (newImageUrl) {
        deleteLocalImage(newImageUrl);
      }

      return res.status(500).json({
        message: "Failed to update deal",
        error: error.message,
      });
    }
  }
);

// ======================================================
// ADMIN - TOGGLE ACTIVE / INACTIVE
// ======================================================

router.patch(
  "/admin/todays-deals/:id/toggle",
  async (req, res) => {
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

      return res.json({
        message: result.rows[0].is_active
          ? "Deal activated"
          : "Deal deactivated",

        deal: result.rows[0],
      });

    } catch (error) {
      console.error(
        "TOGGLE DEAL ERROR:",
        error
      );

      return res.status(500).json({
        message: "Failed to update deal status",
        error: error.message,
      });
    }
  }
);

// ======================================================
// ADMIN - DELETE DEAL
// DELETE DATABASE RECORD + LOCAL VPS IMAGE
// ======================================================

router.delete(
  "/admin/todays-deals/:id",
  async (req, res) => {
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

      // Delete associated local VPS image
      deleteLocalImage(
        result.rows[0].image_url
      );

      return res.json({
        message: "Deal deleted successfully",
        deal: result.rows[0],
      });

    } catch (error) {
      console.error(
        "DELETE DEAL ERROR:",
        error
      );

      return res.status(500).json({
        message: "Failed to delete deal",
        error: error.message,
      });
    }
  }
);

// ======================================================
// MULTER ERROR HANDLER
// ======================================================

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "Image size must be less than 5 MB",
      });
    }

    return res.status(400).json({
      message: error.message,
    });
  }

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  next();
});

// ======================================================
// EXPORT
// ======================================================

module.exports = router;
