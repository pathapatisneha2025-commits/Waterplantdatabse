import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const AddGrocery = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const editItem = location.state?.item;
  const isEdit = !!editItem;

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

    // PRICE STRUCTURE
    mrp: "",
    price: "",
    premiumPrice: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");

  // =========================
  // PREFILL ON EDIT
  // =========================
  useEffect(() => {
    if (editItem) {
      setForm({
        name: editItem.name || "",
        brand: editItem.brand || "",
        category: editItem.category || "",
        subcategory: editItem.subcategory || "",
        description: editItem.description || "",
        discount: editItem.discount || "",
        quantity: editItem.quantity || 1,
        unit: editItem.unit || "",
        stock: editItem.stock || "",

        mrp: editItem.mrp || "",
        price: editItem.price || "",
        premiumPrice:
          editItem.premiumPrice || editItem.premiumprice || "",
      });

      setPreview(editItem.img || "");
    }
  }, [editItem]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  // =========================
  // ADD + EDIT SUBMIT
  // =========================
  const handleSubmit = async () => {
    const formData = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value);
    });

    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      const url = isEdit
        ? `https://waterplantdatabse.onrender.com/groceries/update/${editItem.id}`
        : `https://waterplantdatabse.onrender.com/groceries/add`;

      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed");
        return;
      }

      alert(isEdit ? "Updated Successfully!" : "Added Successfully!");
      navigate("/admingrocerylisting");
    } catch (error) {
      console.error(error);
      alert("Server Error");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.heading}>
          {isEdit ? "Edit Grocery Item" : "Add Grocery Item"}
        </h2>

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
        />

        {/* PRICE SECTION */}
        <input name="mrp" type="number" placeholder="MRP Price" value={form.mrp} onChange={handleChange} style={styles.input} />

        <input name="price" type="number" placeholder="Non-Premium Price" value={form.price} onChange={handleChange} style={styles.input} />

        <input name="premiumPrice" type="number" placeholder="Premium Price" value={form.premiumPrice} onChange={handleChange} style={styles.input} />

        <input name="discount" type="number" placeholder="Discount (%)" value={form.discount} onChange={handleChange} style={styles.input} />
        <input name="quantity" type="number" placeholder="Quantity" value={form.quantity} onChange={handleChange} style={styles.input} />
        <input name="unit" placeholder="Unit (kg, litre, pcs)" value={form.unit} onChange={handleChange} style={styles.input} />
        <input name="stock" type="number" placeholder="Stock" value={form.stock} onChange={handleChange} style={styles.input} />

        {/* IMAGE */}
        <label style={styles.fileLabel}>Upload Image</label>
        <input type="file" accept="image/*" onChange={handleImageChange} />

        {preview && (
          <img
            src={preview}
            alt="preview"
            style={{
              width: "100%",
              height: "180px",
              objectFit: "cover",
              borderRadius: "10px",
              marginTop: "10px",
              marginBottom: "15px",
            }}
          />
        )}

        <button style={styles.button} onClick={handleSubmit}>
          {isEdit ? "Update Item" : "Save Item"}
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
    fontSize: "24px",
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
  fileLabel: {
    fontWeight: "600",
    color: "#ff6600",
  },
};

export default AddGrocery;