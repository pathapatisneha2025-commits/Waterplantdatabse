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
        <div style={styles.headerLeft}>
          <button style={styles.backBtn} onClick={() => navigate(-1)} title="Go Back">
            ←
          </button>
          <h1 style={styles.title}>Grocery Items</h1>
        </div>

        <button style={styles.addBtn} onClick={() => navigate("/adminGrocery")}>
          ➕ Add Item
        </button>
      </div>

      {loading ? (
        <p style={styles.loadingText}>Loading...</p>
      ) : (
        <div style={styles.tableCard}>
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

                {/* ✅ PRICE STRUCTURE */}
                <th style={styles.th}>MRP</th>
                <th style={styles.th}>Non-Premium</th>
                <th style={styles.th}>Premium</th>

                <th style={styles.th}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="16" style={styles.emptyText}>
                    No items found
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} style={styles.row}>
                    <td style={styles.td}>{item.id}</td>

                    <td style={styles.td}>
                      <img src={item.img} alt="img" style={styles.image} />
                    </td>

                    <td style={styles.td}>{item.name}</td>
                    <td style={styles.td}>{item.brand}</td>
                    <td style={styles.td}>{item.category}</td>
                    <td style={styles.td}>{item.subcategory}</td>
                    <td style={{ ...styles.td, maxWidth: "200px", whiteSpace: "normal" }}>{item.description}</td>
                    <td style={styles.td}>{item.discount}%</td>
                    <td style={styles.td}>{item.quantity}</td>
                    <td style={styles.td}>{item.unit}</td>
                    <td style={styles.td}>{item.stock}</td>

                    {/* ✅ PRICES */}
                    <td style={styles.td}>₹{item.mrp}</td>
                    <td style={styles.td}>₹{item.price}</td>
                    <td style={styles.td}>₹{item.premiumPrice || item.premiumprice}</td>

                    <td style={{ ...styles.td, ...styles.actionCol }}>
                      <button style={styles.editBtn} onClick={() => handleEdit(item)}>
                        Edit
                      </button>

                      <button
                        style={styles.deleteBtn}
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const styles = {
  wrapper: {
    padding: "15px",
    minHeight: "100vh",
    background: "#f9fafb",
    fontFamily: "Arial",
    maxWidth: "100%",
    boxSizing: "border-box",
  },

  headerContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
    flexWrap: "wrap",
    gap: "15px",
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
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

  title: {
    color: "#ff6600",
    fontSize: "28px",
    fontWeight: "bold",
    margin: 0,
  },

  addBtn: {
    padding: "10px 20px",
    background: "#ff6600",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  tableCard: {
    background: "#fff",
    padding: "10px",
    borderRadius: "12px",
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1300px",
  },

  th: {
    borderBottom: "1px solid #eee",
    padding: "10px",
    textAlign: "left",
    whiteSpace: "nowrap",
  },

  td: {
    borderBottom: "1px solid #eee",
    padding: "10px",
    textAlign: "left",
    whiteSpace: "nowrap",
  },

  image: {
    width: "55px",
    height: "55px",
    borderRadius: "8px",
    objectFit: "cover",
  },

  row: {
    borderBottom: "1px solid #eee",
  },

  actionCol: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },

  editBtn: {
    background: "#ffaa33",
    border: "none",
    padding: "6px 10px",
    borderRadius: "6px",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },

  deleteBtn: {
    background: "#ff3300",
    border: "none",
    padding: "6px 10px",
    borderRadius: "6px",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },

  loadingText: {
    textAlign: "center",
    marginTop: "50px",
  },

  emptyText: {
    textAlign: "center",
    padding: "20px",
    color: "#999",
  },
};

export default GroceryList;