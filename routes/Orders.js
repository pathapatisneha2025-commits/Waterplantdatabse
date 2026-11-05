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
  let transactionStarted = false;

  try {
    const {
      user_id,
      customer_name,
      mobile,
      address,
      landmark,
      pincode,
      payment_mode,
      total_amount,
      latitude,
      longitude,
      location_address,
      items,
      order_source,
    } = req.body;

    // ==========================================
    // LOG REQUEST
    // ==========================================

    console.log("=================================");
    console.log("PLACE ORDER REQUEST");
    console.log("USER ID:", user_id);
    console.log("CUSTOMER:", customer_name);
    console.log("ORDER SOURCE:", order_source);
    console.log("FRONTEND ITEMS:", JSON.stringify(items, null, 2));
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
      !Number.isFinite(longitudeNumber) ||
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
    transactionStarted = true;

    // ==========================================
    // FETCH PREMIUM STATUS FROM USERS TABLE
    // NEVER TRUST FRONTEND is_premium
    // ==========================================

    const userResult = await client.query(
      `
      SELECT
        id,
        is_premium
      FROM users
      WHERE id = $1
      FOR UPDATE
      `,
      [user_id]
    );

    if (userResult.rows.length === 0) {
      throw new Error("Customer not found");
    }

    const isPremium =
      userResult.rows[0].is_premium === true;

    console.log("CUSTOMER PREMIUM STATUS:", {
      user_id,
      is_premium: isPremium,
    });

    let orderItems = [];

    // ==========================================
    // 1. BUY NOW ORDER
    // ==========================================

    if (order_source === "buy_now") {
      console.log("PROCESSING BUY NOW ORDER");

      if (!Array.isArray(items) || items.length === 0) {
        throw new Error("No Buy Now items received");
      }

      orderItems = items.map((item) => {
        const qty = Number(
          item.qty ?? item.quantity ?? 1
        );

        const price = Number(item.price ?? 0);

        const itemType = String(
          item.item_type || "grocery"
        ).toLowerCase().trim();

        return {
          item_id: item.item_id ?? item.id ?? null,
          qty,
          name: item.name || item.item_name || "Product",
          item_type: itemType,
          slot: item.slot || null,
          price,
          total: Number((qty * price).toFixed(2)),
        };
      });

      console.log(
        "BUY NOW ITEMS:",
        JSON.stringify(orderItems, null, 2)
      );
    }

    // ==========================================
    // 2. NORMAL CART ORDER
    // ==========================================

    else {
      console.log("PROCESSING CART ORDER");

      const cartResult = await client.query(
        `
        SELECT
          uc.id AS cart_id,
          uc.item_id,
          uc.qty,
          uc.name,
          uc.item_type,
          uc.slot,

          uc.price AS cart_price,
          uc.premium_price AS cart_premium_price,

          gi.price AS product_price

        FROM user_cart uc

        LEFT JOIN grocery_items gi
          ON gi.id = uc.item_id

        WHERE uc.user_id = $1

        ORDER BY uc.id DESC
        `,
        [user_id]
      );

      if (cartResult.rows.length === 0) {
        throw new Error("Cart is empty");
      }

      orderItems = cartResult.rows.map((item) => {
        const qty = Number(item.qty || 1);

        const itemType = String(
          item.item_type || "grocery"
        ).toLowerCase().trim();

        const isWater = itemType === "water";

        let price = 0;

        // ======================================
        // WATER CAN PRICE
        // FROM user_cart.price
        // ======================================

        if (isWater) {
          price = Number(item.cart_price);
        }

        // ======================================
        // GROCERY PRICE
        // ======================================

        else {
          if (isPremium) {
            price = Number(
              item.cart_premium_price ??
              item.product_price ??
              item.cart_price
            );
          } else {
            price = Number(
              item.product_price ??
              item.cart_price
            );
          }
        }

        if (
          !Number.isFinite(price) ||
          price <= 0
        ) {
          throw new Error(
            `Invalid price for ${item.name}. Cart price: ${item.cart_price}`
          );
        }

        const total = Number(
          (qty * price).toFixed(2)
        );

        console.log("PLACE ORDER CART PRICE:", {
          cart_id: item.cart_id,
          item_id: item.item_id,
          name: item.name,
          item_type: itemType,
          cart_price: item.cart_price,
          cart_premium_price: item.cart_premium_price,
          product_price: item.product_price,
          final_price: price,
          qty,
          total,
        });

        return {
          item_id: item.item_id,
          qty,
          name: item.name || "Product",
          item_type: isWater ? "water" : "grocery",
          slot: item.slot || null,
          price,
          total,
        };
      });

      console.log(
        "FINAL CART ORDER ITEMS:",
        JSON.stringify(orderItems, null, 2)
      );
    }

    // ==========================================
    // 3. VALIDATE ORDER ITEMS
    // ==========================================

    if (!orderItems.length) {
      throw new Error("No items found for this order");
    }

    for (const item of orderItems) {
      const qty = Number(item.qty);
      const price = Number(item.price);

      if (!Number.isFinite(qty) || qty <= 0) {
        throw new Error(
          `Invalid quantity for ${item.name}`
        );
      }

      if (!Number.isFinite(price) || price <= 0) {
        throw new Error(
          `Invalid price for ${item.name}`
        );
      }

      item.total = Number(
        (qty * price).toFixed(2)
      );

      console.log("ITEM PRICE CHECK:", {
        name: item.name,
        item_type: item.item_type,
        qty,
        price,
        total: item.total,
      });
    }

    // ==========================================
    // 4. CHECK STOCK & REDUCE GROCERY STOCK
    // ==========================================

    for (const item of orderItems) {
      if (item.item_type === "water") {
        continue;
      }

      const itemId = item.item_id;
      const qty = Number(item.qty);

      if (!itemId) {
        throw new Error(
          `Invalid grocery item ID for ${item.name}`
        );
      }

      const stockResult = await client.query(
        `
        SELECT
          stock,
          name
        FROM grocery_items
        WHERE id = $1
        FOR UPDATE
        `,
        [itemId]
      );

      if (!stockResult.rows.length) {
        throw new Error(
          `Item not found (ID: ${itemId})`
        );
      }

      const currentStock = Number(
        stockResult.rows[0].stock
      );

      console.log(
        `STOCK CHECK: ${item.name}`,
        "Requested:",
        qty,
        "Available:",
        currentStock
      );

      if (currentStock < qty) {
        throw new Error(
          `Insufficient stock for ${item.name}. Available: ${currentStock}`
        );
      }

      await client.query(
        `
        UPDATE grocery_items
        SET
          stock = stock - $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        `,
        [qty, itemId]
      );

      console.log(
        `STOCK REDUCED: ${item.name} by ${qty}`
      );
    }

    // ==========================================
    // 5. CALCULATE ITEM SUBTOTAL
    // ==========================================

    const itemsSubtotal = Number(
      orderItems
        .reduce(
          (sum, item) => sum + Number(item.total),
          0
        )
        .toFixed(2)
    );

    console.log("ITEMS SUBTOTAL:", itemsSubtotal);
    console.log("FRONTEND TOTAL:", total_amount);

    // ==========================================
    // 6. CALCULATE FINAL AMOUNT
    // ==========================================

    // Existing behavior retained:
    // Uses frontend total when valid and positive;
    // otherwise uses calculated item subtotal.

    const frontendTotal = Number(total_amount);

    const finalAmount =
      Number.isFinite(frontendTotal) && frontendTotal > 0
        ? frontendTotal
        : itemsSubtotal;

    // ==========================================
    // 7. INSERT ORDER
    // PREMIUM STATUS COMES FROM USERS TABLE
    // ==========================================

    const insertOrder = await client.query(
      `
      INSERT INTO groceriesorders
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
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13
      )
      RETURNING *
      `,
      [
        user_id,
        customer_name,
        mobile,
        address,
        landmark || null,
        pincode,
        payment_mode || "COD",
        finalAmount,
        isPremium,
        JSON.stringify(orderItems),
        latitudeNumber,
        longitudeNumber,
        location_address || null,
      ]
    );

    const createdOrder = insertOrder.rows[0];

    // ==========================================
    // 8. UPDATE WATER BOOKING FLAG
    // ==========================================

    const hasWaterOrder = orderItems.some(
      (item) => item.item_type === "water"
    );

    if (hasWaterOrder) {
      await client.query(
        `
        UPDATE users
        SET
          has_booked_water_cans = TRUE,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND has_booked_water_cans = FALSE
        `,
        [user_id]
      );
    }

    // ==========================================
    // 9. CLEAR CART
    // ONLY NORMAL CART CHECKOUT
    // ==========================================

    if (order_source !== "buy_now") {
      await client.query(
        `
        DELETE FROM user_cart
        WHERE user_id = $1
        `,
        [user_id]
      );

      console.log("CART CLEARED");
    } else {
      console.log("BUY NOW - CART NOT CLEARED");
    }

    // ==========================================
    // 10. COMMIT TRANSACTION
    // ==========================================

    await client.query("COMMIT");
    transactionStarted = false;

    // ==========================================
    // 11. RESPONSE
    // ==========================================

    console.log("=================================");
    console.log("ORDER CREATED:", createdOrder.id);
    console.log("ORDER SOURCE:", order_source);
    console.log("CUSTOMER PREMIUM:", isPremium);
    console.log("ITEMS SUBTOTAL:", itemsSubtotal);
    console.log("FINAL AMOUNT:", finalAmount);

    console.log(
      "SAVED ITEMS:",
      JSON.stringify(orderItems, null, 2)
    );

    console.log("=================================");

    return res.status(201).json({
      message: "Order placed successfully",
      order: createdOrder,
      order_source: order_source || "cart",
      is_premium: isPremium,
      items_subtotal: itemsSubtotal,
      location: {
        latitude: latitudeNumber,
        longitude: longitudeNumber,
        address: location_address || null,
      },
    });

  } catch (error) {
    // ==========================================
    // ROLLBACK
    // ==========================================

    if (transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("ROLLBACK ERROR:", rollbackError);
      }
    }

    console.error("PLACE ORDER ERROR:", error);

    return res.status(500).json({
      error: error.message || "Failed to place order",
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
      } = req.body;

      // =====================================================
      // VALIDATION
      // =====================================================

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

      // =====================================================
      // START TRANSACTION
      // =====================================================

      await client.query("BEGIN");

      // =====================================================
      // CHECK ORDER
      //
      // IMPORTANT:
      // groceriesorders DOES NOT HAVE delivered_at.
      // We use updated_at as the delivery date.
      // =====================================================

      const orderResult = await client.query(
        `
        SELECT
          id,
          user_id,
          status,
          updated_at
        FROM groceriesorders
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

      console.log(
        "RETURN ORDER:",
        order
      );

      // =====================================================
      // VERIFY USER OWNS ORDER
      // =====================================================

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

      // =====================================================
      // ORDER MUST BE DELIVERED
      // =====================================================

      const orderStatus = String(
        order.status || ""
      )
        .trim()
        .toLowerCase();

      if (orderStatus !== "delivered") {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message:
            "Return can only be requested for delivered orders.",
          current_status: order.status,
        });
      }

      // =====================================================
      // CHECK PRODUCT
      // =====================================================

      const productResult =
        await client.query(
          `
          SELECT
            id,
            name,
            return_allowed,
            return_days
          FROM grocery_items
          WHERE id = $1
          `,
          [product_id]
        );

      if (
        productResult.rows.length === 0
      ) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          success: false,
          message: "Product not found.",
        });
      }

      const product =
        productResult.rows[0];

      // =====================================================
      // CHECK RETURN ALLOWED
      // =====================================================

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

      // =====================================================
      // GET RETURN DAYS
      // =====================================================

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

      // Maximum return period = 7 days
      allowedDays = Math.min(
        allowedDays,
        7
      );

      // =====================================================
      // DELIVERY DATE
      //
      // Since there is NO delivered_at column,
      // use updated_at.
      // =====================================================

      const deliveryDate =
        order.updated_at;

      if (!deliveryDate) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message:
            "Delivery date is not available for this order.",
        });
      }

      console.log(
        "RETURN DELIVERY DATE:",
        deliveryDate
      );

      // =====================================================
      // VALIDATE DELIVERY DATE
      // =====================================================

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

      // =====================================================
      // CALCULATE RETURN DEADLINE
      //
      // Example:
      // delivered = Aug 20
      // return_days = 3
      //
      // Valid:
      // Aug 20
      // Aug 21
      // Aug 22
      //
      // Deadline = Aug 22 23:59:59
      // =====================================================

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

      console.log(
        "RETURN PERIOD:",
        {
          deliveryDate: deliveryDay,
          allowedDays,
          deadline,
          today,
        }
      );

      // =====================================================
      // CHECK RETURN PERIOD
      // =====================================================

      if (
        today.getTime() >
        deadline.getTime()
      ) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message:
            "The return period for this product has expired.",
          delivery_date:
            deliveryDate,
          return_days:
            allowedDays,
          return_deadline:
            deadline,
        });
      }

      // =====================================================
      // CHECK DUPLICATE RETURN REQUEST
      // =====================================================

      const duplicateResult =
        await client.query(
          `
          SELECT
            id,
            return_status
          FROM groceriesorders
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

      // =====================================================
      // IMAGE URLS FROM CLOUDINARY
      // =====================================================

      const imageUrls =
        Array.isArray(req.files)
          ? req.files
              .map(
                (file) =>
                  file.path ||
                  file.secure_url ||
                  file.url
              )
              .filter(Boolean)
          : [];

      console.log(
        "RETURN IMAGE URLS:",
        imageUrls
      );

      // =====================================================
      // UPDATE ORDER
      // =====================================================

      const updateResult =
        await client.query(
          `
          UPDATE groceriesorders
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

      // =====================================================
      // COMMIT
      // =====================================================

      await client.query("COMMIT");

      // =====================================================
      // RESPONSE
      // =====================================================

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

          delivery_date:
            deliveryDate,

          return_days:
            allowedDays,

          return_deadline:
            deadline,
        },
      });
    } catch (error) {
      // =====================================================
      // ROLLBACK
      // =====================================================

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

      // =====================================================
      // MULTER ERRORS
      // =====================================================

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

      // =====================================================
      // DATABASE ERROR
      // =====================================================

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
router.post("/process", async (req, res) => {
  const client = await pool.connect();

  try {
    const { order_id, action } = req.body;

    // =====================================================
    // VALIDATION
    // =====================================================

    if (!order_id) {
      return res.status(400).json({
        success: false,
        message: "order_id is required.",
      });
    }

    if (!action) {
      return res.status(400).json({
        success: false,
        message: "action is required.",
      });
    }

    const normalizedAction =
      String(action).trim().toLowerCase();

    if (
      normalizedAction !== "approve" &&
      normalizedAction !== "reject"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Action must be either approve or reject.",
      });
    }

    await client.query("BEGIN");

    // =====================================================
    // GET ORDER
    // =====================================================

    const orderResult = await client.query(
      `
      SELECT
        id,
        user_id,
        status,
        return_status,
        return_reason,
        return_images
      FROM groceriesorders
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

    // =====================================================
    // RETURN REQUEST MUST EXIST
    // =====================================================

    if (
      String(order.return_status || "").toLowerCase() !==
      "pending"
    ) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message:
          "There is no pending return request for this order.",
        return_status:
          order.return_status || null,
      });
    }

    // =====================================================
    // NEW STATUS
    // =====================================================

    const newReturnStatus =
      normalizedAction === "approve"
        ? "approved"
        : "rejected";

    // =====================================================
    // UPDATE RETURN
    // =====================================================

    const updateResult = await client.query(
      `
      UPDATE groceriesorders
      SET
        return_status = $1,
        return_processed_at = NOW()
      WHERE id = $2
      RETURNING
        id,
        return_status,
        return_reason,
        return_images,
        return_requested_at,
        return_processed_at
      `,
      [
        newReturnStatus,
        order_id,
      ]
    );

    await client.query("COMMIT");

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,
      message:
        normalizedAction === "approve"
          ? "Return request approved successfully."
          : "Return request rejected successfully.",

      return: updateResult.rows[0],
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "Rollback error:",
        rollbackError
      );
    }

    console.error(
      "RETURN PROCESS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to process return request.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  } finally {
    client.release();
  }
});
router.post("/cancel/:id", async (req, res) => {
  const orderId = req.params.id;

  try {
    // Check order exists
    const orderResult = await pool.query(
      `
      SELECT id, status
      FROM groceriesorders
      WHERE id = $1
      `,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const order = orderResult.rows[0];

    const currentStatus = String(
      order.status || ""
    ).toLowerCase();

    // Already cancelled
    if (
      currentStatus === "cancelled" ||
      currentStatus === "canceled"
    ) {
      return res.status(400).json({
        success: false,
        message: "Order is already cancelled",
      });
    }

    // Don't allow completed/delivered orders
    if (
      currentStatus === "completed" ||
      currentStatus === "delivered"
    ) {
      return res.status(400).json({
        success: false,
        message: "Completed orders cannot be cancelled",
      });
    }

    // Update status only
    const updateResult = await pool.query(
      `
      UPDATE groceriesorders
      SET status = 'cancelled'
      WHERE id = $1
      RETURNING *
      `,
      [orderId]
    );

    return res.json({
      success: true,
      message: "Order cancelled successfully",
      order: updateResult.rows[0],
    });

  } catch (error) {
    console.error(
      "Cancel order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: error.message,
    });
  }
});
module.exports = router;
