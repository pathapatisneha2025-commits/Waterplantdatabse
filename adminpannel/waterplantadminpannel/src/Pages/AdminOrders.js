import React, {
  useState,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";

const API_URL =
  "https://waterplantdatabse-v763.onrender.com";

export default function AdminOrdersScreen() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState({});
  const [selectedDrivers, setSelectedDrivers] =
    useState({});

  // =========================================================
  // ESCAPE HTML
  // =========================================================

  const escapeHtml = (value) => {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // =========================================================
  // FETCH ORDERS
  // =========================================================

  const fetchOrders = useCallback(
    async () => {
      try {
        const res = await fetch(
          `${API_URL}/orders/all`
        );

        if (!res.ok) {
          throw new Error(
            "Failed to fetch orders"
          );
        }

        const data = await res.json();

        setOrders(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(
          "Fetch orders error:",
          error
        );

        alert(
          "Failed to fetch orders"
        );
      }
    },
    []
  );

  // =========================================================
  // FETCH DRIVERS
  // =========================================================

  const fetchDrivers = useCallback(
    async () => {
      try {
        const res = await fetch(
          `${API_URL}/users/list/drivers`
        );

        if (!res.ok) {
          throw new Error(
            "Failed to fetch drivers"
          );
        }

        const data = await res.json();

        setDrivers(
          data.success &&
            Array.isArray(
              data.drivers
            )
            ? data.drivers
            : []
        );
      } catch (error) {
        console.error(
          "Fetch drivers error:",
          error
        );

        alert(
          "Failed to fetch drivers"
        );
      }
    },
    []
  );

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        await Promise.all([
          fetchOrders(),
          fetchDrivers(),
        ]);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [
    fetchOrders,
    fetchDrivers,
  ]);

  // =========================================================
  // GET DRIVER NAME
  // =========================================================

  const getDriverName = (
    driverId,
    driverName
  ) => {
    if (driverName) {
      return driverName;
    }

    if (!driverId) {
      return null;
    }

    const driver =
      drivers.find(
        (item) =>
          String(item.id) ===
          String(driverId)
      );

    return driver
      ? driver.name
      : `Driver #${driverId}`;
  };

  // =========================================================
  // HANDLE DRIVER SELECTION
  // =========================================================

  const handleDriverChange = (
    orderId,
    driverId
  ) => {
    setSelectedDrivers(
      (prev) => ({
        ...prev,
        [orderId]: driverId,
      })
    );
  };

  // =========================================================
  // ASSIGN / REASSIGN DRIVER
  // =========================================================

  const handleAssignDriver =
    async (orderId) => {
      const selectedDriverId =
        selectedDrivers[orderId];

      if (!selectedDriverId) {
        alert(
          "Please select a driver"
        );
        return;
      }

      const order =
        orders.find(
          (item) =>
            String(item.id) ===
            String(orderId)
        );

      if (!order) {
        alert("Order not found");
        return;
      }

      const currentDriverId =
        order.driver_id ||
        order.driverId ||
        order.deliveryboy_id ||
        order.delivery_boy_id ||
        null;

      const currentDriverName =
        getDriverName(
          currentDriverId,
          order.driver_name
        );

      const newDriverName =
        getDriverName(
          selectedDriverId,
          null
        );

      // =======================================================
      // SAME DRIVER
      // =======================================================

      if (
        currentDriverId &&
        String(currentDriverId) ===
          String(selectedDriverId)
      ) {
        alert(
          `${newDriverName} is already assigned to order #${orderId}`
        );

        return;
      }

      // =======================================================
      // REASSIGN CONFIRMATION
      // =======================================================

      if (currentDriverId) {
        const confirmed =
          window.confirm(
            `Order #${orderId} is currently assigned to ${currentDriverName}.\n\n` +
              `Do you want to reassign this order to ${newDriverName}?`
          );

        if (!confirmed) {
          return;
        }
      } else {
        const confirmed =
          window.confirm(
            `Assign order #${orderId} to ${newDriverName}?`
          );

        if (!confirmed) {
          return;
        }
      }

      try {
        setAssigning(
          (prev) => ({
            ...prev,
            [orderId]: true,
          })
        );

        const res = await fetch(
          `${API_URL}/orders/assign-driver`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              orderId:
                orderId,
              driverId:
                selectedDriverId,
            }),
          }
        );

        const data =
          await res.json();

        if (
          !res.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Failed to assign driver"
          );
        }

        alert(
          currentDriverId
            ? `Order #${orderId} reassigned from ${currentDriverName} to ${newDriverName}`
            : `Order #${orderId} assigned to ${newDriverName}`
        );

        setSelectedDrivers(
          (prev) => {
            const updated = {
              ...prev,
            };

            delete updated[
              orderId
            ];

            return updated;
          }
        );

        await fetchOrders();
      } catch (error) {
        console.error(
          "Assign/reassign error:",
          error
        );

        alert(
          error.message ||
            "Server error while assigning driver"
        );
      } finally {
        setAssigning(
          (prev) => ({
            ...prev,
            [orderId]: false,
          })
        );
      }
    };

  // =========================================================
  // PRINT BILL
  //
  // IMPORTANT:
  // Opens invoice window ONLY.
  // DOES NOT automatically call window.print().
  // =========================================================

  const handlePrintBill = (
    order
  ) => {
    if (!order) {
      alert("Order not found");
      return;
    }

    const currentDriverId =
      order.driver_id ||
      order.driverId ||
      order.deliveryboy_id ||
      order.delivery_boy_id ||
      null;

    const driverName =
      getDriverName(
        currentDriverId,
        order.driver_name
      ) || "Not Assigned";

    // ---------------------------------------------------------
    // SAFE VALUES
    // ---------------------------------------------------------

    const customerName =
      order.customer_name ||
      "Customer";

    const mobile =
      order.mobile || "N/A";

    const address =
      order.address || "N/A";

    const landmark =
      order.landmark || "";

    const pincode =
      order.pincode || "N/A";

    const paymentMode =
      order.payment_mode ||
      "N/A";

    const status =
      order.status || "N/A";

    const orderDate =
      order.created_at
        ? new Date(
            order.created_at
          ).toLocaleString(
            "en-IN",
            {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }
          )
        : "N/A";

    const totalAmount =
      Number(
        order.total_amount || 0
      );

    const premium =
      order.is_premium
        ? "Yes"
        : "No";

    // ---------------------------------------------------------
    // ITEMS
    // ---------------------------------------------------------

    let items = [];

    if (
      Array.isArray(order.items)
    ) {
      items = order.items;
    } else if (
      typeof order.items ===
      "string"
    ) {
      try {
        const parsed =
          JSON.parse(
            order.items
          );

        if (
          Array.isArray(parsed)
        ) {
          items = parsed;
        }
      } catch (error) {
        console.error(
          "Failed to parse order items:",
          error
        );
      }
    }

    const itemsRows =
      items.length > 0
        ? items
            .map(
              (
                item,
                index
              ) => {
                const itemName =
                  item.item_name ||
                  item.name ||
                  item.product_name ||
                  "Unnamed Item";

                const qty =
                  Number(
                    item.qty ||
                      item.quantity ||
                      0
                  );

                const price =
                  Number(
                    item.price ||
                      item.unit_price ||
                      0
                  );

                let itemTotal =
                  Number(
                    item.total ||
                      item.item_total ||
                      0
                  );

                if (!itemTotal) {
                  itemTotal =
                    qty * price;
                }

                return `
                  <tr>

                    <td>
                      ${index + 1}
                    </td>

                    <td class="item-name">
                      ${escapeHtml(
                        itemName
                      )}
                    </td>

                    <td class="center">
                      ${qty}
                    </td>

                    <td class="right">
                      ₹${price.toFixed(
                        2
                      )}
                    </td>

                    <td class="right">
                      ₹${itemTotal.toFixed(
                        2
                      )}
                    </td>

                  </tr>
                `;
              }
            )
            .join("")
        : `
            <tr>

              <td
                colspan="5"
                class="center"
              >
                No items available
              </td>

            </tr>
          `;

    // ---------------------------------------------------------
    // OPEN BILL WINDOW
    // ---------------------------------------------------------

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=900,height=1000"
      );

    if (!printWindow) {
      alert(
        "Please allow pop-ups in your browser to open the bill."
      );

      return;
    }

    // ---------------------------------------------------------
    // BILL HTML
    // ---------------------------------------------------------

    const billHTML = `
      <!DOCTYPE html>

      <html>

        <head>

          <meta charset="UTF-8" />

          <title>
            Invoice - Order #${escapeHtml(
              String(order.id)
            )}
          </title>

          <style>

            * {
              box-sizing: border-box;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              font-family:
                Arial,
                Helvetica,
                sans-serif;
              color: #222;
            }

            body {
              padding: 20px;
            }

            /* =========================================
               INVOICE
            ========================================= */

            .invoice {

              width: 210mm;

              min-height: 297mm;

              margin: 0 auto;

              padding: 16mm;

              background: #ffffff;

            }

            /* =========================================
               ORANGE TOP LINE
            ========================================= */

            .top-line {

              height: 5px;

              width: 100%;

              background: #ff6600;

              margin-bottom: 20px;

            }

            /* =========================================
               HEADER
            ========================================= */

            .header {

              display: flex;

              justify-content:
                space-between;

              align-items:
                flex-start;

              border-bottom:
                1px solid #ddd;

              padding-bottom: 18px;

              margin-bottom: 20px;

            }

            .company-name {

              font-size: 28px;

              font-weight: 800;

              color: #ff6600;

              margin-bottom: 6px;

            }

            .company-subtitle {

              font-size: 13px;

              color: #555;

              line-height: 1.6;

            }

            .invoice-title {

              text-align: right;

            }

            .invoice-title h1 {

              margin: 0;

              font-size: 28px;

              color: #222;

              letter-spacing: 1px;

            }

            .invoice-number {

              margin-top: 8px;

              font-size: 14px;

              color: #555;

            }

            /* =========================================
               SECTIONS
            ========================================= */

            .section {

              margin-bottom: 22px;

            }

            .section-title {

              font-size: 14px;

              font-weight: 700;

              color: #ff6600;

              text-transform:
                uppercase;

              letter-spacing:
                0.5px;

              margin-bottom: 8px;

            }

            /* =========================================
               CUSTOMER INFORMATION
            ========================================= */

            .info-grid {

              display: grid;

              grid-template-columns:
                1fr 1fr;

              gap: 18px;

            }

            .info-box {

              border:
                1px solid #ddd;

              border-radius: 5px;

              padding: 12px;

            }

            .info-row {

              display: flex;

              margin-bottom: 7px;

              font-size: 13px;

              line-height: 1.4;

            }

            .info-row:last-child {

              margin-bottom: 0;

            }

            .info-label {

              width: 110px;

              font-weight: 700;

              color: #555;

              flex-shrink: 0;

            }

            .info-value {

              color: #222;

              word-break:
                break-word;

            }

            /* =========================================
               TABLE
            ========================================= */

            table {

              width: 100%;

              border-collapse:
                collapse;

              margin-top: 8px;

            }

            th {

              background:
                #ff6600;

              color: #ffffff;

              padding:
                10px 8px;

              border:
                1px solid #ff6600;

              font-size: 12px;

              text-align: left;

            }

            td {

              padding:
                10px 8px;

              border:
                1px solid #ddd;

              font-size: 12px;

              vertical-align:
                top;

            }

            .item-name {

              width: 45%;

            }

            .center {

              text-align: center;

            }

            .right {

              text-align: right;

            }

            /* =========================================
               SUMMARY
            ========================================= */

            .summary {

              width: 330px;

              margin-left: auto;

              margin-top: 18px;

            }

            .summary-row {

              display: flex;

              justify-content:
                space-between;

              padding: 7px 0;

              font-size: 13px;

            }

            .summary-row.total {

              border-top:
                2px solid #ff6600;

              margin-top: 5px;

              padding-top: 12px;

              font-size: 18px;

              font-weight: 800;

              color: #ff6600;

            }

            /* =========================================
               PREMIUM BADGE
            ========================================= */

            .badge {

              display:
                inline-block;

              padding:
                4px 9px;

              border-radius:
                20px;

              background:
                #fff3e0;

              color:
                #e65100;

              font-size: 11px;

              font-weight: 700;

            }

            /* =========================================
               PAYMENT
            ========================================= */

            .payment-box {

              border:
                1px solid #ddd;

              border-radius: 5px;

              padding: 12px;

              display: flex;

              justify-content:
                space-between;

              gap: 20px;

            }

            .payment-item {

              font-size: 13px;

            }

            .payment-label {

              display: block;

              color: #777;

              font-size: 11px;

              margin-bottom: 4px;

            }

            .payment-value {

              font-weight: 700;

            }

            /* =========================================
               FOOTER
            ========================================= */

            .footer {

              margin-top: 55px;

              border-top:
                1px solid #ddd;

              padding-top: 18px;

              text-align: center;

              color: #777;

              font-size: 11px;

              line-height: 1.7;

            }

            .thank-you {

              font-size: 16px;

              font-weight: 700;

              color: #ff6600;

              margin-bottom: 5px;

            }

            /* =========================================
               BILL WINDOW BUTTONS
            ========================================= */

            .print-controls {

              position: fixed;

              top: 15px;

              right: 15px;

              display: flex;

              gap: 10px;

              z-index: 9999;

            }

            .print-button {

              background:
                #1976d2;

              color: #ffffff;

              border: none;

              padding:
                11px 20px;

              border-radius: 6px;

              font-size: 14px;

              font-weight: 700;

              cursor: pointer;

            }

            .close-button {

              background:
                #555;

              color: #ffffff;

              border: none;

              padding:
                11px 20px;

              border-radius: 6px;

              font-size: 14px;

              font-weight: 700;

              cursor: pointer;

            }

            .print-button:hover {

              background:
                #125ca8;

            }

            .close-button:hover {

              background:
                #333;

            }

            /* =========================================
               A4 PRINT SETTINGS
            ========================================= */

            @page {

              size: A4;

              margin: 0;

            }

            @media print {

              html,
              body {

                width: 210mm;

                min-height: 297mm;

                padding: 0;

                margin: 0;

              }

              body {

                -webkit-print-color-adjust:
                  exact;

                print-color-adjust:
                  exact;

              }

              .invoice {

                width: 210mm;

                min-height: 297mm;

                margin: 0;

                padding: 16mm;

              }

              /* Hide print controls */

              .print-controls {

                display:
                  none !important;

              }

            }

          </style>

        </head>

        <body>

          <!-- =========================================
               PRINT / CLOSE BUTTONS
          ========================================== -->

          <div class="print-controls">

            <button
              class="print-button"
              onclick="window.print()"
            >
              🖨️ Print Bill
            </button>

            <button
              class="close-button"
              onclick="window.close()"
            >
              ✕ Close
            </button>

          </div>

          <!-- =========================================
               INVOICE
          ========================================== -->

          <div class="invoice">

            <div class="top-line"></div>

            <!-- HEADER -->

            <div class="header">

              <div>

                <div class="company-name">
                  WATER PLANT
                </div>

                <div class="company-subtitle">

                  Water & Grocery Delivery

                  <br />

                  Customer Invoice / Bill

                </div>

              </div>

              <div class="invoice-title">

                <h1>
                  INVOICE
                </h1>

                <div class="invoice-number">

                  Order #${escapeHtml(
                    String(order.id)
                  )}

                </div>

              </div>

            </div>

            <!-- CUSTOMER DETAILS -->

            <div class="section">

              <div class="section-title">
                Customer Details
              </div>

              <div class="info-grid">

                <!-- LEFT BOX -->

                <div class="info-box">

                  <div class="info-row">

                    <div class="info-label">
                      Customer
                    </div>

                    <div class="info-value">

                      ${escapeHtml(
                        customerName
                      )}

                    </div>

                  </div>

                  <div class="info-row">

                    <div class="info-label">
                      Mobile
                    </div>

                    <div class="info-value">

                      ${escapeHtml(
                        mobile
                      )}

                    </div>

                  </div>

                  <div class="info-row">

                    <div class="info-label">
                      Address
                    </div>

                    <div class="info-value">

                      ${escapeHtml(
                        address
                      )}

                      ${
                        landmark
                          ? `, ${escapeHtml(
                              landmark
                            )}`
                          : ""
                      }

                    </div>

                  </div>

                  <div class="info-row">

                    <div class="info-label">
                      Pincode
                    </div>

                    <div class="info-value">

                      ${escapeHtml(
                        pincode
                      )}

                    </div>

                  </div>

                </div>

                <!-- RIGHT BOX -->

                <div class="info-box">

                  <div class="info-row">

                    <div class="info-label">
                      Order Date
                    </div>

                    <div class="info-value">

                      ${escapeHtml(
                        orderDate
                      )}

                    </div>

                  </div>

                  <div class="info-row">

                    <div class="info-label">
                      Payment
                    </div>

                    <div class="info-value">

                      ${escapeHtml(
                        paymentMode
                      )}

                    </div>

                  </div>

                  <div class="info-row">

                    <div class="info-label">
                      Status
                    </div>

                    <div class="info-value">

                      ${escapeHtml(
                        status
                      )}

                    </div>

                  </div>

                  <div class="info-row">

                    <div class="info-label">
                      Premium
                    </div>

                    <div class="info-value">

                      <span class="badge">

                        ${premium}

                      </span>

                    </div>

                  </div>

                  <div class="info-row">

                    <div class="info-label">
                      Driver
                    </div>

                    <div class="info-value">

                      ${escapeHtml(
                        driverName
                      )}

                    </div>

                  </div>

                </div>

              </div>

            </div>

            <!-- ORDER ITEMS -->

            <div class="section">

              <div class="section-title">
                Order Items
              </div>

              <table>

                <thead>

                  <tr>

                    <th
                      style="width: 7%;"
                    >
                      #
                    </th>

                    <th>
                      Item
                    </th>

                    <th
                      style="width: 12%;"
                    >
                      Qty
                    </th>

                    <th
                      style="width: 18%;"
                    >
                      Price
                    </th>

                    <th
                      style="width: 20%;"
                    >
                      Amount
                    </th>

                  </tr>

                </thead>

                <tbody>

                  ${itemsRows}

                </tbody>

              </table>

            </div>

            <!-- PAYMENT INFORMATION -->

            <div class="section">

              <div class="section-title">
                Payment Information
              </div>

              <div class="payment-box">

                <div class="payment-item">

                  <span
                    class="payment-label"
                  >
                    Payment Mode
                  </span>

                  <span
                    class="payment-value"
                  >
                    ${escapeHtml(
                      paymentMode
                    )}
                  </span>

                </div>

                <div class="payment-item">

                  <span
                    class="payment-label"
                  >
                    Premium Customer
                  </span>

                  <span
                    class="payment-value"
                  >
                    ${premium}
                  </span>

                </div>

                <div class="payment-item">

                  <span
                    class="payment-label"
                  >
                    Order Status
                  </span>

                  <span
                    class="payment-value"
                  >
                    ${escapeHtml(
                      status
                    )}
                  </span>

                </div>

              </div>

            </div>

            <!-- TOTAL -->

            <div class="summary">

              <div class="summary-row">

                <span>
                  Sub Total
                </span>

                <span>
                  ₹${totalAmount.toFixed(
                    2
                  )}
                </span>

              </div>

              <div class="summary-row">

                <span>
                  Delivery Charges
                </span>

                <span>
                  ₹0.00
                </span>

              </div>

              <div
                class="summary-row total"
              >

                <span>
                  GRAND TOTAL
                </span>

                <span>
                  ₹${totalAmount.toFixed(
                    2
                  )}
                </span>

              </div>

            </div>

            <!-- FOOTER -->

            <div class="footer">

              <div class="thank-you">

                Thank You For Your Order!

              </div>

              Please keep this invoice
              for your records.

              <br />

              Generated on

              ${escapeHtml(
                new Date().toLocaleString(
                  "en-IN"
                )
              )}

            </div>

          </div>

        </body>

      </html>
    `;

    // =========================================================
    // WRITE BILL
    // =========================================================

    printWindow.document.open();

    printWindow.document.write(
      billHTML
    );

    printWindow.document.close();

    // =========================================================
    // FOCUS WINDOW ONLY
    //
    // NO window.print() HERE
    // =========================================================

    setTimeout(() => {
      try {
        printWindow.focus();
      } catch (error) {
        console.error(
          "Could not focus bill window:",
          error
        );
      }
    }, 300);
  };

  // =========================================================
  // STYLES
  // =========================================================

  const styles = {
    container: {
      marginTop: "0px",
      fontFamily:
        "Arial, sans-serif",
      padding: "15px",
      maxWidth: "100%",
      boxSizing: "border-box",
      backgroundColor: "#fff",
    },

    headerRow: {
      display: "flex",
      alignItems: "center",
      gap: "15px",
      marginBottom: "15px",
    },

    backBtn: {
      background: "#fff",
      border: "1px solid #ccc",
      borderRadius: "5px",
      width: "36px",
      height: "36px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "18px",
      cursor: "pointer",
      color: "#333",
      flexShrink: 0,
    },

    header: {
      color: "#FF6600",
      margin: 0,
    },

    tableResponsiveWrapper: {
      width: "100%",
      overflowX: "auto",
      WebkitOverflowScrolling:
        "touch",
    },

    table: {
      width: "100%",
      borderCollapse:
        "collapse",
      minWidth: "1450px",
    },

    th: {
      border:
        "1px solid #FF6600",
      padding: "10px",
      backgroundColor:
        "#FF6600",
      color: "#fff",
      textAlign: "left",
      whiteSpace: "nowrap",
    },

    td: {
      border:
        "1px solid #FF6600",
      padding: "10px",
      textAlign: "left",
      whiteSpace: "nowrap",
      verticalAlign: "top",
    },

    row: {
      backgroundColor: "#fff",
    },

    assignBtn: {
      padding: "6px 10px",
      backgroundColor:
        "#FF6600",
      border: "none",
      color: "#fff",
      borderRadius: "5px",
      cursor: "pointer",
      whiteSpace: "nowrap",
      fontWeight: "600",
    },

    assignBtnDisabled: {
      padding: "6px 10px",
      backgroundColor: "#aaa",
      border: "none",
      color: "#fff",
      borderRadius: "5px",
      cursor: "not-allowed",
      whiteSpace: "nowrap",
      fontWeight: "600",
    },

    printBtn: {
      padding: "7px 12px",
      backgroundColor:
        "#1976D2",
      border: "none",
      color: "#fff",
      borderRadius: "5px",
      cursor: "pointer",
      whiteSpace: "nowrap",
      fontWeight: "600",
      fontSize: "13px",
    },

    itemsCell: {
      maxWidth: "200px",
      whiteSpace: "normal",
    },

    select: {
      padding: "6px",
      borderRadius: "5px",
      border:
        "1px solid #ccc",
      minWidth: "130px",
      backgroundColor: "#fff",
    },

    driverBox: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      minWidth: "200px",
    },

    currentDriver: {
      padding: "7px 10px",
      backgroundColor:
        "#E8F5E9",
      borderRadius: "5px",
      color: "#2E7D32",
      fontSize: "13px",
      fontWeight: "600",
    },

    notAssigned: {
      padding: "7px 10px",
      backgroundColor:
        "#FFF3E0",
      borderRadius: "5px",
      color: "#E65100",
      fontSize: "13px",
      fontWeight: "600",
    },

    assignRow: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
    },

    statusPending: {
      color: "#E53935",
      fontWeight: "600",
    },

    statusCompleted: {
      color: "#4CAF50",
      fontWeight: "600",
    },

    statusOther: {
      color: "#333",
      fontWeight: "600",
    },

    actionBox: {
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      minWidth: "220px",
    },
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div
        style={styles.container}
      >
        <div
          style={styles.headerRow}
        >
          <button
            style={
              styles.backBtn
            }
            onClick={() =>
              navigate(-1)
            }
            title="Go Back"
          >
            ←
          </button>

          <h2
            style={
              styles.header
            }
          >
            Admin Orders
          </h2>
        </div>

        <div>
          Loading orders...
        </div>
      </div>
    );
  }

  // =========================================================
  // NO ORDERS
  // =========================================================

  if (!orders.length) {
    return (
      <div
        style={styles.container}
      >
        <div
          style={styles.headerRow}
        >
          <button
            style={
              styles.backBtn
            }
            onClick={() =>
              navigate(-1)
            }
            title="Go Back"
          >
            ←
          </button>

          <h2
            style={
              styles.header
            }
          >
            Admin Orders
          </h2>
        </div>

        <div>
          No orders found
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div
      style={styles.container}
    >
      {/* HEADER */}

      <div
        style={styles.headerRow}
      >
        <button
          style={styles.backBtn}
          onClick={() =>
            navigate(-1)
          }
          title="Go Back"
        >
          ←
        </button>

        <h2
          style={styles.header}
        >
          Admin Orders
        </h2>
      </div>

      {/* TABLE */}

      <div
        style={
          styles.tableResponsiveWrapper
        }
      >
        <table
          style={styles.table}
        >
          <thead>
            <tr>
              <th
                style={styles.th}
              >
                Order ID
              </th>

              <th
                style={styles.th}
              >
                Customer
              </th>

              <th
                style={styles.th}
              >
                Mobile
              </th>

              <th
                style={styles.th}
              >
                Address
              </th>

              <th
                style={styles.th}
              >
                Pincode
              </th>

              <th
                style={styles.th}
              >
                Payment
              </th>

              <th
                style={styles.th}
              >
                Total
              </th>

              <th
                style={styles.th}
              >
                Premium
              </th>

              <th
                style={styles.th}
              >
                Status
              </th>

              <th
                style={styles.th}
              >
                Items
              </th>

              <th
                style={styles.th}
              >
                Order Date
              </th>

              <th
                style={styles.th}
              >
                Driver
              </th>

              <th
                style={styles.th}
              >
                Print
              </th>
            </tr>
          </thead>

          <tbody>
            {orders.map(
              (order) => {
                const currentDriverId =
                  order.driver_id ||
                  order.driverId ||
                  order.deliveryboy_id ||
                  order.delivery_boy_id ||
                  null;

                const currentDriverName =
                  getDriverName(
                    currentDriverId,
                    order.driver_name
                  );

                const isAssigning =
                  assigning[
                    order.id
                  ];

                return (
                  <tr
                    key={
                      order.id
                    }
                    style={
                      styles.row
                    }
                  >
                    {/* ORDER ID */}

                    <td
                      style={
                        styles.td
                      }
                    >
                      #{order.id}
                    </td>

                    {/* CUSTOMER */}

                    <td
                      style={
                        styles.td
                      }
                    >
                      {order.customer_name ||
                        "N/A"}
                    </td>

                    {/* MOBILE */}

                    <td
                      style={
                        styles.td
                      }
                    >
                      {order.mobile ||
                        "N/A"}
                    </td>

                    {/* ADDRESS */}

                    <td
                      style={
                        styles.td
                      }
                    >
                      {order.address ||
                        ""}

                      {order.landmark
                        ? `, ${order.landmark}`
                        : ""}
                    </td>

                    {/* PINCODE */}

                    <td
                      style={
                        styles.td
                      }
                    >
                      {order.pincode ||
                        "N/A"}
                    </td>

                    {/* PAYMENT */}

                    <td
                      style={
                        styles.td
                      }
                    >
                      {order.payment_mode ||
                        "N/A"}
                    </td>

                    {/* TOTAL */}

                    <td
                      style={
                        styles.td
                      }
                    >
                      ₹
                      {Number(
                        order.total_amount ||
                          0
                      ).toFixed(
                        2
                      )}
                    </td>

                    {/* PREMIUM */}

                    <td
                      style={
                        styles.td
                      }
                    >
                      {order.is_premium
                        ? "Yes"
                        : "No"}
                    </td>

                    {/* STATUS */}

                    <td
                      style={
                        styles.td
                      }
                    >
                      <span
                        style={
                          String(
                            order.status
                          ).toLowerCase() ===
                          "pending"
                            ? styles.statusPending
                            : String(
                                order.status
                              ).toLowerCase() ===
                              "completed"
                            ? styles.statusCompleted
                            : styles.statusOther
                        }
                      >
                        {order.status ||
                          "N/A"}
                      </span>
                    </td>

                    {/* ITEMS */}

                    <td
                      style={{
                        ...styles.td,
                        ...styles.itemsCell,
                      }}
                    >
                      {Array.isArray(
                        order.items
                      ) &&
                      order.items
                        .length >
                        0 ? (
                        order.items.map(
                          (
                            item,
                            itemIdx
                          ) => {
                            const itemName =
                              item.item_name ||
                              item.name ||
                              "Unnamed";

                            const itemTotal =
                              item.total
                                ? `₹${item.total}`
                                : "";

                            const key =
                              item.item_id ||
                              itemIdx;

                            return (
                              <div
                                key={
                                  key
                                }
                              >
                                {
                                  item.qty
                                }{" "}
                                ×{" "}
                                {
                                  itemName
                                }{" "}
                                {
                                  itemTotal
                                }
                              </div>
                            );
                          }
                        )
                      ) : (
                        <span>
                          No items
                        </span>
                      )}
                    </td>

                    {/* ORDER DATE */}

                    <td
                      style={
                        styles.td
                      }
                    >
                      {order.created_at
                        ? new Date(
                            order.created_at
                          ).toLocaleDateString(
                            "en-IN"
                          )
                        : "N/A"}
                    </td>

                    {/* DRIVER */}

                    <td
                      style={
                        styles.td
                      }
                    >
                      <div
                        style={
                          styles.driverBox
                        }
                      >
                        {/* CURRENT DRIVER */}

                        {currentDriverId ? (
                          <div
                            style={
                              styles.currentDriver
                            }
                          >
                            🚚 Driver:{" "}
                            {
                              currentDriverName
                            }
                          </div>
                        ) : (
                          <div
                            style={
                              styles.notAssigned
                            }
                          >
                            ⚠️ Not Assigned
                          </div>
                        )}

                        {/* ASSIGN / REASSIGN */}

                        <div
                          style={
                            styles.assignRow
                          }
                        >
                          <select
                            style={
                              styles.select
                            }
                            value={
                              selectedDrivers[
                                order.id
                              ] ||
                              ""
                            }
                            onChange={(
                              e
                            ) =>
                              handleDriverChange(
                                order.id,
                                e
                                  .target
                                  .value
                              )
                            }
                            disabled={
                              isAssigning
                            }
                          >
                            <option value="">
                              Select Driver
                            </option>

                            {drivers.map(
                              (
                                driver
                              ) => (
                                <option
                                  key={
                                    driver.id
                                  }
                                  value={
                                    driver.id
                                  }
                                >
                                  {
                                    driver.name
                                  }
                                </option>
                              )
                            )}
                          </select>

                          <button
                            style={
                              isAssigning
                                ? styles.assignBtnDisabled
                                : styles.assignBtn
                            }
                            disabled={
                              isAssigning
                            }
                            onClick={() =>
                              handleAssignDriver(
                                order.id
                              )
                            }
                          >
                            {isAssigning
                              ? "Saving..."
                              : currentDriverId
                              ? "Reassign"
                              : "Assign"}
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* PRINT BILL */}

                    <td
                      style={
                        styles.td
                      }
                    >
                      <div
                        style={
                          styles.actionBox
                        }
                      >
                        <button
                          style={
                            styles.printBtn
                          }
                          onClick={() =>
                            handlePrintBill(
                              order
                            )
                          }
                          title="Open A4 Bill"
                        >
                          🖨️ Print Bill
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}