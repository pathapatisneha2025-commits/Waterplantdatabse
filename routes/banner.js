const express = require("express");
const router = express.Router();

const pool = require("../db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ======================================================
// VPS LOCAL IMAGE STORAGE
// ======================================================

const BASE_URL = (
  process.env.BASE_URL || "https://api2.ajpartyhouse.in"
).replace(/\/+$/, "");

const UPLOAD_DIR = path.join(
  __dirname,
  "../uploads/banners"
);

// Create folder automatically if it does not exist
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ======================================================
// MULTER STORAGE
// ======================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const originalName = path
      .parse(file.originalname)
      .name
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .substring(0, 50);

    cb(
      null,
      `${Date.now()}-${originalName}${extension}`
    );
  },
});

// ======================================================
// FILE FILTER
// ======================================================

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  cb(
    new Error("Only JPG, JPEG, PNG and WEBP images are allowed")
  );
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
});

// ======================================================
// IMAGE HELPERS
// ======================================================

const getImageUrl = (filename) => {
  return `${BASE_URL}/uploads/banners/${encodeURIComponent(filename)}`;
};

// Parse image_url from database
const parseImageUrls = (value) => {
  if (Array.isArray(value)) {
    return value.filter(
      (image) => typeof image === "string" && image.trim() !== ""
    );
  }

  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  const imageValue = value.trim();

  try {
    const parsed = JSON.parse(imageValue);

    if (Array.isArray(parsed)) {
      return parsed.filter(
        (image) => typeof image === "string" && image.trim() !== ""
      );
    }

    if (typeof parsed === "string" && parsed.trim()) {
      return [parsed];
    }

    return [];
  } catch (error) {
    // Support old single-image URL records
    return [imageValue];
  }
};

// Delete only images belonging to this VPS banner folder.
// Old Cloudinary URLs and unrelated URLs are ignored.
const deleteLocalImage = async (imageUrl) => {
  try {
    if (typeof imageUrl !== "string") {
      return;
    }

    const prefix = `${BASE_URL}/uploads/banners/`;

    if (!imageUrl.startsWith(prefix)) {
      return;
    }

    const filename = decodeURIComponent(
      imageUrl.substring(prefix.length)
    );

    // Prevent directory traversal
    if (
      !filename ||
      filename !== path.basename(filename)
    ) {
      return;
    }

    const filePath = path.join(UPLOAD_DIR, filename);

    await fs.promises.unlink(filePath).catch((error) => {
      if (error.code !== "ENOENT") {
        throw error;
      }
    });

    console.log("Deleted banner image:", filename);
  } catch (error) {
    console.error("LOCAL BANNER IMAGE DELETE ERROR:", error.message);
  }
};

// Delete newly uploaded files if a request fails
const cleanupUploadedFiles = async (files = []) => {
  for (const file of files) {
    if (file && file.path) {
      try {
        await fs.promises.unlink(file.path);
      } catch (error) {
        if (error.code !== "ENOENT") {
          console.error(
            "UPLOADED FILE CLEANUP ERROR:",
            error.message
          );
        }
      }
    }
  }
};

// ======================================================
// BOOLEAN HELPER
// ======================================================

const normalizeBoolean = (value, defaultValue = false) => {
  if (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true" ||
    value === "TRUE" ||
    value === "True"
  ) {
    return true;
  }

  if (
    value === false ||
    value === 0 ||
    value === "0" ||
    value === "false" ||
    value === "FALSE" ||
    value === "False"
  ) {
    return false;
  }

  return defaultValue;
};

// ======================================================
// GET ALL BANNERS - ADMIN
// ======================================================

router.get("/admin", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        title,
        subtitle,
        banner_type,
        image_url,
        display_order,
        enabled,
        created_at,
        updated_at
      FROM banners
      ORDER BY
        display_order ASC,
        id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("GET ADMIN BANNERS ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch banners",
      error: error.message,
    });
  }
});

// ======================================================
// GET ACTIVE BANNERS - CUSTOMER APP
// ======================================================

router.get("/active", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        title,
        subtitle,
        banner_type,
        image_url,
        button_text,
        button_screen,
        display_order
      FROM banners
      WHERE enabled = TRUE
      ORDER BY
        display_order ASC,
        id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("GET ACTIVE BANNERS ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch active banners",
      error: error.message,
    });
  }
});

// ======================================================
// GET SINGLE BANNER
// ======================================================

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM banners
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Banner not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("GET BANNER ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch banner",
      error: error.message,
    });
  }
});

// ======================================================
// ADD BANNER
// ======================================================

