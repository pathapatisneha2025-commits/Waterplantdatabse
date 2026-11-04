
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminWaterPlantCategory() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const BASE_URL = "https://api2.ajpartyhouse.in";

  // =====================================================
  // FETCH CATEGORIES
  // =====================================================

  const fetchCategories = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/categories/all`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setCategories(data);
      } else if (Array.isArray(data.categories)) {
        setCategories(data.categories);
      } else if (Array.isArray(data.data)) {
        setCategories(data.data);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error("Fetch categories error:", error);
      alert("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // =====================================================
  // IMAGE SELECTION
  // =====================================================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Please select JPG, PNG or WEBP image");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should not exceed 5 MB");
      e.target.value = "";
      return;
    }

    // Revoke previous preview URL
    if (previewImage.startsWith("blob:")) {
      URL.revokeObjectURL(previewImage);
    }

    setSelectedImage(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  // =====================================================
  // RESET FORM
  // =====================================================

  const resetForm = () => {
    if (previewImage.startsWith("blob:")) {
      URL.revokeObjectURL(previewImage);
    }

    setCategoryName("");
    setSelectedImage(null);
    setPreviewImage("");
    setEditingId(null);

    const fileInput = document.getElementById(
      "categoryImage"
    );

    if (fileInput) {
      fileInput.value = "";
    }
  };

  // =====================================================
  // ADD CATEGORY
  // =====================================================

  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      alert("Please enter category name");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("name", categoryName.trim());

      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      const res = await fetch(
        `${BASE_URL}/categories/add`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      console.log("Add Category Response:", data);

      if (res.ok) {
        alert("Category added successfully");

        resetForm();
        await fetchCategories();
      } else {
        alert(data.message || "Failed to add category");
      }
    } catch (error) {
      console.error("Add category error:", error);
      alert("Server error");
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // UPDATE CATEGORY
  // =====================================================

  const handleUpdateCategory = async () => {
    if (!categoryName.trim()) {
      alert("Please enter category name");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("name", categoryName.trim());

      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      const res = await fetch(
        `${BASE_URL}/categories/update/${editingId}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      const data = await res.json();

      console.log("Update Category Response:", data);

      if (res.ok) {
        alert("Category updated successfully");

        resetForm();
        await fetchCategories();
      } else {
        alert(data.message || "Failed to update category");
      }
    } catch (error) {
      console.error("Update category error:", error);
      alert("Server error");
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // EDIT CATEGORY
  // =====================================================

  const handleEdit = (category) => {
    resetForm();

    setEditingId(category.id);
    setCategoryName(category.name || "");
    setPreviewImage(category.image_url || "");
  };

  // =====================================================
  // CANCEL EDIT
  // =====================================================

  const handleCancel = () => {
    resetForm();
  };

  // =====================================================
  // DELETE CATEGORY
  // =====================================================

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this category?"
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        `${BASE_URL}/categories/delete/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (res.ok) {
        alert("Category deleted successfully");

        setCategories((prev) =>
          prev.filter((category) => category.id !== id)
        );

        if (editingId === id) {
          resetForm();
        }
      } else {
        alert(data.message || "Delete failed");
      }
    } catch (error) {
      console.error("Delete category error:", error);
      alert("Server error");
    }
  };

  // =====================================================
  // STYLES
  // =====================================================

  const styles = {
    container: {
      padding: "15px",
      fontFamily: "Arial, sans-serif",
      maxWidth: "100%",
      boxSizing: "border-box",
    },

    headerRow: {
      display: "flex",
      alignItems: "center",
      gap: "15px",
      marginBottom: "20px",
      flexWrap: "wrap",
    },

    backBtn: {
      background: "#fff",
      border: "1px solid #ccc",
      borderRadius: "5px",
      width: "36px",
      height: "36px",
      cursor: "pointer",
      fontSize: "18px",
    },

    header: {
      color: "#FF6600",
      margin: 0,
    },

    formCard: {
      background: "#fff",
      border: "1px solid #eee",
      borderRadius: "10px",
      padding: "18px",
      marginBottom: "25px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    },

    addSection: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      flexWrap: "wrap",
    },

    input: {
      padding: "11px 12px",
      border: "1px solid #FF6600",
      borderRadius: "5px",
      fontSize: "14px",
      width: "280px",
      maxWidth: "100%",
      boxSizing: "border-box",
    },

    fileInput: {
      padding: "8px",
      border: "1px solid #ddd",
      borderRadius: "5px",
      maxWidth: "100%",
      background: "#fff",
    },

    previewContainer: {
      marginTop: "15px",
    },

    previewImage: {
      width: "110px",
      height: "110px",
      objectFit: "cover",
      borderRadius: "8px",
      border: "1px solid #ddd",
    },

    addBtn: {
      padding: "10px 18px",
      backgroundColor: "#FF6600",
      border: "none",
      color: "#fff",
      borderRadius: "5px",
      cursor: "pointer",
      fontWeight: "bold",
    },

    cancelBtn: {
      padding: "10px 18px",
      backgroundColor: "#777",
      border: "none",
      color: "#fff",
      borderRadius: "5px",
      cursor: "pointer",
    },

    tableResponsiveWrapper: {
      width: "100%",
      overflowX: "auto",
    },

    table: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: "750px",
    },

    th: {
      border: "1px solid #FF6600",
      padding: "11px",
      backgroundColor: "#FF6600",
      color: "#fff",
      textAlign: "left",
    },

    td: {
      border: "1px solid #FF6600",
      padding: "10px",
      textAlign: "left",
    },

    categoryImage: {
      width: "65px",
      height: "65px",
      objectFit: "cover",
      borderRadius: "6px",
    },

    editBtn: {
      marginRight: "8px",
      padding: "6px 12px",
      backgroundColor: "#FFA500",
      border: "none",
      color: "#fff",
      borderRadius: "5px",
      cursor: "pointer",
    },

    deleteBtn: {
      padding: "6px 12px",
      backgroundColor: "#E53935",
      border: "none",
      color: "#fff",
      borderRadius: "5px",
      cursor: "pointer",
    },

    emptyText: {
      padding: "20px",
      textAlign: "center",
      color: "#777",
    },
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div style={styles.container}>
        <h2 style={styles.header}>
          Water Plant Categories
        </h2>
        Loading categories...
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div style={styles.container}>

      {/* HEADER */}

      <div style={styles.headerRow}>
        <button
          style={styles.backBtn}
          onClick={() => navigate(-1)}
        >
          ←
        </button>

        <h2 style={styles.header}>
          Water Plant Categories
        </h2>
      </div>

      {/* ADD / EDIT FORM */}

      <div style={styles.formCard}>

        <h3>
          {editingId ? "Update Category" : "Add New Category"}
        </h3>

        <div style={styles.addSection}>

          {/* CATEGORY NAME */}

          <input
            type="text"
            placeholder="Enter category name"
            value={categoryName}
            onChange={(e) =>
              setCategoryName(e.target.value)
            }
            style={styles.input}
          />

          {/* IMAGE UPLOAD */}

          <input
            id="categoryImage"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            style={styles.fileInput}
          />

          {/* ADD / UPDATE BUTTON */}

          {editingId ? (
            <>
              <button
                style={{
                  ...styles.addBtn,
                  opacity: saving ? 0.6 : 1,
                }}
                onClick={handleUpdateCategory}
                disabled={saving}
              >
                {saving ? "Updating..." : "Update Category"}
              </button>

              <button
                style={styles.cancelBtn}
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              style={{
                ...styles.addBtn,
                opacity: saving ? 0.6 : 1,
              }}
              onClick={handleAddCategory}
              disabled={saving}
            >
              {saving ? "Adding..." : "➕ Add Category"}
            </button>
          )}

        </div>

        {/* IMAGE PREVIEW */}

        {previewImage && (
          <div style={styles.previewContainer}>
            <p>
              {selectedImage ? "Selected Image Preview:" : "Current Category Image:"}
            </p>

            <img
              src={previewImage}
              alt="Category Preview"
              style={styles.previewImage}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}

        <p style={{ color: "#777", fontSize: "12px" }}>
          Supported formats: JPG, PNG, WEBP. Maximum size: 5 MB.
          When editing, selecting a new image replaces the existing image.
          If you don't select a new image, the existing image is retained.
        </p>

      </div>

      {/* CATEGORY TABLE */}

      <div style={styles.tableResponsiveWrapper}>

        <table style={styles.table}>

          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Image</th>
              <th style={styles.th}>Category Name</th>
              <th style={styles.th}>Created Date</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>

          <tbody>

            {categories.length === 0 ? (

              <tr>
                <td colSpan="5" style={styles.emptyText}>
                  No categories found
                </td>
              </tr>

            ) : (

              categories.map((category) => (

                <tr key={category.id}>

                  <td style={styles.td}>
                    {category.id}
                  </td>

                  <td style={styles.td}>
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        style={styles.categoryImage}
                      />
                    ) : (
                      "No Image"
                    )}
                  </td>

                  <td style={styles.td}>
                    {category.name}
                  </td>

                  <td style={styles.td}>
                    {category.created_at
                      ? new Date(
                          category.created_at
                        ).toLocaleDateString()
                      : "N/A"}
                  </td>

                  <td style={styles.td}>

                    <button
                      style={styles.editBtn}
                      onClick={() => handleEdit(category)}
                    >
                      Edit
                    </button>

                    <button
                      style={styles.deleteBtn}
                      onClick={() => handleDelete(category.id)}
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
}
