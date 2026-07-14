import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const AddGrocery = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const editItem = location.state?.item;
  const isEdit = !!editItem;

  const [form, setForm] = useState({
    name: "",
    brand: "",
    category: "",
    subcategory: "",
    description: "",
    discount: "",
    quantity: 1,
    unit: "",
    stock: "",

    // PRICE STRUCTURE
    mrp: "",
    price: "",
    premiumPrice: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");

  // =========================
  // PREFILL ON EDIT
  // =========================
  useEffect(() => {
    if (editItem) {
      setForm({
        name: editItem.name || "",
        brand: editItem.brand || "",
        category: editItem.category || "",
        subcategory: editItem.subcategory || "",
        description: editItem.description || "",
        discount: editItem.discount || "",
        quantity: editItem.quantity || 1,
        unit: editItem.unit || "",
        stock: editItem.stock || "",

        mrp: editItem.mrp || "",
        price: editItem.price || "",
        premiumPrice:
          editItem.premiumPrice || editItem.premiumprice || "",
      });

      setPreview(editItem.img || "");
    }
  }, [editItem]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  // =========================
  // ADD + EDIT SUBMIT
  // =========================
  const handleSubmit = async () => {
    const formData = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value);
    });

    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      const url = isEdit
        ? `https://waterplantdatabse-v763.onrender.com/groceries/update/${editItem.id}`
        : `https://waterplantdatabse-v763.onrender.com/groceries/add`;

      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed");
        return;
      }

      alert(isEdit ? "Updated Successfully!" : "Added Successfully!");
      navigate("/admingrocerylisting");
    } catch (error) {
      console.error(error);
      alert("Server Error");
    }
  };

return (
  <div style={styles.page}>
    <div style={styles.card}>

      <h2 style={styles.heading}>
        {isEdit ? "Edit Grocery Item" : "Add Grocery Item"}
      </h2>

      <div style={styles.grid}>

        <input 
          name="name" 
          placeholder="Grocery Name"
          value={form.name}
          onChange={handleChange}
          style={styles.input}
        />

        <input 
          name="brand"
          placeholder="Brand"
          value={form.brand}
          onChange={handleChange}
          style={styles.input}
        />


        <input 
          name="category"
          placeholder="Category"
          value={form.category}
          onChange={handleChange}
          style={styles.input}
        />

        <input 
          name="subcategory"
          placeholder="Subcategory"
          value={form.subcategory}
          onChange={handleChange}
          style={styles.input}
        />

      </div>


      <textarea
        name="description"
        placeholder="Description"
        value={form.description}
        onChange={handleChange}
        style={styles.textarea}
      />


      <h3 style={styles.sectionTitle}>
        Price Details
      </h3>


      <div style={styles.grid}>


        <input
          name="mrp"
          type="number"
          placeholder="MRP Price ₹"
          value={form.mrp}
          onChange={handleChange}
          style={styles.input}
        />


        <input
          name="price"
          type="number"
          placeholder="Normal Price ₹"
          value={form.price}
          onChange={handleChange}
          style={styles.input}
        />


        <input
          name="premiumPrice"
          type="number"
          placeholder="Premium Price ₹"
          value={form.premiumPrice}
          onChange={handleChange}
          style={styles.input}
        />


        <input
          name="discount"
          type="number"
          placeholder="Discount %"
          value={form.discount}
          onChange={handleChange}
          style={styles.input}
        />


      </div>



      <h3 style={styles.sectionTitle}>
        Stock Details
      </h3>



      <div style={styles.grid}>


        <input
          name="quantity"
          type="number"
          placeholder="Quantity"
          value={form.quantity}
          onChange={handleChange}
          style={styles.input}
        />


        <input
          name="unit"
          placeholder="Unit (kg, litre, pcs)"
          value={form.unit}
          onChange={handleChange}
          style={styles.input}
        />


        <input
          name="stock"
          type="number"
          placeholder="Stock"
          value={form.stock}
          onChange={handleChange}
          style={styles.input}
        />


      </div>



      <h3 style={styles.sectionTitle}>
        Product Image
      </h3>


      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
      />



      {preview && (
        <img
          src={preview}
          alt="preview"
          style={styles.preview}
        />
      )}



      <button
        style={styles.button}
        onClick={handleSubmit}
      >
        {isEdit ? "Update Item" : "Save Item"}
      </button>


    </div>
  </div>
);
};

const styles={


page:{
 minHeight:"100vh",
 background:"#f5f7fb",
 padding:"20px",
 display:"flex",
 justifyContent:"center",
 alignItems:"flex-start"
},


card:{

 width:"100%",
 maxWidth:"750px",

 background:"#fff",

 padding:"30px",

 borderRadius:"20px",

 boxShadow:"0 5px 20px rgba(0,0,0,0.08)"

},



heading:{

 textAlign:"center",
 fontSize:"26px",
 fontWeight:"700",
 color:"#ff6600",
 marginBottom:"25px"

},



grid:{

 display:"grid",
 gridTemplateColumns:"repeat(2,1fr)",
 gap:"15px"

},



input:{

 width:"100%",
 padding:"14px",

 borderRadius:"12px",

 border:"1px solid #ddd",

 fontSize:"16px",

 boxSizing:"border-box"

},


textarea:{

 width:"100%",

 height:"100px",

 padding:"14px",

 borderRadius:"12px",

 border:"1px solid #ddd",

 fontSize:"16px",

 marginTop:"15px",

 boxSizing:"border-box"

},



sectionTitle:{

 color:"#333",

 fontSize:"18px",

 marginTop:"25px",

 marginBottom:"12px"

},



preview:{

 width:"100%",

 height:"220px",

 objectFit:"cover",

 borderRadius:"15px",

 marginTop:"15px",

 marginBottom:"20px"

},



button:{

 width:"100%",

 padding:"16px",

 background:"#ff6600",

 color:"#fff",

 border:"none",

 borderRadius:"14px",

 fontSize:"18px",

 fontWeight:"700",

 cursor:"pointer"

}

};

export default AddGrocery;