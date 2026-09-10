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
  // =========================
  // MAIN WRAPPER
  // =========================

  wrapper: {
    width: "100%",
    minHeight: "100vh",
    padding: "15px",
    background: "#f9fafb",
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box",
  },

  // =========================
  // HEADER
  // =========================

  headerContainer: {
    width: "100%",
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
    width: "36px",
    height: "36px",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: "5px",
    color: "#333",
    fontSize: "18px",
    cursor: "pointer",
    flexShrink: 0,
  },

  title: {
    margin: 0,
    color: "#ff6600",
    fontSize: "28px",
    fontWeight: "bold",
  },

  addBtn: {
    padding: "10px 20px",
    background: "#ff6600",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "0.2s ease",
  },

  // =========================
  // TABLE CONTAINER
  // =========================

  tableCard: {
    width: "100%",
    background: "#fff",
    padding: "10px",
    borderRadius: "12px",
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
    boxSizing: "border-box",
  },

  table: {
    width: "100%",
    minWidth: "1500px",
    borderCollapse: "collapse",
    tableLayout: "auto",
  },

  th: {
    padding: "12px 10px",
    textAlign: "left",
    whiteSpace: "nowrap",
    background: "#fff",
    color: "#333",
    fontWeight: "700",
    fontSize: "14px",
    borderBottom: "1px solid #eee",
  },

  td: {
    padding: "12px 10px",
    textAlign: "left",
    whiteSpace: "nowrap",
    verticalAlign: "middle",
    color: "#333",
    fontSize: "14px",
    borderBottom: "1px solid #eee",
  },

  row: {
    borderBottom: "1px solid #eee",
    transition: "background 0.2s ease",
  },

  // =========================
  // IMAGE
  // NO IMAGE CONTAINER
  // NO BORDER
  // NO RADIUS
  // NO CROP
  // =========================

  image: {
    display: "block",

    /* Natural image sizing */
    width: "auto",
    height: "auto",

    /* Prevent image from breaking the table */
    maxWidth: "100px",
    maxHeight: "100px",

    /* Keep original aspect ratio */
    objectFit: "contain",

    /* Completely remove visual container styling */
    border: "none",
    borderRadius: 0,
    background: "transparent",
    boxShadow: "none",

    padding: 0,
    margin: 0,

    verticalAlign: "middle",
  },

  noImage: {
    display: "inline-block",
    color: "#999",
    fontSize: "12px",
    whiteSpace: "nowrap",
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
    whiteSpace: "nowrap",
  },

  premiumDiscountBadge: {
    display: "inline-block",
    padding: "5px 8px",
    borderRadius: "6px",
    background: "#fff0e6",
    color: "#ff6600",
    fontSize: "12px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  // =========================
  // ACTIONS
  // =========================

  actionCol: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    whiteSpace: "nowrap",
  },

  editBtn: {
    padding: "6px 10px",
    background: "#ffaa33",
    border: "none",
    borderRadius: "6px",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  deleteBtn: {
    padding: "6px 10px",
    background: "#ff3300",
    border: "none",
    borderRadius: "6px",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  // =========================
  // LOADING
  // =========================

  loadingText: {
    textAlign: "center",
    marginTop: "50px",
    color: "#666",
    fontSize: "15px",
  },

  // =========================
  // EMPTY
  // =========================

  emptyText: {
    textAlign: "center",
    padding: "30px 20px",
    color: "#999",
    fontSize: "14px",
  },
};

export default GroceryList;