router.post(
  "/add",
  upload.array("images", 10),
  async (req, res) => {
    try {
      const {
        title,
        subtitle,
        banner_type = "text",
        button_text,
        button_screen,
        display_order = 0,
        enabled = "true",
      } = req.body;

      // VALIDATION
      if (!title && !subtitle) {
        await cleanupUploadedFiles(req.files);

        return res.status(400).json({
          message: "Title or subtitle is required",
        });
      }

      // IMAGE VALIDATION
      if (
        banner_type === "image" &&
        (!req.files || req.files.length === 0)
      ) {
        await cleanupUploadedFiles(req.files);

        return res.status(400).json({
          message: "At least one image is required for image banner",
        });
      }

      // IMAGE URLS
      const imageUrls = (req.files || []).map((file) =>
        getImageUrl(file.filename)
      );

      // INSERT DATABASE
      const result = await pool.query(
        `
        INSERT INTO banners
        (
          title,
          subtitle,
          banner_type,
          image_url,
          button_text,
          button_screen,
          display_order,
          enabled,
          updated_at
        )
        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          CURRENT_TIMESTAMP
        )
        RETURNING *
        `,
        [
          title || null,
          subtitle || null,
          banner_type,
          JSON.stringify(imageUrls),
          button_text || null,
          button_screen || null,
          Number(display_order) || 0,
          normalizeBoolean(enabled, true),
        ]
      );

      res.status(201).json({
        message: "Banner added successfully",
        banner: result.rows[0],
      });
    } catch (error) {
      await cleanupUploadedFiles(req.files);

      console.error("ADD BANNER ERROR:", error);

      res.status(500).json({
        message: "Failed to add banner",
        error: error.message,
      });
    }
  }
);

// ======================================================
// UPDATE BANNER
// ======================================================

router.put(
  "/:id",
  upload.array("images", 10),
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        title,
        subtitle,
        banner_type,
        button_text,
        button_screen,
        display_order,
        enabled,
        existing_images,
      } = req.body;

      console.log("========================================");
      console.log("UPDATE BANNER");
      console.log("ID:", id);
      console.log("BODY:", req.body);
      console.log("FILES:", req.files?.length || 0);
      console.log("========================================");

      // GET EXISTING BANNER
      const existingResult = await pool.query(
        `
        SELECT *
        FROM banners
        WHERE id = $1
        `,
        [id]
      );

      if (existingResult.rows.length === 0) {
        await cleanupUploadedFiles(req.files);

        return res.status(404).json({
          message: "Banner not found",
        });
      }

      const existing = existingResult.rows[0];

      // EXISTING DATABASE IMAGES
      const databaseImages = parseImageUrls(existing.image_url);

      // EXISTING IMAGES SENT FROM FRONTEND
      let keptExistingImages = databaseImages;

      if (existing_images !== undefined) {
        try {
          let parsedExistingImages = existing_images;

          if (typeof parsedExistingImages === "string") {
            parsedExistingImages = JSON.parse(parsedExistingImages);
          }

          if (Array.isArray(parsedExistingImages)) {
            keptExistingImages = parsedExistingImages.filter(
              (image) =>
                typeof image === "string" &&
                image.trim() !== ""
            );
          }
        } catch (error) {
          console.error("EXISTING IMAGES PARSE ERROR:", error);

          // Keep database images if parsing fails
          keptExistingImages = databaseImages;
        }
      }

      // NEW VPS IMAGE URLS
      const newImageUrls = (req.files || [])
        .map((file) => getImageUrl(file.filename))
        .filter(Boolean);

      // COMBINE OLD + NEW IMAGES
      let imageUrls = [
        ...keptExistingImages,
        ...newImageUrls,
      ];

      // REMOVE DUPLICATES
      imageUrls = [...new Set(imageUrls)];

      // FINAL BANNER TYPE
      const finalBannerType =
        banner_type !== undefined &&
        banner_type !== null &&
        banner_type !== ""
          ? banner_type
          : existing.banner_type;

      // TEXT BANNER
      if (finalBannerType === "text") {
        imageUrls = [];
      }

      // IMAGE BANNER VALIDATION
      if (
        finalBannerType === "image" &&
        imageUrls.length === 0
      ) {
        await cleanupUploadedFiles(req.files);

        return res.status(400).json({
          message: "At least one image is required for image banner",
        });
      }

      // MAXIMUM 10 IMAGES
      if (imageUrls.length > 10) {
        await cleanupUploadedFiles(req.files);

        return res.status(400).json({
          message: "Maximum 10 images are allowed per banner",
        });
      }

      // ENABLED VALUE
      const finalEnabled =
        enabled !== undefined
          ? normalizeBoolean(enabled, true)
          : normalizeBoolean(existing.enabled, true);

      // DISPLAY ORDER
      let finalDisplayOrder = 0;

      if (display_order !== undefined) {
        const parsedOrder = Number(display_order);

        finalDisplayOrder = Number.isFinite(parsedOrder)
          ? parsedOrder
          : 0;
      } else {
        finalDisplayOrder = Number(existing.display_order) || 0;
      }

      // FINAL TEXT VALUES
      const finalTitle =
        title !== undefined
          ? title.trim() || null
          : existing.title;

      const finalSubtitle =
        subtitle !== undefined
          ? subtitle.trim() || null
          : existing.subtitle;

      const finalButtonText =
        button_text !== undefined
          ? button_text.trim() || null
          : existing.button_text;

      const finalButtonScreen =
        button_screen !== undefined
          ? button_screen.trim() || null
          : existing.button_screen;

      // UPDATE DATABASE
      const result = await pool.query(
        `
        UPDATE banners
        SET
          title = $1,
          subtitle = $2,
          banner_type = $3,
          image_url = $4,
          button_text = $5,
          button_screen = $6,
          display_order = $7,
          enabled = $8,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $9
        RETURNING *
        `,
        [
          finalTitle,
          finalSubtitle,
          finalBannerType,
          JSON.stringify(imageUrls),
          finalButtonText,
          finalButtonScreen,
          finalDisplayOrder,
          finalEnabled,
          id,
        ]
      );

      // DELETE OLD VPS IMAGES THAT WERE REMOVED
      const imagesToDelete = databaseImages.filter(
        (oldImage) => !imageUrls.includes(oldImage)
      );

      for (const imageUrl of imagesToDelete) {
        await deleteLocalImage(imageUrl);
      }

      // If the banner was changed to text type,
      // newly uploaded images are not retained.
      // Delete those unused uploads.
      if (finalBannerType === "text") {
        await cleanupUploadedFiles(req.files);
      }

      console.log("BANNER UPDATED SUCCESSFULLY:", id);

      return res.json({
        message: "Banner updated successfully",
        banner: result.rows[0],
      });
    } catch (error) {
      await cleanupUploadedFiles(req.files);

      console.error("========================================");
      console.error("UPDATE BANNER ERROR:", error);
      console.error("ERROR MESSAGE:", error.message);
      console.error("ERROR STACK:", error.stack);
      console.error("========================================");

      return res.status(500).json({
        message: "Failed to update banner",
        error: error.message,
      });
    }
  }
);

