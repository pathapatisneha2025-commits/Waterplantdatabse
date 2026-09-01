import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const GroceryList = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // FETCH ITEMS
  // =========================
  const fetchItems = async () => {
    try {
      const res = await fetch(
        "https://api2.ajpartyhouse.in/groceries/all"
      );

      const data = await res.json();

      console.log("API Response:", data);

      if (Array.isArray(data)) {
        setItems(data);
      } else if (Array.isArray(data.data)) {
        setItems(data.data);
      } else if (Array.isArray(data.groceries)) {
        setItems(data.groceries);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.log(
        "Error fetching grocery:",
        error
      );

      alert("Server error");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // =========================
  // DELETE
  // =========================
  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure to delete?"
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        `https://api2.ajpartyhouse.in/groceries/delete/${id}`,
        {
          method: "DELETE",
        }
      );

      if (res.ok) {
        setItems((prev) =>
          prev.filter(
            (item) => item.id !== id
          )
        );
      } else {
        alert("Delete failed");
      }
    } catch (error) {
      console.log(error);
      alert("Server error");
    }
  };

  // =========================
  // EDIT
  // =========================
  const handleEdit = (item) => {
    navigate("/adminGrocery", {
      state: {
        item,
      },
    });
  };

  // =========================
  // FORMAT PRICE
  // =========================
  const formatPrice = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "0.00";
    }

    const number = Number(value);

    if (isNaN(number)) {
      return "0.00";
    }

    return number.toFixed(2);
  };

  // =========================
  // GET PREMIUM PRICE
  // =========================
  const getPremiumPrice = (item) => {
    return (
      item.premiumPrice ??
      item.premiumprice ??
      0
    );
  };

  // =========================
  // GET PREMIUM DISCOUNT
  // =========================
  const getPremiumDiscount = (item) => {
    return (
      item.premiumDiscount ??
      item.premiumdiscount ??
      0
    );
  };

  return (
    <div style={styles.wrapper}>

      {/* =========================
          HEADER
      ========================= */}
      <div style={styles.headerContainer}>

        <div style={styles.headerLeft}>

          <button
            style={styles.backBtn}
            onClick={() => navigate(-1)}
            title="Go Back"
          >
            ←
          </button>

          <h1 style={styles.title}>
            Grocery Items
          </h1>

        </div>

        <button
          style={styles.addBtn}
          onClick={() =>
            navigate("/adminGrocery")
          }
        >
          ➕ Add Item
        </button>

      </div>

      {/* =========================
          LOADING
      ========================= */}
      {loading ? (
        <p style={styles.loadingText}>
          Loading...
        </p>
      ) : (
        <div style={styles.tableCard}>

          <table style={styles.table}>

            <thead>
              <tr>

                <th style={styles.th}>
                  ID
                </th>

                <th style={styles.th}>
                  Image
                </th>

                <th style={styles.th}>
                  Name
                </th>

                <th style={styles.th}>
                  Brand
                </th>

                <th style={styles.th}>
                  Category
                </th>

                <th style={styles.th}>
                  Subcategory
                </th>

                <th style={styles.th}>
                  Description
                </th>

                {/* =========================
                    PRICE DETAILS
                ========================= */}

                <th style={styles.th}>
                  MRP
                </th>

                <th style={styles.th}>
                  Non-Premium Price
                </th>

                <th style={styles.th}>
                  Non-Premium Discount
                </th>

                <th style={styles.th}>
                  Premium Price
                </th>

                <th style={styles.th}>
                  Premium Discount
                </th>

                {/* =========================
                    STOCK
                ========================= */}

                <th style={styles.th}>
                  Qty
                </th>

                <th style={styles.th}>
                  Unit
                </th>

                <th style={styles.th}>
                  Stock
                </th>

                <th style={styles.th}>
                  Actions
                </th>

              </tr>
            </thead>

            <tbody>

              {items.length === 0 ? (

                <tr>
                  <td
                    colSpan="16"
                    style={styles.emptyText}
                  >
                    No items found
                  </td>
                </tr>

              ) : (

                items.map((item) => {

                  const premiumPrice =
                    getPremiumPrice(item);

                  const premiumDiscount =
                    getPremiumDiscount(item);

                  return (
                    <tr
                      key={item.id}
                      style={styles.row}
                    >

                      {/* ID */}
                      <td style={styles.td}>
                        {item.id}
                      </td>

                      {/* IMAGE */}
                      <td style={styles.td}>
                        {item.img ? (
                          <img
                            src={item.img}
                            alt={item.name || "img"}
                            style={styles.image}
                          />
                        ) : (
                          <span
                            style={
                              styles.noImage
                            }
                          >
                            No Image
                          </span>
                        )}
                      </td>

                      {/* NAME */}
                      <td style={styles.td}>
                        {item.name}
                      </td>

                      {/* BRAND */}
                      <td style={styles.td}>
                        {item.brand}
                      </td>

                      {/* CATEGORY */}
                      <td style={styles.td}>
                        {item.category}
                      </td>

                      {/* SUBCATEGORY */}
                      <td style={styles.td}>
                        {item.subcategory}
                      </td>

                      {/* DESCRIPTION */}
                      <td
                        style={{
                          ...styles.td,
                          maxWidth: "200px",
                          whiteSpace: "normal",
                        }}
                      >
                        {item.description}
                      </td>

                      {/* =========================
                          MRP
                      ========================= */}
                      <td
                        style={{
                          ...styles.td,
                          ...styles.mrpPrice,
                        }}
                      >
                        ₹
                        {formatPrice(
                          item.mrp
                        )}
                      </td>

                      {/* =========================
                          NON-PREMIUM PRICE
                      ========================= */}
                      <td
                        style={{
                          ...styles.td,
                          ...styles.normalPrice,
                        }}
                      >
                        ₹
                        {formatPrice(
                          item.price
                        )}
                      </td>

                      {/* =========================
                          NON-PREMIUM DISCOUNT
                      ========================= */}
                      <td style={styles.td}>

                        <span
                          style={
                            styles.discountBadge
                          }
                        >
                          {formatPrice(
                            item.discount
                          )}
                          % OFF
                        </span>

                      </td>

                      {/* =========================
                          PREMIUM PRICE
                      ========================= */}
                      <td
                        style={{
                          ...styles.td,
                          ...styles.premiumPrice,
                        }}
                      >
                        ₹
                        {formatPrice(
                          premiumPrice
                        )}
                      </td>

                      {/* =========================
                          PREMIUM DISCOUNT
                      ========================= */}
                      <td style={styles.td}>

                        <span
                          style={
                            styles.premiumDiscountBadge
                          }
                        >
                          {formatPrice(
                            premiumDiscount
                          )}
                          % OFF
                        </span>

                      </td>

                      {/* QUANTITY */}
                      <td style={styles.td}>
                        {item.quantity}
                      </td>

                      {/* UNIT */}
                      <td style={styles.td}>
                        {item.unit}
                      </td>

                      {/* STOCK */}
                      <td style={styles.td}>
                        {item.stock}
                      </td>

                      {/* ACTIONS */}
                      <td
                        style={{
                          ...styles.td,
                          ...styles.actionCol,
                        }}
                      >

                        <button
                          style={
                            styles.editBtn
                          }
                          onClick={() =>
                            handleEdit(item)
                          }
                        >
                          Edit
                        </button>

                        <button
                          style={
                            styles.deleteBtn
                          }
                          onClick={() =>
                            handleDelete(
                              item.id
                            )
                          }
                        >
                          Delete
                        </button>

                      </td>

                    </tr>
                  );
                })
              )}

            </tbody>

          </table>

        </div>
      )}

    </div>
  );
};

