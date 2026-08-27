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
    premiumDiscount: "",
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
  const [categories, setCategories] = useState([]);

  // =========================
  // FETCH CATEGORIES
  // =========================
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const url =
          "https://waterplantdatabse-v763.onrender.com/categories/all";

        const res = await fetch(url);

        if (!res.ok) {
          throw new Error(
            `Failed to fetch categories: ${res.status}`
          );
        }

        const data = await res.json();

        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error("Category fetch error:", error);
        alert("Failed to load categories");
      }
    };

    fetchCategories();
  }, []);

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
        premiumDiscount:
          editItem.premiumDiscount ||
          editItem.premiumdiscount ||
          "",

        quantity: editItem.quantity || 1,
        unit: editItem.unit || "",
        stock: editItem.stock || "",

        mrp: editItem.mrp || "",
        price: editItem.price || "",
        premiumPrice:
          editItem.premiumPrice ||
          editItem.premiumprice ||
          "",
      });

      setPreview(editItem.img || "");
    }
  }, [editItem]);

  // =========================
  // HANDLE CHANGE
  // =========================
  const handleChange = (e) => {
    const { name, value } = e.target;

    // MRP / NORMAL PRICE / PREMIUM PRICE
    // automatically calculate discounts
    if (
      name === "mrp" ||
      name === "price" ||
      name === "premiumPrice"
    ) {
      setForm((prev) => {
        const updated = {
          ...prev,
          [name]: value,
        };

        const mrp = parseFloat(updated.mrp);
        const normalPrice = parseFloat(updated.price);
        const premiumPrice = parseFloat(
          updated.premiumPrice
        );

        // =========================
        // NORMAL DISCOUNT
        // =========================
        if (
          !isNaN(mrp) &&
          mrp > 0 &&
          !isNaN(normalPrice) &&
          normalPrice >= 0
        ) {
          const discount =
            ((mrp - normalPrice) / mrp) * 100;

          updated.discount = Math.max(
            0,
            discount
          ).toFixed(2);
        } else {
          updated.discount = "";
        }

        // =========================
        // PREMIUM DISCOUNT
        // =========================
        if (
          !isNaN(mrp) &&
          mrp > 0 &&
          !isNaN(premiumPrice) &&
          premiumPrice >= 0
        ) {
          const discount =
            ((mrp - premiumPrice) / mrp) * 100;

          updated.premiumDiscount = Math.max(
            0,
            discount
          ).toFixed(2);
        } else {
          updated.premiumDiscount = "";
        }

        return updated;
      });

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================
  // IMAGE CHANGE
  // =========================
  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  // =========================
  // SUBMIT
  // =========================
  const handleSubmit = async () => {
    const mrp = parseFloat(form.mrp);
    const normalPrice = parseFloat(form.price);
    const premiumPrice = parseFloat(form.premiumPrice);

    // =========================
    // VALIDATION
    // =========================
    if (!form.name.trim()) {
      alert("Please enter grocery name");
      return;
    }

    if (!form.category) {
      alert("Please select category");
      return;
    }

    if (!form.mrp) {
      alert("Please enter MRP Price");
      return;
    }

    if (!form.price) {
      alert("Please enter Normal Price");
      return;
    }

    if (!form.premiumPrice) {
      alert("Please enter Premium Price");
      return;
    }

    if (normalPrice > mrp) {
      alert(
        "Normal Price cannot be greater than MRP"
      );
      return;
    }

    if (premiumPrice > mrp) {
      alert(
        "Premium Price cannot be greater than MRP"
      );
      return;
    }

    const formData = new FormData();

    Object.entries(form).forEach(
      ([key, value]) => {
        formData.append(key, value);
      }
    );

    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      const url = isEdit
        ? `https://waterplantdatabse-v763.onrender.com/groceries/update/${editItem.id}`
        : `https://waterplantdatabse-v763.onrender.com/groceries/add`;

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

      alert(
        isEdit
          ? "Updated Successfully!"
          : "Added Successfully!"
      );

      navigate("/admingrocerylisting");
    } catch (error) {
      console.error("Submit error:", error);
      alert("Server Error");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* =========================
            HEADER
        ========================= */}
        <div style={styles.header}>

          <button
            type="button"
            onClick={() => navigate(-1)}
            style={styles.backButton}
          >
            ←
          </button>

          <h2 style={styles.heading}>
            {isEdit
              ? "Edit Grocery Item"
              : "Add Grocery Item"}
          </h2>

          <div style={styles.headerSpace}></div>

        </div>

        {/* =========================
            BASIC DETAILS
        ========================= */}
        <div style={styles.grid}>

          <input
            name="name"
            placeholder="Grocery Name"
            value={form.name}
            onChange={handleChange}
            style={styles.input}
          />

          <input
            name="brand"
            placeholder="Brand"
            value={form.brand}
            onChange={handleChange}
            style={styles.input}
          />

          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            style={styles.input}
          >
            <option value="">
              Select Category
            </option>

            {categories.map((category) => (
              <option
                key={category.id}
                value={category.name}
              >
                {category.name}
              </option>
            ))}
          </select>

          <input
            name="subcategory"
            placeholder="Subcategory"
            value={form.subcategory}
            onChange={handleChange}
            style={styles.input}
          />

        </div>

        {/* =========================
            DESCRIPTION
        ========================= */}
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          style={styles.textarea}
        />

        {/* =========================
            PRICE DETAILS
        ========================= */}
     <h3 style={styles.sectionTitle}>
  Price Details
</h3>

<div style={styles.grid}>

  {/* MRP */}
  <input
    name="mrp"
    type="number"
    min="0"
    step="0.01"
    placeholder="MRP Price ₹"
    value={form.mrp}
    onChange={handleChange}
    style={styles.input}
  />

  {/* Empty space so MRP stays full row */}
  <div></div>

  {/* NORMAL PRICE */}
  <input
    name="price"
    type="number"
    min="0"
    step="0.01"
    placeholder="Normal Price ₹"
    value={form.price}
    onChange={handleChange}
    style={styles.input}
  />

  {/* NORMAL DISCOUNT */}
  <input
    name="discount"
    type="number"
    placeholder="Normal Discount %"
    value={form.discount}
    readOnly
    style={{
      ...styles.input,
      background: "#f5f5f5",
      color: "#555",
      cursor: "not-allowed",
    }}
  />

  {/* PREMIUM PRICE */}
  <input
    name="premiumPrice"
    type="number"
    min="0"
    step="0.01"
    placeholder="Premium Price ₹"
    value={form.premiumPrice}
    onChange={handleChange}
    style={styles.input}
  />

  {/* PREMIUM DISCOUNT */}
  <input
    name="premiumDiscount"
    type="number"
    placeholder="Premium Discount %"
    value={form.premiumDiscount}
    readOnly
    style={{
      ...styles.input,
      background: "#f5f5f5",
      color: "#555",
      cursor: "not-allowed",
    }}
  />

</div>

        {/* =========================
            STOCK DETAILS
        ========================= */}
        <h3 style={styles.sectionTitle}>
          Stock Details
        </h3>

        <div style={styles.grid}>

          <input
            name="quantity"
            type="number"
            min="1"
            placeholder="Quantity"
            value={form.quantity}
            onChange={handleChange}
            style={styles.input}
          />

          <input
            name="unit"
            placeholder="Unit (kg, litre, pcs)"
            value={form.unit}
            onChange={handleChange}
            style={styles.input}
          />

          <input
            name="stock"
            type="number"
            min="0"
            placeholder="Stock"
            value={form.stock}
            onChange={handleChange}
            style={styles.input}
          />

        </div>

        {/* =========================
            PRODUCT IMAGE
        ========================= */}
        <h3 style={styles.sectionTitle}>
          Product Image
        </h3>

        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />

        {preview && (
          <img
            src={preview}
            alt="preview"
            style={styles.preview}
          />
        )}

        {/* =========================
            SAVE
        ========================= */}
        <button
          type="button"
          style={styles.button}
          onClick={handleSubmit}
        >
          {isEdit
            ? "Update Item"
            : "Save Item"}
        </button>

      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    padding: "20px",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    boxSizing: "border-box",
  },

  card: {
    width: "100%",
    maxWidth: "750px",
    background: "#fff",
    padding: "30px",
    borderRadius: "20px",
    boxShadow:
      "0 5px 20px rgba(0,0,0,0.08)",
    boxSizing: "border-box",
  },

  // =========================
  // HEADER
  // =========================
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "25px",
  },

  backButton: {
    width: "45px",
    height: "45px",
    borderRadius: "12px",
    border: "1px solid #ddd",
    background: "#fff",
    fontSize: "28px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#333",
  },

  headerSpace: {
    width: "45px",
  },

  heading: {
    flex: 1,
    textAlign: "center",
    fontSize: "26px",
    fontWeight: "700",
    color: "#ff6600",
    margin: 0,
  },

  // =========================
  // GRID
  // =========================
  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "15px",
  },

  input: {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid #ddd",
    fontSize: "16px",
    boxSizing: "border-box",
    outline: "none",
  },

  textarea: {
    width: "100%",
    height: "100px",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid #ddd",
    fontSize: "16px",
    marginTop: "15px",
    boxSizing: "border-box",
    resize: "vertical",
  },

  // =========================
  // SECTION
  // =========================
  sectionTitle: {
    color: "#333",
    fontSize: "18px",
    marginTop: "25px",
    marginBottom: "12px",
  },

  // =========================
  // IMAGE
  // =========================
  preview: {
    width: "100%",
    height: "220px",
    objectFit: "cover",
    borderRadius: "15px",
    marginTop: "15px",
    marginBottom: "20px",
  },

  // =========================
  // BUTTON
  // =========================
  button: {
    width: "100%",
    padding: "16px",
    background: "#ff6600",
    color: "#fff",
    border: "none",
    borderRadius: "14px",
    fontSize: "18px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "10px",
  },
};

export default AddGrocery;