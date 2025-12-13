import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const GroceryList = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // ============================
  // FETCH LISTING API
  // ============================
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

  // ============================
  // DELETE API
  // ============================
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

  // Redirect to Edit
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
                <th>Price</th>
                <th>Premium</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="14" style={styles.emptyText}>
                    No items found
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} style={styles.row}>
                   
                    <td>{item.id}</td>
                     <td>
                      <img
                        src={item.img}
                        alt="img"
                        style={styles.image}
                      />
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
                    <td>₹{item.price}</td>
                    <td>₹{item.premiumprice}</td>

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

// -----------------------
// BEAUTIFUL UI STYLING
// -----------------------
const styles = {
  wrapper: {
    padding: "30px",
    minHeight: "100vh",
    background: "#f9fafb",
    fontFamily: "Arial, sans-serif",
  },

  headerContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
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
    fontSize: "15px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "0.2s",
  },

  tableCard: {
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1200px",
  },

  image: {
    width: "55px",
    height: "55px",
    borderRadius: "8px",
    objectFit: "cover",
  },

  emptyText: {
    padding: "20px",
    textAlign: "center",
    color: "#999",
    fontSize: "16px",
  },

  loadingText: {
    textAlign: "center",
    fontSize: "18px",
    marginTop: "50px",
  },

  row: {
    borderBottom: "1px solid #eee",
    transition: "0.2s",
  },

  actionCol: {
    minWidth: "150px",
    display: "flex",
    gap: "8px",
  },

  editBtn: {
    padding: "6px 12px",
    background: "#ffaa33",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    color: "#fff",
    fontWeight: "bold",
  },

  deleteBtn: {
    padding: "6px 12px",
    background: "#ff3300",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    color: "#fff",
    fontWeight: "bold",
  },
};

export default GroceryList;
