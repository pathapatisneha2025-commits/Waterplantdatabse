const express = require("express");
const cors = require("cors");
const Signup = require("./routes/signup");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Use Router
app.use("/Signup", Signup);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
