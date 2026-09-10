
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

  const [selectedImages, setSelectedImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

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
        throw new Error(data.message || "Failed to load banners");
      }

      setBanners(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("FETCH BANNERS ERROR:", error);
      alert(error.message || "Failed to load banners");
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
  // GET BANNER IMAGES
  // =====================================================

  const getBannerImages = (banner) => {
    if (Array.isArray(banner?.image_urls)) {
      return banner.image_urls.filter(Boolean);
    }

    if (Array.isArray(banner?.images)) {
      return banner.images
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }

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

    if (banner?.image_url) {
      if (Array.isArray(banner.image_url)) {
        return banner.image_url.filter(Boolean);
      }

      if (typeof banner.image_url === "string") {
        const value = banner.image_url.trim();

        if (value.startsWith("[") && value.endsWith("]")) {
          try {
            const parsed = JSON.parse(value);

            if (Array.isArray(parsed)) {
              return parsed.filter(Boolean);
            }
          } catch (error) {
            console.warn("Unable to parse image_url JSON:", error);
          }
        }

        if (value) {
          return [value];
        }
      }
    }

    if (banner?.image) {
      if (Array.isArray(banner.image)) {
        return banner.image.filter(Boolean);
      }

      if (typeof banner.image === "string") {
        const value = banner.image.trim();

        if (value.startsWith("[") && value.endsWith("]")) {
          try {
            const parsed = JSON.parse(value);

            if (Array.isArray(parsed)) {
              return parsed.filter(Boolean);
            }
          } catch (error) {
            console.warn("Unable to parse image JSON:", error);
          }
        }

        if (value) {
          return [value];
        }
      }
    }

    return [];
  };

  // =====================================================
  // IMAGE CHANGE
  // =====================================================

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);

    if (!files.length) {
      return;
    }

    const currentTotal =
      existingImages.length + selectedImages.length;

    const remainingSlots = MAX_IMAGES - currentTotal;

    if (remainingSlots <= 0) {
      alert(`You already have the maximum ${MAX_IMAGES} images.`);
      e.target.value = "";
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      alert(
        `Only ${remainingSlots} more image${
          remainingSlots !== 1 ? "s are" : " is"
        } allowed.`
      );
    }

    const validFiles = [];

    for (const file of filesToProcess) {
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

      const preview = URL.createObjectURL(file);

      validFiles.push({
        file,
        preview,
      });
    }

    if (validFiles.length > 0) {
      setSelectedImages((prev) => [
        ...prev,
        ...validFiles,
      ]);
    }

    e.target.value = "";
  };

  // =====================================================
  // REMOVE NEW IMAGE
  // =====================================================

  const removeSelectedImage = (index) => {
    setSelectedImages((prev) => {
      const imageToRemove = prev[index];

      if (imageToRemove?.preview) {
        URL.revokeObjectURL(imageToRemove.preview);
      }

      return prev.filter((_, i) => i !== index);
    });
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
  // RESET
  // =====================================================

  const resetForm = () => {
    selectedImages.forEach((item) => {
      if (item?.preview) {
        URL.revokeObjectURL(item.preview);
      }
    });

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
  // ADD
  // =====================================================

  const handleAdd = () => {
    resetForm();
    setShowModal(true);
  };

  // =====================================================
  // EDIT
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

    setExistingImages(getBannerImages(banner));
    setSelectedImages([]);

    setShowModal(true);
  };

  // =====================================================
  // CLOSE
  // =====================================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    resetForm();
  };

  // =====================================================
  // CHANGE TYPE
  // =====================================================

  const changeBannerType = (type) => {
    setForm((prev) => ({
      ...prev,
      banner_type: type,
    }));

    if (type === "text") {
      selectedImages.forEach((item) => {
        if (item?.preview) {
          URL.revokeObjectURL(item.preview);
        }
      });

      setSelectedImages([]);
      setExistingImages([]);
    }
  };

  // =====================================================
  // SAVE
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;

    try {
      setSaving(true);

      if (!form.title.trim() && !form.subtitle.trim()) {
        alert("Please enter a title or subtitle.");
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

      const formData = new FormData();

      formData.append("title", form.title.trim());
      formData.append("subtitle", form.subtitle.trim());
      formData.append("banner_type", form.banner_type);
      formData.append("button_text", form.button_text.trim());
      formData.append(
        "button_screen",
        form.button_screen.trim()
      );
      formData.append(
        "display_order",
        String(form.display_order)
      );
      formData.append(
        "enabled",
        String(form.enabled)
      );

      selectedImages.forEach((item) => {
        formData.append("images", item.file);
      });

      if (editingBanner) {
        formData.append(
          "existing_images",
          JSON.stringify(existingImages)
        );
      }

      const url = editingBanner
        ? `${API_URL}/banner/${editingBanner.id}`
        : `${API_URL}/banner/add`;

      const response = await fetch(url, {
        method: editingBanner ? "PUT" : "POST",
        body: formData,
      });

      let data = {};

      try {
        data = await response.json();
      } catch (error) {
        console.warn("Response is not JSON:", error);
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to save banner."
        );
      }

      alert(
        editingBanner
          ? "Banner updated successfully."
          : "Banner added successfully."
      );

      setShowModal(false);
      resetForm();

      await fetchBanners();
    } catch (error) {
      console.error("SAVE BANNER ERROR:", error);

      alert(
        error.message ||
          "Something went wrong while saving the banner."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // TOGGLE STATUS
  // =====================================================

  const toggleStatus = async (banner) => {
    try {
      const response = await fetch(
        `${API_URL}/banners/${banner.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            enabled: !banner.enabled,
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch (error) {
        console.warn("STATUS RESPONSE JSON ERROR:", error);
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update status."
        );
      }

      await fetchBanners();
    } catch (error) {
      console.error("STATUS ERROR:", error);

      alert(
        error.message ||
          "Failed to update banner status."
      );
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async (banner) => {
    const confirmed = window.confirm(
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

      let data = {};

      try {
        data = await response.json();
      } catch (error) {
        console.warn("DELETE RESPONSE JSON ERROR:", error);
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete banner."
        );
      }

      alert("Banner deleted successfully.");

      await fetchBanners();
    } catch (error) {
      console.error("DELETE BANNER ERROR:", error);

      alert(
        error.message ||
          "Failed to delete banner."
      );
    }
  };

  // =====================================================
  // TABLE PREVIEW
  // =====================================================

  const renderBannerImages = (banner) => {
    const images = getBannerImages(banner);

    if (
      banner.banner_type !== "image" ||
      images.length === 0
    ) {
      return (
        <div className="text-banner-thumbnail">
          <div className="text-thumbnail-icon">T</div>
        </div>
      );
    }

    return (
      <div className="banner-preview-list">
        {images.slice(0, 3).map((image, index) => (
          <div
            className="table-image-wrap"
            key={`${image}-${index}`}
          >
            <img
              src={image}
              alt={
                banner.title
                  ? `${banner.title} ${index + 1}`
                  : `Banner ${index + 1}`
              }
              className="banner-thumbnail"
            />
          </div>
        ))}

        {images.length > 3 && (
          <div className="more-images-badge">
            +{images.length - 3}
          </div>
        )}
      </div>
    );
  };

  const totalSelectedImages =
    existingImages.length +
    selectedImages.length;

  const remainingImages =
    MAX_IMAGES - totalSelectedImages;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <>
      <style>{`

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          background: #f5f7fa;
        }

        button,
        input,
        select {
          font-family: inherit;
        }

        /* ================================================
           PAGE
        ================================================ */

        .banner-page {
          width: 100%;
          min-height: 100vh;
          padding: 30px;
          background: #f5f7fa;
          color: #111827;
        }

        /* ================================================
           HEADER
        ================================================ */

        .banner-page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
        }

        .header-title-container {
          display: flex;
          align-items: center;
          gap: 15px;
          min-width: 0;
        }

        .back-arrow-btn {
          width: 44px;
          height: 44px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          color: #374151;
          transition: 0.2s;
          flex-shrink: 0;
        }

        .back-arrow-btn:hover {
          background: #f9fafb;
          border-color: #d1d5db;
          transform: translateX(-2px);
        }

        .banner-page-header h1 {
          margin: 0 0 5px;
          font-size: 29px;
          line-height: 1.2;
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
          cursor: pointer;
          background: #f97316;
          color: white;
          padding: 13px 21px;
          border-radius: 11px;
          font-size: 14px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 7px 18px rgba(249, 115, 22, 0.20);
          transition: 0.2s;
          white-space: nowrap;
        }

        .add-banner-btn:hover {
          background: #ea580c;
          transform: translateY(-1px);
        }

        .add-banner-btn span {
          font-size: 21px;
          line-height: 1;
        }

        /* ================================================
           STATS
        ================================================ */

        .banner-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
          margin-bottom: 25px;
        }

        .banner-stat-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 15px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          box-shadow: 0 3px 12px rgba(15, 23, 42, 0.035);
        }

        .stat-icon {
          width: 49px;
          height: 49px;
          border-radius: 13px;
          background: #fff7ed;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 21px;
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
          font-size: 25px;
          color: #111827;
        }

        /* ================================================
           CARD
        ================================================ */

        .banner-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 3px 12px rgba(15, 23, 42, 0.035);
        }

        .banner-card-header {
          padding: 22px 25px;
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

        /* ================================================
           LOADING
        ================================================ */

        .banner-loading {
          min-height: 300px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 13px;
          color: #6b7280;
        }

        .spinner {
          width: 36px;
          height: 36px;
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

        /* ================================================
           EMPTY
        ================================================ */

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
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: #fff7ed;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 31px;
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

        /* ================================================
           TABLE
        ================================================ */

        .banner-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .banner-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 980px;
        }

        .banner-table th {
          background: #fafafa;
          color: #6b7280;
          font-size: 11px;
          font-weight: 750;
          text-transform: uppercase;
          letter-spacing: 0.45px;
          text-align: left;
          padding: 14px 18px;
          border-bottom: 1px solid #e5e7eb;
          white-space: nowrap;
        }

        .banner-table td {
          padding: 17px 18px;
          border-bottom: 1px solid #f0f1f3;
          vertical-align: middle;
        }

        .banner-table tbody tr {
          transition: background 0.15s;
        }

        .banner-table tbody tr:hover {
          background: #fffaf5;
        }

        .banner-table tbody tr:last-child td {
          border-bottom: none;
        }

        /* ================================================
           TABLE IMAGE PREVIEW
        ================================================ */

        .banner-preview-list {
          display: flex;
          align-items: center;
          gap: 9px;
          max-width: 330px;
          overflow-x: auto;
          padding: 3px 0;
          scrollbar-width: thin;
        }

        .table-image-wrap {
          width: 92px;
          min-width: 92px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .banner-thumbnail {
          display: block;
          width: auto;
          max-width: 92px;
          height: auto;
          max-height: 62px;
          object-fit: contain;
          object-position: center;
          border: none;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
        }

        .more-images-badge {
          min-width: 39px;
          height: 39px;
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

        .text-banner-thumbnail {
          width: 88px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .text-thumbnail-icon {
          width: 38px;
          height: 38px;
          background: #f97316;
          color: white;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 800;
        }

        /* ================================================
           INFO
        ================================================ */

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
          line-height: 1.45;
        }

        /* ================================================
           TYPE
        ================================================ */

        .type-badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 750;
        }

        .text-type {
          background: #eff6ff;
          color: #2563eb;
        }

        .image-type {
          background: #f5f3ff;
          color: #7c3aed;
        }

        /* ================================================
           ORDER
        ================================================ */

        .order-number {
          width: 33px;
          height: 33px;
          border-radius: 9px;
          background: #f3f4f6;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 750;
          color: #374151;
        }

        /* ================================================
           STATUS
        ================================================ */

        .status-toggle {
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 11px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 750;
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

        /* ================================================
           ACTIONS
        ================================================ */

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
          padding: 8px 11px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 650;
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

        /* ================================================
           MODAL
        ================================================ */

        .banner-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.68);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 9999;
          overflow-y: auto;
        }

        .banner-modal {
          width: 100%;
          max-width: 820px;
          max-height: 94vh;
          overflow-y: auto;
          background: white;
          border-radius: 18px;
          box-shadow: 0 28px 80px rgba(0, 0, 0, 0.28);
          animation: modalIn 0.2s ease;
        }

        @keyframes modalIn {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .banner-modal-header {
          padding: 21px 25px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid #edf0f3;
          position: sticky;
          top: 0;
          background: white;
          z-index: 5;
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
          width: 36px;
          height: 36px;
          border: none;
          background: #f3f4f6;
          border-radius: 9px;
          cursor: pointer;
          font-size: 23px;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .modal-close:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        /* ================================================
           FORM
        ================================================ */

        .banner-modal form {
          padding: 25px;
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
        .form-group input[type="number"] {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          padding: 12px 13px;
          font-size: 14px;
          color: #111827;
          outline: none;
          background: white;
          transition: 0.2s;
        }

        .form-group input[type="text"]:focus,
        .form-group input[type="number"]:focus {
          border-color: #f97316;
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.10);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 17px;
        }

        .field-help {
          display: block;
          margin-top: 6px;
          color: #9ca3af;
          font-size: 11px;
          line-height: 1.5;
        }

        /* ================================================
           TYPE
        ================================================ */

        .banner-type-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 13px;
        }

        .type-option {
          border: 1px solid #e5e7eb;
          border-radius: 11px;
          padding: 15px;
          display: flex;
          align-items: flex-start;
          gap: 11px;
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
          line-height: 1.45;
        }

        /* ================================================
           UPLOAD
        ================================================ */

        .image-upload-box {
          border: 2px dashed #d1d5db;
          border-radius: 14px;
          background: #fafafa;
          overflow: hidden;
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
          min-height: 160px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          text-align: center;
          padding: 25px;
        }

        .upload-icon {
          width: 50px;
          height: 50px;
          border-radius: 14px;
          background: #fff1e7;
          color: #f97316;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 23px;
          margin-bottom: 12px;
        }

        .image-upload-label strong {
          font-size: 14px;
          color: #374151;
          margin-bottom: 6px;
        }

        .image-upload-label span {
          font-size: 11px;
          color: #9ca3af;
          line-height: 1.5;
        }

        /* ================================================
           IMAGE SECTION
        ================================================ */

        .selected-images-section {
          margin-top: 22px;
        }

        .selected-images-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 13px;
        }

        .selected-images-title strong {
          font-size: 13px;
          color: #374151;
        }

        .image-count {
          color: #6b7280;
          font-size: 11px;
        }

        .existing-label {
          color: #059669 !important;
        }

        .new-label {
          color: #2563eb !important;
        }

        /* ================================================
           IMAGE GRID
           NO IMAGE CONTAINER
           NO BORDER
           NO CROP
        ================================================ */

        .image-preview-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px;
        }

        .image-preview-item {
          position: relative;
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: visible;
        }

        .image-preview-item img {
          display: block;
          width: auto;
          max-width: 100%;
          height: auto;
          max-height: 230px;
          object-fit: contain;
          object-position: center;
          border: none;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
        }

        .remove-image-btn {
          position: absolute;
          top: 2px;
          right: 2px;
          width: 30px;
          height: 30px;
          border: none;
          border-radius: 50%;
          background: rgba(220, 38, 38, 0.94);
          color: white;
          cursor: pointer;
          font-size: 18px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          box-shadow: 0 3px 9px rgba(0, 0, 0, 0.18);
          transition: 0.15s;
          z-index: 2;
        }

        .remove-image-btn:hover {
          background: #b91c1c;
          transform: scale(1.07);
        }

        .image-number {
          position: absolute;
          left: 2px;
          top: 2px;
          min-width: 25px;
          height: 25px;
          padding: 0 7px;
          border-radius: 13px;
          background: rgba(17, 24, 39, 0.78);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          z-index: 2;
        }

        /* ================================================
           IMAGE COUNTER
        ================================================ */

        .image-total-info {
          margin-top: 15px;
          padding: 12px 14px;
          background: #f8fafc;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .image-total-info span {
          color: #6b7280;
          font-size: 12px;
        }

        .image-total-info strong {
          color: #111827;
          font-size: 12px;
        }

        .image-limit-warning {
          color: #dc2626 !important;
        }

        .image-remaining {
          margin-top: 7px;
          color: #9ca3af;
          font-size: 11px;
        }

        /* ================================================
           ENABLE
        ================================================ */

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

        /* ================================================
           SWITCH
        ================================================ */

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
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.20);
        }

        .switch input:checked + .slider {
          background: #f97316;
        }

        .switch input:checked + .slider:before {
          transform: translateX(21px);
        }

        /* ================================================
           FOOTER
        ================================================ */

        .banner-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 25px;
          padding-top: 21px;
          border-top: 1px solid #edf0f3;
        }

        .cancel-btn,
        .save-banner-btn {
          min-width: 120px;
          padding: 12px 18px;
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
        .modal-close:disabled,
        .remove-image-btn:disabled {
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

        /* ================================================
           RESPONSIVE
        ================================================ */

        @media (max-width: 1000px) {

          .banner-page {
            padding: 22px;
          }

          .image-preview-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .image-preview-item img {
            max-height: 210px;
          }

        }

        @media (max-width: 760px) {

          .banner-page {
            padding: 16px;
          }

          .banner-page-header {
            flex-direction: column;
            align-items: stretch;
          }

          .add-banner-btn {
            width: 100%;
          }

          .banner-stats {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .banner-card-header {
            padding: 18px;
          }

          .banner-modal-overlay {
            padding: 9px;
            align-items: flex-start;
          }

          .banner-modal {
            margin-top: 8px;
            max-height: 96vh;
            border-radius: 14px;
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
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px;
          }

          .image-preview-item img {
            max-height: 190px;
          }

          .banner-modal-footer {
            flex-direction: column-reverse;
          }

          .cancel-btn,
          .save-banner-btn {
            width: 100%;
          }

        }

        @media (max-width: 480px) {

          .banner-page {
            padding: 12px;
          }

          .header-title-container {
            gap: 10px;
          }

          .back-arrow-btn {
            width: 40px;
            height: 40px;
          }

          .banner-page-header h1 {
            font-size: 22px;
          }

          .banner-page-header p {
            font-size: 12px;
            line-height: 1.45;
          }

          .banner-stat-card {
            padding: 16px;
          }

          .stat-icon {
            width: 43px;
            height: 43px;
          }

          .banner-modal-header h2 {
            font-size: 18px;
          }

          .image-upload-label {
            min-height: 145px;
            padding: 18px;
          }

          .image-preview-grid {
            grid-template-columns: 1fr 1fr;
            gap: 13px;
          }

          .image-preview-item img {
            max-height: 145px;
          }

          .remove-image-btn {
            width: 26px;
            height: 26px;
            font-size: 16px;
          }

          .image-number {
            min-width: 22px;
            height: 22px;
            font-size: 9px;
          }

        }

      `}</style>

      {/* =====================================================
          PAGE
      ===================================================== */}

      <div className="banner-page">

        {/* HEADER */}

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
              <h1>Banner Management</h1>

              <p>
                Manage promotional banners displayed
                in the customer app.
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

        {/* STATS */}

        <div className="banner-stats">

          <div className="banner-stat-card">

            <div className="stat-icon">
              🖼️
            </div>

            <div>
              <span>Total Banners</span>
              <strong>{banners.length}</strong>
            </div>

          </div>

          <div className="banner-stat-card">

            <div className="stat-icon active">
              ✓
            </div>

            <div>
              <span>Active</span>

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
              <span>Disabled</span>

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

        {/* MAIN CARD */}

        <div className="banner-card">

          <div className="banner-card-header">

            <h2>All Banners</h2>

            <p>
              View, edit or control banner visibility
            </p>

          </div>

          {loading ? (

            <div className="banner-loading">
              <div className="spinner"></div>
              <span>Loading banners...</span>
            </div>

          ) : banners.length === 0 ? (

            <div className="banner-empty">

              <div className="empty-icon">
                📢
              </div>

              <h3>No Banners Found</h3>

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
                            ✎ Edit
                          </button>

                          <button
                            className="action-delete"
                            onClick={() =>
                              handleDelete(banner)
                            }
                          >
                            🗑 Delete
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

      {/* =====================================================
          MODAL
      ===================================================== */}

      {showModal && (

        <div className="banner-modal-overlay">

          <div className="banner-modal">

            {/* MODAL HEADER */}

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
                  Configure banner content,
                  images and action target.
                </p>

              </div>

              <button
                className="modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close"
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <form onSubmit={handleSubmit}>

              {/* TYPE */}

              <div className="form-group">

                <label>
                  Banner Type
                </label>

                <div className="banner-type-options">

                  <div
                    className={`type-option ${
                      form.banner_type === "text"
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      changeBannerType("text")
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
                        custom title and subtitle.
                      </small>

                    </div>

                  </div>

                  <div
                    className={`type-option ${
                      form.banner_type === "image"
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      changeBannerType("image")
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
                        Upload up to 10 promotional
                        banner images.
                      </small>

                    </div>

                  </div>

                </div>

              </div>

              {/* TITLE + SUBTITLE */}

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

              {/* MULTIPLE IMAGES */}

              {form.banner_type === "image" && (

                <div className="form-group">

                  <label>
                    Banner Images
                  </label>

                  <div className="image-upload-box">

                    <input
                      type="file"
                      id="banner-image-files"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
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
                        Select multiple PNG, JPG or WEBP
                        images · Maximum 10 images ·
                        5MB each
                      </span>

                    </label>

                  </div>

                  {/* EXISTING */}

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
                                  removeExistingImage(index)
                                }
                                disabled={saving}
                                title="Remove image"
                                aria-label={`Remove existing image ${
                                  index + 1
                                }`}
                              >
                                ×
                              </button>

                            </div>

                          )
                        )}

                      </div>

                    </div>

                  )}

                  {/* NEW */}

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
                          (item, index) => (

                            <div
                              className="image-preview-item"
                              key={`${item.file.name}-${item.file.lastModified}-${index}`}
                            >

                              <img
                                src={item.preview}
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
                                  removeSelectedImage(index)
                                }
                                disabled={saving}
                                title="Remove image"
                                aria-label={`Remove new image ${
                                  index + 1
                                }`}
                              >
                                ×
                              </button>

                            </div>

                          )
                        )}

                      </div>

                    </div>

                  )}

                  {/* COUNTER */}

                  <div className="image-total-info">

                    <span>
                      Total banner images
                    </span>

                    <strong
                      className={
                        totalSelectedImages >= MAX_IMAGES
                          ? "image-limit-warning"
                          : ""
                      }
                    >
                      {totalSelectedImages} / {MAX_IMAGES}
                    </strong>

                  </div>

                  <div className="image-remaining">
                    {remainingImages > 0
                      ? `${remainingImages} image${
                          remainingImages !== 1
                            ? "s"
                            : ""
                        } remaining`
                      : "Maximum image limit reached"}
                  </div>

                  <small className="field-help">
                    You can select images multiple times.
                    Existing images remain unless you
                    remove them using ×. New images are
                    uploaded when you save the banner.
                  </small>

                </div>

              )}

              {/* BUTTON */}

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
                    Target Screen / Route
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

              {/* ORDER + ENABLE */}

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
                    Lower numbers appear first.
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

              {/* FOOTER */}

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
