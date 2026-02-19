import React, { useState, useEffect } from "react";

export default function DriverManagement() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://waterplantdatabse.onrender.com/users/all")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {

          // ✅ Only drivers
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

  const styles = {
    container: { marginTop: "20px", fontFamily: "Arial, sans-serif" },
    header: { color: "#007bff", marginBottom: "10px" },
    table: { width: "100%", borderCollapse: "collapse" },
    th: {
      border: "1px solid #007bff",
      padding: "10px",
      backgroundColor: "#007bff",
      color: "white",
      textAlign: "left",
    },
    td: { border: "1px solid #007bff", padding: "10px", textAlign: "left" },
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
