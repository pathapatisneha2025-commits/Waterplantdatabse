
import React, { useEffect, useState } from "react";
import {
  FaTruck,
  FaRupeeSign,
  FaSave,
  FaSyncAlt,
} from "react-icons/fa";

const API_URL = "https://api2.ajpartyhouse.in/deliverycharge";

const DeliveryCharge = () => {
  const [charge, setCharge] = useState("");
  const [currentCharge, setCurrentCharge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchDeliveryCharge = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/all`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch delivery charge");
      }

      const value = Number(data.delivery_charge ?? 30);

      setCurrentCharge(value);
      setCharge(String(value));
    } catch (err) {
      setError(err.message || "Unable to load delivery charge");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryCharge();
  }, []);

  const handleSave = async () => {
    setMessage("");
    setError("");

    const numericCharge = Number(charge);

    if (
      charge.trim() === "" ||
      !Number.isFinite(numericCharge) ||
      numericCharge < 0
    ) {
      setError("Please enter a valid delivery charge.");
      return;
    }

    try {
      setSaving(true);

      const method = currentCharge === null ? "POST" : "PUT";

      const response = await fetch(`${API_URL}/delivery-charge`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          delivery_charge: numericCharge,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save delivery charge");
      }

      setCurrentCharge(numericCharge);
      setCharge(String(numericCharge));

      setMessage(
        method === "POST"
          ? "Delivery charge added successfully!"
          : "Delivery charge updated successfully!"
      );
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="delivery-page">
      <style>{`
        .delivery-page {
          min-height: 100vh;
          padding: 30px;
          background: #f5f7fa;
          color: #263238;
          box-sizing: border-box;
          font-family: Arial, sans-serif;
        }

        .delivery-page * {
          box-sizing: border-box;
        }

        .delivery-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 15px;
          margin-bottom: 30px;
        }

        .delivery-header h2 {
          margin: 0 0 8px;
          font-size: 25px;
          font-weight: 700;
        }

        .delivery-header p {
          margin: 0;
          color: #718096;
          font-size: 14px;
        }

        .delivery-refresh {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px 18px;
          border: 1px solid #dce3e9;
          border-radius: 8px;
          background: white;
          color: #263238;
          cursor: pointer;
        }

        .delivery-card {
          width: 100%;
          max-width: 480px;
          padding: 30px;
          border: 1px solid #e5eaf0;
          border-radius: 14px;
          background: white;
          box-shadow: 0 4px 18px rgba(0,0,0,0.04);
        }

        .delivery-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 55px;
          height: 55px;
          margin-bottom: 18px;
          border-radius: 12px;
          background: #e8f5ef;
          color: #168653;
          font-size: 25px;
        }

        .delivery-card h3 {
          margin: 0 0 8px;
          font-size: 21px;
        }

        .delivery-description {
          margin: 0 0 25px;
          color: #718096;
          font-size: 14px;
          line-height: 1.5;
        }

        .delivery-card label {
          display: block;
          margin-bottom: 9px;
          font-size: 14px;
          font-weight: 600;
        }

        .delivery-input-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 14px;
          border: 1px solid #dce3e9;
          border-radius: 9px;
          background: white;
          color: #168653;
        }

        .delivery-input-wrapper:focus-within {
          border-color: #168653;
        }

        .delivery-input-wrapper input {
          width: 100%;
          height: 48px;
          border: none;
          outline: none;
          background: transparent;
          color: #263238;
          font-size: 17px;
        }

        .current-delivery-charge {
          margin-top: 18px;
          padding: 13px;
          border-radius: 8px;
          background: #f5f7fa;
          color: #52616b;
          font-size: 14px;
        }

        .current-delivery-charge strong {
          margin-left: 5px;
          color: #168653;
          font-size: 17px;
        }

        .delivery-save {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          margin-top: 22px;
          padding: 14px;
          border: none;
          border-radius: 9px;
          background: #168653;
          color: white;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
        }

        .delivery-save:hover {
          background: #116b41;
        }

        .delivery-save:disabled,
        .delivery-refresh:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .delivery-success,
        .delivery-error {
          margin-top: 15px;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
        }

        .delivery-success {
          background: #e8f5ef;
          color: #168653;
        }

        .delivery-error {
          background: #fff0f0;
          color: #d32f2f;
        }

        .delivery-loading {
          display: flex;
          min-height: 60vh;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #168653;
        }

        .delivery-spin {
          animation: deliverySpin 1s linear infinite;
          font-size: 25px;
        }

        @keyframes deliverySpin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 600px) {
          .delivery-page {
            padding: 18px;
          }

          .delivery-card {
            padding: 22px;
          }

          .delivery-header h2 {
            font-size: 21px;
          }
        }
      `}</style>

      {loading ? (
        <div className="delivery-loading">
          <FaSyncAlt className="delivery-spin" />
          <p>Loading delivery charge...</p>
        </div>
      ) : (
        <>
          <div className="delivery-header">
            <div>
              <h2>Delivery Charge Management</h2>
              <p>Manage the delivery fee applied to customer orders.</p>
            </div>

            <button
              className="delivery-refresh"
              onClick={fetchDeliveryCharge}
              disabled={saving}
            >
              <FaSyncAlt /> Refresh
            </button>
          </div>

          <div className="delivery-card">
            <div className="delivery-icon">
              <FaTruck />
            </div>

            <h3>Delivery Charge</h3>

            <p className="delivery-description">
              Set the amount customers should pay for delivery.
            </p>

            <label htmlFor="deliveryCharge">
              Delivery charge (₹)
            </label>

            <div className="delivery-input-wrapper">
              <FaRupeeSign />

              <input
                id="deliveryCharge"
                type="number"
                min="0"
                step="0.01"
                value={charge}
                onChange={(e) => setCharge(e.target.value)}
                placeholder="Enter delivery charge"
              />
            </div>

            {currentCharge !== null && (
              <div className="current-delivery-charge">
                Current delivery charge:
                <strong>₹{currentCharge.toFixed(2)}</strong>
              </div>
            )}

            {message && (
              <div className="delivery-success">{message}</div>
            )}

            {error && (
              <div className="delivery-error">{error}</div>
            )}

            <button
              className="delivery-save"
              onClick={handleSave}
              disabled={saving}
            >
              <FaSave />
              {saving
                ? "Saving..."
                : currentCharge === null
                ? "Add Delivery Charge"
                : "Update Delivery Charge"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default DeliveryCharge;
