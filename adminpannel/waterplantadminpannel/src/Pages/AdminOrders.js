import React, { useState, useEffect } from "react";

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDrivers, setSelectedDrivers] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ordersRes, driversRes] = await Promise.all([
          fetch("https://waterplantdatabse.onrender.com/orders/all"),
          fetch("https://waterplantdatabse.onrender.com/users/list/drivers"),
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
        "https://waterplantdatabse.onrender.com/orders/assign-driver",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, driverId }),
        }
      );
      const data = await res.json();
      if (data.success) {
        alert(`Driver assigned to order #${orderId}`);
        // Refresh orders
        const ordersRes = await fetch("https://waterplantdatabse.onrender.com/orders/all");
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
      marginTop: "20px",
      fontFamily: "Arial, sans-serif",
      padding: "15px",
    },
    header: { color: "#FF6600", marginBottom: "15px" },
    table: { width: "100%", borderCollapse: "collapse" },
    th: {
      border: "1px solid #FF6600",
      padding: "10px",
      backgroundColor: "#FF6600",
      color: "#fff",
      textAlign: "left",
    },
    td: { border: "1px solid #FF6600", padding: "10px", textAlign: "left" },
    row: { backgroundColor: "#fff" },
    assignBtn: {
      marginLeft: "10px",
      padding: "5px 10px",
      backgroundColor: "#FF6600",
      border: "none",
      color: "#fff",
      borderRadius: "5px",
      cursor: "pointer",
    },
    itemsCell: { maxWidth: "200px" },
    select: { padding: "5px", borderRadius: "5px" },
  };

  if (loading) return <div style={styles.container}>Loading orders...</div>;
  if (!orders.length) return <div style={styles.container}>No orders found</div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Admin Orders</h2>
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
                {order.items.map((item) => (
                  <div key={item.item_id}>
                    {item.qty} × {item.item_name} (₹{item.total})
                  </div>
                ))}
              </td>
              <td style={styles.td}>{order.created_at.slice(0, 10)}</td>
              <td style={styles.td}>
                {order.status === "Pending" && (
                  <>
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
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
