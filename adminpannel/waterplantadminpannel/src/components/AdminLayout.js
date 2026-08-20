import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { FiLogOut, FiList } from "react-icons/fi";

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: "Banner Mangement", path: "/adminbanner", icon: <FiList /> },
    { name: "Customer Mangement", path: "/customermanagement", icon: <FiList /> },
    { name: "Driver Mangement", path: "/drivermanagement", icon: <FiList /> },
    { name: "categoryAdding", path: "/admincatagories", icon: <FiList /> },
    { name: "Grocery List", path: "/admingrocerylisting", icon: <FiList /> },
    { name: "Order Mangement", path: "/adminorders", icon: <FiList /> },
    { name: "Stock Inventory", path: "/stockinventory", icon: <FiList /> },
    { name: "Drivers Earnings", path: "/driverearnings", icon: <FiList /> },
    // { name: "AssignDrivers", path: "/ordersassigndriver", icon: <FiList /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    navigate("/login", { replace: true });
  };

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
        <div style={logoutBtn} onClick={handleLogout}>
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
  height: "100vh", // Changed from minHeight to lock height to viewport
  overflow: "hidden", // Prevents body-level double scrollbars
  backgroundColor: "#ffffff",
};

const sidebar = {
  width: "260px",
  background: "#fff",
  borderRight: "2px solid #ff7f00",
  padding: "25px 20px",
  height: "100vh",
  display: "flex",
  flexDirection: "column", // Enables vertical stacking for flex children
  boxSizing: "border-box",
};

const title = {
  fontSize: "1.8rem",
  color: "#ff7f00",
  fontWeight: "700",
  marginBottom: "35px",
  textAlign: "center",
  flexShrink: 0, // Prevents the title from shrinking
};

const menuList = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  overflowY: "auto", // Adds vertical scrollbar only to menu items if they exceed screen height
  flex: 1, // Takes up available space between title and logout button
  paddingRight: "4px", // Prevents content clipping next to scrollbar
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
  flexShrink: 0,
};

const icon = {
  marginRight: "10px",
  fontSize: "1.2rem",
};

const logoutBtn = {
  marginTop: "20px",
  padding: "12px 15px",
  backgroundColor: "#ff3b30",
  color: "#fff",
  borderRadius: "8px",
  textAlign: "center",
  cursor: "pointer",
  fontWeight: "600",
  flexShrink: 0, // Keeps the logout button locked at the bottom
};

const content = {
  flex: 1,
  padding: "30px",
  background: "#fff7f0",
  height: "100vh",
  overflowY: "auto", // Makes the main page content area scrollable independently
  boxSizing: "border-box",
};

export default AdminLayout;