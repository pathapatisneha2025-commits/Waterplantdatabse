import React, { useState, useEffect } from "react";
import moment from "moment";

export default function AdminDriverDashboard() {
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState({});
  const [filter, setFilter] = useState("month"); // month, quarter, custom
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [loading, setLoading] = useState(true);

  // Fetch orders and drivers
  useEffect(() => {
    const fetchData = async () => {
      try {
        const resOrders = await fetch("https://waterplantdatabse.onrender.com/orders/all");
        const dataOrders = await resOrders.json();
        const transformedOrders = dataOrders.map((o) => ({
          id: o.id,
          customer_name: o.customer_name,
          status: o.status,
          total_amount: Number(o.total_amount),
          delivered_cans: Number(o.delivered_cans || 0),
          created_at: o.created_at,
          driver_id: o.driver_id,
        }));
        setOrders(transformedOrders);

        const resUsers = await fetch("https://waterplantdatabse.onrender.com/users/all");
        const dataUsers = await resUsers.json();
        const driverMap = dataUsers.users
          .filter((u) => u.role === "driver")
          .reduce((acc, d) => {
            acc[d.id] = d.name;
            return acc;
          }, {});
        setDrivers(driverMap);
      } catch (err) {
        console.error("Error fetching data:", err);
        alert("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter orders
  const filterOrders = () => {
    const now = moment();
    return orders.filter((order) => {
      const orderDate = moment(order.created_at);
      if (filter === "month") return orderDate.isSame(now, "month");
      if (filter === "quarter") return orderDate.quarter() === now.quarter() && orderDate.year() === now.year();
      if (filter === "custom" && dateRange.start && dateRange.end) {
        const startDate = moment(dateRange.start).startOf("day");
        const endDate = moment(dateRange.end).endOf("day");
        return orderDate.isBetween(startDate, endDate, undefined, "[]");
      }
      return true;
    });
  };

  const filteredOrders = filterOrders();
  const totalDelivered = filteredOrders.filter((o) => o.status === "Delivered").length;

  // Only sum delivered orders
  const totalAmount = filteredOrders
    .filter((o) => o.status === "Delivered")
    .reduce((sum, o) => sum + o.total_amount, 0);

  // Inline styles matching CustomerManagement UI
  const styles = {
    container: { fontFamily: "Arial, sans-serif", maxWidth: "900px", margin: "20px auto" },
    header: { color: "#ff7f50", marginBottom: "10px", textAlign: "center" },
    table: { width: "100%", borderCollapse: "collapse", marginTop: "20px" },
    th: { border: "1px solid #ff7f50", padding: "10px", backgroundColor: "#ff7f50", color: "white", textAlign: "left" },
    td: { border: "1px solid #ff7f50", padding: "10px", textAlign: "left" },
    filters: { display: "flex", justifyContent: "center", gap: "10px", marginBottom: "20px" },
    filterBtn: { padding: "8px 16px", backgroundColor: "#3498db", border: "none", color: "white", cursor: "pointer", borderRadius: "5px" },
    filterBtnActive: { backgroundColor: "#2980b9" },
    customRange: { display: "flex", gap: "10px", marginLeft: "10px" },
    stats: { display: "flex", justifyContent: "space-around", marginBottom: "20px" },
    statCard: { backgroundColor: "#ecf0f1", padding: "16px", borderRadius: "8px", textAlign: "center", width: "200px" },
    statTitle: { marginBottom: "8px", color: "#2c3e50" },
    statValue: { fontSize: "20px", fontWeight: "bold" },
    statusColors: {
      Pending: "#f1c40f",      // yellow
      Assigned: "#3498db",     // blue
      Delivered: "#2ecc71",    // green
    },
  };

  if (loading) return <div style={styles.container}>Loading orders...</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Driver Dashboard</h1>

      {/* Filters */}
      <div style={styles.filters}>
        <button
          style={{ ...styles.filterBtn, ...(filter === "month" ? styles.filterBtnActive : {}) }}
          onClick={() => setFilter("month")}
        >
          This Month
        </button>
        <button
          style={{ ...styles.filterBtn, ...(filter === "quarter" ? styles.filterBtnActive : {}) }}
          onClick={() => setFilter("quarter")}
        >
          This Quarter
        </button>
        <button
          style={{ ...styles.filterBtn, ...(filter === "custom" ? styles.filterBtnActive : {}) }}
          onClick={() => setFilter("custom")}
        >
          Custom Range
        </button>

        {filter === "custom" && (
          <div style={styles.customRange}>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={styles.stats}>
        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Deliveries</h3>
          <p style={styles.statValue}>{totalDelivered}</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Amount Generated</h3>
          <p style={styles.statValue}>₹ {totalAmount}</p>
        </div>
      </div>

      {/* Orders Table */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Customer</th>
            <th style={styles.th}>Driver</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Amount</th>
            <th style={styles.th}>Delivered Cans</th>
            <th style={styles.th}>Date</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map((o) => (
            <tr
              key={o.id}
              style={{ backgroundColor: styles.statusColors[o.status] || "#fff" }}
            >
              <td style={styles.td}>{o.id}</td>
              <td style={styles.td}>{o.customer_name}</td>
              <td style={styles.td}>{o.driver_id ? drivers[o.driver_id] : "Unassigned"}</td>
              <td style={styles.td}>{o.status}</td>
              <td style={styles.td}>₹ {o.total_amount}</td>
              <td style={styles.td}>{o.delivered_cans}</td>
              <td style={styles.td}>{moment(o.created_at).format("YYYY-MM-DD")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}