
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function DriverManagement() {
  const navigate = useNavigate();

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  const API = "https://api2.ajpartyhouse.in";

  useEffect(() => {
    fetch(`${API}/users/all`)
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

  // APPROVE DRIVER
  const approveDriver = async (id) => {
    try {
      const res = await fetch(`${API}/users/approve-driver`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setDrivers((prev) =>
          prev.map((d) =>
            d.id === id
              ? {
                  ...d,
                  approved: true,
                }
              : d
          )
        );

        alert("Driver approved successfully!");
      } else {
        alert(data.message || "Failed to approve driver.");
      }
    } catch (err) {
      console.error("Approve driver error:", err);
      alert("Failed to approve driver.");
    }
  };

  // REMOVE DRIVER
  const removeDriver = async (id, name) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove driver "${name}"?\n\nThis will permanently delete the driver.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setRemovingId(id);

      const res = await fetch(`${API}/users/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Remove driver from UI immediately
        setDrivers((prev) =>
          prev.filter((driver) => driver.id !== id)
        );

        alert("Driver removed successfully!");
      } else {
        alert(data.message || data.error || "Failed to remove driver.");
      }
    } catch (err) {
      console.error("Remove driver error:", err);
      alert("Failed to remove driver.");
    } finally {
      setRemovingId(null);
    }
  };

  const styles = {
    container: {
      padding: "20px",
      fontFamily: "Arial, sans-serif",
      maxWidth: "100%",
      boxSizing: "border-box",
    },

    headerRow: {
      display: "flex",
      alignItems: "center",
      gap: "15px",
      marginBottom: "15px",
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
    },

    header: {
      color: "#ff7f50",
      margin: 0,
    },

    tableResponsiveWrapper: {
      width: "100%",
      overflowX: "auto",
      WebkitOverflowScrolling: "touch",
    },

    table: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: "1000px",
    },

    th: {
      border: "1px solid #ff7f50",
      padding: "10px",
      backgroundColor: "#ff7f50",
      color: "white",
      textAlign: "left",
      whiteSpace: "nowrap",
    },

    td: {
      border: "1px solid #ff7f50",
      padding: "10px",
      textAlign: "left",
      whiteSpace: "nowrap",
    },

    approveBtn: {
      padding: "7px 12px",
      backgroundColor: "#28a745",
      border: "none",
      color: "white",
      borderRadius: "5px",
      cursor: "pointer",
      fontWeight: "600",
    },

    approvedText: {
      color: "#4CAF50",
      fontWeight: "600",
    },

    removeBtn: {
      padding: "7px 12px",
      backgroundColor: "#dc3545",
      border: "none",
      color: "white",
      borderRadius: "5px",
      cursor: "pointer",
      fontWeight: "600",
      marginLeft: "8px",
    },

    removingBtn: {
      padding: "7px 12px",
      backgroundColor: "#999",
      border: "none",
      color: "white",
      borderRadius: "5px",
      cursor: "not-allowed",
      fontWeight: "600",
      marginLeft: "8px",
    },

    emptyRow: {
      textAlign: "center",
      padding: "20px",
      color: "#777",
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        Loading drivers...
      </div>
    );
  }

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
          Driver Management
        </h2>
      </div>

      {/* TABLE */}
      <div style={styles.tableResponsiveWrapper}>
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
              <th style={styles.th}>Action</th>
            </tr>
          </thead>

          <tbody>
            {drivers.length === 0 ? (
              <tr>
                <td
                  colSpan="9"
                  style={styles.emptyRow}
                >
                  No drivers found.
                </td>
              </tr>
            ) : (
              drivers.map((d) => (
                <tr key={d.id}>
                  <td style={styles.td}>
                    {d.name || "N/A"}
                  </td>

                  <td style={styles.td}>
                    {d.email || "N/A"}
                  </td>

                  <td style={styles.td}>
                    {d.phone || "N/A"}
                  </td>

                  <td style={styles.td}>
                    {d.registeredAt}
                  </td>

                  <td style={styles.td}>
                    {d.address || "N/A"}
                  </td>

                  <td style={styles.td}>
                    {d.latitude ?? "N/A"}
                  </td>

                  <td style={styles.td}>
                    {d.longitude ?? "N/A"}
                  </td>

                  {/* APPROVAL */}
                  <td style={styles.td}>
                    {d.approved ? (
                      <span style={styles.approvedText}>
                        Approved
                      </span>
                    ) : (
                      <button
                        style={styles.approveBtn}
                        onClick={() =>
                          approveDriver(d.id)
                        }
                      >
                        Approve
                      </button>
                    )}
                  </td>

                  {/* REMOVE */}
                  <td style={styles.td}>
                    <button
                      style={
                        removingId === d.id
                          ? styles.removingBtn
                          : styles.removeBtn
                      }
                      disabled={removingId === d.id}
                      onClick={() =>
                        removeDriver(d.id, d.name)
                      }
                    >
                      {removingId === d.id
                        ? "Removing..."
                        : "Remove"}
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
