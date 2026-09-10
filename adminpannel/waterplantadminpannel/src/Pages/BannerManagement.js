
import React, { useEffect, useState } from "react";

const API_URL = "https://api2.ajpartyhouse.in";

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const BannerManagement = ({ onBack }) => {
  const [banners, setBanners] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const [editingBanner, setEditingBanner] = useState(null);

  // New files selected from computer
  const [selectedImages, setSelectedImages] = useState([]);

  // Existing images while editing
  const [existingImages, setExistingImages] = useState([]);

  // =====================================================
  // FORM
  // =====================================================

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    banner_type: "text",
    button_text: "",
    button_screen: "",
    display_order: 0,
    enabled: true,
  });

  // =====================================================
  // FETCH BANNERS
  // =====================================================

  const fetchBanners = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/banner/admin`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load banners"
        );
      }

      setBanners(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("FETCH BANNERS ERROR:", error);

      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // =====================================================
  // GET EXISTING IMAGES
  // Supports:
  // image_urls: []
  // images: []
  // image_url: "single url"
  // =====================================================

  const getBannerImages = (banner) => {
    if (Array.isArray(banner.image_urls)) {
      return banner.image_urls.filter(Boolean);
    }

    if (Array.isArray(banner.images)) {
      return banner.images
        .map((item) => {
          if (typeof item === "string") return item;

          return (
            item?.image_url ||
            item?.url ||
            item?.secure_url ||
            item?.image ||
            null
          );
        })
        .filter(Boolean);
    }

    if (banner.image_url) {
      return [banner.image_url];
    }

    if (banner.image) {
      return [banner.image];
    }

    return [];
  };

  // =====================================================
  // IMAGE CHANGE
  // =====================================================

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);

    if (!files.length) return;

    const totalImages =
      existingImages.length + selectedImages.length;

    if (totalImages + files.length > MAX_IMAGES) {
      alert(
        `You can upload maximum ${MAX_IMAGES} images per banner.`
      );

      e.target.value = "";
      return;
    }

    const validFiles = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        alert(`${file.name} is not a valid image file.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        alert(
          `${file.name} is larger than 5MB. Please select a smaller image.`
        );
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length) {
      setSelectedImages((prev) => [
        ...prev,
        ...validFiles,
      ]);
    }

    // Allow selecting same file again
    e.target.value = "";
  };

  // =====================================================
  // REMOVE NEW IMAGE
  // =====================================================

  const removeSelectedImage = (index) => {
    setSelectedImages((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  // =====================================================
  // REMOVE EXISTING IMAGE
  // =====================================================

  const removeExistingImage = (index) => {
    setExistingImages((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  // =====================================================
  // RESET FORM
  // =====================================================

  const resetForm = () => {
    setForm({
      title: "",
      subtitle: "",
      banner_type: "text",
      button_text: "",
      button_screen: "",
      display_order: 0,
      enabled: true,
    });

    setSelectedImages([]);
    setExistingImages([]);
    setEditingBanner(null);
  };

  // =====================================================
  // OPEN ADD
  // =====================================================

  const handleAdd = () => {
    resetForm();
    setShowModal(true);
  };

  // =====================================================
  // OPEN EDIT
  // =====================================================

  const handleEdit = (banner) => {
    setEditingBanner(banner);

    setForm({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      banner_type: banner.banner_type || "text",
      button_text: banner.button_text || "",
      button_screen: banner.button_screen || "",
      display_order: banner.display_order ?? 0,
      enabled: banner.enabled ?? true,
    });

    const images = getBannerImages(banner);

    setExistingImages(images);
    setSelectedImages([]);

    setShowModal(true);
  };

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    resetForm();
  };

  // =====================================================
  // SAVE BANNER
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;

    try {
      setSaving(true);

      // -------------------------------------------------
      // VALIDATION
      // -------------------------------------------------

      if (
        !form.title.trim() &&
        !form.subtitle.trim()
      ) {
        alert(
          "Please enter a title or subtitle"
        );

        setSaving(false);
        return;
      }

      const totalImages =
        existingImages.length +
        selectedImages.length;

      if (
        form.banner_type === "image" &&
        totalImages === 0
      ) {
        alert("Please select at least one banner image.");

        setSaving(false);
        return;
      }

      if (totalImages > MAX_IMAGES) {
        alert(
          `Maximum ${MAX_IMAGES} images are allowed per banner.`
        );

        setSaving(false);
        return;
      }

      // -------------------------------------------------
      // FORM DATA
      // -------------------------------------------------

      const formData = new FormData();

      formData.append(
        "title",
        form.title
      );

      formData.append(
        "subtitle",
        form.subtitle
      );

      formData.append(
        "banner_type",
        form.banner_type
      );

      formData.append(
        "button_text",
        form.button_text
      );

      formData.append(
        "button_screen",
        form.button_screen
      );

      formData.append(
        "display_order",
        form.display_order
      );

      formData.append(
        "enabled",
        form.enabled
      );

      // -------------------------------------------------
      // NEW IMAGES
      // IMPORTANT:
      // Backend should use upload.array("images", 10)
      // -------------------------------------------------

      selectedImages.forEach((image) => {
        formData.append(
          "images",
          image
        );
      });

      // -------------------------------------------------
      // EXISTING IMAGES
      //
      // This allows backend to know which old images
      // should remain after editing.
      //
      // Backend can read:
      // req.body.existing_images
      // -------------------------------------------------

      if (editingBanner) {
        formData.append(
          "existing_images",
          JSON.stringify(existingImages)
        );
      }

      // -------------------------------------------------
      // URL
      // -------------------------------------------------

      const url = editingBanner
        ? `${API_URL}/banner/${editingBanner.id}`
        : `${API_URL}/banner/add`;

      // -------------------------------------------------
      // REQUEST
      // -------------------------------------------------

      const response = await fetch(
        url,
        {
          method: editingBanner
            ? "PUT"
            : "POST",
          body: formData,
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to save banner"
        );
      }

      alert(
        editingBanner
          ? "Banner updated successfully"
          : "Banner added successfully"
      );

      setShowModal(false);

      resetForm();

      await fetchBanners();
    } catch (error) {
      console.error(
        "SAVE BANNER ERROR:",
        error
      );

      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // ENABLE / DISABLE
  // =====================================================

  const toggleStatus = async (banner) => {
    try {
      const response = await fetch(
        `${API_URL}/banners/${banner.id}/status`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            enabled: !banner.enabled,
          }),
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

      await fetchBanners();
    } catch (error) {
      console.error(
        "STATUS ERROR:",
        error
      );

      alert(error.message);
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async (banner) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${
          banner.title || "this banner"
        }"?`
      );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_URL}/banners/${banner.id}`,
        {
          method: "DELETE",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete banner"
        );
      }

      alert(
        "Banner deleted successfully"
      );

      await fetchBanners();
    } catch (error) {
      console.error(
        "DELETE BANNER ERROR:",
        error
      );

      alert(error.message);
    }
  };

  // =====================================================
  // RENDER BANNER PREVIEWS
  // =====================================================

  const renderBannerImages = (banner) => {
    const images = getBannerImages(banner);

    if (
      banner.banner_type !== "image" ||
      images.length === 0
    ) {
      return (
        <div className="text-banner-thumbnail">
          <span>T</span>
        </div>
      );
    }

    return (
      <div className="banner-preview-list">
        {images.slice(0, 4).map((image, index) => (
          <img
            key={`${image}-${index}`}
            src={image}
            alt={
              banner.title
                ? `${banner.title} ${index + 1}`
                : `Banner ${index + 1}`
            }
            className="banner-thumbnail"
          />
        ))}

        {images.length > 4 && (
          <div className="more-images-badge">
            +{images.length - 4}
          </div>
        )}
      </div>
    );
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <>
      <style>{`

        * {
          box-sizing: border-box;
        }

        .banner-page {
          width: 100%;
          min-height: 100vh;
          padding: 28px;
          background: #f7f8fa;
          color: #1f2937;
        }

        /* ================================
           HEADER
        ================================= */

        .banner-page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 26px;
        }

        .header-title-container {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .back-arrow-btn {
          width: 42px;
          height: 42px;
          border: 1px solid #e5e7eb;
          background: white;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: #374151;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .back-arrow-btn:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
          transform: translateY(-1px);
        }

        .banner-page-header h1 {
          margin: 0 0 4px;
          font-size: 28px;
          font-weight: 750;
          color: #111827;
        }

        .banner-page-header p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .add-banner-btn {
          border: none;
          outline: none;
          cursor: pointer;
          background: #f97316;
          color: white;
          padding: 12px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 5px 15px rgba(249, 115, 22, 0.22);
          transition: all 0.2s ease;
        }

        .add-banner-btn:hover {
          background: #ea580c;
          transform: translateY(-1px);
          box-shadow: 0 7px 18px rgba(249, 115, 22, 0.28);
        }

        .add-banner-btn span {
          font-size: 20px;
          line-height: 1;
        }

        /* ================================
           STATS
        ================================= */

        .banner-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
          margin-bottom: 24px;
        }

        .banner-stat-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: #fff7ed;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }

        .stat-icon.active {
          background: #ecfdf5;
          color: #059669;
        }

        .stat-icon.disabled {
          background: #fef2f2;
          color: #dc2626;
        }

        .banner-stat-card span {
          display: block;
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .banner-stat-card strong {
          display: block;
          font-size: 24px;
          color: #111827;
        }

        /* ================================
           CARD
        ================================= */

        .banner-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
        }

        .banner-card-header {
          padding: 21px 24px;
          border-bottom: 1px solid #edf0f3;
        }

        .banner-card-header h2 {
          margin: 0 0 5px;
          font-size: 18px;
          color: #111827;
        }

        .banner-card-header p {
          margin: 0;
          color: #6b7280;
          font-size: 13px;
        }

        /* ================================
           LOADING
        ================================= */

        .banner-loading {
          min-height: 280px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #6b7280;
        }

        .spinner {
          width: 35px;
          height: 35px;
          border: 3px solid #fed7aa;
          border-top-color: #f97316;
          border-radius: 50%;
          animation: bannerSpin 0.8s linear infinite;
        }

        @keyframes bannerSpin {
          to {
            transform: rotate(360deg);
          }
        }

        /* ================================
           EMPTY
        ================================= */

        .banner-empty {
          min-height: 360px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding: 40px;
          text-align: center;
        }

        .empty-icon {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: #fff7ed;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          margin-bottom: 18px;
        }

        .banner-empty h3 {
          margin: 0 0 7px;
          font-size: 18px;
          color: #111827;
        }

        .banner-empty p {
          margin: 0 0 20px;
          color: #6b7280;
          font-size: 14px;
        }

        .empty-add-btn {
          border: none;
          cursor: pointer;
          background: #f97316;
          color: white;
          padding: 11px 18px;
          border-radius: 9px;
          font-weight: 700;
        }

        .empty-add-btn:hover {
          background: #ea580c;
        }

        /* ================================
           TABLE
        ================================= */

        .banner-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .banner-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 950px;
        }

        .banner-table th {
          background: #fafafa;
          color: #6b7280;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          text-align: left;
          padding: 14px 18px;
          border-bottom: 1px solid #e5e7eb;
          white-space: nowrap;
        }

        .banner-table td {
          padding: 16px 18px;
          border-bottom: 1px solid #f0f1f3;
          vertical-align: middle;
        }

        .banner-table tbody tr {
          transition: background 0.15s ease;
        }

        .banner-table tbody tr:hover {
          background: #fffaf5;
        }

        .banner-table tbody tr:last-child td {
          border-bottom: none;
        }

        /* ================================
           MULTIPLE BANNER PREVIEW
           NO IMAGE CONTAINER
           NO BORDER
           NO CROP
        ================================= */

        .banner-preview-list {
          display: flex;
          align-items: center;
          gap: 8px;
          max-width: 330px;
          overflow-x: auto;
          padding: 2px 0;
        }

        .banner-thumbnail {
          width: 110px;
          max-width: 110px;
          height: 65px;
          display: block;
          object-fit: contain;
          border: none;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
          flex-shrink: 0;
        }

        .more-images-badge {
          min-width: 38px;
          height: 38px;
          padding: 0 8px;
          border-radius: 20px;
          background: #f97316;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
          flex-shrink: 0;
        }

        /* ================================
           TEXT BANNER
        ================================= */

        .text-banner-thumbnail {
          width: 100px;
          height: 58px;
          border-radius: 8px;
          background: #fff7ed;
          border: 1px solid #fed7aa;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .text-banner-thumbnail span {
          width: 34px;
          height: 34px;
          background: #f97316;
          color: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
        }

        /* ================================
           BANNER INFO
        ================================= */

        .banner-info {
          display: flex;
          flex-direction: column;
          gap: 5px;
          max-width: 300px;
        }

        .banner-info strong {
          color: #111827;
          font-size: 14px;
        }

        .banner-info span {
          color: #6b7280;
          font-size: 12px;
          line-height: 1.4;
        }

        /* ================================
           TYPE
        ================================= */

        .type-badge {
          display: inline-flex;
          align-items: center;
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
        }

        .text-type {
          background: #eff6ff;
          color: #2563eb;
        }

        .image-type {
          background: #f5f3ff;
          color: #7c3aed;
        }

        /* ================================
           ORDER
        ================================= */

        .order-number {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #f3f4f6;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: #374151;
        }

        /* ================================
           STATUS
        ================================= */

        .status-toggle {
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 11px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          transition: 0.2s;
        }

        .status-enabled {
          background: #ecfdf5;
          color: #047857;
        }

        .status-disabled {
          background: #fef2f2;
          color: #b91c1c;
        }

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: currentColor;
        }

        .status-toggle:hover {
          opacity: 0.8;
        }

        /* ================================
           ACTIONS
        ================================= */

        .banner-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .action-edit,
        .action-delete {
          border: 1px solid #e5e7eb;
          background: white;
          border-radius: 8px;
          padding: 7px 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 600;
          transition: 0.2s;
        }

        .action-edit {
          color: #2563eb;
        }

        .action-delete {
          color: #dc2626;
        }

        .action-edit:hover {
          background: #eff6ff;
          border-color: #bfdbfe;
        }

        .action-delete:hover {
          background: #fef2f2;
          border-color: #fecaca;
        }

        /* ================================
           MODAL OVERLAY
        ================================= */

        .banner-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.62);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 9999;
          overflow-y: auto;
        }

        .banner-modal {
          width: 100%;
          max-width: 700px;
          max-height: 92vh;
          overflow-y: auto;
          background: white;
          border-radius: 16px;
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.25);
          animation: modalIn 0.2s ease;
        }

        @keyframes modalIn {
          from {
            opacity: 0;
            transform: translateY(15px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* ================================
           MODAL HEADER
        ================================= */

        .banner-modal-header {
          padding: 22px 24px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid #edf0f3;
          position: sticky;
          top: 0;
          background: white;
          z-index: 2;
        }

        .banner-modal-header h2 {
          margin: 0 0 5px;
          font-size: 20px;
          color: #111827;
        }

        .banner-modal-header p {
          margin: 0;
          color: #6b7280;
          font-size: 13px;
        }

        .modal-close {
          width: 34px;
          height: 34px;
          border: none;
          background: #f3f4f6;
          border-radius: 8px;
          cursor: pointer;
          font-size: 24px;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        /* ================================
           FORM
        ================================= */

        .banner-modal form {
          padding: 24px;
        }

        .form-group {
          margin-bottom: 19px;
        }

        .form-group > label {
          display: block;
          margin-bottom: 7px;
          color: #374151;
          font-size: 13px;
          font-weight: 700;
        }

        .form-group input[type="text"],
        .form-group input[type="number"],
        .form-group select,
        .form-group textarea {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 9px;
          padding: 11px 12px;
          font-family: inherit;
          font-size: 14px;
          color: #111827;
          outline: none;
          background: white;
          transition: border 0.2s, box-shadow 0.2s;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 80px;
        }

        .form-group input[type="text"]:focus,
        .form-group input[type="number"]:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          border-color: #f97316;
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .field-help {
          display: block;
          margin-top: 6px;
          color: #9ca3af;
          font-size: 11px;
        }

        /* ================================
           TYPE OPTIONS
        ================================= */

        .banner-type-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .type-option {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 13px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
          transition: 0.2s;
        }

        .type-option:hover {
          border-color: #fdba74;
          background: #fffaf5;
        }

        .type-option.selected {
          border-color: #f97316;
          background: #fff7ed;
        }

        .type-option input {
          margin-top: 3px;
          accent-color: #f97316;
        }

        .type-option strong {
          display: block;
          font-size: 13px;
          color: #111827;
          margin-bottom: 4px;
        }

        .type-option small {
          display: block;
          color: #6b7280;
          font-size: 11px;
        }

        /* ================================
           MULTIPLE IMAGE UPLOAD
        ================================= */

        .image-upload-box {
          border: 2px dashed #d1d5db;
          border-radius: 12px;
          transition: 0.2s;
        }

        .image-upload-box:hover {
          border-color: #f97316;
          background: #fffaf5;
        }

        .image-upload-box input {
          display: none;
        }

        .image-upload-label {
          min-height: 140px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          text-align: center;
          padding: 20px;
        }

        .upload-icon {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #fff7ed;
          color: #f97316;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          margin-bottom: 10px;
        }

        .image-upload-label strong {
          font-size: 13px;
          color: #374151;
          margin-bottom: 5px;
        }

        .image-upload-label span {
          font-size: 11px;
          color: #9ca3af;
        }

        /* ================================
           SELECTED IMAGE PREVIEWS
           NO IMAGE CONTAINER
        ================================= */

        .selected-images-section {
          margin-top: 16px;
        }

        .selected-images-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
        }

        .selected-images-title strong {
          font-size: 13px;
          color: #374151;
        }

        .image-count {
          color: #6b7280;
          font-size: 11px;
        }

        .image-preview-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .image-preview-item {
          position: relative;
          min-width: 0;
        }

        .image-preview-item img {
          display: block;
          width: 100%;
          height: auto;
          max-width: 100%;
          object-fit: contain;
          border: none;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
        }

        .remove-image-btn {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 50%;
          background: rgba(220, 38, 38, 0.92);
          color: white;
          cursor: pointer;
          font-size: 17px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.18);
        }

        .remove-image-btn:hover {
          background: #b91c1c;
          transform: scale(1.05);
        }

        .image-number {
          position: absolute;
          left: 6px;
          top: 6px;
          min-width: 24px;
          height: 24px;
          padding: 0 6px;
          border-radius: 12px;
          background: rgba(17, 24, 39, 0.75);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
        }

        .existing-label {
          color: #059669;
        }

        .new-label {
          color: #2563eb;
        }

        /* ================================
           ENABLE BOX
        ================================= */

        .enable-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          padding: 15px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          background: #fafafa;
          margin-top: 4px;
        }

        .enable-box strong {
          display: block;
          font-size: 13px;
          color: #111827;
          margin-bottom: 4px;
        }

        .enable-box span:not(.slider) {
          display: block;
          color: #6b7280;
          font-size: 11px;
        }

        /* ================================
           SWITCH
        ================================= */

        .switch {
          position: relative;
          width: 46px;
          height: 25px;
          flex-shrink: 0;
          cursor: pointer;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          inset: 0;
          background: #d1d5db;
          border-radius: 30px;
          transition: 0.2s;
        }

        .slider:before {
          content: "";
          position: absolute;
          width: 19px;
          height: 19px;
          left: 3px;
          top: 3px;
          background: white;
          border-radius: 50%;
          transition: 0.2s;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        .switch input:checked + .slider {
          background: #f97316;
        }

        .switch input:checked + .slider:before {
          transform: translateX(21px);
        }

        /* ================================
           MODAL FOOTER
        ================================= */

        .banner-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 25px;
          padding-top: 20px;
          border-top: 1px solid #edf0f3;
        }

        .cancel-btn,
        .save-banner-btn {
          min-width: 115px;
          padding: 11px 17px;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s;
        }

        .cancel-btn {
          background: white;
          border: 1px solid #d1d5db;
          color: #374151;
        }

        .cancel-btn:hover {
          background: #f9fafb;
        }

        .save-banner-btn {
          border: none;
          background: #f97316;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .save-banner-btn:hover:not(:disabled) {
          background: #ea580c;
        }

        .cancel-btn:disabled,
        .save-banner-btn:disabled,
        .modal-close:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .button-spinner {
          width: 15px;
          height: 15px;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-top-color: white;
          border-radius: 50%;
          animation: bannerSpin 0.7s linear infinite;
        }

        /* ================================
           RESPONSIVE
        ================================= */

        @media (max-width: 900px) {

          .banner-page {
            padding: 20px;
          }

          .banner-stats {
            grid-template-columns: 1fr;
          }

          .banner-thumbnail {
            width: 100px;
            max-width: 100px;
            height: 60px;
          }

        }

        @media (max-width: 650px) {

          .banner-page {
            padding: 14px;
          }

          .banner-page-header {
            flex-direction: column;
            align-items: stretch;
          }

          .banner-page-header h1 {
            font-size: 23px;
          }

          .add-banner-btn {
            width: 100%;
            justify-content: center;
          }

          .banner-card-header {
            padding: 17px;
          }

          .banner-table td,
          .banner-table th {
            padding: 13px;
          }

          .banner-preview-list {
            max-width: 280px;
          }

          .banner-thumbnail {
            width: 90px;
            max-width: 90px;
            height: 55px;
          }

          .banner-modal-overlay {
            padding: 10px;
            align-items: flex-start;
          }

          .banner-modal {
            margin-top: 10px;
            max-height: 95vh;
          }

          .banner-modal-header {
            padding: 18px;
          }

          .banner-modal form {
            padding: 18px;
          }

          .form-row {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .banner-type-options {
            grid-template-columns: 1fr;
          }

          .image-preview-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }

          .banner-modal-footer {
            flex-direction: column-reverse;
          }

          .cancel-btn,
          .save-banner-btn {
            width: 100%;
          }

        }

        @media (max-width: 400px) {

          .banner-stat-card {
            padding: 15px;
          }

          .stat-icon {
            width: 42px;
            height: 42px;
          }

          .banner-modal-header h2 {
            font-size: 18px;
          }

          .banner-thumbnail {
            width: 80px;
            max-width: 80px;
            height: 50px;
          }

          .image-preview-grid {
            grid-template-columns: 1fr 1fr;
          }

        }

      `}</style>

      {/* =================================================
          PAGE
      ================================================= */}

      <div className="banner-page">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="banner-page-header">

          <div className="header-title-container">

            <button
              className="back-arrow-btn"
              onClick={() => {
                if (onBack) {
                  onBack();
                } else {
                  window.history.back();
                }
              }}
              title="Go Back"
              aria-label="Go Back"
            >
              ←
            </button>

            <div>

              <h1>
                Banner Management
              </h1>

              <p>
                Manage promotional banners
                displayed in the customer app.
              </p>

            </div>

          </div>

          <button
            className="add-banner-btn"
            onClick={handleAdd}
          >
            <span>+</span>
            Add Banner
          </button>

        </div>

        {/* =================================================
            STATS
        ================================================= */}

        <div className="banner-stats">

          <div className="banner-stat-card">

            <div className="stat-icon">
              🖼️
            </div>

            <div>

              <span>
                Total Banners
              </span>

              <strong>
                {banners.length}
              </strong>

            </div>

          </div>

          <div className="banner-stat-card">

            <div className="stat-icon active">
              ✓
            </div>

            <div>

              <span>
                Active
              </span>

              <strong>
                {
                  banners.filter(
                    (item) => item.enabled
                  ).length
                }
              </strong>

            </div>

          </div>

          <div className="banner-stat-card">

            <div className="stat-icon disabled">
              ✕
            </div>

            <div>

              <span>
                Disabled
              </span>

              <strong>
                {
                  banners.filter(
                    (item) => !item.enabled
                  ).length
                }
              </strong>

            </div>

          </div>

        </div>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="banner-card">

          <div className="banner-card-header">

            <h2>
              All Banners
            </h2>

            <p>
              View, edit or control banner visibility
            </p>

          </div>

          {loading ? (

            <div className="banner-loading">

              <div className="spinner"></div>

              <span>
                Loading banners...
              </span>

            </div>

          ) : banners.length === 0 ? (

            <div className="banner-empty">

              <div className="empty-icon">
                📢
              </div>

              <h3>
                No Banners Found
              </h3>

              <p>
                Get started by adding your first
                promotional banner.
              </p>

              <button
                className="empty-add-btn"
                onClick={handleAdd}
              >
                + Add Banner
              </button>

            </div>

          ) : (

            <div className="banner-table-wrapper">

              <table className="banner-table">

                <thead>

                  <tr>
                    <th>Preview</th>
                    <th>Banner Details</th>
                    <th>Type</th>
                    <th>Order</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>

                </thead>

                <tbody>

                  {banners.map((banner) => (

                    <tr key={banner.id}>

                      <td>
                        {renderBannerImages(banner)}
                      </td>

                      <td>

                        <div className="banner-info">

                          <strong>
                            {
                              banner.title ||
                              "Untitled Banner"
                            }
                          </strong>

                          <span>
                            {
                              banner.subtitle ||
                              "No subtitle provided"
                            }
                          </span>

                        </div>

                      </td>

                      <td>

                        <span
                          className={`type-badge ${
                            banner.banner_type === "image"
                              ? "image-type"
                              : "text-type"
                          }`}
                        >
                          {
                            banner.banner_type === "image"
                              ? "Image"
                              : "Text"
                          }
                        </span>

                      </td>

                      <td>

                        <span className="order-number">
                          {banner.display_order ?? 0}
                        </span>

                      </td>

                      <td>

                        <button
                          className={`status-toggle ${
                            banner.enabled
                              ? "status-enabled"
                              : "status-disabled"
                          }`}
                          onClick={() =>
                            toggleStatus(banner)
                          }
                        >

                          <span className="status-dot"></span>

                          {
                            banner.enabled
                              ? "Active"
                              : "Disabled"
                          }

                        </button>

                      </td>

                      <td>

                        <div className="banner-actions">

                          <button
                            className="action-edit"
                            onClick={() =>
                              handleEdit(banner)
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="action-delete"
                            onClick={() =>
                              handleDelete(banner)
                            }
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

      {/* =================================================
          MODAL
      ================================================= */}

      {showModal && (

        <div className="banner-modal-overlay">

          <div className="banner-modal">

            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div className="banner-modal-header">

              <div>

                <h2>
                  {
                    editingBanner
                      ? "Edit Banner"
                      : "Add New Banner"
                  }
                </h2>

                <p>
                  Configure banner appearance,
                  images and action target
                </p>

              </div>

              <button
                className="modal-close"
                onClick={closeModal}
                disabled={saving}
              >
                &times;
              </button>

            </div>

            {/* =================================================
                FORM
            ================================================= */}

            <form onSubmit={handleSubmit}>

              {/* =================================================
                  BANNER TYPE
              ================================================= */}

              <div className="form-group">

                <label>
                  Banner Type
                </label>

                <div className="banner-type-options">

                  {/* TEXT */}

                  <div
                    className={`type-option ${
                      form.banner_type === "text"
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        banner_type: "text",
                      }))
                    }
                  >

                    <input
                      type="radio"
                      name="banner_type"
                      value="text"
                      checked={
                        form.banner_type === "text"
                      }
                      onChange={handleChange}
                    />

                    <div>

                      <strong>
                        Text / Clean Banner
                      </strong>

                      <small>
                        Solid colored card with
                        custom title & subtitle
                      </small>

                    </div>

                  </div>

                  {/* IMAGE */}

                  <div
                    className={`type-option ${
                      form.banner_type === "image"
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        banner_type: "image",
                      }))
                    }
                  >

                    <input
                      type="radio"
                      name="banner_type"
                      value="image"
                      checked={
                        form.banner_type === "image"
                      }
                      onChange={handleChange}
                    />

                    <div>

                      <strong>
                        Multiple Image Banner
                      </strong>

                      <small>
                        Upload multiple promotional
                        banner images
                      </small>

                    </div>

                  </div>

                </div>

              </div>

              {/* =================================================
                  TITLE + SUBTITLE
              ================================================= */}

              <div className="form-row">

                <div className="form-group">

                  <label htmlFor="title">
                    Title
                  </label>

                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g., Special Discount!"
                  />

                </div>

                <div className="form-group">

                  <label htmlFor="subtitle">
                    Subtitle
                  </label>

                  <input
                    type="text"
                    id="subtitle"
                    name="subtitle"
                    value={form.subtitle}
                    onChange={handleChange}
                    placeholder="e.g., Get 20% off today"
                  />

                </div>

              </div>

              {/* =================================================
                  MULTIPLE IMAGE UPLOAD
              ================================================= */}

              {form.banner_type === "image" && (

                <div className="form-group">

                  <label>
                    Banner Images
                  </label>

                  <div className="image-upload-box">

                    <input
                      type="file"
                      id="banner-image-files"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                    />

                    <label
                      htmlFor="banner-image-files"
                      className="image-upload-label"
                    >

                      <div className="upload-icon">
                        📷
                      </div>

                      <strong>
                        Click to upload banner images
                      </strong>

                      <span>
                        Select multiple PNG, JPG or
                        WEBP images · Maximum 10 images
                        · 5MB each
                      </span>

                    </label>

                  </div>

                  {/* =================================================
                      EXISTING IMAGES
                  ================================================= */}

                  {existingImages.length > 0 && (

                    <div className="selected-images-section">

                      <div className="selected-images-title">

                        <strong className="existing-label">
                          Existing Images
                        </strong>

                        <span className="image-count">
                          {existingImages.length} image
                          {existingImages.length !== 1
                            ? "s"
                            : ""}
                        </span>

                      </div>

                      <div className="image-preview-grid">

                        {existingImages.map(
                          (image, index) => (

                            <div
                              className="image-preview-item"
                              key={`${image}-${index}`}
                            >

                              <img
                                src={image}
                                alt={`Existing banner ${
                                  index + 1
                                }`}
                              />

                              <span className="image-number">
                                {index + 1}
                              </span>

                              <button
                                type="button"
                                className="remove-image-btn"
                                onClick={() =>
                                  removeExistingImage(
                                    index
                                  )
                                }
                                disabled={saving}
                                title="Remove image"
                              >
                                ×
                              </button>

                            </div>

                          )
                        )}

                      </div>

                    </div>

                  )}

                  {/* =================================================
                      NEW SELECTED IMAGES
                  ================================================= */}

                  {selectedImages.length > 0 && (

                    <div className="selected-images-section">

                      <div className="selected-images-title">

                        <strong className="new-label">
                          New Images
                        </strong>

                        <span className="image-count">
                          {selectedImages.length} image
                          {selectedImages.length !== 1
                            ? "s"
                            : ""}
                        </span>

                      </div>

                      <div className="image-preview-grid">

                        {selectedImages.map(
                          (file, index) => (

                            <div
                              className="image-preview-item"
                              key={`${file.name}-${file.lastModified}-${index}`}
                            >

                              <img
                                src={URL.createObjectURL(
                                  file
                                )}
                                alt={`New banner ${
                                  index + 1
                                }`}
                              />

                              <span className="image-number">
                                {existingImages.length +
                                  index +
                                  1}
                              </span>

                              <button
                                type="button"
                                className="remove-image-btn"
                                onClick={() =>
                                  removeSelectedImage(
                                    index
                                  )
                                }
                                disabled={saving}
                                title="Remove image"
                              >
                                ×
                              </button>

                            </div>

                          )
                        )}

                      </div>

                    </div>

                  )}

                  {/* =================================================
                      IMAGE COUNT
                  ================================================= */}

                  {(existingImages.length > 0 ||
                    selectedImages.length > 0) && (

                    <small className="field-help">

                      Total images:{" "}
                      <strong>
                        {
                          existingImages.length +
                          selectedImages.length
                        }
                      </strong>
                      {" / "}
                      {MAX_IMAGES}

                    </small>

                  )}

                </div>

              )}

              {/* =================================================
                  BUTTON
              ================================================= */}

              <div className="form-row">

                <div className="form-group">

                  <label htmlFor="button_text">
                    Button Text (Optional)
                  </label>

                  <input
                    type="text"
                    id="button_text"
                    name="button_text"
                    value={form.button_text}
                    onChange={handleChange}
                    placeholder="e.g., Book Now"
                  />

                </div>

                <div className="form-group">

                  <label htmlFor="button_screen">
                    Target Screen/Route
                  </label>

                  <input
                    type="text"
                    id="button_screen"
                    name="button_screen"
                    value={form.button_screen}
                    onChange={handleChange}
                    placeholder="e.g., CartScreen"
                  />

                </div>

              </div>

              {/* =================================================
                  ORDER + ENABLE
              ================================================= */}

              <div className="form-row">

                <div className="form-group">

                  <label htmlFor="display_order">
                    Display Order
                  </label>

                  <input
                    type="number"
                    id="display_order"
                    name="display_order"
                    value={form.display_order}
                    onChange={handleChange}
                    min="0"
                  />

                  <small className="field-help">
                    Lower numbers appear first
                  </small>

                </div>

                <div
                  className="form-group"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                  }}
                >

                  <div className="enable-box">

                    <div>

                      <strong>
                        Enable Banner
                      </strong>

                      <span>
                        Show immediately in app
                      </span>

                    </div>

                    <label className="switch">

                      <input
                        type="checkbox"
                        name="enabled"
                        checked={form.enabled}
                        onChange={handleChange}
                      />

                      <span className="slider"></span>

                    </label>

                  </div>

                </div>

              </div>

              {/* =================================================
                  FOOTER
              ================================================= */}

              <div className="banner-modal-footer">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-banner-btn"
                  disabled={saving}
                >

                  {saving && (
                    <span className="button-spinner"></span>
                  )}

                  {
                    saving
                      ? "Saving..."
                      : editingBanner
                      ? "Update Banner"
                      : "Save Banner"
                  }

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </>
  );
};

export default BannerManagement;
