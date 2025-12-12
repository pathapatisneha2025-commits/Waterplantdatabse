import React from "react";
import { useNavigate } from "react-router-dom";

const GroceryList = ({ items = [], handleEdit = () => {}, handleDelete = () => {} }) => {
  const navigate = useNavigate();

  return (
    <div style={styles.wrapper}>
      <h1 style={styles.title}>Grocery Items</h1>

      {/* Add Items Button (Right Aligned) */}
      <div style={styles.addBtnContainer}>
        <button
          style={styles.addBtn}
          onClick={() => navigate("/adminGrocery")}
        >
          ➕ Add Items
        </button>
      </div>

      {/* Table Card */}
      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Price</th>
              <th>Premium Price</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {items?.length === 0 ? (
              <tr>
                <td colSpan="5" style={styles.emptyText}>
                  No items found
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <img
                      src={item.img}
                      alt="img"
                      style={{ width: 50, height: 50, borderRadius: 8 }}
                    />
                  </td>
                  <td>{item.name}</td>
                  <td>₹{item.price}</td>
                  <td>₹{item.premiumPrice}</td>
                  <td>
                    <button
                      style={styles.editBtn}
                      onClick={() => handleEdit(item)}
                    >
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
    </div>
  );
};

const styles = {
  wrapper: {
    padding: "30px",
    background: "#fff",
    minHeight: "100vh",
    fontFamily: "Arial",
  },
  title: {
    color: "#ff6600",
    fontSize: "30px",
    marginBottom: "20px",
    fontWeight: "bold",
  },

  // New container for right-aligned button
  addBtnContainer: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "20px",
  },

  addBtn: {
    padding: "10px 20px",
    background: "#ff6600",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  tableCard: {
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
    borderLeft: "5px solid #ff6600",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  emptyText: {
    textAlign: "center",
    padding: "20px",
    color: "#777",
  },
  editBtn: {
    padding: "6px 10px",
    background: "#ffaa33",
    border: "none",
    borderRadius: "6px",
    marginRight: "5px",
    cursor: "pointer",
    color: "#fff",
  },
  deleteBtn: {
    padding: "6px 10px",
    background: "#ff3300",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    color: "#fff",
  },
};

export default GroceryList;
