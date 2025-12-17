import React, { useEffect, useState } from "react";

const PremiumCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDrivers, setSelectedDrivers] = useState({}); // separate state

  useEffect(() => {
    // Fetch premium customers
    fetch("https://waterplantdatabse.onrender.com/users/list/premium")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCustomers(data.users);
        } else {
          setError("Failed to load customers");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Server error");
        setLoading(false);
      });

    // Fetch drivers
    fetch("https://waterplantdatabse.onrender.com/users/list/drivers")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDrivers(data.drivers);
        } else {
          console.error("Failed to load drivers");
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleAssignDriver = (customerId) => {
    const driverId = selectedDrivers[customerId];
    if (!driverId) {
      alert("Please select a driver");
      return;
    }

    fetch(`https://waterplantdatabse.onrender.com/users/assign-driver`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, driverId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Driver assigned successfully");
        } else {
          alert("Failed to assign driver");
        }
      })
      .catch((err) => {
        console.error(err);
        alert("Server error");
      });
  };

  if (loading) return <p>Loading premium customers...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Premium Customers</h2>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Phone</th>
            <th style={styles.th}>Email</th>
            <th style={styles.th}>Address</th>
            <th style={styles.th}>Pincode</th>
            <th style={styles.th}>Created At</th>
            <th style={styles.th}>Assign Driver</th>
          </tr>
        </thead>

        <tbody>
          {customers.length === 0 ? (
            <tr>
              <td colSpan="8" style={styles.noData}>
                No premium customers found
              </td>
            </tr>
          ) : (
            customers.map((customer, index) => (
              <tr
                key={customer.id}
                style={index % 2 === 0 ? styles.rowEven : styles.rowOdd}
              >
                <td style={styles.td}>{customer.id}</td>
                <td style={styles.td}>{customer.name}</td>
                <td style={styles.td}>{customer.phone}</td>
                <td style={styles.td}>{customer.email}</td>
                <td style={styles.td}>{customer.address}</td>
                <td style={styles.td}>{customer.pincode}</td>
                <td style={styles.td}>
                  {new Date(customer.created_at).toLocaleDateString()}
                </td>
                <td style={styles.td}>
                  <select
                    value={selectedDrivers[customer.id] || ""}
                    onChange={(e) =>
                      setSelectedDrivers((prev) => ({
                        ...prev,
                        [customer.id]: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select Driver</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name}
                      </option>
                    ))}
                  </select>
                  <button
                    style={styles.assignBtn}
                    onClick={() => handleAssignDriver(customer.id)}
                  >
                    Assign
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    backgroundColor: "#fff",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    maxWidth: "1200px",
    margin: "20px auto",
  },
  heading: {
    color: "#FF6600",
    marginBottom: "15px",
    fontFamily: "Arial, sans-serif",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    border: "1px solid #FF6600",
    padding: "10px",
    backgroundColor: "#FF6600",
    color: "#fff",
    textAlign: "left",
  },
  td: {
    border: "1px solid #FF9900",
    padding: "8px",
    color: "#333",
  },
  rowEven: {
    backgroundColor: "#fff",
  },
  rowOdd: {
    backgroundColor: "#fff7f0",
  },
  noData: {
    textAlign: "center",
    padding: "15px",
    color: "#FF6600",
  },
  assignBtn: {
    marginLeft: "10px",
    padding: "5px 10px",
    backgroundColor: "#FF6600",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default PremiumCustomers;
