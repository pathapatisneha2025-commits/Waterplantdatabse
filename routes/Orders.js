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
    folder: "orders",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    public_id: (req, file) => {
      const nameWithoutExt = path.parse(file.originalname).name;
      return Date.now() + "-" + nameWithoutExt;
    },
  },
});

const upload = multer({ storage });

/* ------------------ PLACE ORDER ------------------ */
router.post("/place", async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      user_id,
      customer_name,
      mobile,
      address,
      landmark,
      pincode,
      payment_mode,
      is_premium,
      total_amount,

      // ==========================================
      // CUSTOMER LIVE LOCATION
      // ==========================================
      latitude,
      longitude,
      location_address,

      // ==========================================
      // BUY NOW / CART
      // ==========================================
      items,
      order_source,
    } = req.body;

    console.log("=================================");
    console.log("PLACE ORDER REQUEST");
    console.log("USER ID:", user_id);
    console.log("CUSTOMER:", customer_name);
    console.log("MOBILE:", mobile);
    console.log("LATITUDE:", latitude);
    console.log("LONGITUDE:", longitude);
    console.log("LOCATION ADDRESS:", location_address);
    console.log("ORDER SOURCE:", order_source);
    console.log(
      "FRONTEND ITEMS:",
      JSON.stringify(items, null, 2)
    );
    console.log("=================================");

    // ==========================================
    // REQUIRED CUSTOMER DETAILS
    // ==========================================

    if (
      !user_id ||
      !customer_name ||
      !mobile ||
      !address ||
      !pincode
    ) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    // ==========================================
    // VALIDATE LOCATION
    // ==========================================

    if (
      latitude === undefined ||
      latitude === null ||
      longitude === undefined ||
      longitude === null
    ) {
      return res.status(400).json({
        message:
          "Customer live location is required. Please detect your current location.",
      });
    }

    const latitudeNumber = Number(latitude);
    const longitudeNumber = Number(longitude);

    if (
      !Number.isFinite(latitudeNumber) ||
      !Number.isFinite(longitudeNumber)
    ) {
      return res.status(400).json({
        message: "Invalid latitude or longitude",
      });
    }

    if (
      latitudeNumber < -90 ||
      latitudeNumber > 90 ||
      longitudeNumber < -180 ||
      longitudeNumber > 180
    ) {
      return res.status(400).json({
        message: "Invalid GPS coordinates",
      });
    }

    // ==========================================
    // START TRANSACTION
    // ==========================================

    await client.query("BEGIN");

    // ==========================================
    // 1. GET ORDER ITEMS
    //
    // BUY NOW:
    //     Use req.body.items
    //
    // CART:
    //     Read from user_cart
    // ==========================================

    let orderItems = [];

    if (
      order_source === "buy_now"
    ) {
      console.log(
        "PROCESSING BUY NOW ORDER"
      );

      // ==========================================
      // BUY NOW VALIDATION
      // ==========================================

      if (
        !Array.isArray(items) ||
        items.length === 0
      ) {
        throw new Error(
          "No Buy Now items received"
        );
      }

      // ==========================================
      // NORMALIZE BUY NOW ITEMS
      // ==========================================

      orderItems = items.map((item) => ({
        item_id:
          item.item_id ??
          item.id ??
          null,

        qty: Number(
          item.qty ??
          item.quantity ??
          1
        ),

        name:
          item.name ||
          item.item_name ||
          "Product",

        item_type:
          item.item_type ||
          "grocery",

        slot:
          item.slot ||
          null,

        price: Number(
          item.price || 0
        ),

        total: Number(
          item.total ??
          (
            Number(
              item.qty ??
              item.quantity ??
              1
            ) *
            Number(
              item.price || 0
            )
          )
        ),
      }));

      console.log(
        "BUY NOW ITEMS:",
        JSON.stringify(
          orderItems,
          null,
          2
        )
      );
    } else {
      // ==========================================
      // NORMAL CART ORDER
      // ==========================================

      console.log(
        "PROCESSING CART ORDER"
      );

      const cartResult =
        await client.query(
          `SELECT
             item_id,
             qty,
             name,
             item_type,
             slot
           FROM user_cart
           WHERE user_id = $1`,
          [user_id]
        );

      if (
        cartResult.rows.length === 0
      ) {
        throw new Error(
          "Cart is empty"
        );
      }

      orderItems =
        cartResult.rows;

      console.log(
        "CART ITEMS:",
        JSON.stringify(
          orderItems,
          null,
          2
        )
      );
    }

    // ==========================================
    // VALIDATE ORDER ITEMS
    // ==========================================

    if (
      !orderItems ||
      orderItems.length === 0
    ) {
      throw new Error(
        "No items found for this order"
      );
    }

    // ==========================================
    // 2. CHECK STOCK & REDUCE GROCERY STOCK
    // ==========================================

    for (const item of orderItems) {
      // Water doesn't use grocery stock
      if (
        item.item_type === "water"
      ) {
        continue;
      }

      const itemId =
        item.item_id;

      if (!itemId) {
        throw new Error(
          `Invalid grocery item ID for ${item.name}`
        );
      }

      const qty = Number(
        item.qty || 1
      );

      if (qty <= 0) {
        throw new Error(
          `Invalid quantity for ${item.name}`
        );
      }

      // ==========================================
      // LOCK STOCK ROW
      // ==========================================

      const stockResult =
        await client.query(
          `SELECT
             stock,
             name
           FROM grocery_items
           WHERE id = $1
           FOR UPDATE`,
          [itemId]
        );

      if (
        !stockResult.rows.length
      ) {
        throw new Error(
          `Item not found (ID: ${itemId})`
        );
      }

      const currentStock =
        Number(
          stockResult.rows[0].stock
        );

      console.log(
        `STOCK CHECK: ${item.name}`,
        "Requested:",
        qty,
        "Available:",
        currentStock
      );

      // ==========================================
      // STOCK VALIDATION
      // ==========================================

      if (
        currentStock < qty
      ) {
        throw new Error(
          `Insufficient stock for ${item.name}. Available: ${currentStock}`
        );
      }

      // ==========================================
      // REDUCE STOCK
      // ==========================================

      await client.query(
        `UPDATE grocery_items
         SET stock = stock - $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [
          qty,
          itemId,
        ]
      );

      console.log(
        `STOCK REDUCED: ${item.name} by ${qty}`
      );
    }

    // ==========================================
    // 3. INSERT ORDER
    // ==========================================

    const insertOrder =
      await client.query(
        `INSERT INTO groceriesorders
          (
            user_id,
            customer_name,
            mobile,
            address,
            landmark,
            pincode,
            payment_mode,
            total_amount,
            is_premium,
            items,

            latitude,
            longitude,
            location_address
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
            $10,

            $11,
            $12,
            $13
          )
        RETURNING *`,
        [
          user_id,
          customer_name,
          mobile,
          address,
          landmark || null,
          pincode,
          payment_mode || "COD",
          Number(
            total_amount || 0
          ),
          is_premium || false,

          // ======================================
          // SAVE ORDER ITEMS
          // ======================================

          JSON.stringify(
            orderItems
          ),

          // ======================================
          // LOCATION
          // ======================================

          latitudeNumber,
          longitudeNumber,
          location_address || null,
        ]
      );

    const createdOrder =
      insertOrder.rows[0];

    console.log(
      "================================="
    );

    console.log(
      "ORDER CREATED:",
      createdOrder.id
    );

    console.log(
      "ORDER SOURCE:",
      order_source
    );

    console.log(
      "SAVED ITEMS:",
      JSON.stringify(
        orderItems,
        null,
        2
      )
    );

    console.log(
      "SAVED LATITUDE:",
      createdOrder.latitude
    );

    console.log(
      "SAVED LONGITUDE:",
      createdOrder.longitude
    );

    console.log(
      "================================="
    );

    // ==========================================
    // 4. UPDATE WATER BOOKING FLAG
    // ==========================================

    const hasWaterOrder =
      orderItems.some(
        (item) =>
          item.item_type ===
          "water"
      );

    if (hasWaterOrder) {
      await client.query(
        `UPDATE users
         SET
           has_booked_water_cans = TRUE,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
           AND has_booked_water_cans = FALSE`,
        [user_id]
      );
    }

    // ==========================================
    // 5. CLEAR CART
    //
    // IMPORTANT:
    //
    // Only clear cart for normal cart checkout.
    //
    // BUY NOW should NOT delete the customer's
    // existing cart.
    // ==========================================

    if (
      order_source !== "buy_now"
    ) {
      await client.query(
        `DELETE FROM user_cart
         WHERE user_id = $1`,
        [user_id]
      );

      console.log(
        "CART CLEARED"
      );
    } else {
      console.log(
        "BUY NOW - CART NOT CLEARED"
      );
    }

    // ==========================================
    // 6. COMMIT
    // ==========================================

    await client.query(
      "COMMIT"
    );

    // ==========================================
    // 7. RESPONSE
    // ==========================================

    res.status(201).json({
      message:
        "Order placed successfully",

      order: createdOrder,

      order_source:
        order_source ||
        "cart",

      location: {
        latitude:
          latitudeNumber,

        longitude:
          longitudeNumber,

        address:
          location_address ||
          null,
      },
    });
  } catch (error) {
    // ==========================================
    // ROLLBACK
    // ==========================================

    await client.query(
      "ROLLBACK"
    );

    console.error(
      "Place order error:",
      error
    );

    res.status(500).json({
      error:
        error.message ||
        "Failed to place order",
    });
  } finally {
    client.release();
  }
});
/* ------------------ GET ALL ORDERS ------------------ */
router.get("/all", async (req, res) => {
  try {
    const orders = await pool.query(
      `SELECT * FROM groceriesorders ORDER BY created_at DESC`
    );

    res.json(orders.rows);
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/* ------------------ GET ORDER BY ID ------------------ */
router.get("/:id", async (req, res) => {
  try {
    const orderId = req.params.id;

    const order = await pool.query(
      `SELECT * FROM groceriesorders WHERE id = $1`,
      [orderId]
    );

    if (order.rowCount === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order.rows[0]);
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/* ------------------ GET ORDERS BY USER ID ------------------ */
router.get("/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const orders = await pool.query(
      `SELECT * FROM groceriesorders WHERE user_id = $1`,
      [userId]
    );

    res.json(orders.rows);
  } catch (error) {
    console.error("Get orders by user_id error:", error);
    res.status(500).json({ error: "Server error" });
  }
});



/* ------------------ UPDATE ORDER STATUS ------------------ */
router.put("/status/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const update = await pool.query(
      `UPDATE groceriesorders SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (update.rowCount === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      message: "Status updated",
      order: update.rows[0],
    });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/* ------------------ DELETE ORDER ------------------ */
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const del = await pool.query(
      `DELETE FROM groceriesorders WHERE id = $1 RETURNING *`,
      [id]
    );

    if (del.rowCount === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Delete order error:", error);
    res.status(500).json({ error: "Server error" });
  }
});
/* ------------------ ASSIGN DRIVER ------------------ */
router.post("/assign-driver", async (req, res) => {
  const { orderId, driverId } = req.body;

  if (!orderId || !driverId) {
    return res
      .status(400)
      .json({ success: false, message: "orderId and driverId are required" });
  }

  try {
    // Check if order exists
    const { rows: orderRows } = await pool.query(
      "SELECT * FROM groceriesorders WHERE id = $1",
      [orderId]
    );

    if (orderRows.length === 0)
      return res.status(404).json({ success: false, message: "Order not found" });

    // Check if driver exists and has role = driver
    const { rows: driverRows } = await pool.query(
      "SELECT * FROM users WHERE id = $1 AND role = 'driver'",
      [driverId]
    );

    if (driverRows.length === 0)
      return res.status(404).json({ success: false, message: "Driver not found" });

    // Assign driver to order
    const { rows: updatedOrder } = await pool.query(
      `UPDATE groceriesorders 
       SET driver_id = $1, status = 'Assigned' 
       WHERE id = $2 
       RETURNING *`,
      [driverId, orderId]
    );

    res.json({
      success: true,
      message: `Driver ${driverRows[0].name} assigned to order #${orderId}`,
      order: updatedOrder[0],
    });
  } catch (error) {
    console.error("Assign driver error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ------------------ GET ORDERS BY DRIVER ------------------ */
router.get("/driver/:driverId", async (req, res) => {
  try {
    const driverId = req.params.driverId;

    if (!driverId) {
      return res
        .status(400)
        .json({ success: false, message: "Driver ID is required" });
    }

    const { rows: orders } = await pool.query(
      `SELECT * FROM groceriesorders 
       WHERE driver_id = $1
       ORDER BY created_at DESC`,
      [driverId]
    );

    res.json({
      success: true,
      driverId,
      orders,
    });
  } catch (error) {
    console.error("Get orders by driver error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET orders + customer locations by driver ID
router.get("/locations/driver/:driverId", async (req, res) => {
  try {
    const driverId = req.params.driverId;

    if (!driverId) {
      return res.status(400).json({ success: false, message: "Driver ID is required" });
    }

    // Fetch assigned orders with customer info
    const { rows: orders } = await pool.query(
      `SELECT o.*, u.name AS customer_name, u.phone AS customer_phone, u.latitude, u.longitude, u.address AS customer_address
       FROM groceriesorders o
       JOIN users u ON o.user_id = u.id
       WHERE o.driver_id = $1
       ORDER BY o.created_at DESC`,
      [driverId]
    );

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get orders by driver error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ------------------ MARK ORDER DELIVERED ------------------ */
router.post("/mark-delivered", async (req, res) => {
  const {
    order_id,
    status,
    notes,
  } = req.body;

  // Only order_id and status are required
  if (!order_id || !status) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }

  try {
    const { rows } = await pool.query(
      `
      UPDATE groceriesorders
      SET
        status = $1,
        notes = $2
      WHERE id = $3
      RETURNING *
      `,
      [
        status,
        notes || null,
        order_id,
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      message: "Order marked as delivered",
      order: rows[0],
    });

  } catch (err) {
    console.error(
      "Mark delivered error:",
      err
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.put("/received/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE groceriesorders 
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      ["Received", id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      message: "Order marked as Received",
      order: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating received status:", error);
    res.status(500).json({ error: "Server error" });
  }
});
router.post(
  "/request",
  upload.array("images", 10),
  async (req, res) => {
    const client = await pool.connect();

    try {
      console.log(
        "RETURN REQUEST BODY:",
        req.body
      );

      console.log(
        "RETURN IMAGES:",
        req.files?.length || 0
      );

      const {
        user_id,
        order_id,
        item_id,
        product_id,
        product_name,
        quantity,
        reason,
        return_days,
      } = req.body;

      // =================================================
      // VALIDATION
      // =================================================

      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: "user_id is required.",
        });
      }

      if (!order_id) {
        return res.status(400).json({
          success: false,
          message: "order_id is required.",
        });
      }

      if (!item_id) {
        return res.status(400).json({
          success: false,
          message: "item_id is required.",
        });
      }

      if (!product_id) {
        return res.status(400).json({
          success: false,
          message: "product_id is required.",
        });
      }

      if (!reason || !reason.trim()) {
        return res.status(400).json({
          success: false,
          message: "Return reason is required.",
        });
      }

      if (reason.trim().length < 5) {
        return res.status(400).json({
          success: false,
          message:
            "Return reason must contain at least 5 characters.",
        });
      }

      // =================================================
      // START TRANSACTION
      // =================================================

      await client.query("BEGIN");

      // =================================================
      // CHECK ORDER
      // =================================================

      const orderResult = await client.query(
        `
        SELECT
          id,
          user_id,
          status,
          delivered_at
        FROM orders
        WHERE id = $1
        FOR UPDATE
        `,
        [order_id]
      );

      if (orderResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          success: false,
          message: "Order not found.",
        });
      }

      const order = orderResult.rows[0];

      // =================================================
      // VERIFY USER OWNS ORDER
      // =================================================

      if (
        Number(order.user_id) !==
        Number(user_id)
      ) {
        await client.query("ROLLBACK");

        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to request a return for this order.",
        });
      }

      // =================================================
      // ORDER MUST BE DELIVERED
      // =================================================

      if (
        String(order.status).toLowerCase() !==
        "delivered"
      ) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message:
            "Return can only be requested for delivered orders.",
        });
      }

      // =================================================
      // CHECK PRODUCT
      // =================================================

      const productResult = await client.query(
        `
        SELECT
          id,
          name,
          return_allowed,
          return_days
        FROM groceries
        WHERE id = $1
        `,
        [product_id]
      );

      if (productResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          success: false,
          message: "Product not found.",
        });
      }

      const product =
        productResult.rows[0];

      // =================================================
      // CHECK RETURN ALLOWED
      // =================================================

      const returnAllowed =
        product.return_allowed === true ||
        product.return_allowed === "true" ||
        product.return_allowed === 1 ||
        product.return_allowed === "1";

      if (!returnAllowed) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message:
            "This product is not eligible for return.",
        });
      }

      // =================================================
      // RETURN DAYS
      // =================================================

      let allowedDays = Number(
        product.return_days
      );

      if (
        Number.isNaN(allowedDays) ||
        allowedDays <= 0
      ) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message:
            "Return period is not configured for this product.",
        });
      }

      // Maximum 7 days
      allowedDays = Math.min(
        allowedDays,
        7
      );

      // =================================================
      // DELIVERY DATE
      // =================================================

      let deliveryDate =
        order.delivered_at;

      if (!deliveryDate) {
        // If your orders table does not have delivered_at
        // and you use updated_at instead, this fallback
        // can be used.

        const fallbackResult =
          await client.query(
            `
            SELECT updated_at
            FROM orders
            WHERE id = $1
            `,
            [order_id]
          );

        deliveryDate =
          fallbackResult.rows[0]
            ?.updated_at;
      }

      if (!deliveryDate) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message:
            "Delivery date is not available for this order.",
        });
      }

      // =================================================
      // CHECK RETURN PERIOD
      // =================================================

      const delivery =
        new Date(deliveryDate);

      if (
        Number.isNaN(
          delivery.getTime()
        )
      ) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message:
            "Invalid delivery date.",
        });
      }

      const today = new Date();

      const deliveryDay =
        new Date(delivery);

      deliveryDay.setHours(
        0,
        0,
        0,
        0
      );

      const deadline =
        new Date(deliveryDay);

      deadline.setDate(
        deadline.getDate() +
          (allowedDays - 1)
      );

      deadline.setHours(
        23,
        59,
        59,
        999
      );

      if (
        today.getTime() >
        deadline.getTime()
      ) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message:
            "The return period for this product has expired.",
        });
      }

      // =================================================
      // CHECK DUPLICATE REQUEST
      // =================================================

      const duplicateResult =
        await client.query(
          `
          SELECT id, return_status
          FROM orders
          WHERE id = $1
            AND return_status IS NOT NULL
          `,
          [order_id]
        );

      if (
        duplicateResult.rows.length > 0
      ) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          message:
            "A return request has already been submitted for this order.",
          return_status:
            duplicateResult.rows[0]
              .return_status,
        });
      }

      // =================================================
      // IMAGE URLS
      // =================================================

      const imageUrls =
        Array.isArray(req.files)
          ? req.files
              .map(
                (file) =>
                  file.path ||
                  file.secure_url
              )
              .filter(Boolean)
          : [];

      console.log(
        "RETURN IMAGE URLS:",
        imageUrls
      );

      // =================================================
      // UPDATE ORDER
      // =================================================

      const updateResult =
        await client.query(
          `
          UPDATE orders
          SET
            return_status = 'pending',
            return_reason = $1,
            return_images = $2::text[],
            return_requested_at = NOW(),
            return_processed_at = NULL
          WHERE id = $3
          RETURNING
            id,
            return_status,
            return_reason,
            return_images,
            return_requested_at
          `,
          [
            reason.trim(),
            imageUrls,
            order_id,
          ]
        );

      // =================================================
      // COMMIT
      // =================================================

      await client.query("COMMIT");

      // =================================================
      // RESPONSE
      // =================================================

      return res.status(201).json({
        success: true,

        message:
          "Return request submitted successfully.",

        return: {
          order_id:
            updateResult.rows[0].id,

          product_id:
            Number(product_id),

          product_name:
            product_name ||
            product.name,

          item_id:
            Number(item_id),

          quantity:
            Number(quantity || 1),

          reason:
            updateResult.rows[0]
              .return_reason,

          return_status:
            updateResult.rows[0]
              .return_status,

          return_images:
            updateResult.rows[0]
              .return_images || [],

          return_requested_at:
            updateResult.rows[0]
              .return_requested_at,
        },
      });
    } catch (error) {
      // =================================================
      // ROLLBACK
      // =================================================

      try {
        await client.query(
          "ROLLBACK"
        );
      } catch (rollbackError) {
        console.error(
          "Rollback error:",
          rollbackError
        );
      }

      console.error(
        "RETURN REQUEST ERROR:",
        error
      );

      // Multer / image errors
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Each return image must be 5 MB or smaller.",
        });
      }

      if (
        error.code ===
        "LIMIT_FILE_COUNT"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Maximum 10 images are allowed.",
        });
      }

      if (
        error.message &&
        error.message.includes(
          "Only image files"
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Only image files are allowed.",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Failed to submit return request.",
        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      });
    } finally {
      client.release();
    }
  }
);


module.exports = router;
