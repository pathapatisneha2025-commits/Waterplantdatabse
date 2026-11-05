
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
const API_URL = "https://api2.ajpartyhouse.in";

const WaterCanPricing = () => {
  const [price, setPrice] = useState("50");
  const [currentPrice, setCurrentPrice] = useState("");
  const [pricingId, setPricingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isExisting = pricingId !== null;
const navigate = useNavigate();
  // =====================================
  // FETCH CURRENT PRICE
  // =====================================

  const fetchPrice = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `${API_URL}/watercan/all`
      );

      const data = await res.json();

      if (res.status === 404) {
        setPricingId(null);
        setCurrentPrice("");
        setPrice("50");
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(
          data.message || "Failed to fetch price"
        );
      }

      setPricingId(data.pricing.id);

      const fetchedPrice = String(data.pricing.price);

      setPrice(fetchedPrice);
      setCurrentPrice(fetchedPrice);

    } catch (err) {
      console.error("FETCH PRICE ERROR:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrice();
  }, []);

  // =====================================
  // ADD / UPDATE PRICE
  // =====================================

  const handleSave = async (e) => {
    e.preventDefault();

    const numericPrice = Number(price);

    if (
      price.trim() === "" ||
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      setError("Please enter a valid price.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const method = isExisting ? "PUT" : "POST";

      const endpoint = isExisting
        ? `${API_URL}/watercan/update`
        : `${API_URL}/watercan/add`;

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price: numericPrice,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.message || "Failed to save price"
        );
      }

      const savedPrice = String(data.pricing.price);

      setPricingId(data.pricing.id);
      setPrice(savedPrice);
      setCurrentPrice(savedPrice);

      setMessage(
        isExisting
          ? "Water can price updated successfully!"
          : "Water can price added successfully!"
      );

    } catch (err) {
      console.error("SAVE PRICE ERROR:", err);
      setError(err.message);

      // In case another admin created the record
      // after this page loaded, refresh the current data.
      if (err.message.toLowerCase().includes("already exists")) {
        fetchPrice();
      }

    } finally {
      setSaving(false);
    }
  };

  // =====================================
  // RESET
  // =====================================

  const handleReset = () => {
    setPrice(
      isExisting ? currentPrice : "50"
    );

    setMessage("");
    setError("");
  };

  // =====================================
  // UI
  // =====================================

  return (
    <div style={styles.page}>

   <div style={styles.header}>
  <div style={styles.headerLeft}>
    <button
      type="button"
      onClick={() => navigate(-1)}
      style={styles.backButton}
      title="Go Back"
    >
      ←
    </button>

    <div>
      <h2 style={styles.heading}>
        Water Can Pricing
      </h2>

      <p style={styles.subtitle}>
        Manage and configure water can selling prices
      </p>
    </div>
  </div>

  <div style={styles.headerIcon}>
    💧
  </div>
</div>

      {loading ? (
        <div style={styles.loading}>
          Loading water can price...
        </div>
      ) : (
        <div style={styles.content}>

          {/* CURRENT PRICE */}

          {isExisting && (
            <div style={styles.currentPriceCard}>

              <div style={styles.currentPriceTop}>
                <div>
                  <p style={styles.currentLabel}>
                    CURRENT WATER CAN PRICE
                  </p>

                  <h2 style={styles.currentPrice}>
                    ₹{Number(currentPrice).toFixed(2)}
                  </h2>

                  <p style={styles.currentDescription}>
                    Current selling price per water can
                  </p>
                </div>

                <div style={styles.priceIcon}>
                  💧
                </div>
              </div>

              <div style={styles.status}>
                <span style={styles.statusDot}></span>
                Active Pricing
              </div>

            </div>
          )}

          {/* ADD / UPDATE CARD */}

          <div style={styles.card}>

            <div style={styles.cardHeader}>

              <div style={styles.cardIcon}>
                {isExisting ? "✏️" : "➕"}
              </div>

              <div>
                <h3 style={styles.cardTitle}>
                  {isExisting
                    ? "Update Water Can Price"
                    : "Add Water Can Price"}
                </h3>

                <p style={styles.description}>
                  {isExisting
                    ? "Change the existing selling price."
                    : "Set the initial selling price for water cans."}
                </p>
              </div>

            </div>

            <form onSubmit={handleSave}>

              <label style={styles.label}>
                Price Per Water Can (₹)
              </label>

              <div style={styles.inputWrapper}>

                <span style={styles.rupee}>₹</span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    setMessage("");
                    setError("");
                  }}
                  placeholder="Enter water can price"
                  style={styles.input}
                  required
                />

              </div>

              <div style={styles.preview}>
                <span>New selling price</span>

                <strong>
                  ₹{
                    price !== "" &&
                    Number.isFinite(Number(price))
                      ? Number(price).toFixed(2)
                      : "0.00"
                  }
                </strong>
              </div>

              {message && (
                <div style={styles.success}>
                  ✓ {message}
                </div>
              )}

              {error && (
                <div style={styles.error}>
                  ⚠ {error}
                </div>
              )}

              <div style={styles.buttonRow}>

                <button
                  type="button"
                  onClick={handleReset}
                  disabled={saving}
                  style={styles.cancelButton}
                >
                  Reset
                </button>

                <button
                  type="submit"
                  disabled={saving || price.trim() === ""}
                  style={{
                    ...styles.button,
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving
                    ? "Saving..."
                    : isExisting
                      ? "Update Price"
                      : "Add Water Can Price"}
                </button>

              </div>

            </form>

          </div>

          {/* INFORMATION */}

          <div style={styles.infoCard}>
            <span style={styles.infoIcon}>ℹ️</span>

            <div>
              <h4 style={styles.infoTitle}>
                Pricing Information
              </h4>

              <p style={styles.infoText}>
                {isExisting
                  ? "The current price is active for regular and premium customers. Updating this price changes the selling price used for future water can orders."
                  : "No water can price has been configured yet. Add the initial price to activate water can pricing."}
              </p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

// =====================================
// STYLES
// =====================================

const styles = {
  page: {
    padding: "30px",
    minHeight: "100vh",
    background: "#f5f7f8",
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },

  heading: {
    fontSize: "26px",
    fontWeight: "700",
    color: "#0B1E22",
    margin: 0,
  },
headerLeft: {
  display: "flex",
  alignItems: "center",
  gap: "16px",
},

backButton: {
  width: "42px",
  height: "42px",
  borderRadius: "10px",
  border: "1px solid #dce1e8",
  background: "#ffffff",
  color: "#0B1E22",
  fontSize: "26px",
  fontWeight: "600",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "0.2s",
},
  subtitle: {
    color: "#7b8494",
    marginTop: "8px",
    fontSize: "14px",
  },

  headerIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "#e4f2f1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "25px",
  },

  content: {
    maxWidth: "850px",
  },

  currentPriceCard: {
    background: "#0B1E22",
    padding: "30px",
    borderRadius: "15px",
    color: "#fff",
    marginBottom: "25px",
    boxShadow: "0 5px 20px rgba(11,30,34,0.12)",
  },

  currentPriceTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  currentLabel: {
    color: "#b8c8c7",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "1px",
    margin: "0 0 12px",
  },

  currentPrice: {
    fontSize: "36px",
    fontWeight: "700",
    color: "#D4B477",
    margin: 0,
  },

  currentDescription: {
    color: "#b8c8c7",
    fontSize: "13px",
    marginTop: "8px",
  },

  priceIcon: {
    width: "65px",
    height: "65px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
  },

  status: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "22px",
    fontSize: "12px",
    color: "#c4e7d3",
  },

  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#4ade80",
  },

  card: {
    background: "#fff",
    padding: "30px",
    borderRadius: "14px",
    boxShadow: "0 3px 15px rgba(0,0,0,0.04)",
    border: "1px solid #edf0f1",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "25px",
  },

  cardIcon: {
    width: "48px",
    height: "48px",
    background: "#e4f2f1",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
  },

  cardTitle: {
    fontSize: "20px",
    color: "#0B1E22",
    margin: "0 0 8px",
  },

  description: {
    color: "#7b8494",
    fontSize: "13px",
    margin: 0,
    lineHeight: "21px",
  },

  label: {
    display: "block",
    fontWeight: "600",
    fontSize: "14px",
    marginBottom: "10px",
    color: "#344054",
  },

  inputWrapper: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #dce1e8",
    borderRadius: "9px",
    padding: "0 15px",
    height: "55px",
    marginBottom: "15px",
    background: "#fff",
  },

  rupee: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#0B1E22",
    marginRight: "12px",
  },

  input: {
    width: "100%",
    border: "none",
    outline: "none",
    fontSize: "20px",
    fontWeight: "600",
    color: "#0B1E22",
    background: "transparent",
  },

  preview: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px",
    background: "#f5f8f7",
    borderRadius: "8px",
    marginBottom: "20px",
    color: "#667085",
    fontSize: "13px",
  },

  buttonRow: {
    display: "flex",
    gap: "12px",
    marginTop: "20px",
  },

  cancelButton: {
    padding: "14px 22px",
    background: "#fff",
    color: "#344054",
    border: "1px solid #dce1e8",
    borderRadius: "9px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },

  button: {
    flex: 1,
    padding: "15px",
    background: "#0B1E22",
    color: "#fff",
    border: "none",
    borderRadius: "9px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },

  success: {
    color: "#16834a",
    background: "#e9f8ef",
    padding: "12px",
    borderRadius: "7px",
    fontSize: "13px",
    marginBottom: "15px",
  },

  error: {
    color: "#c62828",
    background: "#ffeded",
    padding: "12px",
    borderRadius: "7px",
    fontSize: "13px",
    marginBottom: "15px",
  },

  infoCard: {
    display: "flex",
    gap: "14px",
    padding: "20px",
    background: "#edf5f4",
    borderRadius: "10px",
    marginTop: "22px",
  },

  infoIcon: {
    fontSize: "20px",
  },

  infoTitle: {
    margin: "0 0 7px",
    fontSize: "14px",
    color: "#0B1E22",
  },

  infoText: {
    margin: 0,
    color: "#667085",
    fontSize: "13px",
    lineHeight: "21px",
  },

  loading: {
    padding: "30px",
    color: "#667085",
  },
};

export default WaterCanPricing;
