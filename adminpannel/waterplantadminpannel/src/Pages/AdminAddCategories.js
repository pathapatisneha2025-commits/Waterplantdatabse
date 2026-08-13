
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminWaterPlantCategory() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const BASE_URL =
    "https://waterplantdatabse-v763.onrender.com";

  // =====================================================
  // FETCH CATEGORIES
  // =====================================================
  const fetchCategories = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `${BASE_URL}/categories/all`
      );

      const data = await res.json();

      console.log("Categories API Response:", data);

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
  // ADD CATEGORY
  // =====================================================
  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      alert("Please enter category name");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(
        `${BASE_URL}/categories/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: categoryName.trim(),
          }),
        }
      );

      const data = await res.json();

      console.log("Add Category Response:", data);

      if (res.ok) {
        alert("Category added successfully");

        setCategoryName("");

        fetchCategories();
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

      const res = await fetch(
        `${BASE_URL}/categories/update/${editingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: categoryName.trim(),
          }),
        }
      );

      const data = await res.json();

      console.log("Update Category Response:", data);

      if (res.ok) {
        alert("Category updated successfully");

        setCategoryName("");
        setEditingId(null);

        fetchCategories();
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
  // EDIT
  // =====================================================
  const handleEdit = (category) => {
    setEditingId(category.id);
    setCategoryName(category.name || "");
  };

  // =====================================================
  // CANCEL EDIT
  // =====================================================
  const handleCancel = () => {
    setEditingId(null);
    setCategoryName("");
  };

  // =====================================================
  // DELETE
  // =====================================================
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) {
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

      console.log("Delete Category Response:", data);

      if (res.ok) {
        alert("Category deleted successfully");

        setCategories((prev) =>
          prev.filter((category) => category.id !== id)
        );

        if (editingId === id) {
          handleCancel();
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
      marginTop: "0px",
      fontFamily: "Arial, sans-serif",
      padding: "15px",
      maxWidth: "100%",
      boxSizing: "border-box",
    },

    headerRow: {
      display: "flex",
      alignItems: "center",
      gap: "15px",
      marginBottom: "15px",
      flexWrap: "wrap",
    },

    backBtn: {
      background: "#fff",
      border: "1px solid #ccc",
      borderRadius: "5px",
      width: "36px",
      height: "36px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "18px",
      cursor: "pointer",
      color: "#333",
      flexShrink: 0,
    },

    header: {
      color: "#FF6600",
      margin: 0,
    },

    // ================================================
    // ADD CATEGORY AREA
    // ================================================

    addSection: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginBottom: "20px",
      flexWrap: "wrap",
    },

    input: {
      padding: "9px 12px",
      border: "1px solid #FF6600",
      borderRadius: "5px",
      fontSize: "14px",
      width: "280px",
      maxWidth: "100%",
      outline: "none",
      boxSizing: "border-box",
    },

    addBtn: {
      padding: "9px 16px",
      backgroundColor: "#FF6600",
      border: "none",
      color: "#fff",
      borderRadius: "5px",
      cursor: "pointer",
      fontWeight: "bold",
      whiteSpace: "nowrap",
    },

    cancelBtn: {
      padding: "9px 16px",
      backgroundColor: "#777",
      border: "none",
      color: "#fff",
      borderRadius: "5px",
      cursor: "pointer",
      fontWeight: "bold",
      whiteSpace: "nowrap",
    },

    // ================================================
    // TABLE
    // ================================================

    tableResponsiveWrapper: {
      width: "100%",
      overflowX: "auto",
      WebkitOverflowScrolling: "touch",
    },

    table: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: "600px",
    },

    th: {
      border: "1px solid #FF6600",
      padding: "10px",
      backgroundColor: "#FF6600",
      color: "#fff",
      textAlign: "left",
      whiteSpace: "nowrap",
    },

    td: {
      border: "1px solid #FF6600",
      padding: "10px",
      textAlign: "left",
      whiteSpace: "nowrap",
    },

    row: {
      backgroundColor: "#fff",
    },

    editBtn: {
      marginRight: "8px",
      padding: "5px 10px",
      backgroundColor: "#FFA500",
      border: "none",
      color: "#fff",
      borderRadius: "5px",
      cursor: "pointer",
      whiteSpace: "nowrap",
    },

    deleteBtn: {
      padding: "5px 10px",
      backgroundColor: "#E53935",
      border: "none",
      color: "#fff",
      borderRadius: "5px",
      cursor: "pointer",
      whiteSpace: "nowrap",
    },

    actionCell: {
      display: "flex",
      alignItems: "center",
      gap: "5px",
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
        <div style={styles.headerRow}>
          <button
            style={styles.backBtn}
            onClick={() => navigate(-1)}
            title="Go Back"
          >
            ←
          </button>

          <h2 style={styles.header}>
            Water Plant Categories
          </h2>
        </div>

        <div>Loading categories...</div>
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
          title="Go Back"
        >
          ←
        </button>

        <h2 style={styles.header}>
          Water Plant Categories
        </h2>
      </div>

      {/* ADD / EDIT CATEGORY */}
      <div style={styles.addSection}>

        <input
          type="text"
          placeholder="Enter category name"
          value={categoryName}
          onChange={(e) =>
            setCategoryName(e.target.value)
          }
          style={styles.input}
        />

        {editingId ? (
          <>
            <button
              style={styles.addBtn}
              onClick={handleUpdateCategory}
              disabled={saving}
            >
              {saving ? "Updating..." : "Update"}
            </button>

            <button
              style={styles.cancelBtn}
              onClick={handleCancel}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            style={styles.addBtn}
            onClick={handleAddCategory}
            disabled={saving}
          >
            {saving ? "Adding..." : "➕ Add Category"}
          </button>
        )}

      </div>

      {/* CATEGORY TABLE */}
      <div style={styles.tableResponsiveWrapper}>

        <table style={styles.table}>

          <thead>
            <tr>
              <th style={styles.th}>
                ID
              </th>

              <th style={styles.th}>
                Category Name
              </th>

              <th style={styles.th}>
                Created Date
              </th>

              <th style={styles.th}>
                Actions
              </th>
            </tr>
          </thead>

          <tbody>

            {categories.length === 0 ? (

              <tr>
                <td
                  colSpan="4"
                  style={styles.emptyText}
                >
                  No categories found
                </td>
              </tr>

            ) : (

              categories.map((category) => (

                <tr
                  key={category.id}
                  style={styles.row}
                >

                  <td style={styles.td}>
                    {category.id}
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

                    <div style={styles.actionCell}>

                      <button
                        style={styles.editBtn}
                        onClick={() =>
                          handleEdit(category)
                        }
                      >
                        Edit
                      </button>

                      <button
                        style={styles.deleteBtn}
                        onClick={() =>
                          handleDelete(category.id)
                        }
                      >
                        Delete
                      </button>

                    </div>

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
