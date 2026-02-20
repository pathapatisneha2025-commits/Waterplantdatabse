import React, { useState, useEffect } from "react";

export default function DriverManagement() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://waterplantdatabse.onrender.com/users/all")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const mapped = data.users
            .filter((u) => u.role === "driver")
            .map((u) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              phone: u.phone,
              registeredAt: u.created_at
                ? new Date(u.created_at).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "N/A",
              address: u.address,
              latitude: u.latitude,
              longitude: u.longitude,
              approved: u.driver_approved || false,
            }));

          setDrivers(mapped);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching drivers:", err);
        setLoading(false);
      });
  }, []);

  const approveDriver = async (id) => {
    try {
      const res = await fetch(
        "https://waterplantdatabse.onrender.com/users/approve-driver",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: id }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setDrivers((prev) =>
          prev.map((d) => (d.id === id ? { ...d, approved: true } : d))
        );
        alert("Driver approved successfully!");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to approve driver.");
    }
  };

  // Styles (matching Customer Management UI)
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
    approveBtn: {
      padding: "5px 10px",
      backgroundColor: "#28a745",
      border: "none",
      color: "white",
      borderRadius: "5px",
      cursor: "pointer",
    },
  };

  if (loading) return <div style={styles.container}>Loading drivers...</div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Driver Management</h2>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Email</th>
            <th style={styles.th}>Phone</th>
            <th style={styles.th}>Registered At</th>
            <th style={styles.th}>Address</th>
            <th style={styles.th}>Latitude</th>
            <th style={styles.th}>Longitude</th>
            <th style={styles.th}>Approval</th>
          </tr>
        </thead>
        <tbody>
          {drivers.map((d) => (
            <tr key={d.id}>
              <td style={styles.td}>{d.name}</td>
              <td style={styles.td}>{d.email}</td>
              <td style={styles.td}>{d.phone}</td>
              <td style={styles.td}>{d.registeredAt}</td>
              <td style={styles.td}>{d.address}</td>
              <td style={styles.td}>{d.latitude}</td>
              <td style={styles.td}>{d.longitude}</td>
              <td style={styles.td}>
                {d.approved ? (
                  <span style={{ color: "#4CAF50", fontWeight: "600" }}>
                    Approved
                  </span>
                ) : (
                  <button
                    style={styles.approveBtn}
                    onClick={() => approveDriver(d.id)}
                  >
                    Approve
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}