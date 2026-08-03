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
        const res = await fetch("https://waterplantdatabse-v763.onrender.com/groceries/all");
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

  // Styles preserving the original color theme, plus header row, back button, and mobile scroll responsiveness
  const styles = {
    container: { 
      marginTop: "0px", 
      fontFamily: "Arial, sans-serif",
      padding: "15px",
      maxWidth: "100%",
      boxSizing: "border-box"
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
    header: { color: "#ff7f50", margin: 0 },
    tableResponsiveWrapper: {
      width: "100%",
      overflowX: "auto",
      WebkitOverflowScrolling: "touch",
    },
    table: { width: "100%", borderCollapse: "collapse", minWidth: "800px" },
    th: {
      border: "1px solid #ff7f50",
      padding: "10px",
      backgroundColor: "#ff7f50",
      color: "white",
      textAlign: "left",
      whiteSpace: "nowrap",
    },
    td: { border: "1px solid #ff7f50", padding: "10px", textAlign: "left", whiteSpace: "nowrap" },
    img: { width: "50px", height: "50px", borderRadius: "5px", objectFit: "cover" },
    emptyText: { padding: "20px", textAlign: "center", color: "#999" },
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