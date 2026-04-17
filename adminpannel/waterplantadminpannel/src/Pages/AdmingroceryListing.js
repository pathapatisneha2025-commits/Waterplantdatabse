import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const GroceryList = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      const res = await fetch("https://waterplantdatabse.onrender.com/groceries/all");
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
        `https://waterplantdatabse.onrender.com/groceries/delete/${id}`,
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
        <h1 style={styles.title}>Grocery Items</h1>

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
                <th>ID</th>
                <th>Image</th>
                <th>Name</th>
                <th>Brand</th>
                <th>Category</th>
                <th>Subcategory</th>
                <th>Description</th>
                <th>Discount</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Stock</th>

                {/* ✅ PRICE STRUCTURE */}
                <th>MRP</th>
                <th>Non-Premium</th>
                <th>Premium</th>

                <th>Actions</th>
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
                    <td>{item.id}</td>

                    <td>
                      <img src={item.img} alt="img" style={styles.image} />
                    </td>

                    <td>{item.name}</td>
                    <td>{item.brand}</td>
                    <td>{item.category}</td>
                    <td>{item.subcategory}</td>
                    <td style={{ maxWidth: "200px" }}>{item.description}</td>
                    <td>{item.discount}%</td>
                    <td>{item.quantity}</td>
                    <td>{item.unit}</td>
                    <td>{item.stock}</td>

                    {/* ✅ PRICES */}
                    <td>₹{item.mrp}</td>
                    <td>₹{item.price}</td>
                    <td>₹{item.premiumPrice || item.premiumprice}</td>

                    <td style={styles.actionCol}>
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
    padding: "30px",
    minHeight: "100vh",
    background: "#f9fafb",
    fontFamily: "Arial",
  },

  headerContainer: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "25px",
  },

  title: {
    color: "#ff6600",
    fontSize: "32px",
    fontWeight: "bold",
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
    padding: "20px",
    borderRadius: "12px",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1300px",
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
  },

  editBtn: {
    background: "#ffaa33",
    border: "none",
    padding: "6px 10px",
    borderRadius: "6px",
    color: "#fff",
    fontWeight: "bold",
  },

  deleteBtn: {
    background: "#ff3300",
    border: "none",
    padding: "6px 10px",
    borderRadius: "6px",
    color: "#fff",
    fontWeight: "bold",
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