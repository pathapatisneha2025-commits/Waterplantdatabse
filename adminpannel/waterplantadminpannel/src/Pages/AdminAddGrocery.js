import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddGrocery = ({ addItem }) => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    id: "",
    name: "",
    img: "",
    price: "",
    premiumPrice: "",
    quantity: 1,
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    addItem({ ...form, id: Date.now() });
    navigate("/grocery-list");
  };

  return (
    <div style={styles.wrapper}>
      <h1 style={styles.title}>Add Grocery Item</h1>

      <div style={styles.formCard}>
        <input
          name="name"
          placeholder="Item Name"
          value={form.name}
          onChange={handleChange}
          style={styles.input}
        />

        <input
          name="img"
          placeholder="Image URL"
          value={form.img}
          onChange={handleChange}
          style={styles.input}
        />

        <input
          name="price"
          placeholder="Non-Premium Price"
          type="number"
          value={form.price}
          onChange={handleChange}
          style={styles.input}
        />

        <input
          name="premiumPrice"
          placeholder="Premium Price"
          type="number"
          value={form.premiumPrice}
          onChange={handleChange}
          style={styles.input}
        />

        <button style={styles.submitBtn} onClick={handleSubmit}>
          Save Item
        </button>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    padding: "30px",
    background: "#fff",
    minHeight: "100vh",
  },
  title: {
    color: "#ff6600",
    fontSize: "28px",
    marginBottom: "15px",
    fontWeight: "bold",
  },
  formCard: {
    width: "40%",
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    borderLeft: "5px solid #ff6600",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "12px",
    borderRadius: "8px",
    border: "1px solid #ddd",
  },
  submitBtn: {
    width: "100%",
    padding: "12px",
    background: "#ff6600",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer",
  },
};

export default AddGrocery;
