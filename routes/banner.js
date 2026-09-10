const express = require("express");

const router = express.Router();

const pool = require("../db");

const multer = require("multer");

const path = require("path");

const {
  CloudinaryStorage,
} = require("multer-storage-cloudinary");

const cloudinary = require("../cloudinary");


// ======================================================
// CLOUDINARY STORAGE
// ======================================================

const storage = new CloudinaryStorage({

  cloudinary,

  params: {

    folder: "banners",

    allowed_formats: [
      "jpg",
      "png",
      "jpeg",
      "webp",
    ],

    public_id: (req, file) => {

      const nameWithoutExt =
        path.parse(
          file.originalname
        ).name;

      return (
        Date.now() +
        "-" +
        nameWithoutExt
      );

    },

  },

});


const upload = multer({
  storage,
});


// ======================================================
// GET ALL BANNERS - ADMIN
// ======================================================

router.get(
  "/admin",
  async (req, res) => {
    try {

      const result =
        await pool.query(`
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

      res.json(
        result.rows
      );

    } catch (error) {

      console.error(
        "GET ADMIN BANNERS ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch banners",

        error:
          error.message,
      });
    }
  }
);

// ======================================================
// GET ACTIVE BANNERS - CUSTOMER APP
// ======================================================

router.get(
  "/active",
  async (req, res) => {

    try {

      const result =
        await pool.query(`
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


      res.json(
        result.rows
      );


    } catch (error) {

      console.error(
        "GET ACTIVE BANNERS ERROR:",
        error
      );


      res.status(500).json({

        message:
          "Failed to fetch active banners",

        error:
          error.message,

      });

    }

  }
);


// ======================================================
// GET SINGLE BANNER
// ======================================================

router.get(
  "/:id",
  async (req, res) => {

    try {

      const {
        id
      } = req.params;


      const result =
        await pool.query(
          `
          SELECT *
          FROM banners
          WHERE id = $1
          `,
          [id]
        );


      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({

          message:
            "Banner not found",

        });

      }


      res.json(
        result.rows[0]
      );


    } catch (error) {

      console.error(
        "GET BANNER ERROR:",
        error
      );


      res.status(500).json({

        message:
          "Failed to fetch banner",

        error:
          error.message,

      });

    }

  }
);


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

      // ==================================================
      // VALIDATION
      // ==================================================

      if (!title && !subtitle) {
        return res.status(400).json({
          message: "Title or subtitle is required",
        });
      }

      // ==================================================
      // IMAGE VALIDATION
      // ==================================================

      if (
        banner_type === "image" &&
        (!req.files || req.files.length === 0)
      ) {
        return res.status(400).json({
          message: "At least one image is required for image banner",
        });
      }

      // ==================================================
      // IMAGE URLS
      // ==================================================

      let imageUrls = [];

      if (req.files && req.files.length > 0) {
        imageUrls = req.files.map((file) => file.path);
      }

      // ==================================================
      // INSERT DATABASE
      // ==================================================

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

          enabled === true || enabled === "true",
        ]
      );

      // ==================================================
      // RESPONSE
      // ==================================================

      res.status(201).json({
        message: "Banner added successfully",

        banner: result.rows[0],
      });
    } catch (error) {
      console.error(
        "ADD BANNER ERROR:",
        error
      );

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

      // ==================================================
      // GET EXISTING BANNER
      // ==================================================

      const existingResult = await pool.query(
        `
        SELECT *
        FROM banners
        WHERE id = $1
        `,
        [id]
      );

      if (existingResult.rows.length === 0) {
        return res.status(404).json({
          message: "Banner not found",
        });
      }

      const existing = existingResult.rows[0];

      // ==================================================
      // HELPER - NORMALIZE BOOLEAN
      // ==================================================

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

      // ==================================================
      // EXISTING DATABASE IMAGES
      // ==================================================

      let databaseImages = [];

      if (Array.isArray(existing.image_url)) {
        databaseImages = existing.image_url.filter(Boolean);
      } else if (
        typeof existing.image_url === "string" &&
        existing.image_url.trim() !== ""
      ) {
        const value = existing.image_url.trim();

        try {
          const parsed = JSON.parse(value);

          if (Array.isArray(parsed)) {
            databaseImages = parsed.filter(Boolean);
          } else if (parsed) {
            databaseImages = [parsed];
          }
        } catch (error) {
          // Old single image URL
          databaseImages = [value];
        }
      }

      // ==================================================
      // EXISTING IMAGES SENT FROM FRONTEND
      // ==================================================

      let keptExistingImages = databaseImages;

      if (existing_images !== undefined) {
        try {
          let parsedExistingImages = existing_images;

          // If multipart sends JSON string
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
          console.error(
            "EXISTING IMAGES PARSE ERROR:",
            error
          );

          // Keep database images if parsing fails
          keptExistingImages = databaseImages;
        }
      }

      // ==================================================
      // NEW CLOUDINARY IMAGES
      // ==================================================

      const newImageUrls =
        req.files &&
        Array.isArray(req.files)
          ? req.files
              .map((file) => file.path)
              .filter(Boolean)
          : [];

      // ==================================================
      // COMBINE OLD + NEW IMAGES
      // ==================================================

      let imageUrls = [
        ...keptExistingImages,
        ...newImageUrls,
      ];

      // Remove duplicate URLs
      imageUrls = [...new Set(imageUrls)];

      // ==================================================
      // FINAL BANNER TYPE
      // ==================================================

      const finalBannerType =
        banner_type !== undefined &&
        banner_type !== null &&
        banner_type !== ""
          ? banner_type
          : existing.banner_type;

      // ==================================================
      // TEXT BANNER
      // ==================================================

      if (finalBannerType === "text") {
        imageUrls = [];
      }

      // ==================================================
      // IMAGE BANNER VALIDATION
      // ==================================================

      if (
        finalBannerType === "image" &&
        imageUrls.length === 0
      ) {
        return res.status(400).json({
          message:
            "At least one image is required for image banner",
        });
      }

      // ==================================================
      // MAXIMUM 10 IMAGES
      // ==================================================

      if (imageUrls.length > 10) {
        return res.status(400).json({
          message:
            "Maximum 10 images are allowed per banner",
        });
      }

      // ==================================================
      // ENABLED VALUE
      // ==================================================

      const finalEnabled =
        enabled !== undefined
          ? normalizeBoolean(enabled, true)
          : normalizeBoolean(existing.enabled, true);

      console.log(
        "ENABLED FROM REQUEST:",
        enabled,
        typeof enabled
      );

      console.log(
        "FINAL ENABLED:",
        finalEnabled,
        typeof finalEnabled
      );

      // ==================================================
      // DISPLAY ORDER
      // ==================================================

      let finalDisplayOrder = 0;

      if (display_order !== undefined) {
        const parsedOrder = Number(display_order);

        finalDisplayOrder = Number.isFinite(parsedOrder)
          ? parsedOrder
          : 0;
      } else {
        finalDisplayOrder =
          Number(existing.display_order) || 0;
      }

      // ==================================================
      // FINAL TEXT VALUES
      // ==================================================

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

      // ==================================================
      // UPDATE DATABASE
      // ==================================================

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

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.json({
        message: "Banner updated successfully",
        banner: result.rows[0],
      });

    } catch (error) {
      console.error(
        "========================================"
      );

      console.error(
        "UPDATE BANNER ERROR:",
        error
      );

      console.error(
        "ERROR MESSAGE:",
        error.message
      );

      console.error(
        "ERROR STACK:",
        error.stack
      );

      console.error(
        "========================================"
      );

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

router.patch(
  "/:id/status",

  async (req, res) => {

    try {

      const {
        id
      } = req.params;


      const {
        enabled
      } = req.body;


      if (
        typeof enabled !==
        "boolean"
      ) {

        return res.status(400).json({

          message:
            "enabled must be true or false",

        });

      }


      const result =
        await pool.query(
          `
          UPDATE banners

          SET

            enabled = $1,

            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = $2

          RETURNING *
          `,

          [
            enabled,
            id
          ]
        );


      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({

          message:
            "Banner not found",

        });

      }


      res.json({

        message:
          enabled
            ? "Banner enabled successfully"
            : "Banner disabled successfully",

        banner:
          result.rows[0],

      });


    } catch (error) {

      console.error(
        "STATUS UPDATE ERROR:",
        error
      );


      res.status(500).json({

        message:
          "Failed to update banner status",

        error:
          error.message,

      });

    }

  }
);


