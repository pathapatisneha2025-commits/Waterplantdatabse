import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { FiLogOut, FiList } from "react-icons/fi";

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: "Grocery List", path: "/admingrocerylisting", icon: <FiList /> },
    { name: "Customer Mangement", path: "/customermanagement", icon: <FiList /> },
    { name: "AssignDrivers", path: "/ordersassigndriver", icon: <FiList /> },


  ];

  return (
    <div style={container}>
      {/* Sidebar */}
      <aside style={sidebar}>
        <h2 style={title}>Admin Panel</h2>

        <div style={menuList}>
          {navItems.map((item) => (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                ...menuItem,
                backgroundColor:
                  location.pathname === item.path ? "#ff7f00" : "transparent",
                color: location.pathname === item.path ? "#fff" : "#333",
                fontWeight: location.pathname === item.path ? "700" : "500",
              }}
            >
              <span style={icon}>{item.icon}</span>
              {item.name}
            </div>
          ))}
        </div>

        {/* Logout */}
        <div style={logoutBtn} onClick={() => alert("Logout clicked!")}>
          <FiLogOut style={{ marginRight: 10 }} /> Logout
        </div>
      </aside>

      {/* Main Content */}
      <main style={content}>
        <Outlet />
      </main>
    </div>
  );
};

/* --------------------- Styles ---------------------- */

const container = {
  display: "flex",
  minHeight: "100vh",
  backgroundColor: "#ffffff",
};

const sidebar = {
  width: "260px",
  background: "#fff",
  borderRight: "2px solid #ff7f00",
  padding: "25px 20px",
  position: "sticky",
  top: 0,
  height: "100vh",
};

const title = {
  fontSize: "1.8rem",
  color: "#ff7f00",
  fontWeight: "700",
  marginBottom: "35px",
  textAlign: "center",
};

const menuList = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const menuItem = {
  padding: "12px 15px",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "1rem",
  display: "flex",
  alignItems: "center",
  transition: "0.3s",
  border: "1px solid #ffe0c2",
};

const icon = {
  marginRight: "10px",
  fontSize: "1.2rem",
};

const logoutBtn = {
  marginTop: "auto",
  padding: "12px 15px",
  backgroundColor: "#ff3b30",
  color: "#fff",
  borderRadius: "8px",
  textAlign: "center",
  cursor: "pointer",
  fontWeight: "600",
};

const content = {
  flex: 1,
  padding: "30px",
  background: "#fff7f0",
};

export default AdminLayout;
