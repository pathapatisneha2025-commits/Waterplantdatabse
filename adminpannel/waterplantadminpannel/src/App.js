import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import GroceryList from "./Pages/AdmingroceryListing";
import AddGrocery from "./Pages/AdminAddGrocery";
import AdminLayout from "./components/AdminLayout";
import CustomerManagement from "./Pages/CustomerManagement";
import OrdersAssignDriver from "./Pages/AdminAssignDriver";
import DriverManagement from "./Pages/DriverMangegement";
import AdminOrdersScreen from "./Pages/AdminOrders";
import GroceryListStock from "./Pages/AdminInventory";
import AdminDriverDashboard from "./Pages/AdminDriverdashboard";
import GroceryDashboard from "./Pages/Dashboard";
import AdminLogin from "./Pages/Adminlogin";
import AdminWaterPlantCategory from "./Pages/AdminAddCategories";
function App() {
  return (
  <Router>
  <Routes>
    <Route path="/" element={<Navigate to="/login" />} />
<Route path="/login" element={<AdminLogin/>} />

    <Route path="/" element={<AdminLayout />} >
    <Route path="/dashboard" element={<GroceryDashboard />} />
</Route>
    <Route path="/admincatagories" element={<AdminWaterPlantCategory />} />

    <Route path="/admingrocerylisting" element={<GroceryList />} />

<Route path="/adminGrocery" element={<AddGrocery />} />
<Route path="/customermanagement" element={<CustomerManagement />} />
<Route path="/ordersassigndriver" element={<OrdersAssignDriver />} />
<Route path="/drivermanagement" element={<DriverManagement />} />
<Route path="/adminorders" element={<AdminOrdersScreen />} />
<Route path="/stockinventory" element={<GroceryListStock />} />
<Route path="/driverearnings" element={<AdminDriverDashboard />} />







    <Route path="*" element={<h2>Page Not Found</h2>} />
  </Routes>
</Router>

  );
}

export default App;
