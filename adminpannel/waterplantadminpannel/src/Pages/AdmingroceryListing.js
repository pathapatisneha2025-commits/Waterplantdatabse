import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const GroceryList = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      const res = await fetch("https://waterplantdatabse-v763.onrender.com/groceries/all");
      const data = await res.json();

      console.log("API Response:", data);

      if (Array.isArray(data)) setItems(data);
      else if (Array.isArray(data.data)) setItems(data.data);
      else if (Array.isArray(data.groceries)) setItems(data.groceries);
      else setItems([]);
    } catch (error) {
      console.log("Error fetching grocery:", error);
      alert("Server error");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure to delete?")) return;

    try {
      const res = await fetch(
        `https://waterplantdatabse-v763.onrender.com/groceries/delete/${id}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        setItems(items.filter((item) => item.id !== id));
      } else {
        alert("Delete failed");
      }
    } catch {
      alert("Server error");
    }
  };

  const handleEdit = (item) => {
    navigate("/adminGrocery", { state: { item } });
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.headerContainer}>
        <div>
          <h1 style={styles.title}>Grocery Items</h1>
          <p style={styles.subtitle}>Manage inventory, pricing, and stock details seamlessly.</p>
        </div>

        <button style={styles.addBtn} onClick={() => navigate("/adminGrocery")}>
          ➕ Add New Item
        </button>
      </div>

      {loading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading inventory...</p>
        </div>
      ) : (
        <div style={styles.tableCard}>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Image</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Brand</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Subcategory</th>
                  <th style={styles.th}>Description</th>
                  <th style={styles.th}>Discount</th>
                  <th style={styles.th}>Qty</th>
                  <th style={styles.th}>Unit</th>
                  <th style={styles.th}>Stock</th>
                  <th style={styles.th}>MRP</th>
                  <th style={styles.th}>Non-Premium</th>
                  <th style={styles.th}>Premium</th>
                  <th style={{ ...styles.th, textAlign: "center" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="15" style={styles.emptyText}>
                      📦 No grocery items found
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr 
                      key={item.id} 
                      style={{
                        ...styles.row,
                        backgroundColor: index % 2 === 0 ? "#ffffff" : "#fbfbfb"
                      }}
                    >
                      <td style={styles.td}>#{item.id}</td>

                      <td style={styles.td}>
                        <img 
                          src={item.img} 
                          alt={item.name} 
                          style={styles.image} 
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/55?text=No+Img";
                          }}
                        />
                      </td>

                      <td style={{ ...styles.td, fontWeight: "600", color: "#1f2937" }}>{item.name}</td>
                      <td style={styles.td}>{item.brand}</td>
                      <td style={styles.td}>
                        <span style={styles.badge}>{item.category}</span>
                      </td>
                      <td style={styles.td}>{item.subcategory}</td>
                      <td style={{ ...styles.td, maxWidth: "200px", color: "#6b7280" }} title={item.description}>
                        {item.description || "—"}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.discountBadge}>{item.discount}% OFF</span>
                      </td>
                      <td style={styles.td}>{item.quantity}</td>
                      <td style={styles.td}>{item.unit}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.stockBadge,
                          background: item.stock > 0 ? "#def7ec" : "#fde8e8",
                          color: item.stock > 0 ? "#03543f" : "#9b1c1c"
                        }}>
                          {item.stock} in stock
                        </span>
                      </td>

                      <td style={{ ...styles.td, textDecoration: "line-through", color: "#9ca3af" }}>₹{item.mrp}</td>
                      <td style={{ ...styles.td, fontWeight: "600", color: "#111827" }}>₹{item.price}</td>
                      <td style={{ ...styles.td, fontWeight: "600", color: "#059669" }}>₹{item.premiumPrice || item.premiumprice}</td>

                      <td style={{ ...styles.td, textAlign: "center" }}>
                        <div style={styles.actionCol}>
                          <button style={styles.editBtn} onClick={() => handleEdit(item)}>
                            Edit
                          </button>

                          <button
                            style={styles.deleteBtn}
                            onClick={() => handleDelete(item.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  wrapper: {
    padding: "32px",
    minHeight: "100vh",
    background: "#f4f6f9",
    fontFamily: "'Inter', sans-serif",
  },

  headerContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "28px",
    flexWrap: "wrap",
    gap: "16px",
  },

  title: {
    color: "#111827",
    fontSize: "28px",
    fontWeight: "700",
    margin: 0,
  },

  subtitle: {
    color: "#6b7280",
    fontSize: "14px",
    marginTop: "4px",
    marginBottom: 0,
  },

  addBtn: {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #ff6600 0%, #e65c00 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(255, 102, 0, 0.25)",
    transition: "all 0.2s ease",
  },

  tableCard: {
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
    overflow: "hidden",
    border: "1px solid #e5e7eb",
  },

  tableWrapper: {
    overflowX: "auto",
    width: "100%",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1400px",
    textAlign: "left",
  },

  th: {
    background: "#f9fafb",
    color: "#374151",
    fontWeight: "600",
    fontSize: "13px",
    padding: "14px 16px",
    borderBottom: "1px solid #e5e7eb",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },

  td: {
    padding: "14px 16px",
    fontSize: "14px",
    color: "#4b5563",
    borderBottom: "1px solid #f3f4f6",
    whiteSpace: "nowrap",
  },

  image: {
    width: "48px",
    height: "48px",
    borderRadius: "8px",
    objectFit: "cover",
    border: "1px solid #e5e7eb",
  },

  row: {
    transition: "background 0.15s ease",
  },

  badge: {
    background: "#e0f2fe",
    color: "#0369a1",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "500",
  },

  discountBadge: {
    background: "#fef3c7",
    color: "#d97706",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
  },

  stockBadge: {
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "500",
  },

  actionCol: {
    display: "flex",
    gap: "8px",
    justifyContent: "center",
  },

  editBtn: {
    background: "#eff6ff",
    color: "#2563eb",
    border: "1px solid #bfdbfe",
    padding: "6px 12px",
    borderRadius: "6px",
    fontWeight: "600",
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.2s",
  },

  deleteBtn: {
    background: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fecaca",
    padding: "6px 12px",
    borderRadius: "6px",
    fontWeight: "600",
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.2s",
  },

  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "300px",
  },

  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #ff6600",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },

  loadingText: {
    marginTop: "12px",
    color: "#6b7280",
    fontSize: "14px",
    fontWeight: "500",
  },

  emptyText: {
    textAlign: "center",
    padding: "40px",
    color: "#9ca3af",
    fontSize: "15px",
    fontWeight: "500",
  },
};

export default GroceryList;