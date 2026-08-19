import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

const GroceryDashboard = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
const [newOrderCount, setNewOrderCount] = useState(0);
const [showNotification, setShowNotification] = useState(false);
const [notificationMessage, setNotificationMessage] = useState("");

const previousOrderIds = useRef([]);
const firstOrderCheck = useRef(true);
  const fetchItems = async () => {
    try {
      const res = await fetch("https://waterplantdatabse-v763.onrender.com/groceries/all");
      const data = await res.json();

      if (Array.isArray(data)) setItems(data);
      else if (Array.isArray(data.data)) setItems(data.data);
      else if (Array.isArray(data.groceries)) setItems(data.groceries);
      else setItems([]);
    } catch (error) {
      console.log("Error fetching grocery:", error);
    }
    setLoading(false);
  };
const checkForNewOrders = async () => {
  try {
    const res = await fetch(
      "https://waterplantdatabse-v763.onrender.com/orders/all"
    );

    if (!res.ok) return;

    const data = await res.json();

    const orders = Array.isArray(data)
      ? data
      : Array.isArray(data.data)
      ? data.data
      : Array.isArray(data.orders)
      ? data.orders
      : [];

    const currentOrderIds = orders.map((order) => order.id);

    // First API call: only remember existing orders.
    // Don't show notifications for old orders.
    if (firstOrderCheck.current) {
      previousOrderIds.current = currentOrderIds;
      firstOrderCheck.current = false;
      return;
    }

    // Find orders that were not present during previous check
    const newOrders = orders.filter(
      (order) => !previousOrderIds.current.includes(order.id)
    );

    if (newOrders.length > 0) {
      setNewOrderCount((prev) => prev + newOrders.length);

      const latestOrder = newOrders[0];

      setNotificationMessage(
        `New order received from ${
          latestOrder.full_name ||
          latestOrder.customer_name ||
          "Customer"
        }`
      );

      setShowNotification(true);

      // Browser alert popup
      alert(
        `🛎️ New Order Received!\n\nCustomer: ${
          latestOrder.full_name ||
          latestOrder.customer_name ||
          "Customer"
        }\nOrder ID: #${latestOrder.id}`
      );
    }

    previousOrderIds.current = currentOrderIds;
  } catch (error) {
    console.log("Error checking new orders:", error);
  }
};
 useEffect(() => {
  fetchItems();

  // Check immediately
  checkForNewOrders();

  // Check for new orders every 10 seconds
  const orderInterval = setInterval(() => {
    checkForNewOrders();
  }, 10000);

  return () => clearInterval(orderInterval);
}, []);

  const totalItems = items.length;
  const outOfStock = items.filter((item) => Number(item.stock) === 0).length;
  const lowStock = items.filter((item) => Number(item.stock) > 0 && Number(item.stock) < 5).length;
  const totalCategories = new Set(items.map((item) => item.category)).size;

  return (
    <div style={styles.wrapper}>
      {showNotification && (
  <div style={styles.notificationPopup}>
    <div style={styles.notificationPopupIcon}>
      🔔
    </div>

    <div style={styles.notificationPopupContent}>
      <strong>New Order Received!</strong>
      <p>{notificationMessage}</p>
    </div>

    <button
      style={styles.notificationClose}
      onClick={() => setShowNotification(false)}
    >
      ×
    </button>
  </div>
)}
      {/* Header */}
      <div style={styles.headerContainer}>
        <div style={styles.headerLeft}>
          <button style={styles.backBtn} onClick={() => navigate(-1)} title="Go Back">
            ←
          </button>
          <div>
            <h1 style={styles.title}>Grocery Dashboard</h1>
            <p style={styles.subtitle}>Overview of your inventory and stock health.</p>
          </div>
        </div>

     <div style={styles.headerRight}>

  {/* Notification Button */}
  <button
    style={styles.notificationBtn}
    onClick={() => {
      setNewOrderCount(0);
      setShowNotification(false);
      navigate("/adminorders");
    }}
    title="New Orders"
  >
    🔔

    {newOrderCount > 0 && (
      <span style={styles.notificationBadge}>
        {newOrderCount > 99 ? "99+" : newOrderCount}
      </span>
    )}
  </button>

  {/* View All Items */}
  <button
    style={styles.primaryBtn}
    onClick={() => navigate("/admingrocerylisting")}
  >
    📋 View All Items
  </button>

</div>
      </div>

      {loading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading dashboard analytics...</p>
        </div>
      ) : (
        <div style={styles.dashboardContent}>
          {/* Stats Grid */}
          <div style={styles.statsGrid}>
            <div style={{ ...styles.statCard, borderLeft: "4px solid #2563eb" }}>
              <div>
                <p style={styles.statLabel}>Total Products</p>
                <h3 style={styles.statValue}>{totalItems}</h3>
              </div>
              <div style={{ ...styles.statIcon, background: "#eff6ff", color: "#2563eb" }}>📦</div>
            </div>

            <div style={{ ...styles.statCard, borderLeft: "4px solid #059669" }}>
              <div>
                <p style={styles.statLabel}>Active Categories</p>
                <h3 style={styles.statValue}>{totalCategories}</h3>
              </div>
              <div style={{ ...styles.statIcon, background: "#ecfdf5", color: "#059669" }}>🗂️</div>
            </div>

            <div style={{ ...styles.statCard, borderLeft: "4px solid #d97706" }}>
              <div>
                <p style={styles.statLabel}>Low Stock (&lt;5)</p>
                <h3 style={styles.statValue}>{lowStock}</h3>
              </div>
              <div style={{ ...styles.statIcon, background: "#fef3c7", color: "#d97706" }}>⚠️</div>
            </div>

            <div style={{ ...styles.statCard, borderLeft: "4px solid #dc2626" }}>
              <div>
                <p style={styles.statLabel}>Out of Stock</p>
                <h3 style={styles.statValue}>{outOfStock}</h3>
              </div>
              <div style={{ ...styles.statIcon, background: "#fef2f2", color: "#dc2626" }}>❌</div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div style={styles.actionPanel}>
            <h3 style={styles.sectionTitle}>Quick Management</h3>
            <div style={styles.actionButtonsGrid}>
              <button style={styles.actionCardBtn} onClick={() => navigate("/adminGrocery")}>
                <span style={styles.actionCardIcon}>➕</span>
                <span style={styles.actionCardTitle}>Add New Item</span>
                <span style={styles.actionCardDesc}>Create and list a fresh grocery product</span>
              </button>

              <button style={styles.actionCardBtn} onClick={() => navigate("/admingrocerylisting")}>
                <span style={styles.actionCardIcon}>✏️</span>
                <span style={styles.actionCardTitle}>Manage Inventory</span>
                <span style={styles.actionCardDesc}>Edit pricing, details, or delete items</span>
              </button>
            </div>
          </div>

          {/* Recent Additions Preview */}
          <div style={styles.recentSection}>
            <div style={styles.recentHeader}>
              <h3 style={styles.sectionTitle}>Recent Items</h3>
              <span style={styles.seeAllLink} onClick={() => navigate("/adminGroceryList")}>
                See All →
              </span>
            </div>

            <div style={styles.recentGrid}>
              {items.slice(0, 4).map((item) => (
                <div key={item.id} style={styles.recentItemCard}>
                  <img 
                    src={item.img} 
                    alt={item.name} 
                    style={styles.recentImage}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/40?text=No+Img";
                    }}
                  />
                  <div style={styles.recentInfo}>
                    <h4 style={styles.recentName}>{item.name}</h4>
                    <p style={styles.recentPrice}>₹{item.price} <span style={styles.recentMrp}>₹{item.mrp}</span></p>
                  </div>
                  <span style={{
                    ...styles.miniBadge,
                    background: item.stock > 0 ? "#def7ec" : "#fde8e8",
                    color: item.stock > 0 ? "#03543f" : "#9b1c1c"
                  }}>
                    {item.stock} left
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
    
  );
};

const styles = {
  wrapper: {
    padding: "16px",
    minHeight: "100vh",
    boxSizing: "border-box",
    background: "#f4f6f9",
    fontFamily: "'Inter', sans-serif",
    display: "flex",
    flexDirection: "column",
  },

  headerContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "12px",
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  backBtn: {
    background: "#fff",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    cursor: "pointer",
    color: "#374151",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    flexShrink: 0,
  },

  title: {
    color: "#111827",
    fontSize: "22px",
    fontWeight: "700",
    margin: 0,
  },

  subtitle: {
    color: "#6b7280",
    fontSize: "12px",
    marginTop: "2px",
    marginBottom: 0,
  },

  primaryBtn: {
    padding: "10px 16px",
    background: "linear-gradient(135deg, #ff6600 0%, #e65c00 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(255, 102, 0, 0.2)",
  },

  dashboardContent: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "14px",
  },

  statCard: {
    background: "#fff",
    padding: "16px",
    borderRadius: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
    border: "1px solid #e5e7eb",
  },

  statLabel: {
    color: "#6b7280",
    fontSize: "12px",
    fontWeight: "500",
    margin: "0 0 4px 0",
  },

  statValue: {
    color: "#111827",
    fontSize: "22px",
    fontWeight: "700",
    margin: 0,
  },

  statIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
  },

  actionPanel: {
    background: "#fff",
    padding: "16px",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
    border: "1px solid #e5e7eb",
  },

  sectionTitle: {
    color: "#111827",
    fontSize: "15px",
    fontWeight: "700",
    margin: "0 0 12px 0",
  },

  actionButtonsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
  },

  actionCardBtn: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "14px",
    textAlign: "left",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    transition: "all 0.2s ease",
  },

  actionCardIcon: {
    fontSize: "20px",
    marginBottom: "4px",
  },

  actionCardTitle: {
    color: "#1f2937",
    fontSize: "14px",
    fontWeight: "600",
  },

  actionCardDesc: {
    color: "#6b7280",
    fontSize: "11px",
  },

  recentSection: {
    background: "#fff",
    padding: "16px",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
    border: "1px solid #e5e7eb",
  },

  recentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },

  seeAllLink: {
    color: "#ff6600",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },

  recentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "10px",
  },

  recentItemCard: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#f9fafb",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #f3f4f6",
  },

  recentImage: {
    width: "40px",
    height: "40px",
    borderRadius: "6px",
    objectFit: "cover",
    border: "1px solid #e5e7eb",
  },

  recentInfo: {
    flex: 1,
    minWidth: 0,
  },

  recentName: {
    color: "#1f2937",
    fontSize: "13px",
    fontWeight: "600",
    margin: "0 0 2px 0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  recentPrice: {
    color: "#059669",
    fontSize: "12px",
    fontWeight: "600",
    margin: 0,
  },

  recentMrp: {
    color: "#9ca3af",
    fontSize: "11px",
    textDecoration: "line-through",
    fontWeight: "normal",
    marginLeft: "4px",
  },

  miniBadge: {
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "10px",
    fontWeight: "600",
    whiteSpace: "nowrap",
  },

  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "300px",
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
    marginTop: "10px",
    color: "#6b7280",
    fontSize: "13px",
    fontWeight: "500",
  },
  headerRight: {
  display: "flex",
  alignItems: "center",
  gap: "10px",
},

notificationBtn: {
  position: "relative",
  width: "42px",
  height: "42px",
  borderRadius: "10px",
  border: "1px solid #e5e7eb",
  background: "#fff",
  cursor: "pointer",
  fontSize: "20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
},

notificationBadge: {
  position: "absolute",
  top: "-6px",
  right: "-6px",
  minWidth: "20px",
  height: "20px",
  padding: "0 5px",
  borderRadius: "20px",
  background: "#dc2626",
  color: "#fff",
  fontSize: "10px",
  fontWeight: "700",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "2px solid #fff",
},

notificationPopup: {
  position: "fixed",
  top: "20px",
  right: "20px",
  zIndex: 9999,
  width: "340px",
  background: "#fff",
  borderRadius: "12px",
  padding: "14px",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
  border: "1px solid #e5e7eb",
  animation: "slideIn 0.3s ease",
},

notificationPopupIcon: {
  width: "42px",
  height: "42px",
  borderRadius: "50%",
  background: "#fff7ed",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "22px",
  flexShrink: 0,
},

notificationPopupContent: {
  flex: 1,
},

notificationClose: {
  border: "none",
  background: "transparent",
  fontSize: "22px",
  color: "#6b7280",
  cursor: "pointer",
},
};

export default GroceryDashboard;