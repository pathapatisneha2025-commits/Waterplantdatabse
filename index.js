const express = require("express");
const cors = require("cors");
const Users = require("./routes/users");
const UserCart = require("./routes/cart");
const Orders = require("./routes/Orders");
const WaterOrders = require("./routes/waterorder");
const Groceries = require("./routes/Groceriesadd");




require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Use Router
app.use("/users", Users);
app.use("/cart", UserCart);
app.use("/orders", Orders);
app.use("/waterorder", WaterOrders);
app.use("/groceries", Groceries);


app.listen(5000, () => {
  console.log("Server running on port 5000");
});
