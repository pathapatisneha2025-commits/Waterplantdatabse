const express = require("express");
const router = express.Router();
const pool = require("../db");

const multer = require("multer");
const cloudinary = require("../cloudinary");

// ======================================================
// MULTER CONFIGURATION
// ======================================================

const storage = multer.memoryStorage();

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

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          "Only JPG, JPEG, PNG and WEBP images are allowed"
        )
      );
    }

    cb(null, true);
  },
});

// ======================================================
// CLOUDINARY UPLOAD HELPER
// ======================================================

const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return resolve(null);
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "todays_deals",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      }
    );

    stream.end(file.buffer);
  });
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

  if (Number.isNaN(number)) {
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
// IMAGE -> CLOUDINARY
// DATABASE -> ONLY image_url
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

      // ==================================================
      // VALIDATION
      // ==================================================

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

      // ==================================================
      // PRICE VALIDATION
      // ==================================================

      if (
        price !== undefined &&
        price !== null &&
        price !== "" &&
        Number.isNaN(Number(price))
      ) {
        return res.status(400).json({
          message: "Invalid price",
        });
      }

      if (
        old_price !== undefined &&
        old_price !== null &&
        old_price !== "" &&
        Number.isNaN(Number(old_price))
      ) {
        return res.status(400).json({
          message: "Invalid old price",
        });
      }

      if (
        product_id !== undefined &&
        product_id !== null &&
        product_id !== "" &&
        Number.isNaN(Number(product_id))
      ) {
        return res.status(400).json({
          message: "Product ID must be a number",
        });
      }

      // ==================================================
      // CLOUDINARY IMAGE
      // ==================================================

      let imageUrl = null;

      if (req.file) {
        try {
          const uploaded =
            await uploadToCloudinary(req.file);

          imageUrl = uploaded.secure_url;

          console.log(
            "Today's Deal image uploaded:",
            imageUrl
          );
        } catch (uploadError) {
          console.error(
            "CLOUDINARY UPLOAD ERROR:",
            uploadError
          );

          return res.status(500).json({
            message: "Failed to upload deal image",
            error: uploadError.message,
          });
        }
      }

      // ==================================================
      // INSERT
      // IMPORTANT:
      // NO image_public_id HERE
      // ==================================================

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

      return res.status(500).json({
        message: "Failed to create deal",
        error: error.message,
      });
    }
  }
);

// ======================================================
// ADMIN - UPDATE DEAL
// IMAGE OPTIONAL
// NEW IMAGE -> CLOUDINARY
// DATABASE -> ONLY image_url
// ======================================================

router.put(
  "/admin/todays-deals/:id",
  upload.single("image"),
  async (req, res) => {
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

      // ==================================================
      // VALIDATION
      // ==================================================

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

      // ==================================================
      // GET EXISTING DEAL
      // ==================================================

      const existingResult = await pool.query(
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
          end_date
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

      const existingDeal =
        existingResult.rows[0];

      // ==================================================
      // KEEP OLD IMAGE BY DEFAULT
      // ==================================================

      let imageUrl =
        existingDeal.image_url || null;

      // ==================================================
      // IF NEW IMAGE SELECTED
      // UPLOAD TO CLOUDINARY
      // ==================================================

      if (req.file) {
        try {
          const uploaded =
            await uploadToCloudinary(req.file);

          imageUrl = uploaded.secure_url;

          console.log(
            "Updated Today's Deal image:",
            imageUrl
          );
        } catch (uploadError) {
          console.error(
            "CLOUDINARY UPDATE UPLOAD ERROR:",
            uploadError
          );

          return res.status(500).json({
            message:
              "Failed to upload new deal image",
            error: uploadError.message,
          });
        }
      }

      // ==================================================
      // UPDATE
      // IMPORTANT:
      // NO image_public_id
      // ==================================================

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

      return res.json({
        message: "Deal updated successfully",
        deal: result.rows[0],
      });
    } catch (error) {
      console.error(
        "UPDATE DEAL ERROR:",
        error
      );

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
//
// IMPORTANT:
// Since image_public_id is NOT stored in DB,
// we cannot safely delete the Cloudinary file.
// The database deal will still be deleted correctly.
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
        message:
          "Image size must be less than 5 MB",
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