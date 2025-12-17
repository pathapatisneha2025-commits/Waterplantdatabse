import React, { useEffect, useState } from "react";

const PremiumCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("https://waterplantdatabse.onrender.com/users/get-premium-customers")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCustomers(data.customers);
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
  }, []);

  if (loading) return <p>Loading premium customers...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Premium Customers</h2>

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
          </tr>
        </thead>

        <tbody>
          {customers.length === 0 ? (
            <tr>
              <td colSpan="7" style={styles.noData}>
                No premium customers found
              </td>
            </tr>
          ) : (
            customers.map((customer) => (
              <tr key={customer.id}>
                <td style={styles.td}>{customer.id}</td>
                <td style={styles.td}>{customer.name}</td>
                <td style={styles.td}>{customer.phone}</td>
                <td style={styles.td}>{customer.email}</td>
                <td style={styles.td}>{customer.address}</td>
                <td style={styles.td}>{customer.pincode}</td>
                <td style={styles.td}>
                  {new Date(customer.created_at).toLocaleDateString()}
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
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "15px",
  },
  th: {
    border: "1px solid #ccc",
    padding: "10px",
    backgroundColor: "#f5f5f5",
    textAlign: "left",
  },
  td: {
    border: "1px solid #ccc",
    padding: "8px",
  },
  noData: {
    textAlign: "center",
    padding: "15px",
  },
};

export default PremiumCustomers;
