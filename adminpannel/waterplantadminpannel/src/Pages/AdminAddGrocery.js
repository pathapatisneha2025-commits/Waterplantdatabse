import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddGrocery = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
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
  });

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // IMAGE UPLOAD
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setPreview(URL.createObjectURL(file)); // preview image
  };

  // SUBMIT TO BACKEND API
  const handleSubmit = async () => {
  if (!imageFile) {
    alert("Please upload an image");
    return;
  }

  const formData = new FormData();
  Object.entries(form).forEach(([key, value]) => {
    formData.append(key, value);
  });

  formData.append("image", imageFile);

  try {
    const res = await fetch("https://waterplantdatabse.onrender.com/groceries/add", {
      method: "POST",
      body: formData, // VERY IMPORTANT → no headers for FormData
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to add item");
      return;
    }

    alert("Grocery Item Added Successfully!");
    navigate("/admingrocerylisting");

  } catch (error) {
    console.error("Upload Error:", error);
    alert("Failed to add item");
  }
};


  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.heading}>Add Grocery Item</h2>

        {/* TEXT INPUT FIELDS */}
        <input name="name" placeholder="Grocery Name" value={form.name} onChange={handleChange} style={styles.input} />
        <input name="brand" placeholder="Brand" value={form.brand} onChange={handleChange} style={styles.input} />
        <input name="category" placeholder="Category" value={form.category} onChange={handleChange} style={styles.input} />
        <input name="subcategory" placeholder="Subcategory" value={form.subcategory} onChange={handleChange} style={styles.input} />

        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          style={{ ...styles.input, height: "70px" }}
        ></textarea>

        <input name="price" type="number" placeholder="Price" value={form.price} onChange={handleChange} style={styles.input} />
        <input name="premiumPrice" type="number" placeholder="Premium Price" value={form.premiumPrice} onChange={handleChange} style={styles.input} />
        <input name="discount" type="number" placeholder="Discount (%)" value={form.discount} onChange={handleChange} style={styles.input} />
        <input name="quantity" type="number" placeholder="Quantity" value={form.quantity} onChange={handleChange} style={styles.input} />
        <input name="unit" placeholder="Unit (kg, litre, pcs)" value={form.unit} onChange={handleChange} style={styles.input} />
        <input name="stock" type="number" placeholder="Stock" value={form.stock} onChange={handleChange} style={styles.input} />

        {/* IMAGE FILE INPUT */}
        <label style={styles.fileLabel}>Upload Image</label>
        <input type="file" accept="image/*" onChange={handleImageChange} style={styles.fileInput} />

        {/* IMAGE PREVIEW */}
        {preview && (
          <img
            src={preview}
            alt="preview"
            style={{
              width: "100%",
              height: "180px",
              objectFit: "cover",
              borderRadius: "10px",
              marginBottom: "15px",
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
    padding: "20px",
  },
  card: {
    width: "420px",
    background: "#fff",
    padding: "30px",
    borderRadius: "16px",
    boxShadow: "0px 4px 18px rgba(0,0,0,0.1)",
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
    marginBottom: "14px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    fontSize: "15px",
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
  },
  fileLabel: { fontWeight: "600", color: "#ff6600", marginBottom: "5px" },
};

export default AddGrocery;
