import React, { useState, useEffect } from "react";

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch customers from API
  useEffect(() => {
    fetch("https://waterplantdatabse.onrender.com/users/all")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const mapped = data.users.map((u) => ({
            id: u.id,
            name: u.name,
            premium: u.is_premium,
            address: u.address,
            premiumRequested: u.premium_requested, // track requests
          }));
          setCustomers(mapped);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching customers:", err);
        setLoading(false);
      });
  }, []);

  // Approve premium via API
  const approvePremium = async (id) => {
    try {
      const res = await fetch(
        "https://waterplantdatabse.onrender.com/users/approve-premium",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: id }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === id
              ? { ...c, premium: true, premiumRequested: false }
              : c
          )
        );
        alert("User approved as Premium!");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to approve premium.");
    }
  };

  // Toggle subscription
  const toggleSubscription = (c) => {
    if (!c.premium && c.premiumRequested) {
      // If user requested premium and toggle is turned on, approve via API
      approvePremium(c.id);
    } else {
      // Admin can remove or add premium manually
      setCustomers((prev) =>
        prev.map((cust) =>
          cust.id === c.id ? { ...cust, premium: !cust.premium } : cust
        )
      );
    }
  };

  // Update customer address
  const updateAddress = (id) => {
    const newAddress = prompt("Enter new address:");
    if (newAddress) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, address: newAddress } : c))
      );
    }
  };

  // Styles
  const styles = {
    container: { marginTop: "20px", fontFamily: "Arial, sans-serif" },
    header: { color: "#ff7f50", marginBottom: "10px" },
    table: { width: "100%", borderCollapse: "collapse" },
    th: {
      border: "1px solid #ff7f50",
      padding: "10px",
      backgroundColor: "#ff7f50",
      color: "white",
      textAlign: "left",
    },
    td: { border: "1px solid #ff7f50", padding: "10px", textAlign: "left" },
    updateBtn: {
      padding: "5px 10px",
      backgroundColor: "#f0ad4e",
      border: "none",
      color: "white",
      borderRadius: "5px",
      cursor: "pointer",
    },
    toggleWrapper: { position: "relative", display: "inline-block", width: "50px", height: "24px" },
    toggleSlider: {
      position: "absolute",
      cursor: "pointer",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "#d9534f",
      transition: ".4s",
      borderRadius: "34px",
    },
    toggleSliderBefore: {
      position: "absolute",
      content: '""',
      height: "18px",
      width: "18px",
      left: "3px",
      bottom: "3px",
      backgroundColor: "white",
      transition: ".4s",
      borderRadius: "50%",
    },
    toggleChecked: { backgroundColor: "#4CAF50" },
    toggleCheckedBefore: { transform: "translateX(26px)" },
  };

  if (loading) return <div style={styles.container}>Loading customers...</div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Customer Management</h2>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Premium Status</th>
            <th style={styles.th}>Subscription</th>
            <th style={styles.th}>Address</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id}>
              <td style={styles.td}>{c.name}</td>

              {/* Premium Status with Pending */}
              <td style={styles.td}>
                {c.premium ? (
                  <span style={{ color: "#4CAF50", fontWeight: "600" }}>Premium</span>
                ) : c.premiumRequested ? (
                  <span style={{ color: "#FFA500", fontWeight: "600" }}>Pending Request</span>
                ) : (
                  <span style={{ color: "#888" }}>Regular</span>
                )}
              </td>

              {/* Subscription Toggle */}
              <td style={styles.td}>
                <label style={styles.toggleWrapper}>
                  <input
                    type="checkbox"
                    checked={c.premium}
                    onChange={() => toggleSubscription(c)}
                    style={{ display: "none" }}
                  />
                  <span
                    style={{
                      ...styles.toggleSlider,
                      ...(c.premium ? styles.toggleChecked : {}),
                    }}
                  >
                    <span
                      style={{
                        ...styles.toggleSliderBefore,
                        ...(c.premium ? styles.toggleCheckedBefore : {}),
                      }}
                    ></span>
                  </span>
                </label>
              </td>

              <td style={styles.td}>{c.address}</td>
              <td style={styles.td}>
                <button
                  style={styles.updateBtn}
                  onClick={() => updateAddress(c.id)}
                >
                  Update Address
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
