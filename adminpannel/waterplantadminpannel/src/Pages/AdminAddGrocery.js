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

    // RETURN SETTINGS
    return_allowed: false,
    return_days: 7,
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
          "https://api2.ajpartyhouse.in/categories/all";

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

        discount:
          editItem.discount !== undefined &&
          editItem.discount !== null
            ? editItem.discount
            : "",

        premiumDiscount:
          editItem.premiumDiscount !== undefined &&
          editItem.premiumDiscount !== null
            ? editItem.premiumDiscount
            : editItem.premiumdiscount !== undefined &&
              editItem.premiumdiscount !== null
            ? editItem.premiumdiscount
            : "",

        quantity: editItem.quantity || 1,
        unit: editItem.unit || "",
        stock:
          editItem.stock !== undefined &&
          editItem.stock !== null
            ? editItem.stock
            : "",

        mrp:
          editItem.mrp !== undefined &&
          editItem.mrp !== null
            ? editItem.mrp
            : "",

        price:
          editItem.price !== undefined &&
          editItem.price !== null
            ? editItem.price
            : "",

        premiumPrice:
          editItem.premiumPrice !== undefined &&
          editItem.premiumPrice !== null
            ? editItem.premiumPrice
            : editItem.premiumprice !== undefined &&
              editItem.premiumprice !== null
            ? editItem.premiumprice
            : "",

        // =========================
        // RETURN SETTINGS
        // =========================

        return_allowed:
          editItem.return_allowed === true ||
          editItem.return_allowed === "true",

        return_days:
          editItem.return_days !== undefined &&
          editItem.return_days !== null
            ? editItem.return_days
            : 7,
      });

      setPreview(editItem.img || "");
    }
  }, [editItem]);

  // =========================
  // HANDLE CHANGE
  // =========================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // =========================
    // RETURN TOGGLE
    // =========================

    if (name === "return_allowed") {
      setForm((prev) => ({
        ...prev,
        return_allowed: checked,
        return_days: checked
          ? prev.return_days || 7
          : 0,
      }));

      return;
    }

    // =========================
    // RETURN DAYS
    // =========================

    if (name === "return_days") {
      setForm((prev) => ({
        ...prev,
        return_days: value,
      }));

      return;
    }

    // =========================
    // PRICE CHANGES
    // =========================

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

    // =========================
    // NORMAL INPUT
    // =========================

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
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
    const premiumPrice = parseFloat(
      form.premiumPrice
    );

    // =========================
    // RETURN DAYS
    // =========================

    const returnDays = form.return_allowed
      ? parseInt(form.return_days, 10)
      : 0;

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

    // =========================
    // RETURN VALIDATION
    // =========================

    if (form.return_allowed) {
      if (
        isNaN(returnDays) ||
        returnDays < 1
      ) {
        alert(
          "Please enter a valid return period"
        );
        return;
      }

      if (returnDays > 365) {
        alert(
          "Return period cannot be more than 365 days"
        );
        return;
      }
    }

    // =========================
    // FORM DATA
    // =========================

    const formData = new FormData();

    // Basic fields

    formData.append(
      "name",
      form.name
    );

    formData.append(
      "brand",
      form.brand
    );

    formData.append(
      "category",
      form.category
    );

    formData.append(
      "subcategory",
      form.subcategory
    );

    formData.append(
      "description",
      form.description
    );

    // Discounts

    formData.append(
      "discount",
      form.discount
    );

    formData.append(
      "premiumDiscount",
      form.premiumDiscount
    );

    // Stock

    formData.append(
      "quantity",
      form.quantity
    );

    formData.append(
      "unit",
      form.unit
    );

    formData.append(
      "stock",
      form.stock
    );

    // Prices

    formData.append(
      "mrp",
      form.mrp
    );

    formData.append(
      "price",
      form.price
    );

    formData.append(
      "premiumPrice",
      form.premiumPrice
    );

    // =========================
    // RETURN SETTINGS
    // =========================

    formData.append(
      "return_allowed",
      form.return_allowed
        ? "true"
        : "false"
    );

    formData.append(
      "return_days",
      String(returnDays)
    );

    // =========================
    // IMAGE
    // =========================

    if (imageFile) {
      formData.append(
        "image",
        imageFile
      );
    }

    // =========================
    // API
    // =========================

    try {
      const url = isEdit
        ? `https://api2.ajpartyhouse.in/groceries/update/${editItem.id}`
        : `https://api2.ajpartyhouse.in/groceries/add`;

      const method = isEdit
        ? "PUT"
        : "POST";

      const res = await fetch(url, {
        method,
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(
          data.message ||
            "Failed to save grocery item"
        );

        return;
      }

      alert(
        isEdit
          ? "Updated Successfully!"
          : "Added Successfully!"
      );

      navigate(
        "/admingrocerylisting"
      );
    } catch (error) {
      console.error(
        "Submit error:",
        error
      );

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

            {categories.map(
              (category) => (
                <option
                  key={category.id}
                  value={category.name}
                >
                  {category.name}
                </option>
              )
            )}
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
            RETURN SETTINGS
        ========================= */}

        <h3 style={styles.sectionTitle}>
          Return Policy
        </h3>

        <div style={styles.returnCard}>

          {/* RETURN TOGGLE */}

          <div style={styles.returnRow}>

            <div>
              <div style={styles.returnTitle}>
                Allow Returns
              </div>

              <div style={styles.returnDescription}>
                Allow customers to return this
                product after delivery.
              </div>
            </div>

            <label style={styles.switch}>

              <input
                type="checkbox"
                name="return_allowed"
                checked={
                  form.return_allowed
                }
                onChange={handleChange}
                style={
                  styles.switchInput
                }
              />

              <span
                style={{
                  ...styles.slider,
                  background:
                    form.return_allowed
                      ? "#ff6600"
                      : "#ccc",
                }}
              >
                <span
                  style={{
                    ...styles.sliderCircle,
                    transform:
                      form.return_allowed
                        ? "translateX(22px)"
                        : "translateX(2px)",
                  }}
                />
              </span>

            </label>

          </div>

          {/* RETURN DAYS */}

          {form.return_allowed && (
            <div style={styles.returnDaysContainer}>

              <label
                style={
                  styles.returnLabel
                }
              >
                Return Period
              </label>

              <div
                style={
                  styles.returnDaysRow
                }
              >

                <input
                  name="return_days"
                  type="number"
                  min="1"
                  max="365"
                  value={
                    form.return_days
                  }
                  onChange={
                    handleChange
                  }
                  style={{
                    ...styles.input,
                    maxWidth: "180px",
                  }}
                />

                <span
                  style={
                    styles.daysText
                  }
                >
                  Days
                </span>

              </div>

              <div
                style={
                  styles.returnHint
                }
              >
                Customers can request a return
                within {form.return_days || 0}{" "}
                days after delivery.
              </div>

            </div>
          )}

          {/* NON RETURNABLE MESSAGE */}

          {!form.return_allowed && (
            <div
              style={
                styles.nonReturnableMessage
              }
            >
              <span
                style={
                  styles.nonReturnableIcon
                }
              >
                ⚠
              </span>

              <span>
                This product will be marked as
                <strong>
                  {" "}
                  Non-returnable
                </strong>
                .
              </span>
            </div>
          )}

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

// =========================================================
// STYLES
// =========================================================

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
  // RETURN CARD
  // =========================

  returnCard: {
    border: "1px solid #e3e3e3",
    borderRadius: "15px",
    padding: "18px",
    background: "#fafafa",
  },

  returnRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
  },

  returnTitle: {
    fontSize: "17px",
    fontWeight: "700",
    color: "#333",
  },

  returnDescription: {
    marginTop: "5px",
    fontSize: "13px",
    color: "#777",
    lineHeight: "19px",
  },

  // =========================
  // SWITCH
  // =========================

  switch: {
    position: "relative",
    width: "48px",
    height: "26px",
    display: "inline-block",
    flexShrink: 0,
  },

  switchInput: {
    opacity: 0,
    width: 0,
    height: 0,
    position: "absolute",
  },

  slider: {
    position: "absolute",
    cursor: "pointer",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: "30px",
    transition: "0.3s",
  },

  sliderCircle: {
    position: "absolute",
    width: "22px",
    height: "22px",
    left: 0,
    top: "2px",
    background: "#fff",
    borderRadius: "50%",
    transition: "0.3s",
    boxShadow:
      "0 1px 4px rgba(0,0,0,0.25)",
  },

  // =========================
  // RETURN DAYS
  // =========================

  returnDaysContainer: {
    marginTop: "18px",
    paddingTop: "18px",
    borderTop: "1px solid #e5e5e5",
  },

  returnLabel: {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    color: "#333",
    marginBottom: "8px",
  },

  returnDaysRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  daysText: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#555",
  },

  returnHint: {
    marginTop: "8px",
    fontSize: "13px",
    color: "#777",
  },

  // =========================
  // NON RETURNABLE
  // =========================

  nonReturnableMessage: {
    marginTop: "15px",
    padding: "12px",
    borderRadius: "10px",
    background: "#fff4e5",
    color: "#8a5200",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  nonReturnableIcon: {
    fontSize: "16px",
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
    marginTop: "20px",
  },
};

export default AddGrocery;