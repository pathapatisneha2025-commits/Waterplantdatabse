import React, { useEffect, useState } from "react";

const API_URL = "https://api2.ajpartyhouse.in";

const WaterCanPricing = () => {
  const [price, setPrice] = useState("50");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =====================================
  // FETCH CURRENT PRICE
  // =====================================

  const fetchPrice = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `${API_URL}/water-pricing`
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.message || "Failed to fetch price"
        );
      }

      setPrice(String(data.pricing.price));
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
  // UPDATE PRICE
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

      const res = await fetch(
        `${API_URL}/water-pricing`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            price: numericPrice,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.message || "Failed to update price"
        );
      }

      setPrice(String(data.pricing.price));

      setMessage("Water can price updated successfully!");
    } catch (err) {
      console.error("UPDATE PRICE ERROR:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // =====================================
  // UI
  // =====================================

  return (
    <div style={styles.page}>

      <div style={styles.header}>
        <div>
          <h2 style={styles.heading}>
            Water Can Pricing
          </h2>

          <p style={styles.subtitle}>
            Manage the water can selling price
          </p>
        </div>
      </div>

      {loading ? (
        <div style={styles.loading}>
          Loading water can price...
        </div>
      ) : (
        <div style={styles.card}>

          <div style={styles.icon}>
            💧
          </div>

          <h3 style={styles.cardTitle}>
            Water Can Price
          </h3>

          <p style={styles.description}>
            This price applies to all customers,
            including premium customers.
          </p>

          <form onSubmit={handleSave}>

            <label style={styles.label}>
              Price per water can (₹)
            </label>

            <div style={styles.inputWrapper}>
              <span style={styles.rupee}>
                ₹
              </span>

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

            {message && (
              <div style={styles.success}>
                ✓ {message}
              </div>
            )}

            {error && (
              <div style={styles.error}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              style={{
                ...styles.button,
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving
                ? "Saving..."
                : "Save Price Changes"}
            </button>

          </form>

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
    background: "#f5f6fa",
    fontFamily: "Arial, sans-serif",
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
    color: "#172b4d",
    margin: 0,
  },

  subtitle: {
    color: "#7b8494",
    marginTop: "8px",
    fontSize: "14px",
  },

  card: {
    background: "#ffffff",
    padding: "35px",
    borderRadius: "14px",
    maxWidth: "480px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
  },

  icon: {
    width: "55px",
    height: "55px",
    background: "#e5f4f5",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    marginBottom: "20px",
  },

  cardTitle: {
    fontSize: "21px",
    color: "#172b4d",
    margin: "0 0 8px",
  },

  description: {
    color: "#7b8494",
    fontSize: "14px",
    lineHeight: "22px",
    marginBottom: "28px",
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
    height: "52px",
    marginBottom: "20px",
  },

  rupee: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#344054",
    marginRight: "10px",
  },

  input: {
    width: "100%",
    border: "none",
    outline: "none",
    fontSize: "18px",
    fontWeight: "600",
    color: "#172b4d",
    background: "transparent",
  },

  button: {
    width: "100%",
    padding: "15px",
    background: "#0B1E22",
    color: "#ffffff",
    border: "none",
    borderRadius: "9px",
    fontSize: "15px",
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

  loading: {
    padding: "30px",
    color: "#667085",
  },
};

export default WaterCanPricing;