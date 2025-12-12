import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddGrocery = ({ addItem }) => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    id: "",
    name: "",
    brand: "",
    category: "",
    subcategory: "",
    description: "",
    discount: "",
    quantity: 1,
    unit: "",
    stock: "",
    price: "",
    premiumPrice: "",
    img: "", // Base64 stored here
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // IMAGE FILE UPLOAD HANDLER
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm({ ...form, img: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    addItem({ ...form, id: Date.now() });
    navigate("/grocery-list");
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.heading}>Add Grocery Item</h2>

        {/* Name */}
        <input
          name="name"
          placeholder="Grocery Name"
          value={form.name}
          onChange={handleChange}
          style={styles.input}
        />

        {/* Brand */}
        <input
          name="brand"
          placeholder="Brand"
          value={form.brand}
          onChange={handleChange}
          style={styles.input}
        />

        {/* Category */}
        <input
          name="category"
          placeholder="Category (e.g., Vegetables)"
          value={form.category}
          onChange={handleChange}
          style={styles.input}
        />

        {/* Subcategory */}
        <input
          name="subcategory"
          placeholder="Subcategory (e.g., Leafy Vegetables)"
          value={form.subcategory}
          onChange={handleChange}
          style={styles.input}
        />

        {/* Description */}
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          style={{ ...styles.input, height: "70px", resize: "none" }}
        ></textarea>

        {/* Price */}
        <input
          name="price"
          placeholder="Price"
          type="number"
          value={form.price}
          onChange={handleChange}
          style={styles.input}
        />

        {/* Premium Price */}
        <input
          name="premiumPrice"
          placeholder="Premium Price"
          type="number"
          value={form.premiumPrice}
          onChange={handleChange}
          style={styles.input}
        />

        {/* Discount */}
        <input
          name="discount"
          placeholder="Discount (%)"
          type="number"
          value={form.discount}
          onChange={handleChange}
          style={styles.input}
        />

        {/* Quantity */}
        <input
          name="quantity"
          placeholder="Quantity"
          type="number"
          value={form.quantity}
          onChange={handleChange}
          style={styles.input}
        />

        {/* Unit */}
        <input
          name="unit"
          placeholder="Unit (kg, g, litre, pcs)"
          value={form.unit}
          onChange={handleChange}
          style={styles.input}
        />

        {/* Stock */}
        <input
          name="stock"
          placeholder="Stock Available"
          type="number"
          value={form.stock}
          onChange={handleChange}
          style={styles.input}
        />

        {/* FILE INPUT */}
        <label style={styles.fileLabel}>Upload Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          style={styles.fileInput}
        />

        {/* IMAGE PREVIEW */}
        {form.img && (
          <img
            src={form.img}
            alt="preview"
            style={{
              width: "100%",
              height: "180px",
              objectFit: "cover",
              marginBottom: "15px",
              borderRadius: "10px",
              border: "1px solid #eee",
            }}
          />
        )}

        <button style={styles.button} onClick={handleSubmit}>
          Save Item
        </button>
      </div>
    </div>
  );
};

const styles = {
  page: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "#ffffff",
    padding: "20px",
  },

  card: {
    width: "420px",
    background: "#ffffff",
    padding: "30px",
    borderRadius: "16px",
    border: "1px solid #f5f5f5",
    boxShadow: "0px 4px 18px rgba(0,0,0,0.08)",
  },

  heading: {
    textAlign: "center",
    fontSize: "26px",
    fontWeight: "700",
    color: "#ff6600",
    marginBottom: "25px",
  },

  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "15px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    fontSize: "15px",
  },

  fileLabel: {
    marginBottom: "5px",
    fontWeight: "600",
    color: "#ff6600",
    display: "block",
  },

  fileInput: {
    marginBottom: "15px",
  },

  button: {
    width: "100%",
    padding: "14px",
    background: "#ff6600",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "17px",
    cursor: "pointer",
    fontWeight: "600",
  },
};

export default AddGrocery;
