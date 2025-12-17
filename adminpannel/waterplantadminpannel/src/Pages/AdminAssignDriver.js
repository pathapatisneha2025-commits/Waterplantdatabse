import React, { useEffect, useState } from "react";

const OrdersAssignDriver = () => {
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDrivers, setSelectedDrivers] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, driversRes, usersRes] = await Promise.all([
          fetch("https://waterplantdatabse.onrender.com/waterorder/all"),
          fetch("https://waterplantdatabse.onrender.com/users/list/drivers"),
          fetch("https://waterplantdatabse.onrender.com/users/list/customers"),
        ]);

        const ordersData = await ordersRes.json();
        const driversData = await driversRes.json();
        const usersData = await usersRes.json();

        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setDrivers(driversData.success ? driversData.drivers : []);
        setUsers(usersData.success ? usersData.customers : []);
      } catch (err) {
        console.error(err);
        setError("Server error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Map userId to customer info
  const userMap = users.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {});

  const handleAssignDriver = (orderId) => {
    const driverId = selectedDrivers[orderId];
    if (!driverId) {
      alert("Please select a driver");
      return;
    }

    fetch(`https://waterplantdatabse.onrender.com/waterorder/assign-driver`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, driverId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) alert(`Driver assigned successfully to order #${orderId}`);
        else alert(`Failed to assign driver: ${data.message}`);
      })
      .catch((err) => {
        console.error(err);
        alert("Server error");
      });
  };

  if (loading) return <p>Loading orders...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Water Orders</h2>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Order ID</th>
            <th style={styles.th}>Customer</th>
            <th style={styles.th}>Phone</th>
            <th style={styles.th}>Cans</th>
            <th style={styles.th}>Slot</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Created At</th>
            <th style={styles.th}>Assign Driver</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan="8" style={styles.noData}>No orders found</td>
            </tr>
          ) : (
            orders.map((order, idx) => {
              const customer = userMap[order.user_id] || { name: "Unknown", phone: "-" };
              return (
                <tr key={order.id} style={idx % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                  <td style={styles.td}>{order.id}</td>
                  <td style={styles.td}>{customer.name}</td>
                  <td style={styles.td}>{customer.phone}</td>
                  <td style={styles.td}>{order.cans}</td>
                  <td style={styles.td}>{order.slot}</td>
                  <td style={styles.td}>{order.status}</td>
                  <td style={styles.td}>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td style={styles.td}>
                    <select
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
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    maxWidth: "1200px",
    margin: "20px auto",
    backgroundColor: "#fff",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  heading: {
    color: "#FF6600",
    marginBottom: "15px",
    fontFamily: "Arial, sans-serif",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    border: "1px solid #FF6600",
    padding: "10px",
    backgroundColor: "#FF6600",
    color: "#fff",
    textAlign: "left",
  },
  td: { border: "1px solid #FF9900", padding: "8px", color: "#333" },
  rowEven: { backgroundColor: "#fff" },
  rowOdd: { backgroundColor: "#fff7f0" },
  noData: { textAlign: "center", padding: "15px", color: "#FF6600" },
  assignBtn: {
    marginLeft: "10px",
    padding: "5px 10px",
    backgroundColor: "#FF6600",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default OrdersAssignDriver;
