const express = require("express");
const cors = require("cors");
require("dotenv/config");
const routes = require("./routes/index.js");
const { PORT } = require("./config/variables.js");
const bodyParser = require("body-parser");

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.options("*", cors());
app.use("/api", routes);
const server = app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at ${PORT}`);
});

module.exports = server;