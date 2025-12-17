import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import GroceryList from "./Pages/AdmingroceryListing";
import AddGrocery from "./Pages/AdminAddGrocery";
import AdminLayout from "./components/AdminLayout";
import CustomerManagement from "./Pages/CustomerManagement";
import OrdersAssignDriver from "./Pages/AdminAssignDriver";
function App() {
  return (
  <Router>
  <Routes>
    <Route path="/" element={<Navigate to="/admingrocerylisting" />} />
    <Route path="/" element={<AdminLayout />} >
<Route path="/admingrocerylisting" element={<GroceryList />} />
<Route path="/adminGrocery" element={<AddGrocery />} />
<Route path="/customermanagement" element={<CustomerManagement />} />
<Route path="/ordersassigndriver" element={<OrdersAssignDriver />} />



</Route>



    <Route path="*" element={<h2>Page Not Found</h2>} />
  </Routes>
</Router>

  );
}

export default App;
