import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// ============================================================
// PAGES
// ============================================================

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
import BannerManagement from "./Pages/BannerManagement";

// ============================================================
// GLOBAL NOTIFICATION
// ============================================================

import GlobalOrderNotification from "./components/GlobalNotificationSounds";
import TodaysDealsAdmin from "./Pages/AdminAddtodaysdeals";

// ============================================================
// APP
// ============================================================

function App() {
  return (
    <Router>

      {/* ======================================================
          GLOBAL ORDER NOTIFICATION

          IMPORTANT:
          This is OUTSIDE <Routes>.

          Therefore it stays mounted while navigating between:
          Dashboard
          Orders
          Grocery
          Inventory
          Drivers
          Customers
          Categories
          etc.

          The order count and sound will continue globally.
          ====================================================== */}

      <GlobalOrderNotification />

      {/* ======================================================
          ROUTES
          ====================================================== */}

      <Routes>

        {/* ====================================================
            DEFAULT
            ==================================================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        {/* ====================================================
            LOGIN
            ==================================================== */}

        <Route
          path="/login"
          element={<AdminLogin />}
        />

        {/* ====================================================
            ADMIN LAYOUT
            ==================================================== */}

        <Route
          element={<AdminLayout />}
        >

          <Route
            path="/dashboard"
            element={<GroceryDashboard />}
          />

        </Route>

        {/* ====================================================
            ADMIN PAGES
            ==================================================== */}

        <Route
          path="/admincatagories"
          element={
            <AdminWaterPlantCategory />
          }
        />

        <Route
          path="/admingrocerylisting"
          element={
            <GroceryList />
          }
        />

        <Route
          path="/adminbanner"
          element={
            <BannerManagement />
          }
        />

        <Route
          path="/adminGrocery"
          element={
            <AddGrocery />
          }
        />

        <Route
          path="/customermanagement"
          element={
            <CustomerManagement />
          }
        />

        <Route
          path="/ordersassigndriver"
          element={
            <OrdersAssignDriver />
          }
        />

        <Route
          path="/drivermanagement"
          element={
            <DriverManagement />
          }
        />

        <Route
          path="/adminorders"
          element={
            <AdminOrdersScreen />
          }
        />

        <Route
          path="/stockinventory"
          element={
            <GroceryListStock />
          }
        />

        <Route
          path="/driverearnings"
          element={
            <AdminDriverDashboard />
          }
        />
   <Route
          path="/todaysdeals"
          element={
            <TodaysDealsAdmin/>
          }
        />
        {/* ====================================================
            404
            ==================================================== */}

        <Route
          path="*"
          element={
            <div
              style={{
                padding: "40px",
                textAlign: "center",
              }}
            >
              <h2>
                Page Not Found
              </h2>
            </div>
          }
        />

      </Routes>

    </Router>
  );
}

export default App;