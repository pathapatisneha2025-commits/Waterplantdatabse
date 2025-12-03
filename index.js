const express = require("express");
const cors = require("cors");
const Users = require("./routes/users");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Use Router
app.use("/users", Users);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