// ======================================================
// DELETE BANNER
// ======================================================

// ======================================================
// DELETE BANNER
// ======================================================

router.delete(
  "/:id",

  async (req, res) => {
    try {
      const { id } = req.params;

      // ==================================================
      // VALIDATE ID
      // ==================================================

      if (!id || !/^\d+$/.test(String(id))) {
        return res.status(400).json({
          message: "Valid banner ID is required",
        });
      }

      // ==================================================
      // GET BANNER
      // ==================================================

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

      // ==================================================
      // GET IMAGE URLS
      // ==================================================

      let imageUrls = [];

      if (Array.isArray(banner.image_url)) {
        imageUrls = banner.image_url.filter(Boolean);
      } else if (
        typeof banner.image_url === "string" &&
        banner.image_url.trim() !== ""
      ) {
        const imageValue = banner.image_url.trim();

        try {
          const parsed = JSON.parse(imageValue);

          if (Array.isArray(parsed)) {
            imageUrls = parsed.filter(Boolean);
          } else if (typeof parsed === "string") {
            imageUrls = [parsed];
          }
        } catch (error) {
          // Old records may contain a normal Cloudinary URL
          imageUrls = [imageValue];
        }
      }

      // ==================================================
      // DELETE CLOUDINARY IMAGES
      // ==================================================

      if (imageUrls.length > 0) {
        for (const imageUrl of imageUrls) {
          try {
            if (
              typeof imageUrl !== "string" ||
              !imageUrl.includes("cloudinary.com")
            ) {
              continue;
            }

            /*
              Example Cloudinary URL:

              https://res.cloudinary.com/demo/image/upload/v1234567890/banners/12345-banner.jpg

              We need:

              banners/12345-banner
            */

            const uploadIndex =
              imageUrl.indexOf("/upload/");

            if (uploadIndex === -1) {
              continue;
            }

            let publicIdWithExtension =
              imageUrl.substring(
                uploadIndex + "/upload/".length
              );

            // Remove transformations/version folders
            const parts =
              publicIdWithExtension.split("/");

            const versionIndex =
              parts.findIndex((part) =>
                /^v\d+$/.test(part)
              );

            if (versionIndex !== -1) {
              publicIdWithExtension =
                parts
                  .slice(versionIndex + 1)
                  .join("/");
            }

            // Remove file extension
            const publicId =
              publicIdWithExtension.replace(
                /\.[^/.]+$/,
                ""
              );

            if (!publicId) {
              continue;
            }

            console.log(
              "Deleting Cloudinary image:",
              publicId
            );

            await cloudinary.uploader.destroy(
              publicId,
              {
                resource_type: "image",
              }
            );

          } catch (cloudinaryError) {

            console.error(
              "CLOUDINARY IMAGE DELETE ERROR:",
              cloudinaryError.message
            );

            // Continue deleting other images
          }
        }
      }

      // ==================================================
      // DELETE DATABASE RECORD
      // ==================================================

      await pool.query(
        `
        DELETE FROM banners
        WHERE id = $1
        `,
        [Number(id)]
      );

      // ==================================================
      // RESPONSE
      // ==================================================

      res.json({
        message: "Banner deleted successfully",
        deleted_banner_id: Number(id),
        deleted_images: imageUrls.length,
      });

    } catch (error) {

      console.error(
        "DELETE BANNER ERROR:",
        error
      );

      res.status(500).json({
        message: "Failed to delete banner",
        error: error.message,
      });
    }
  }
);


module.exports = router;