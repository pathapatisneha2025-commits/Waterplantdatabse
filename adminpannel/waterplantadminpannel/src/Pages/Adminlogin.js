import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
const handleLogin = async (e) => {

    e.preventDefault();

    if(!email || !password){
        alert("Please enter email/mobile and password");
        return;
    }


    try{

        const response = await fetch(
            "https://partyhousedatabase-rpft.onrender.com/admin/login",
            {
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({

                    email:email,
                    password:password

                })
            }
        );


        const data = await response.json();


        console.log("Login Response:",data);



    if(data.message === "Login successful" && data.admin){

    localStorage.setItem(
        "admin",
        JSON.stringify(data.admin)
    );


    navigate("/dashboard");

}
else{

    alert(data.message || "Invalid login credentials");

}


    }
    catch(error){

        console.log("Login Error:",error);

        alert("Server error. Please try again");

    }


}

  const styles = {
    wrapper: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      background: "#f9fafb",
      fontFamily: "Arial, sans-serif",
      padding: "15px",
      boxSizing: "border-box",
    },
    card: {
      background: "#fff",
      padding: "30px",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      width: "100%",
      maxWidth: "400px",
      boxSizing: "border-box",
    },
    title: {
      color: "#ff6600",
      fontSize: "24px",
      fontWeight: "bold",
      marginBottom: "20px",
      textAlign: "center",
      marginT: 0,
    },
    inputGroup: {
      marginBottom: "15px",
    },
    label: {
      display: "block",
      marginBottom: "5px",
      fontWeight: "bold",
      color: "#333",
      fontSize: "14px",
    },
    input: {
      width: "100%",
      padding: "10px",
      border: "1px solid #ccc",
      borderRadius: "6px",
      fontSize: "14px",
      boxSizing: "border-box",
    },
    loginBtn: {
      width: "100%",
      padding: "12px",
      background: "#ff6600",
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      fontWeight: "bold",
      fontSize: "16px",
      cursor: "pointer",
      marginTop: "10px",
    },
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.title}>Admin Login</h2>
<form onSubmit={handleLogin} autoComplete="off">

  <div style={styles.inputGroup}>
    <label style={styles.label}>Email Address</label>
    <input
      type="email"
      name="login-email"
      autoComplete="username"
      style={styles.input}
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      placeholder="Enter admin email"
      required
    />
  </div>

  <div style={styles.inputGroup}>
    <label style={styles.label}>Password</label>
    <input
      type="password"
      name="login-password"
      autoComplete="new-password"
      style={styles.input}
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      placeholder="Enter password"
      required
    />
  </div>

  <button type="submit" style={styles.loginBtn} disabled={loading}>
    {loading ? "Logging in..." : "Login"}
  </button>

</form>
      </div>
    </div>
  );
}