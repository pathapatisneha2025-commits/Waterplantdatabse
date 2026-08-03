import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminOrdersScreen() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDrivers, setSelectedDrivers] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ordersRes, driversRes] = await Promise.all([
          fetch("https://waterplantdatabse-v763.onrender.com/orders/all"),
          fetch("https://waterplantdatabse-v763.onrender.com/users/list/drivers"),
        ]);
        const ordersData = await ordersRes.json();
        const driversData = await driversRes.json();

        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setDrivers(driversData.success ? driversData.drivers : []);
      } catch (err) {
        console.error(err);
        alert("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAssignDriver = async (orderId) => {
    const driverId = selectedDrivers[orderId];
    if (!driverId) {
      alert("Please select a driver");
      return;
    }

    try {
      const res = await fetch(
        "https://waterplantdatabse-v763.onrender.com/orders/assign-driver",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, driverId }),
        }
      );
      const data = await res.json();
      if (data.success) {
        alert(`Driver assigned to order #${orderId}`);
        const ordersRes = await fetch("https://waterplantdatabse-v763.onrender.com/orders/all");
        const ordersData = await ordersRes.json();
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } else {
        alert(data.message || "Failed to assign driver");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  const styles = {
    container: {
      marginTop: "0px",
      fontFamily: "Arial, sans-serif",
      padding: "15px",
      maxWidth: "100%",
      boxSizing: "border-box",
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
    header: { color: "#FF6600", margin: 0 },
    tableResponsiveWrapper: {
      width: "100%",
      overflowX: "auto",
      WebkitOverflowScrolling: "touch",
    },
    table: { width: "100%", borderCollapse: "collapse", minWidth: "1100px" },
    th: {
      border: "1px solid #FF6600",
      padding: "10px",
      backgroundColor: "#FF6600",
      color: "#fff",
      textAlign: "left",
      whiteSpace: "nowrap",
    },
    td: { border: "1px solid #FF6600", padding: "10px", textAlign: "left", whiteSpace: "nowrap" },
    row: { backgroundColor: "#fff" },
    assignBtn: {
      marginLeft: "10px",
      padding: "5px 10px",
      backgroundColor: "#FF6600",
      border: "none",
      color: "#fff",
      borderRadius: "5px",
      cursor: "pointer",
      whiteSpace: "nowrap",
    },
    itemsCell: { maxWidth: "200px", whiteSpace: "normal" },
    select: { padding: "5px", borderRadius: "5px" },
  };

  if (loading) return <div style={styles.container}>Loading orders...</div>;
  if (!orders.length) return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <button style={styles.backBtn} onClick={() => navigate(-1)} title="Go Back">
          ←
        </button>
        <h2 style={styles.header}>Admin Orders</h2>
      </div>
      <div>No orders found</div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <button style={styles.backBtn} onClick={() => navigate(-1)} title="Go Back">
          ←
        </button>
        <h2 style={styles.header}>Admin Orders</h2>
      </div>

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
              <th style={styles.th}>Assign Driver</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, idx) => (
              <tr key={order.id} style={styles.row}>
                <td style={styles.td}>{order.id}</td>
                <td style={styles.td}>{order.customer_name}</td>
                <td style={styles.td}>{order.mobile}</td>
                <td style={styles.td}>{order.address} {order.landmark}</td>
                <td style={styles.td}>{order.pincode}</td>
                <td style={styles.td}>{order.payment_mode}</td>
                <td style={styles.td}>₹{order.total_amount}</td>
                <td style={styles.td}>{order.is_premium ? "Yes" : "No"}</td>
                <td style={{ ...styles.td, color: order.status === "Pending" ? "#E53935" : "#4CAF50" }}>
                  {order.status}
                </td>
                <td style={{ ...styles.td, ...styles.itemsCell }}>
                  {order.items.map((item, itemIdx) => {
                    const itemName = item.item_name || item.name || "Unnamed";
                    const itemTotal = item.total ? `₹${item.total}` : "";
                    const key = item.item_id || itemIdx;
                    return (
                      <div key={key}>
                        {item.qty} × {itemName} {itemTotal}
                      </div>
                    );
                  })}
                </td>
                <td style={styles.td}>{order.created_at ? order.created_at.slice(0, 10) : "N/A"}</td>
                <td style={styles.td}>
                  {order.status === "Pending" && (
                    <div style={{ display: "inline-flex", alignItems: "center" }}>
                      <select
                        style={styles.select}
                        value={selectedDrivers[order.id] || ""}
                        onChange={(e) =>
                          setSelectedDrivers((prev) => ({
                            ...prev,
                            [order.id]: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select Driver</option>
                        {drivers.map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {driver.name}
                          </option>
                        ))}
                      </select>
                      <button
                        style={styles.assignBtn}
                        onClick={() => handleAssignDriver(order.id)}
                      >
                        Assign
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}