const styles = {

  wrapper: {
    padding: "15px",
    minHeight: "100vh",
    background: "#f9fafb",
    fontFamily: "Arial",
    maxWidth: "100%",
    boxSizing: "border-box",
  },

  // =========================
  // HEADER
  // =========================

  headerContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
    flexWrap: "wrap",
    gap: "15px",
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
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
    flexShrink: 0,
  },

  title: {
    color: "#ff6600",
    fontSize: "28px",
    fontWeight: "bold",
    margin: 0,
  },

  addBtn: {
    padding: "10px 20px",
    background: "#ff6600",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  // =========================
  // TABLE
  // =========================

  tableCard: {
    background: "#fff",
    padding: "10px",
    borderRadius: "12px",
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1500px",
  },

  th: {
    borderBottom: "1px solid #eee",
    padding: "10px",
    textAlign: "left",
    whiteSpace: "nowrap",
    background: "#fff",
    fontWeight: "700",
  },

  td: {
    borderBottom: "1px solid #eee",
    padding: "10px",
    textAlign: "left",
    whiteSpace: "nowrap",
  },

  row: {
    borderBottom: "1px solid #eee",
  },

  // =========================
  // IMAGE
  // =========================

  image: {
    width: "55px",
    height: "55px",
    borderRadius: "8px",
    objectFit: "cover",
  },

  noImage: {
    color: "#999",
    fontSize: "12px",
  },

  // =========================
  // PRICES
  // =========================

  mrpPrice: {
    fontWeight: "700",
    color: "#555",
  },

  normalPrice: {
    fontWeight: "700",
    color: "#222",
  },

  premiumPrice: {
    fontWeight: "700",
    color: "#ff6600",
  },

  // =========================
  // DISCOUNTS
  // =========================

  discountBadge: {
    display: "inline-block",
    padding: "5px 8px",
    borderRadius: "6px",
    background: "#e8f7ed",
    color: "#16833b",
    fontSize: "12px",
    fontWeight: "700",
  },

  premiumDiscountBadge: {
    display: "inline-block",
    padding: "5px 8px",
    borderRadius: "6px",
    background: "#fff0e6",
    color: "#ff6600",
    fontSize: "12px",
    fontWeight: "700",
  },

  // =========================
  // ACTIONS
  // =========================

  actionCol: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },

  editBtn: {
    background: "#ffaa33",
    border: "none",
    padding: "6px 10px",
    borderRadius: "6px",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },

  deleteBtn: {
    background: "#ff3300",
    border: "none",
    padding: "6px 10px",
    borderRadius: "6px",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },

  // =========================
  // OTHER
  // =========================

  loadingText: {
    textAlign: "center",
    marginTop: "50px",
  },

  emptyText: {
    textAlign: "center",
    padding: "20px",
    color: "#999",
  },
};

export default GroceryList;