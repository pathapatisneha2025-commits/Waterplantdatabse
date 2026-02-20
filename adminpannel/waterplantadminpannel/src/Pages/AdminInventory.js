import React, { useState, useEffect } from "react";

export default function GroceryListStock() {
  const [groceries, setGroceries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch groceries from API
  useEffect(() => {
    const fetchGroceries = async () => {
      try {
        const res = await fetch("https://waterplantdatabse.onrender.com/groceries/all");
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

  // Styles
  const styles = {
    container: { marginTop: "20px", fontFamily: "Arial, sans-serif" },
    header: { color: "#ff7f50", marginBottom: "10px" },
    table: { width: "100%", borderCollapse: "collapse" },
    th: {
      border: "1px solid #ff7f50",
      padding: "10px",
      backgroundColor: "#ff7f50",
      color: "white",
      textAlign: "left",
    },
    td: { border: "1px solid #ff7f50", padding: "10px", textAlign: "left" },
    img: { width: "50px", height: "50px", borderRadius: "5px" },
    emptyText: { padding: "20px", textAlign: "center", color: "#999" },
  };

  if (loading) return <div style={styles.container}>Loading groceries...</div>;

  if (groceries.length === 0)
    return <div style={styles.container}>No grocery items found.</div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Grocery Items</h2>
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
  );
}