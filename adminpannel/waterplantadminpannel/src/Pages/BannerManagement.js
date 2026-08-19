import React, { useEffect, useState } from "react";

const API_URL =
  "https://waterplantdatabse-v763.onrender.com";

const BannerManagement = () => {
  const [banners, setBanners] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const [editingBanner, setEditingBanner] =
    useState(null);

  const [imagePreview, setImagePreview] =
    useState(null);

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    banner_type: "text",
    button_text: "",
    button_screen: "",
    display_order: 0,
    enabled: true,
    image: null,
  });

  // =====================================================
  // FETCH BANNERS
  // =====================================================

  const fetchBanners = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/banners/admin`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load banners"
        );
      }

      setBanners(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "FETCH BANNERS ERROR:",
        error
      );

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
    const { name, value, type, checked } =
      e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  // =====================================================
  // IMAGE CHANGE
  // =====================================================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    setForm((prev) => ({
      ...prev,
      image: file,
    }));

    setImagePreview(
      URL.createObjectURL(file)
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
      image: null,
    });

    setImagePreview(null);
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
      banner_type:
        banner.banner_type || "text",
      button_text:
        banner.button_text || "",
      button_screen:
        banner.button_screen || "",
      display_order:
        banner.display_order ?? 0,
      enabled:
        banner.enabled ?? true,
      image: null,
    });

    setImagePreview(
      banner.image_url || null
    );

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

    try {
      setSaving(true);

      if (
        !form.title.trim() &&
        !form.subtitle.trim()
      ) {
        alert(
          "Please enter a title or subtitle"
        );
        return;
      }

      if (
        form.banner_type === "image" &&
        !editingBanner &&
        !form.image
      ) {
        alert("Please select an image");
        return;
      }

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

      if (form.image) {
        formData.append(
          "image",
          form.image
        );
      }

      const url = editingBanner
        ? `${API_URL}/banner/${editingBanner.id}`
        : `${API_URL}/banner/add`;

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
  // RENDER
  // =====================================================

  return (
    <>
      {/* =================================================
          SAME-FILE CSS
      ================================================= */}

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

        .banner-page-header h1 {
          margin: 0 0 7px;
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
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
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
          box-shadow: 0 2px 10px rgba(0,0,0,0.03);
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
          min-width: 850px;
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
           THUMBNAIL
        ================================= */

        .banner-thumbnail {
          width: 100px;
          height: 58px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          display: block;
        }

        .text-banner-thumbnail {
          width: 100px;
          height: 58px;
          border-radius: 8px;
          background: linear-gradient(
            135deg,
            #fff7ed,
            #ffedd5
          );
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
          max-width: 650px;
          max-height: 92vh;
          overflow-y: auto;
          background: white;
          border-radius: 16px;
          box-shadow: 0 25px 70px rgba(0,0,0,0.25);
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
           IMAGE UPLOAD
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
           IMAGE PREVIEW
        ================================= */

        .image-preview-container {
          position: relative;
          margin-top: 12px;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .image-preview-container img {
          display: block;
          width: 100%;
          max-height: 220px;
          object-fit: cover;
        }

        .preview-label {
          position: absolute;
          left: 10px;
          top: 10px;
          background: rgba(0,0,0,0.65);
          color: white;
          padding: 5px 9px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 700;
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
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
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
          border: 2px solid rgba(255,255,255,0.4);
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

        }

      `}</style>

      {/* =================================================
          PAGE
      ================================================= */}

      <div className="banner-page">

        {/* HEADER */}

        <div className="banner-page-header">

          <div>
            <h1>
              Banner Management
            </h1>

            <p>
              Manage promotional banners
              displayed in the customer app.
            </p>
          </div>

          <button
            className="add-banner-btn"
            onClick={handleAdd}
          >
            <span>+</span>
            Add Banner
          </button>

        </div>

        {/* STATS */}

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
                    (item) =>
                      item.enabled
                  ).length
                }
              </strong>
            </div>

          </div>

          <div className="banner-stat-card">

            <div className="stat-icon disabled">
              ×
            </div>

            <div>
              <span>
                Disabled
              </span>

              <strong>
                {
                  banners.filter(
                    (item) =>
                      !item.enabled
                  ).length
                }
              </strong>
            </div>

          </div>

        </div>

        {/* TABLE */}

        <div className="banner-card">

          <div className="banner-card-header">

            <div>
              <h2>
                All Banners
              </h2>

              <p>
                Control what customers see
                in the app.
              </p>
            </div>

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
                🖼️
              </div>

              <h3>
                No banners yet
              </h3>

              <p>
                Add your first promotional
                banner.
              </p>

              <button
                onClick={handleAdd}
                className="empty-add-btn"
              >
                + Add Banner
              </button>

            </div>

          ) : (

            <div className="banner-table-wrapper">

              <table className="banner-table">

                <thead>

                  <tr>

                    <th>
                      Preview
                    </th>

                    <th>
                      Banner
                    </th>

                    <th>
                      Type
                    </th>

                    <th>
                      Order
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {banners.map(
                    (banner) => (

                      <tr
                        key={banner.id}
                      >

                        <td>

                          {banner.image_url ? (

                            <img
                              src={
                                banner.image_url
                              }
                              alt={
                                banner.title ||
                                "Banner"
                              }
                              className="banner-thumbnail"
                            />

                          ) : (

                            <div className="text-banner-thumbnail">

                              <span>
                                T
                              </span>

                            </div>

                          )}

                        </td>

                        <td>

                          <div className="banner-info">

                            <strong>
                              {banner.title ||
                                "Untitled Banner"}
                            </strong>

                            {banner.subtitle && (

                              <span>
                                {
                                  banner.subtitle
                                }
                              </span>

                            )}

                          </div>

                        </td>

                        <td>

                          <span
                            className={`type-badge ${
                              banner.banner_type ===
                              "image"
                                ? "image-type"
                                : "text-type"
                            }`}
                          >

                            {banner.banner_type ===
                            "image"
                              ? "Image"
                              : "Text"}

                          </span>

                        </td>

                        <td>

                          <span className="order-number">
                            {
                              banner.display_order
                            }
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
                              toggleStatus(
                                banner
                              )
                            }
                          >

                            <span
                              className="status-dot"
                            ></span>

                            {banner.enabled
                              ? "Enabled"
                              : "Disabled"}

                          </button>

                        </td>

                        <td>

                          <div className="banner-actions">

                            <button
                              className="action-edit"
                              onClick={() =>
                                handleEdit(
                                  banner
                                )
                              }
                            >
                              ✏️
                              <span>
                                Edit
                              </span>
                            </button>

                            <button
                              className="action-delete"
                              onClick={() =>
                                handleDelete(
                                  banner
                                )
                              }
                            >
                              🗑️
                              <span>
                                Delete
                              </span>
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

        {/* =================================================
            MODAL
        ================================================= */}

        {showModal && (

          <div className="banner-modal-overlay">

            <div className="banner-modal">

              <div className="banner-modal-header">

                <div>

                  <h2>
                    {editingBanner
                      ? "Edit Banner"
                      : "Add New Banner"}
                  </h2>

                  <p>
                    Create a banner for
                    your customers.
                  </p>

                </div>

                <button
                  className="modal-close"
                  onClick={
                    closeModal
                  }
                  disabled={saving}
                >
                  ×
                </button>

              </div>

              <form
                onSubmit={
                  handleSubmit
                }
              >

                {/* BANNER TYPE */}

                <div className="form-group">

                  <label>
                    Banner Type
                  </label>

                  <div className="banner-type-options">

                    <label
                      className={`type-option ${
                        form.banner_type ===
                        "text"
                          ? "selected"
                          : ""
                      }`}
                    >

                      <input
                        type="radio"
                        name="banner_type"
                        value="text"
                        checked={
                          form.banner_type ===
                          "text"
                        }
                        onChange={
                          handleChange
                        }
                      />

                      <div>

                        <strong>
                          📝 Text Banner
                        </strong>

                        <small>
                          Display text
                          promotion
                        </small>

                      </div>

                    </label>

                    <label
                      className={`type-option ${
                        form.banner_type ===
                        "image"
                          ? "selected"
                          : ""
                      }`}
                    >

                      <input
                        type="radio"
                        name="banner_type"
                        value="image"
                        checked={
                          form.banner_type ===
                          "image"
                        }
                        onChange={
                          handleChange
                        }
                      />

                      <div>

                        <strong>
                          🖼️ Image Banner
                        </strong>

                        <small>
                          Upload promotional
                          image
                        </small>

                      </div>

                    </label>

                  </div>

                </div>

                {/* TITLE */}

                <div className="form-group">

                  <label>
                    Title
                  </label>

                  <input
                    type="text"
                    name="title"
                    value={
                      form.title
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Example: Summer Offer"
                  />

                </div>

                {/* SUBTITLE */}

                <div className="form-group">

                  <label>
                    Subtitle
                  </label>

                  <textarea
                    name="subtitle"
                    value={
                      form.subtitle
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Example: Get 20% off on your next order"
                    rows="3"
                  />

                </div>

                {/* IMAGE */}

                {form.banner_type ===
                  "image" && (

                  <div className="form-group">

                    <label>
                      Banner Image
                    </label>

                    <div className="image-upload-box">

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/webp"
                        onChange={
                          handleImageChange
                        }
                        id="banner-image"
                      />

                      <label
                        htmlFor="banner-image"
                        className="image-upload-label"
                      >

                        <div className="upload-icon">
                          ⬆
                        </div>

                        <strong>
                          Click to upload
                        </strong>

                        <span>
                          JPG, PNG, JPEG or
                          WEBP · Max 5MB
                        </span>

                      </label>

                    </div>

                    {imagePreview && (

                      <div className="image-preview-container">

                        <img
                          src={
                            imagePreview
                          }
                          alt="Banner preview"
                        />

                        <div className="preview-label">
                          Preview
                        </div>

                      </div>

                    )}

                  </div>

                )}

                {/* BUTTON + ACTION */}

                <div className="form-row">

                  <div className="form-group">

                    <label>
                      Button Text
                    </label>

                    <input
                      type="text"
                      name="button_text"
                      value={
                        form.button_text
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Shop Now"
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Button Action
                    </label>

                    <select
                      name="button_screen"
                      value={
                        form.button_screen
                      }
                      onChange={
                        handleChange
                      }
                    >

                      <option value="">
                        No Action
                      </option>

                      <option value="GroceryScreen">
                        Grocery
                      </option>

                      <option value="WaterScreen">
                        Water
                      </option>

                      <option value="OrderScreen">
                        Orders
                      </option>

                    </select>

                  </div>

                </div>

                {/* DISPLAY ORDER */}

                <div className="form-group">

                  <label>
                    Display Order
                  </label>

                  <input
                    type="number"
                    name="display_order"
                    value={
                      form.display_order
                    }
                    onChange={
                      handleChange
                    }
                    min="0"
                  />

                  <small className="field-help">
                    Lower numbers appear
                    first.
                  </small>

                </div>

                {/* ENABLE */}

                <div className="enable-box">

                  <div>

                    <strong>
                      Show in Customer App
                    </strong>

                    <span>
                      Enable this banner
                      for customers.
                    </span>

                  </div>

                  <label className="switch">

                    <input
                      type="checkbox"
                      name="enabled"
                      checked={
                        form.enabled
                      }
                      onChange={
                        handleChange
                      }
                    />

                    <span className="slider"></span>

                  </label>

                </div>

                {/* FOOTER */}

                <div className="banner-modal-footer">

                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={
                      closeModal
                    }
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="save-banner-btn"
                    disabled={saving}
                  >

                    {saving ? (

                      <>
                        <span className="button-spinner"></span>
                        Saving...
                      </>

                    ) : (

                      editingBanner
                        ? "Update Banner"
                        : "Save Banner"

                    )}

                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

      </div>
    </>
  );
};

export default BannerManagement;