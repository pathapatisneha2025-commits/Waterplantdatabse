import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const GroceryDashboard = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // ======================================================
  // FETCH GROCERY ITEMS
  // ======================================================
  const fetchItems = async () => {
    try {
      const res = await fetch(
        "https://api2.ajpartyhouse.in/groceries/all"
      );

      const data = await res.json();

      if (Array.isArray(data)) {
        setItems(data);
      } else if (Array.isArray(data.data)) {
        setItems(data.data);
      } else if (Array.isArray(data.groceries)) {
        setItems(data.groceries);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.log("Error fetching grocery:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // INITIAL LOAD
  // ======================================================
  useEffect(() => {
    fetchItems();
  }, []);

  // ======================================================
  // DASHBOARD CALCULATIONS
  // ======================================================
  const totalItems = items.length;

  const outOfStock = items.filter(
    (item) => Number(item.stock) === 0
  ).length;

  const lowStock = items.filter(
    (item) =>
      Number(item.stock) > 0 &&
      Number(item.stock) < 5
  ).length;

  const totalCategories = new Set(
    items.map((item) => item.category)
  ).size;

  // ======================================================
  // UI
  // ======================================================
  return (
    <div style={styles.wrapper}>
      {/* ==================================================
          HEADER
      ================================================== */}
      <div style={styles.headerContainer}>
        <div style={styles.headerLeft}>
          <button
            style={styles.backBtn}
            onClick={() => navigate(-1)}
            title="Go Back"
          >
            ←
          </button>

          <div>
            <h1 style={styles.title}>Grocery Dashboard</h1>

            <p style={styles.subtitle}>
              Overview of your inventory and stock health.
            </p>
          </div>
        </div>

        <div style={styles.headerRight}>
          {/* View All Items */}
          <button
            style={styles.primaryBtn}
            onClick={() => navigate("/admingrocerylisting")}
          >
            📋 View All Items
          </button>
        </div>
      </div>

      {/* ==================================================
          LOADING
      ================================================== */}
      {loading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>

          <p style={styles.loadingText}>
            Loading dashboard analytics...
          </p>
        </div>
      ) : (
        <div style={styles.dashboardContent}>
          {/* ==================================================
              STATS GRID
          ================================================== */}
          <div style={styles.statsGrid}>
            {/* Total Products */}
            <div
              style={{
                ...styles.statCard,
                borderLeft: "4px solid #2563eb",
              }}
            >
              <div>
                <p style={styles.statLabel}>
                  Total Products
                </p>

                <h3 style={styles.statValue}>
                  {totalItems}
                </h3>
              </div>

              <div
                style={{
                  ...styles.statIcon,
                  background: "#eff6ff",
                  color: "#2563eb",
                }}
              >
                📦
              </div>
            </div>

            {/* Active Categories */}
            <div
              style={{
                ...styles.statCard,
                borderLeft: "4px solid #059669",
              }}
            >
              <div>
                <p style={styles.statLabel}>
                  Active Categories
                </p>

                <h3 style={styles.statValue}>
                  {totalCategories}
                </h3>
              </div>

              <div
                style={{
                  ...styles.statIcon,
                  background: "#ecfdf5",
                  color: "#059669",
                }}
              >
                🗂️
              </div>
            </div>

            {/* Low Stock */}
            <div
              style={{
                ...styles.statCard,
                borderLeft: "4px solid #d97706",
              }}
            >
              <div>
                <p style={styles.statLabel}>
                  Low Stock (&lt;5)
                </p>

                <h3 style={styles.statValue}>
                  {lowStock}
                </h3>
              </div>

              <div
                style={{
                  ...styles.statIcon,
                  background: "#fef3c7",
                  color: "#d97706",
                }}
              >
                ⚠️
              </div>
            </div>

            {/* Out of Stock */}
            <div
              style={{
                ...styles.statCard,
                borderLeft: "4px solid #dc2626",
              }}
            >
              <div>
                <p style={styles.statLabel}>
                  Out of Stock
                </p>

                <h3 style={styles.statValue}>
                  {outOfStock}
                </h3>
              </div>

              <div
                style={{
                  ...styles.statIcon,
                  background: "#fef2f2",
                  color: "#dc2626",
                }}
              >
                ❌
              </div>
            </div>
          </div>

          {/* ==================================================
              QUICK ACTIONS
          ================================================== */}
          <div style={styles.actionPanel}>
            <h3 style={styles.sectionTitle}>
              Quick Management
            </h3>

            <div style={styles.actionButtonsGrid}>
              {/* Add New Item */}
              <button
                style={styles.actionCardBtn}
                onClick={() =>
                  navigate("/adminGrocery")
                }
              >
                <span style={styles.actionCardIcon}>
                  ➕
                </span>

                <span style={styles.actionCardTitle}>
                  Add New Item
                </span>

                <span style={styles.actionCardDesc}>
                  Create and list a fresh grocery product
                </span>
              </button>

              {/* Manage Inventory */}
              <button
                style={styles.actionCardBtn}
                onClick={() =>
                  navigate("/admingrocerylisting")
                }
              >
                <span style={styles.actionCardIcon}>
                  ✏️
                </span>

                <span style={styles.actionCardTitle}>
                  Manage Inventory
                </span>

                <span style={styles.actionCardDesc}>
                  Edit pricing, details, or delete items
                </span>
              </button>
            </div>
          </div>

          {/* ==================================================
              RECENT ITEMS
          ================================================== */}
          <div style={styles.recentSection}>
            <div style={styles.recentHeader}>
              <h3 style={styles.sectionTitle}>
                Recent Items
              </h3>

              <span
                style={styles.seeAllLink}
                onClick={() =>
                  navigate("/admingrocerylisting")
                }
              >
                See All →
              </span>
            </div>

            <div style={styles.recentGrid}>
              {items.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  style={styles.recentItemCard}
                >
                  {/* Product Image */}
                  <img
                    src={item.img}
                    alt={item.name}
                    style={styles.recentImage}
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/40?text=No+Img";
                    }}
                  />

                  {/* Product Information */}
                  <div style={styles.recentInfo}>
                    <h4 style={styles.recentName}>
                      {item.name}
                    </h4>

                    <p style={styles.recentPrice}>
                      ₹{item.price}

                      <span style={styles.recentMrp}>
                        ₹{item.mrp}
                      </span>
                    </p>
                  </div>

                  {/* Stock */}
                  <span
                    style={{
                      ...styles.miniBadge,
                      background:
                        Number(item.stock) > 0
                          ? "#def7ec"
                          : "#fde8e8",
                      color:
                        Number(item.stock) > 0
                          ? "#03543f"
                          : "#9b1c1c",
                    }}
                  >
                    {item.stock} left
                  </span>
                </div>
              ))}

              {/* No Items */}
              {items.length === 0 && (
                <div style={styles.noItems}>
                  No grocery items found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  // ======================================================
  // MAIN WRAPPER
  // ======================================================

  wrapper: {
    width: "100%",
    minHeight: "100vh",
    padding: "20px",
    boxSizing: "border-box",
    background: "#f4f6f9",
    fontFamily: "'Inter', sans-serif",
    display: "flex",
    flexDirection: "column",
  },

  // ======================================================
  // HEADER
  // ======================================================

  headerContainer: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "22px",
    flexWrap: "wrap",
    gap: "14px",
    boxSizing: "border-box",
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: 0,
  },

  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  backBtn: {
    background: "#fff",
    border: "1px solid #d1d5db",
    borderRadius: "9px",
    width: "42px",
    height: "42px",
    minWidth: "42px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    cursor: "pointer",
    color: "#374151",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    flexShrink: 0,
  },

  title: {
    color: "#111827",
    fontSize: "24px",
    fontWeight: "700",
    margin: 0,
    lineHeight: "1.3",
  },

  subtitle: {
    color: "#6b7280",
    fontSize: "13px",
    marginTop: "4px",
    marginBottom: 0,
    lineHeight: "1.4",
  },

  // ======================================================
  // PRIMARY BUTTON
  // ======================================================

  primaryBtn: {
    padding: "11px 17px",
    background:
      "linear-gradient(135deg, #ff6600 0%, #e65c00 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "9px",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
    boxShadow:
      "0 4px 12px rgba(255, 102, 0, 0.20)",
    whiteSpace: "nowrap",
  },

  // ======================================================
  // DASHBOARD CONTENT
  // ======================================================

  dashboardContent: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  // ======================================================
  // STATS
  // ======================================================

  statsGrid: {
    width: "100%",
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "14px",
  },

  statCard: {
    background: "#fff",
    padding: "17px",
    borderRadius: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.04)",
    border: "1px solid #e5e7eb",
    minWidth: 0,
    boxSizing: "border-box",
  },

  statLabel: {
    color: "#6b7280",
    fontSize: "12px",
    fontWeight: "500",
    margin: "0 0 5px 0",
  },

  statValue: {
    color: "#111827",
    fontSize: "23px",
    fontWeight: "700",
    margin: 0,
    lineHeight: "1.2",
  },

  statIcon: {
    width: "42px",
    height: "42px",
    minWidth: "42px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "19px",
    flexShrink: 0,
  },

  // ======================================================
  // QUICK MANAGEMENT PANEL
  // ======================================================

  actionPanel: {
    width: "100%",
    background: "#fff",
    padding: "18px",
    borderRadius: "12px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.04)",
    border: "1px solid #e5e7eb",
    boxSizing: "border-box",
  },

  sectionTitle: {
    color: "#111827",
    fontSize: "16px",
    fontWeight: "700",
    margin: "0 0 13px 0",
    lineHeight: "1.3",
  },

  actionButtonsGrid: {
    width: "100%",
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
  },

  actionCardBtn: {
    width: "100%",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "15px",
    textAlign: "left",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    transition: "all 0.2s ease",
    boxSizing: "border-box",
  },

  actionCardIcon: {
    fontSize: "21px",
    marginBottom: "4px",
  },

  actionCardTitle: {
    color: "#1f2937",
    fontSize: "14px",
    fontWeight: "600",
    lineHeight: "1.3",
  },

  actionCardDesc: {
    color: "#6b7280",
    fontSize: "11px",
    lineHeight: "1.4",
  },

  // ======================================================
  // RECENT ITEMS SECTION
  // ======================================================

  recentSection: {
    width: "100%",
    background: "#fff",
    padding: "18px",
    borderRadius: "12px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.04)",
    border: "1px solid #e5e7eb",
    boxSizing: "border-box",
  },

  recentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "13px",
  },

  seeAllLink: {
    color: "#ff6600",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  recentGrid: {
    width: "100%",
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "10px",
  },

  // ======================================================
  // RECENT ITEM
  // ======================================================

  recentItemCard: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "#f9fafb",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #f3f4f6",
    boxSizing: "border-box",
    minWidth: 0,
  },

  // ======================================================
  // PRODUCT IMAGE
  // NO IMAGE CONTAINER
  // NO BORDER
  // NO BACKGROUND
  // NO SHADOW
  // ======================================================

  recentImage: {
    display: "block",
    width: "50px",
    height: "50px",
    minWidth: "50px",
    objectFit: "contain",
    objectPosition: "center",
    border: "none",
    borderRadius: "0",
    background: "transparent",
    boxShadow: "none",
    padding: "0",
    margin: "0",
    flexShrink: 0,
  },

  // ======================================================
  // PRODUCT INFORMATION
  // ======================================================

  recentInfo: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
  },

  recentName: {
    color: "#1f2937",
    fontSize: "13px",
    fontWeight: "600",
    margin: "0 0 4px 0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    lineHeight: "1.3",
  },

  recentPrice: {
    color: "#059669",
    fontSize: "12px",
    fontWeight: "600",
    margin: 0,
    lineHeight: "1.3",
  },

  recentMrp: {
    color: "#9ca3af",
    fontSize: "11px",
    textDecoration: "line-through",
    fontWeight: "normal",
    marginLeft: "5px",
  },

  // ======================================================
  // STOCK BADGE
  // ======================================================

  miniBadge: {
    padding: "3px 7px",
    borderRadius: "5px",
    fontSize: "10px",
    fontWeight: "600",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },

  // ======================================================
  // EMPTY STATE
  // ======================================================

  noItems: {
    width: "100%",
    textAlign: "center",
    padding: "35px 20px",
    color: "#6b7280",
    fontSize: "13px",
    boxSizing: "border-box",
  },

  // ======================================================
  // LOADING
  // ======================================================

  loadingContainer: {
    width: "100%",
    minHeight: "320px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
  },

  spinner: {
    width: "36px",
    height: "36px",
    border: "3px solid #f3f3f3",
    borderTop: "3px solid #ff6600",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },

  loadingText: {
    marginTop: "12px",
    color: "#6b7280",
    fontSize: "13px",
    fontWeight: "500",
  },
};
export default GroceryDashboard;