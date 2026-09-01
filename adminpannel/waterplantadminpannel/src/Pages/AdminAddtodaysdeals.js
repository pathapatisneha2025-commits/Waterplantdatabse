import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
const API_BASE =
  "https://api2.ajpartyhouse.in";

const EMPTY_FORM = {
  title: "",
  subtitle: "",
  discount_text: "",
  price: "",
  old_price: "",
  button_text: "Order Now",
  button_screen: "WaterScreen",
  product_id: "",
  category: "",
  is_active: true,
  start_date: "",
  end_date: "",
};

export default function TodaysDealsAdmin() {
    const navigate = useNavigate();
  const [deals, setDeals] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);

  const [editingDeal, setEditingDeal] =
    useState(null);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [selectedImage, setSelectedImage] =
    useState(null);

  const [imagePreview, setImagePreview] =
    useState("");

  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  // =====================================================
  // FETCH DEALS
  // =====================================================

  const fetchDeals = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/todaydeals/admin/todays-deals`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch deals"
        );
      }

      const data = await response.json();

      setDeals(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(err);

      setError(
        "Failed to load today's deals"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  // =====================================================
  // FORM HANDLER
  // =====================================================

  const handleChange = (
    field,
    value
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // =====================================================
  // RESET IMAGE
  // =====================================================

  const resetImage = () => {
    setSelectedImage(null);

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImagePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // =====================================================
  // IMAGE SELECT
  // =====================================================

  const handleImageChange = (event) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    // -------------------------------------------------
    // TYPE
    // -------------------------------------------------

    if (!file.type.startsWith("image/")) {
      alert(
        "Please select an image file."
      );

      event.target.value = "";
      return;
    }

    // -------------------------------------------------
    // SIZE - 5 MB
    // -------------------------------------------------

    if (file.size > 5 * 1024 * 1024) {
      alert(
        "Image size must be less than 5 MB."
      );

      event.target.value = "";
      return;
    }

    // -------------------------------------------------
    // CLEAN OLD PREVIEW
    // -------------------------------------------------

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(file);

    setImagePreview(
      URL.createObjectURL(file)
    );
  };

  // =====================================================
  // OPEN FILE PICKER
  // =====================================================

  const chooseImage = () => {
    fileInputRef.current?.click();
  };

  // =====================================================
  // OPEN ADD
  // =====================================================

  const openAddModal = () => {
    const today =
      new Date()
        .toISOString()
        .split("T")[0];

    setEditingDeal(null);

    setForm({
      ...EMPTY_FORM,
      start_date: today,
      end_date: today,
    });

    resetImage();

    setModalOpen(true);
  };

  // =====================================================
  // OPEN EDIT
  // =====================================================

  const openEditModal = (deal) => {
    setEditingDeal(deal);

    setForm({
      title: deal.title || "",

      subtitle:
        deal.subtitle || "",

      discount_text:
        deal.discount_text || "",

      price:
        deal.price !== null &&
        deal.price !== undefined
          ? String(deal.price)
          : "",

      old_price:
        deal.old_price !== null &&
        deal.old_price !== undefined
          ? String(deal.old_price)
          : "",

      button_text:
        deal.button_text ||
        "Order Now",

      button_screen:
        deal.button_screen ||
        "WaterScreen",

      product_id:
        deal.product_id !== null &&
        deal.product_id !== undefined
          ? String(deal.product_id)
          : "",

      category:
        deal.category || "",

      is_active:
        deal.is_active === true,

      start_date:
        formatDateForInput(
          deal.start_date
        ),

      end_date:
        formatDateForInput(
          deal.end_date
        ),
    });

    resetImage();

    // Existing Cloudinary image
    if (deal.image_url) {
      setImagePreview(
        deal.image_url
      );
    }

    setModalOpen(true);
  };

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);

    setEditingDeal(null);

    setForm(EMPTY_FORM);

    resetImage();
  };

  // =====================================================
  // DATE FORMAT INPUT
  // =====================================================

  const formatDateForInput = (
    value
  ) => {
    if (!value) return "";

    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(value).substring(
        0,
        10
      );
    }

    return date
      .toISOString()
      .split("T")[0];
  };

  // =====================================================
  // VALIDATION
  // =====================================================

  const validateForm = () => {
    if (!form.title.trim()) {
      alert(
        "Please enter deal title"
      );

      return false;
    }

    if (!form.start_date) {
      alert(
        "Please select start date"
      );

      return false;
    }

    if (!form.end_date) {
      alert(
        "Please select end date"
      );

      return false;
    }

    if (
      form.start_date >
      form.end_date
    ) {
      alert(
        "End date cannot be before start date"
      );

      return false;
    }

    if (
      form.price !== "" &&
      Number.isNaN(
        Number(form.price)
      )
    ) {
      alert(
        "Please enter a valid price"
      );

      return false;
    }

    if (
      form.old_price !== "" &&
      Number.isNaN(
        Number(form.old_price)
      )
    ) {
      alert(
        "Please enter a valid old price"
      );

      return false;
    }

    if (
      form.product_id !== "" &&
      Number.isNaN(
        Number(form.product_id)
      )
    ) {
      alert(
        "Product ID must be a number"
      );

      return false;
    }

    return true;
  };

  // =====================================================
  // SAVE DEAL
  // =====================================================

  const saveDeal = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      // =================================================
      // FORMDATA
      // =================================================

      const formData =
        new FormData();

      formData.append(
        "title",
        form.title.trim()
      );

      formData.append(
        "subtitle",
        form.subtitle.trim()
      );

      formData.append(
        "discount_text",
        form.discount_text.trim()
      );

      formData.append(
        "price",
        form.price === ""
          ? ""
          : String(form.price)
      );

      formData.append(
        "old_price",
        form.old_price === ""
          ? ""
          : String(form.old_price)
      );

      formData.append(
        "button_text",
        form.button_text.trim() ||
          "Order Now"
      );

      formData.append(
        "button_screen",
        form.button_screen.trim()
      );

      formData.append(
        "product_id",
        form.product_id === ""
          ? ""
          : String(form.product_id)
      );

      formData.append(
        "category",
        form.category.trim()
      );

      formData.append(
        "is_active",
        String(form.is_active)
      );

      formData.append(
        "start_date",
        form.start_date
      );

      formData.append(
        "end_date",
        form.end_date
      );

      // =================================================
      // IMAGE
      // =================================================

      if (selectedImage) {
        formData.append(
          "image",
          selectedImage
        );
      }

      // =================================================
      // URL
      // =================================================

      const url = editingDeal
        ? `${API_BASE}/todaydeals/admin/todays-deals/${editingDeal.id}`
        : `${API_BASE}/todaydeals/admin/todays-deals`;

      const method =
        editingDeal
          ? "PUT"
          : "POST";

      // =================================================
      // REQUEST
      // =================================================

      const response =
        await fetch(url, {
          method,
          body: formData,
        });

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to save deal"
        );
      }

      alert(
        editingDeal
          ? "Deal updated successfully"
          : "Deal created successfully"
      );

      closeModal();

      await fetchDeals();
    } catch (err) {
      console.error(
        "SAVE DEAL ERROR:",
        err
      );

      alert(
        err.message ||
          "Failed to save today's deal"
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const deleteDeal = async (id) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this deal?\n\nThe Cloudinary image will also be deleted."
      );

    if (!confirmed) return;

    try {
      const response =
        await fetch(
          `${API_BASE}/admin/todays-deals/${id}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete deal"
        );
      }

      alert(
        "Deal deleted successfully"
      );

      await fetchDeals();
    } catch (err) {
      console.error(err);

      alert(
        err.message ||
          "Failed to delete deal"
      );
    }
  };

  // =====================================================
  // TOGGLE
  // =====================================================

  const toggleDeal = async (id) => {
    try {
      const response =
        await fetch(
          `${API_BASE}/admin/todays-deals/${id}/toggle`,
          {
            method: "PATCH",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update status"
        );
      }

      await fetchDeals();
    } catch (err) {
      console.error(err);

      alert(
        err.message ||
          "Failed to update deal status"
      );
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loading}>
          Loading today's deals...
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div style={styles.page}>
      {/* HEADER */}
{/* HEADER */}

<div style={styles.header}>

  {/* LEFT SIDE */}

  <div style={styles.headerLeft}>

    {/* BACK BUTTON */}

    <button
      type="button"
      style={styles.backButton}
      onClick={() => navigate(-1)}
      title="Go Back"
    >
      ←
    </button>

    <div>
      <h1 style={styles.heading}>
        Today's Deals
      </h1>

      <p style={styles.description}>
        Manage promotional offers
        displayed to customers.
      </p>
    </div>

  </div>

  {/* ADD DEAL */}

  <button
    style={styles.addButton}
    onClick={openAddModal}
  >
    + Add Deal
  </button>

</div>
      {/* ERROR */}

      {error && (
        <div style={styles.errorBox}>
          {error}
        </div>
      )}

      {/* SUMMARY */}

      <div style={styles.summary}>
        <div style={styles.summaryCard}>
          <span
            style={styles.summaryLabel}
          >
            Total Deals
          </span>

          <strong
            style={styles.summaryValue}
          >
            {deals.length}
          </strong>
        </div>

        <div style={styles.summaryCard}>
          <span
            style={styles.summaryLabel}
          >
            Active
          </span>

          <strong
            style={{
              ...styles.summaryValue,
              color: "#16a34a",
            }}
          >
            {
              deals.filter(
                (deal) =>
                  deal.is_active
              ).length
            }
          </strong>
        </div>

        <div style={styles.summaryCard}>
          <span
            style={styles.summaryLabel}
          >
            Inactive
          </span>

          <strong
            style={{
              ...styles.summaryValue,
              color: "#dc2626",
            }}
          >
            {
              deals.filter(
                (deal) =>
                  !deal.is_active
              ).length
            }
          </strong>
        </div>
      </div>

      {/* DEALS */}

      {deals.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>
            🏷️
          </div>

          <h3>No deals found</h3>

          <p>
            Create your first
            Today's Deal.
          </p>

          <button
            style={styles.addButton}
            onClick={openAddModal}
          >
            + Add Deal
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {deals.map((deal) => (
            <div
              key={deal.id}
              style={styles.card}
            >
              {/* IMAGE */}

              <div
                style={
                  styles.imageContainer
                }
              >
                {deal.image_url ? (
                  <img
                    src={deal.image_url}
                    alt={deal.title}
                    style={styles.image}
                  />
                ) : (
                  <div
                    style={styles.noImage}
                  >
                    No Image
                  </div>
                )}

                {deal.discount_text && (
                  <div
                    style={
                      styles.discountBadge
                    }
                  >
                    {deal.discount_text}
                  </div>
                )}

                <div
                  style={{
                    ...styles.statusBadge,
                    backgroundColor:
                      deal.is_active
                        ? "#dcfce7"
                        : "#fee2e2",
                    color:
                      deal.is_active
                        ? "#166534"
                        : "#991b1b",
                  }}
                >
                  {deal.is_active
                    ? "ACTIVE"
                    : "INACTIVE"}
                </div>
              </div>

              {/* CONTENT */}

              <div
                style={
                  styles.cardContent
                }
              >
                <h3
                  style={
                    styles.cardTitle
                  }
                >
                  {deal.title}
                </h3>

                {deal.subtitle && (
                  <p
                    style={
                      styles.cardSubtitle
                    }
                  >
                    {deal.subtitle}
                  </p>
                )}

                {/* PRICE */}

                <div
                  style={
                    styles.priceRow
                  }
                >
                  {deal.price !==
                    null &&
                    deal.price !==
                      undefined && (
                      <strong
                        style={
                          styles.price
                        }
                      >
                        ₹{deal.price}
                      </strong>
                    )}

                  {deal.old_price !==
                    null &&
                    deal.old_price !==
                      undefined && (
                      <span
                        style={
                          styles.oldPrice
                        }
                      >
                        ₹
                        {
                          deal.old_price
                        }
                      </span>
                    )}
                </div>

                {/* DETAILS */}

                <div
                  style={styles.details}
                >
                  <div>
                    <span
                      style={
                        styles.detailLabel
                      }
                    >
                      Category
                    </span>

                    <span
                      style={
                        styles.detailValue
                      }
                    >
                      {deal.category ||
                        "-"}
                    </span>
                  </div>

                  <div>
                    <span
                      style={
                        styles.detailLabel
                      }
                    >
                      Product ID
                    </span>

                    <span
                      style={
                        styles.detailValue
                      }
                    >
                      {deal.product_id ||
                        "-"}
                    </span>
                  </div>

                  <div>
                    <span
                      style={
                        styles.detailLabel
                      }
                    >
                      Valid From
                    </span>

                    <span
                      style={
                        styles.detailValue
                      }
                    >
                      {formatDateForDisplay(
                        deal.start_date
                      )}
                    </span>
                  </div>

                  <div>
                    <span
                      style={
                        styles.detailLabel
                      }
                    >
                      Valid Until
                    </span>

                    <span
                      style={
                        styles.detailValue
                      }
                    >
                      {formatDateForDisplay(
                        deal.end_date
                      )}
                    </span>
                  </div>
                </div>

                {/* ACTIONS */}

                <div
                  style={styles.actions}
                >
                  <button
                    style={
                      styles.editButton
                    }
                    onClick={() =>
                      openEditModal(
                        deal
                      )
                    }
                  >
                    ✏️ Edit
                  </button>

                  <button
                    style={
                      deal.is_active
                        ? styles.disableButton
                        : styles.enableButton
                    }
                    onClick={() =>
                      toggleDeal(
                        deal.id
                      )
                    }
                  >
                    {deal.is_active
                      ? "Disable"
                      : "Activate"}
                  </button>

                  <button
                    style={
                      styles.deleteButton
                    }
                    onClick={() =>
                      deleteDeal(
                        deal.id
                      )
                    }
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =================================================
          MODAL
      ================================================= */}

      {modalOpen && (
        <div
          style={
            styles.modalOverlay
          }
        >
          <div
            style={styles.modal}
          >
            {/* HEADER */}

            <div
              style={
                styles.modalHeader
              }
            >
              <div>
                <h2
                  style={
                    styles.modalTitle
                  }
                >
                  {editingDeal
                    ? "Edit Deal"
                    : "Add Today's Deal"}
                </h2>

                <p
                  style={
                    styles.modalSubtitle
                  }
                >
                  Configure the customer
                  promotion.
                </p>
              </div>

              <button
                style={
                  styles.closeButton
                }
                onClick={closeModal}
                disabled={saving}
              >
                ✕
              </button>
            </div>

            {/* FORM */}

            <div
              style={styles.form}
            >
              {/* TITLE */}

              <div
                style={
                  styles.formGroup
                }
              >
                <label
                  style={styles.label}
                >
                  Deal Title *
                </label>

                <input
                  style={styles.input}
                  value={form.title}
                  onChange={(e) =>
                    handleChange(
                      "title",
                      e.target.value
                    )
                  }
                  placeholder="20L Water Can"
                />
              </div>

              {/* SUBTITLE */}

              <div
                style={
                  styles.formGroup
                }
              >
                <label
                  style={styles.label}
                >
                  Subtitle
                </label>

                <input
                  style={styles.input}
                  value={form.subtitle}
                  onChange={(e) =>
                    handleChange(
                      "subtitle",
                      e.target.value
                    )
                  }
                  placeholder="Pure drinking water"
                />
              </div>

              {/* IMAGE UPLOAD */}

              <div
                style={
                  styles.formGroup
                }
              >
                <label
                  style={styles.label}
                >
                  Deal Image
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={
                    handleImageChange
                  }
                  style={
                    styles.hiddenFileInput
                  }
                />

                <div
                  style={
                    styles.imageUploadBox
                  }
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Deal Preview"
                      style={
                        styles.largePreview
                      }
                    />
                  ) : (
                    <div
                      style={
                        styles.uploadPlaceholder
                      }
                    >
                      <div
                        style={
                          styles.uploadIcon
                        }
                      >
                        🖼️
                      </div>

                      <div
                        style={
                          styles.uploadText
                        }
                      >
                        No image selected
                      </div>
                    </div>
                  )}
                </div>

                <div
                  style={
                    styles.imageButtons
                  }
                >
                  <button
                    type="button"
                    style={
                      styles.chooseImageButton
                    }
                    onClick={
                      chooseImage
                    }
                  >
                    📁{" "}
                    {selectedImage
                      ? "Change Image"
                      : "Choose Image"}
                  </button>

                  {selectedImage && (
                    <button
                      type="button"
                      style={
                        styles.removeImageButton
                      }
                      onClick={
                        resetImage
                      }
                    >
                      ✕ Remove
                    </button>
                  )}
                </div>

                <p
                  style={
                    styles.imageHelp
                  }
                >
                  JPG, PNG, WEBP • Maximum
                  5 MB
                </p>

                {editingDeal &&
                  !selectedImage &&
                  editingDeal.image_url && (
                    <p
                      style={
                        styles.existingImageText
                      }
                    >
                      Existing Cloudinary
                      image will be kept
                      unless you select a
                      new image.
                    </p>
                  )}
              </div>

              {/* DISCOUNT / CATEGORY */}

              <div
                style={styles.formRow}
              >
                <div
                  style={
                    styles.formGroup
                  }
                >
                  <label
                    style={styles.label}
                  >
                    Discount
                  </label>

                  <input
                    style={styles.input}
                    value={
                      form.discount_text
                    }
                    onChange={(e) =>
                      handleChange(
                        "discount_text",
                        e.target.value
                      )
                    }
                    placeholder="10% OFF"
                  />
                </div>

                <div
                  style={
                    styles.formGroup
                  }
                >
                  <label
                    style={styles.label}
                  >
                    Category
                  </label>

                  <input
                    style={styles.input}
                    value={
                      form.category
                    }
                    onChange={(e) =>
                      handleChange(
                        "category",
                        e.target.value
                      )
                    }
                    placeholder="Water / Grocery"
                  />
                </div>
              </div>

              {/* PRICE */}

              <div
                style={styles.formRow}
              >
                <div
                  style={
                    styles.formGroup
                  }
                >
                  <label
                    style={styles.label}
                  >
                    Current Price
                  </label>

                  <input
                    type="number"
                    style={styles.input}
                    value={form.price}
                    onChange={(e) =>
                      handleChange(
                        "price",
                        e.target.value
                      )
                    }
                    placeholder="45"
                  />
                </div>

                <div
                  style={
                    styles.formGroup
                  }
                >
                  <label
                    style={styles.label}
                  >
                    Old Price
                  </label>

                  <input
                    type="number"
                    style={styles.input}
                    value={
                      form.old_price
                    }
                    onChange={(e) =>
                      handleChange(
                        "old_price",
                        e.target.value
                      )
                    }
                    placeholder="50"
                  />
                </div>
              </div>

              {/* PRODUCT */}

              <div
                style={styles.formRow}
              >
                <div
                  style={
                    styles.formGroup
                  }
                >
                  <label
                    style={styles.label}
                  >
                    Product ID
                  </label>

                  <input
                    type="number"
                    style={styles.input}
                    value={
                      form.product_id
                    }
                    onChange={(e) =>
                      handleChange(
                        "product_id",
                        e.target.value
                      )
                    }
                    placeholder="Optional"
                  />
                </div>

                <div
                  style={
                    styles.formGroup
                  }
                >
                  <label
                    style={styles.label}
                  >
                    Button Text
                  </label>

                  <input
                    style={styles.input}
                    value={
                      form.button_text
                    }
                    onChange={(e) =>
                      handleChange(
                        "button_text",
                        e.target.value
                      )
                    }
                    placeholder="Order Now"
                  />
                </div>
              </div>

              {/* SCREEN */}

              <div
                style={
                  styles.formGroup
                }
              >
                <label
                  style={styles.label}
                >
                  Button Screen
                </label>

                <select
                  style={styles.input}
                  value={
                    form.button_screen
                  }
                  onChange={(e) =>
                    handleChange(
                      "button_screen",
                      e.target.value
                    )
                  }
                >
                  <option value="WaterScreen">
                    Water Screen
                  </option>

                  <option value="GroceryScreen">
                    Grocery Screen
                  </option>

                  <option value="ProductDetails">
                    Product Details
                  </option>

                  <option value="">
                    No Navigation
                  </option>
                </select>
              </div>

              {/* DATES */}

              <div
                style={styles.formRow}
              >
                <div
                  style={
                    styles.formGroup
                  }
                >
                  <label
                    style={styles.label}
                  >
                    Start Date *
                  </label>

                  <input
                    type="date"
                    style={styles.input}
                    value={
                      form.start_date
                    }
                    onChange={(e) =>
                      handleChange(
                        "start_date",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div
                  style={
                    styles.formGroup
                  }
                >
                  <label
                    style={styles.label}
                  >
                    End Date *
                  </label>

                  <input
                    type="date"
                    style={styles.input}
                    value={
                      form.end_date
                    }
                    onChange={(e) =>
                      handleChange(
                        "end_date",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>

              {/* ACTIVE */}

              <label
                style={styles.activeRow}
              >
                <input
                  type="checkbox"
                  checked={
                    form.is_active
                  }
                  onChange={(e) =>
                    handleChange(
                      "is_active",
                      e.target.checked
                    )
                  }
                />

                <span>
                  Show this deal to
                  customers
                </span>
              </label>
            </div>

            {/* FOOTER */}

            <div
              style={
                styles.modalFooter
              }
            >
              <button
                style={
                  styles.cancelButton
                }
                onClick={closeModal}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                style={
                  styles.saveButton
                }
                onClick={saveDeal}
                disabled={saving}
              >
                {saving
                  ? "Uploading & Saving..."
                  : editingDeal
                  ? "Update Deal"
                  : "Create Deal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ======================================================
// DATE DISPLAY
// ======================================================

function formatDateForDisplay(
  value
) {
  if (!value) return "-";

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value).substring(
      0,
      10
    );
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f7fa",
    padding: "28px",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
    gap: "20px",
    flexWrap: "wrap",
  },

  heading: {
    margin: 0,
    fontSize: "28px",
    fontWeight: 700,
    color: "#1f2937",
  },

  description: {
    margin: "7px 0 0",
    color: "#6b7280",
    fontSize: "14px",
  },

  addButton: {
    border: "none",
    backgroundColor: "#f28c28",
    color: "#fff",
    padding: "12px 20px",
    borderRadius: "8px",
    fontWeight: 700,
    fontSize: "14px",
    cursor: "pointer",
  },

  errorBox: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    padding: "12px 15px",
    borderRadius: "8px",
    marginBottom: "20px",
  },

  loading: {
    textAlign: "center",
    padding: "80px",
    color: "#6b7280",
  },

  summary: {
    display: "flex",
    gap: "15px",
    marginBottom: "25px",
    flexWrap: "wrap",
  },

  summaryCard: {
    backgroundColor: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "16px 22px",
    minWidth: "150px",
    boxShadow:
      "0 1px 3px rgba(0,0,0,0.04)",
  },

  summaryLabel: {
    display: "block",
    color: "#6b7280",
    fontSize: "12px",
    marginBottom: "5px",
  },

  summaryValue: {
    fontSize: "23px",
    color: "#111827",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fill, minmax(310px, 1fr))",
    gap: "20px",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    overflow: "hidden",
    border: "1px solid #e5e7eb",
    boxShadow:
      "0 2px 8px rgba(0,0,0,0.05)",
  },

  imageContainer: {
    height: "190px",
    backgroundColor: "#f3f4f6",
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  noImage: {
    color: "#9ca3af",
    fontSize: "13px",
  },

  discountBadge: {
    position: "absolute",
    top: "12px",
    left: "12px",
    backgroundColor: "#166534",
    color: "#fff",
    padding: "5px 9px",
    borderRadius: "5px",
    fontSize: "11px",
    fontWeight: 700,
  },

  statusBadge: {
    position: "absolute",
    top: "12px",
    right: "12px",
    padding: "5px 9px",
    borderRadius: "5px",
    fontSize: "10px",
    fontWeight: 700,
  },

  cardContent: {
    padding: "16px",
  },

  cardTitle: {
    margin: 0,
    fontSize: "17px",
    color: "#111827",
  },

  cardSubtitle: {
    color: "#6b7280",
    fontSize: "12px",
    margin: "5px 0",
  },

  priceRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    margin: "12px 0",
  },

  price: {
    color: "#f28c28",
    fontSize: "18px",
  },

  oldPrice: {
    color: "#9ca3af",
    fontSize: "13px",
    textDecoration:
      "line-through",
  },

  details: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr",
    gap: "10px",
    borderTop:
      "1px solid #f0f0f0",
    borderBottom:
      "1px solid #f0f0f0",
    padding: "12px 0",
  },

  detailLabel: {
    display: "block",
    color: "#9ca3af",
    fontSize: "10px",
    marginBottom: "3px",
  },

  detailValue: {
    display: "block",
    color: "#374151",
    fontSize: "12px",
    fontWeight: 600,
  },

  actions: {
    display: "flex",
    gap: "7px",
    marginTop: "14px",
    flexWrap: "wrap",
  },

  editButton: {
    flex: 1,
    border:
      "1px solid #2563eb",
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    padding: "8px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 600,
  },

  disableButton: {
    flex: 1,
    border:
      "1px solid #d97706",
    backgroundColor: "#fff7ed",
    color: "#c2410c",
    padding: "8px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 600,
  },

  enableButton: {
    flex: 1,
    border:
      "1px solid #16a34a",
    backgroundColor: "#f0fdf4",
    color: "#15803d",
    padding: "8px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 600,
  },

  deleteButton: {
    flex: 1,
    border:
      "1px solid #dc2626",
    backgroundColor: "#fef2f2",
    color: "#dc2626",
    padding: "8px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 600,
  },

  empty: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "60px 20px",
    textAlign: "center",
    border:
      "1px solid #e5e7eb",
  },

  emptyIcon: {
    fontSize: "40px",
    marginBottom: "10px",
  },

  // ====================================================
  // MODAL
  // ====================================================

  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor:
      "rgba(0,0,0,0.55)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    padding: "20px",
    boxSizing: "border-box",
  },

  modal: {
    width: "100%",
    maxWidth: "720px",
    maxHeight: "92vh",
    backgroundColor: "#fff",
    borderRadius: "14px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },

  modalHeader: {
    padding: "20px 22px",
    borderBottom:
      "1px solid #e5e7eb",
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
  },

  modalTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "21px",
  },

  modalSubtitle: {
    margin: "5px 0 0",
    color: "#6b7280",
    fontSize: "12px",
  },

  closeButton: {
    border: "none",
    backgroundColor: "#f3f4f6",
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: "15px",
  },

  form: {
    padding: "22px",
    overflowY: "auto",
  },

  formGroup: {
    flex: 1,
    marginBottom: "15px",
    minWidth: 0,
  },

  formRow: {
    display: "flex",
    gap: "15px",
  },

  label: {
    display: "block",
    fontSize: "12px",
    color: "#374151",
    fontWeight: 700,
    marginBottom: "6px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border:
      "1px solid #d1d5db",
    borderRadius: "7px",
    padding: "10px 11px",
    fontSize: "13px",
    outline: "none",
    backgroundColor: "#fff",
  },

  // ====================================================
  // IMAGE UPLOAD
  // ====================================================

  hiddenFileInput: {
    display: "none",
  },

  imageUploadBox: {
    width: "100%",
    height: "190px",
    border:
      "2px dashed #d1d5db",
    borderRadius: "10px",
    backgroundColor: "#f9fafb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  largePreview: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  uploadPlaceholder: {
    textAlign: "center",
    color: "#9ca3af",
  },

  uploadIcon: {
    fontSize: "40px",
    marginBottom: "8px",
  },

  uploadText: {
    fontSize: "13px",
    fontWeight: 600,
  },

  imageButtons: {
    display: "flex",
    gap: "8px",
    marginTop: "9px",
    flexWrap: "wrap",
  },

  chooseImageButton: {
    border:
      "1px solid #2563eb",
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    padding: "9px 14px",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "12px",
  },

  removeImageButton: {
    border:
      "1px solid #dc2626",
    backgroundColor: "#fef2f2",
    color: "#dc2626",
    padding: "9px 14px",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "12px",
  },

  imageHelp: {
    margin: "6px 0 0",
    color: "#9ca3af",
    fontSize: "11px",
  },

  existingImageText: {
    margin: "5px 0 0",
    color: "#16a34a",
    fontSize: "11px",
  },

  activeRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "#374151",
    marginTop: "5px",
  },

  modalFooter: {
    padding: "15px 22px",
    borderTop:
      "1px solid #e5e7eb",
    display: "flex",
    justifyContent:
      "flex-end",
    gap: "10px",
  },

  cancelButton: {
    border:
      "1px solid #d1d5db",
    backgroundColor: "#fff",
    color: "#374151",
    padding: "10px 18px",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: 600,
  },

  saveButton: {
    border: "none",
    backgroundColor: "#f28c28",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: 700,
  },
  headerLeft: {
  display: "flex",
  alignItems: "center",
  gap: "14px",
},

backButton: {
  width: "42px",
  height: "42px",
  borderRadius: "9px",
  border: "1px solid #e5e7eb",
  backgroundColor: "#ffffff",
  color: "#374151",
  fontSize: "24px",
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s ease",
},
};