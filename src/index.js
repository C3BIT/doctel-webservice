const express = require("express");
const cors = require("cors");
require("dotenv/config");
const routes = require("./routes/index.js");
const { PORT } = require("./configs/variables.js");
const bodyParser = require("body-parser");
const { responseHandler } = require("./middlewares/responseHandler.js");

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(responseHandler());
app.options("*", cors());
app.use("/api", routes);
const server = app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at ${PORT}`);
});

module.exports = server;