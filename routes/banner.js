const express = require("express");
const router = express.Router();

const pool = require("../db");
const cloudinary = require("../cloudinary");

const multer = require("multer");
const streamifier = require("streamifier");


// ======================================================
// MULTER
// ======================================================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {

    if (!file.mimetype.startsWith("image/")) {
      return cb(
        new Error("Only image files are allowed")
      );
    }

    cb(null, true);
  },
});


// ======================================================
// UPLOAD IMAGE TO CLOUDINARY
// ======================================================

const uploadToCloudinary = (fileBuffer) => {

  return new Promise((resolve, reject) => {

    const stream =
      cloudinary.uploader.upload_stream(
        {
          folder: "banners",
          resource_type: "image",
        },

        (error, result) => {

          if (error) {
            reject(error);
          } else {
            resolve(result);
          }

        }
      );

    streamifier
      .createReadStream(fileBuffer)
      .pipe(stream);

  });

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
        cloudinary_public_id,
        button_text,
        button_screen,
        display_order,
        enabled,
        created_at,
        updated_at
      FROM banners
      ORDER BY display_order ASC, id DESC
    `);

    res.json(result.rows);

  } catch (error) {

    console.error(
      "GET ADMIN BANNERS ERROR:",
      error
    );

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
      ORDER BY display_order ASC, id DESC
    `);

    res.json(result.rows);

  } catch (error) {

    console.error(
      "GET ACTIVE BANNERS ERROR:",
      error
    );

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

    console.error(
      "GET BANNER ERROR:",
      error
    );

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
  "/",
  upload.single("image"),
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


      let imageUrl = null;
      let cloudinaryPublicId = null;


      // ---------------------------------------------
      // IMAGE BANNER
      // ---------------------------------------------

      if (banner_type === "image") {

        if (!req.file) {

          return res.status(400).json({
            message:
              "Image is required for image banner",
          });

        }


        const uploaded =
          await uploadToCloudinary(
            req.file.buffer
          );


        imageUrl =
          uploaded.secure_url;

        cloudinaryPublicId =
          uploaded.public_id;

      }


      // ---------------------------------------------
      // INSERT
      // ---------------------------------------------

      const result =
        await pool.query(
          `
          INSERT INTO banners
          (
            title,
            subtitle,
            banner_type,
            image_url,
            cloudinary_public_id,
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
            $9,
            CURRENT_TIMESTAMP
          )
          RETURNING *
          `,
          [
            title || null,
            subtitle || null,
            banner_type,
            imageUrl,
            cloudinaryPublicId,
            button_text || null,
            button_screen || null,
            Number(display_order) || 0,
            enabled === true ||
              enabled === "true",
          ]
        );


      res.status(201).json({
        message:
          "Banner added successfully",
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
  upload.single("image"),
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
      } = req.body;


      // ---------------------------------------------
      // GET EXISTING
      // ---------------------------------------------

      const existingResult =
        await pool.query(
          `
          SELECT *
          FROM banners
          WHERE id = $1
          `,
          [id]
        );


      if (
        existingResult.rows.length === 0
      ) {

        return res.status(404).json({
          message: "Banner not found",
        });

      }


      const existing =
        existingResult.rows[0];


      let imageUrl =
        existing.image_url;

      let cloudinaryPublicId =
        existing.cloudinary_public_id;


      // ---------------------------------------------
      // NEW IMAGE
      // ---------------------------------------------

      if (req.file) {

        const uploaded =
          await uploadToCloudinary(
            req.file.buffer
          );


        imageUrl =
          uploaded.secure_url;

        cloudinaryPublicId =
          uploaded.public_id;


        // Delete old Cloudinary image

        if (
          existing.cloudinary_public_id
        ) {

          try {

            await cloudinary.uploader.destroy(
              existing.cloudinary_public_id
            );

          } catch (cloudinaryError) {

            console.log(
              "OLD IMAGE DELETE ERROR:",
              cloudinaryError.message
            );

          }

        }

      }


      // ---------------------------------------------
      // CHANGED TO TEXT
      // ---------------------------------------------

      if (
        banner_type === "text"
      ) {

        if (
          existing.cloudinary_public_id
        ) {

          try {

            await cloudinary.uploader.destroy(
              existing.cloudinary_public_id
            );

          } catch (error) {

            console.log(
              "CLOUDINARY DELETE ERROR:",
              error.message
            );

          }

        }


        imageUrl = null;

        cloudinaryPublicId = null;

      }


      // ---------------------------------------------
      // UPDATE
      // ---------------------------------------------

      const result =
        await pool.query(
          `
          UPDATE banners
          SET
            title = $1,
            subtitle = $2,
            banner_type = $3,
            image_url = $4,
            cloudinary_public_id = $5,
            button_text = $6,
            button_screen = $7,
            display_order = $8,
            enabled = $9,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $10
          RETURNING *
          `,
          [
            title || null,
            subtitle || null,
            banner_type ||
              existing.banner_type,
            imageUrl,
            cloudinaryPublicId,
            button_text || null,
            button_screen || null,
            Number(display_order) || 0,
            enabled === true ||
              enabled === "true",
            id,
          ]
        );


      res.json({
        message:
          "Banner updated successfully",
        banner: result.rows[0],
      });

    } catch (error) {

      console.error(
        "UPDATE BANNER ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Failed to update banner",
        error: error.message,
      });

    }

  }
);


// ======================================================
// ENABLE / DISABLE
// ======================================================

router.patch(
  "/:id/status",
  async (req, res) => {

    try {

      const { id } = req.params;

      const { enabled } =
        req.body;


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
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING *
          `,
          [enabled, id]
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
        message: enabled
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
        error: error.message,
      });

    }

  }
);


// ======================================================
// DELETE BANNER
// ======================================================

router.delete(
  "/:id",
  async (req, res) => {

    try {

      const { id } =
        req.params;


      // ---------------------------------------------
      // GET BANNER
      // ---------------------------------------------

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


      const banner =
        result.rows[0];


      // ---------------------------------------------
      // DELETE CLOUDINARY IMAGE
      // ---------------------------------------------

      if (
        banner.cloudinary_public_id
      ) {

        try {

          await cloudinary.uploader.destroy(
            banner.cloudinary_public_id
          );

        } catch (error) {

          console.log(
            "CLOUDINARY DELETE ERROR:",
            error.message
          );

        }

      }


      // ---------------------------------------------
      // DELETE DATABASE
      // ---------------------------------------------

      await pool.query(
        `
        DELETE FROM banners
        WHERE id = $1
        `,
        [id]
      );


      res.json({
        message:
          "Banner deleted successfully",
      });

    } catch (error) {

      console.error(
        "DELETE BANNER ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Failed to delete banner",
        error: error.message,
      });

    }

  }
);


module.exports = router;