// ======================================================
// ENABLE / DISABLE BANNER
// ======================================================

router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({
        message: "enabled must be true or false",
      });
    }

    const result = await pool.query(
      `
      UPDATE banners
      SET
        enabled = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
      `,
      [enabled, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Banner not found",
      });
    }

    res.json({
      message: enabled
        ? "Banner enabled successfully"
        : "Banner disabled successfully",
      banner: result.rows[0],
    });
  } catch (error) {
    console.error("STATUS UPDATE ERROR:", error);

    res.status(500).json({
      message: "Failed to update banner status",
      error: error.message,
    });
  }
});

// ======================================================
// DELETE BANNER
// ======================================================

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // VALIDATE ID
    if (!id || !/^\d+$/.test(String(id))) {
      return res.status(400).json({
        message: "Valid banner ID is required",
      });
    }

    // GET BANNER
    const result = await pool.query(
      `
      SELECT
        id,
        title,
        banner_type,
        image_url
      FROM banners
      WHERE id = $1
      `,
      [Number(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Banner not found",
      });
    }

    const banner = result.rows[0];

    // GET IMAGE URLS
    const imageUrls = parseImageUrls(banner.image_url);

    // DELETE DATABASE RECORD FIRST
    await pool.query(
      `
      DELETE FROM banners
      WHERE id = $1
      `,
      [Number(id)]
    );

    // DELETE LOCAL VPS IMAGES
    for (const imageUrl of imageUrls) {
      await deleteLocalImage(imageUrl);
    }

    res.json({
      message: "Banner deleted successfully",
      deleted_banner_id: Number(id),
      deleted_images: imageUrls.length,
    });
  } catch (error) {
    console.error("DELETE BANNER ERROR:", error);

    res.status(500).json({
      message: "Failed to delete banner",
      error: error.message,
    });
  }
});

// ======================================================
// MULTER ERROR HANDLER
// ======================================================

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      message: "Banner image upload error",
      error: error.message,
    });
  }

  if (
    error &&
    error.message &&
    error.message.includes("Only JPG")
  ) {
    return res.status(400).json({
      message: error.message,
    });
  }

  next(error);
});

// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;