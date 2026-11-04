require("dotenv").config();

const express = require("express");
const cors = require("cors");

const Users = require("./routes/users");
const UserCart = require("./routes/cart");
const Orders = require("./routes/Orders");
const WaterOrders = require("./routes/waterorder");
const Groceries = require("./routes/Groceriesadd");
const Categories = require("./routes/categories");
const Banners = require("./routes/banner");
const todaysdeals = require("./routes/todaysdeals");
const wishlists = require("./routes/wishlists");
const Admin = require("./routes/admin");
const watercan = require("./routes/watercan");

const app = express();

app.use(cors());
app.use(express.json());
const path = require("path");

app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
);

// Routes
app.use("/users", Users);
app.use("/cart", UserCart);
app.use("/orders", Orders);
app.use("/waterorder", WaterOrders);
app.use("/groceries", Groceries);
app.use("/categories", Categories);
app.use("/banner", Banners);
app.use("/todaydeals", todaysdeals);
app.use("/wishlists", wishlists);
app.use("/admin", Admin);
app.use("/watercan", watercan);


// Server
const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`Waterplant server running on port ${PORT}`);
});