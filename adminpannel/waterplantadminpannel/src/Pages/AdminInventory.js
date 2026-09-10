import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function GroceryListStock() {
  const navigate = useNavigate();
  const [groceries, setGroceries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch groceries from API
  useEffect(() => {
    const fetchGroceries = async () => {
      try {
        const res = await fetch("https://api2.ajpartyhouse.in/groceries/all");
        const data = await res.json();

        if (data.success && Array.isArray(data.groceries)) {
          // Ensure stock is a number
          const normalized = data.groceries.map((item) => ({
            ...item,
            stock: Number(item.stock ?? 0),
            price: Number(item.price ?? 0),
            premiumprice: Number(item.premiumprice ?? 0),
          }));
          setGroceries(normalized);
        } else {
          setGroceries([]);
        }
      } catch (err) {
        console.error("Error fetching groceries:", err);
        setGroceries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGroceries();
  }, []);

 const styles = {
  // =========================================================
  // MAIN CONTAINER
  // =========================================================

  container: {
    width: "100%",
    minHeight: "100vh",
    marginTop: "0",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    background: "#f7f8fa",
    boxSizing: "border-box",
  },

  // =========================================================
  // HEADER
  // =========================================================

  headerRow: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "20px",
    boxSizing: "border-box",
  },

  backBtn: {
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: "10px",
    width: "42px",
    height: "42px",
    minWidth: "42px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    cursor: "pointer",
    color: "#333",
    flexShrink: 0,
    transition: "all 0.2s ease",
  },

  header: {
    color: "#ff7f50",
    margin: 0,
    fontSize: "24px",
    fontWeight: "700",
    lineHeight: "1.3",
  },

  // =========================================================
  // TABLE RESPONSIVE WRAPPER
  // =========================================================

  tableResponsiveWrapper: {
    width: "100%",
    overflowX: "auto",
    overflowY: "hidden",
    WebkitOverflowScrolling: "touch",
    background: "#fff",
    borderRadius: "12px",
    boxSizing: "border-box",
  },

  // =========================================================
  // TABLE
  // =========================================================

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "800px",
    background: "#fff",
  },

  // =========================================================
  // TABLE HEADER
  // =========================================================

  th: {
    border: "1px solid #ff7f50",
    padding: "12px 14px",
    backgroundColor: "#ff7f50",
    color: "#fff",
    textAlign: "left",
    whiteSpace: "nowrap",
    fontSize: "14px",
    fontWeight: "700",
    lineHeight: "1.4",
  },

  // =========================================================
  // TABLE DATA
  // =========================================================

  td: {
    border: "1px solid #eee",
    padding: "12px 14px",
    textAlign: "left",
    whiteSpace: "nowrap",
    fontSize: "14px",
    color: "#333",
    background: "#fff",
    verticalAlign: "middle",
    lineHeight: "1.4",
  },

  // =========================================================
  // IMAGE
  // NO CONTAINER
  // NO BORDER
  // NO BACKGROUND
  // NO RADIUS
  // =========================================================

  img: {
    display: "block",
    width: "60px",
    height: "60px",
    objectFit: "contain",
    objectPosition: "center",
    border: "none",
    borderRadius: "0",
    background: "transparent",
    boxShadow: "none",
    padding: "0",
    margin: "0",
  },

  // =========================================================
  // EMPTY STATE
  // =========================================================

  emptyText: {
    width: "100%",
    padding: "40px 20px",
    textAlign: "center",
    color: "#999",
    background: "#fff",
    borderRadius: "12px",
    fontSize: "15px",
    boxSizing: "border-box",
  },
};

  if (loading) return <div style={styles.container}>Loading groceries...</div>;

  if (groceries.length === 0)
    return (
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <button style={styles.backBtn} onClick={() => navigate(-1)} title="Go Back">
            ←
          </button>
          <h2 style={styles.header}>Grocery Items</h2>
        </div>
        <div style={styles.emptyText}>No grocery items found.</div>
      </div>
    );

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <button style={styles.backBtn} onClick={() => navigate(-1)} title="Go Back">
          ←
        </button>
        <h2 style={styles.header}>Grocery Items</h2>
      </div>

      <div style={styles.tableResponsiveWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Image</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Brand</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Price</th>
              <th style={styles.th}>Premium Price</th>
              <th style={styles.th}>In-Hand Quantity</th>
            </tr>
          </thead>
          <tbody>
            {groceries.map((item) => (
              <tr key={item.id}>
                <td style={styles.td}>
                  <img src={item.img} alt={item.name} style={styles.img} />
                </td>
                <td style={styles.td}>{item.name}</td>
                <td style={styles.td}>{item.brand}</td>
                <td style={styles.td}>{item.category}</td>
                <td style={styles.td}>₹ {item.price}</td>
                <td style={styles.td}>₹ {item.premiumprice}</td>
                <td
                  style={{
                    ...styles.td,
                    color: item.stock <= 30 ? "red" : "green",
                    fontWeight: item.stock <= 30 ? "600" : "normal",
                  }}
                >
                  {item.stock}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}