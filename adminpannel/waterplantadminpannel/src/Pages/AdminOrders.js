import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "https://waterplantdatabse-v763.onrender.com";

export default function AdminOrdersScreen() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState({});
  const [selectedDrivers, setSelectedDrivers] = useState({});

  // =========================================================
  // FETCH ORDERS
  // =========================================================

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/orders/all`);

      if (!res.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await res.json();

      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch orders error:", error);
      alert("Failed to fetch orders");
    }
  }, []);

  // =========================================================
  // FETCH DRIVERS
  // =========================================================

  const fetchDrivers = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/users/list/drivers`);

      if (!res.ok) {
        throw new Error("Failed to fetch drivers");
      }

      const data = await res.json();

      setDrivers(
        data.success && Array.isArray(data.drivers)
          ? data.drivers
          : []
      );
    } catch (error) {
      console.error("Fetch drivers error:", error);
      alert("Failed to fetch drivers");
    }
  }, []);

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
  }, [fetchOrders, fetchDrivers]);

  // =========================================================
  // GET DRIVER NAME
  // =========================================================

  const getDriverName = (driverId, driverName) => {
    if (driverName) {
      return driverName;
    }

    if (!driverId) {
      return null;
    }

    const driver = drivers.find(
      (item) => String(item.id) === String(driverId)
    );

    return driver ? driver.name : `Driver #${driverId}`;
  };

  // =========================================================
  // HANDLE DRIVER SELECTION
  // =========================================================

  const handleDriverChange = (orderId, driverId) => {
    setSelectedDrivers((prev) => ({
      ...prev,
      [orderId]: driverId,
    }));
  };

  // =========================================================
  // ASSIGN / REASSIGN DRIVER
  // =========================================================

  const handleAssignDriver = async (orderId) => {
    const selectedDriverId = selectedDrivers[orderId];

    if (!selectedDriverId) {
      alert("Please select a driver");
      return;
    }

    const order = orders.find(
      (item) => String(item.id) === String(orderId)
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

    const currentDriverName = getDriverName(
      currentDriverId,
      order.driver_name
    );

    const newDriverName = getDriverName(
      selectedDriverId,
      null
    );

    // =======================================================
    // SAME DRIVER
    // =======================================================

    if (
      currentDriverId &&
      String(currentDriverId) === String(selectedDriverId)
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
      const confirmed = window.confirm(
        `Order #${orderId} is currently assigned to ${currentDriverName}.\n\n` +
          `Do you want to reassign this order to ${newDriverName}?`
      );

      if (!confirmed) {
        return;
      }
    } else {
      const confirmed = window.confirm(
        `Assign order #${orderId} to ${newDriverName}?`
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      setAssigning((prev) => ({
        ...prev,
        [orderId]: true,
      }));

      const res = await fetch(
        `${API_URL}/orders/assign-driver`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: orderId,
            driverId: selectedDriverId,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.message || "Failed to assign driver"
        );
      }

      alert(
        currentDriverId
          ? `Order #${orderId} reassigned from ${currentDriverName} to ${newDriverName}`
          : `Order #${orderId} assigned to ${newDriverName}`
      );

      // Clear selected driver
      setSelectedDrivers((prev) => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });

      // Refresh orders
      await fetchOrders();
    } catch (error) {
      console.error("Assign/reassign error:", error);

      alert(
        error.message ||
          "Server error while assigning driver"
      );
    } finally {
      setAssigning((prev) => ({
        ...prev,
        [orderId]: false,
      }));
    }
  };

  // =========================================================
  // STYLES
  // =========================================================

  const styles = {
    container: {
      marginTop: "0px",
      fontFamily: "Arial, sans-serif",
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
      WebkitOverflowScrolling: "touch",
    },

    table: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: "1250px",
    },

    th: {
      border: "1px solid #FF6600",
      padding: "10px",
      backgroundColor: "#FF6600",
      color: "#fff",
      textAlign: "left",
      whiteSpace: "nowrap",
    },

    td: {
      border: "1px solid #FF6600",
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
      backgroundColor: "#FF6600",
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

    itemsCell: {
      maxWidth: "200px",
      whiteSpace: "normal",
    },

    select: {
      padding: "6px",
      borderRadius: "5px",
      border: "1px solid #ccc",
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
      backgroundColor: "#E8F5E9",
      borderRadius: "5px",
      color: "#2E7D32",
      fontSize: "13px",
      fontWeight: "600",
    },

    notAssigned: {
      padding: "7px 10px",
      backgroundColor: "#FFF3E0",
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
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <button
            style={styles.backBtn}
            onClick={() => navigate(-1)}
            title="Go Back"
          >
            ←
          </button>

          <h2 style={styles.header}>
            Admin Orders
          </h2>
        </div>

        <div>Loading orders...</div>
      </div>
    );
  }

  // =========================================================
  // NO ORDERS
  // =========================================================

  if (!orders.length) {
    return (
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <button
            style={styles.backBtn}
            onClick={() => navigate(-1)}
            title="Go Back"
          >
            ←
          </button>

          <h2 style={styles.header}>
            Admin Orders
          </h2>
        </div>

        <div>No orders found</div>
      </div>
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div style={styles.container}>
      {/* HEADER */}

      <div style={styles.headerRow}>
        <button
          style={styles.backBtn}
          onClick={() => navigate(-1)}
          title="Go Back"
        >
          ←
        </button>

        <h2 style={styles.header}>
          Admin Orders
        </h2>
      </div>

      {/* TABLE */}

      <div style={styles.tableResponsiveWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Order ID</th>
              <th style={styles.th}>Customer</th>
              <th style={styles.th}>Mobile</th>
              <th style={styles.th}>Address</th>
              <th style={styles.th}>Pincode</th>
              <th style={styles.th}>Payment</th>
              <th style={styles.th}>Total</th>
              <th style={styles.th}>Premium</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Items</th>
              <th style={styles.th}>Order Date</th>
              <th style={styles.th}>Driver</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => {
              const currentDriverId =
                order.driver_id ||
                order.driverId ||
                order.deliveryboy_id ||
                order.delivery_boy_id ||
                null;

              const currentDriverName = getDriverName(
                currentDriverId,
                order.driver_name
              );

              const isAssigning =
                assigning[order.id];

              return (
                <tr
                  key={order.id}
                  style={styles.row}
                >
                  {/* ORDER ID */}

                  <td style={styles.td}>
                    #{order.id}
                  </td>

                  {/* CUSTOMER */}

                  <td style={styles.td}>
                    {order.customer_name || "N/A"}
                  </td>

                  {/* MOBILE */}

                  <td style={styles.td}>
                    {order.mobile || "N/A"}
                  </td>

                  {/* ADDRESS */}

                  <td style={styles.td}>
                    {order.address || ""}
                    {order.landmark
                      ? `, ${order.landmark}`
                      : ""}
                  </td>

                  {/* PINCODE */}

                  <td style={styles.td}>
                    {order.pincode || "N/A"}
                  </td>

                  {/* PAYMENT */}

                  <td style={styles.td}>
                    {order.payment_mode || "N/A"}
                  </td>

                  {/* TOTAL */}

                  <td style={styles.td}>
                    ₹{order.total_amount || 0}
                  </td>

                  {/* PREMIUM */}

                  <td style={styles.td}>
                    {order.is_premium
                      ? "Yes"
                      : "No"}
                  </td>

                  {/* STATUS */}

                  <td style={styles.td}>
                    <span
                      style={
                        String(order.status).toLowerCase() ===
                        "pending"
                          ? styles.statusPending
                          : String(order.status).toLowerCase() ===
                            "completed"
                          ? styles.statusCompleted
                          : styles.statusOther
                      }
                    >
                      {order.status || "N/A"}
                    </span>
                  </td>

                  {/* ITEMS */}

                  <td
                    style={{
                      ...styles.td,
                      ...styles.itemsCell,
                    }}
                  >
                    {Array.isArray(order.items) &&
                    order.items.length > 0 ? (
                      order.items.map(
                        (item, itemIdx) => {
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
                            <div key={key}>
                              {item.qty} ×{" "}
                              {itemName}{" "}
                              {itemTotal}
                            </div>
                          );
                        }
                      )
                    ) : (
                      <span>No items</span>
                    )}
                  </td>

                  {/* ORDER DATE */}

                  <td style={styles.td}>
                    {order.created_at
                      ? new Date(
                          order.created_at
                        ).toLocaleDateString(
                          "en-IN"
                        )
                      : "N/A"}
                  </td>

                  {/* DRIVER */}

                  <td style={styles.td}>
                    <div style={styles.driverBox}>
                      {/* CURRENT DRIVER */}

                      {currentDriverId ? (
                        <div
                          style={
                            styles.currentDriver
                          }
                        >
                          🚚 Driver:{" "}
                          {currentDriverName}
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

                      <div style={styles.assignRow}>
                        <select
                          style={styles.select}
                          value={
                            selectedDrivers[
                              order.id
                            ] || ""
                          }
                          onChange={(e) =>
                            handleDriverChange(
                              order.id,
                              e.target.value
                            )
                          }
                          disabled={isAssigning}
                        >
                          <option value="">
                            Select Driver
                          </option>

                          {drivers.map(
                            (driver) => (
                              <option
                                key={driver.id}
                                value={driver.id}
                              >
                                {driver.name}
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
                          disabled={isAssigning}
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}