const express = require("express");
const fs = require("fs");
const path = require("path");
const http = require("http");

const mongoose = require("mongoose");
const logger = require("morgan");
const cors = require("cors");
require("dotenv").config();
const filterRoute = require("./routes/api/warranty");
const warrantyRoute = require("./routes/api/warranty");

const reportRoute = require("./routes/api/report");
const dbHost = process.env.MONGODB_URI;
mongoose.set("strictQuery", true);
mongoose
  .connect(dbHost)
  .then(() => {
    console.log("Database connection successful");
  })
  .catch((error) => {
    console.log(error.message);
    process.exit(1);
  });

const app = express();
const server = http.createServer(app);

const formatsLogger = app.get("env") === "development" ? "dev" : "short";

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/api/reports", reportRoute);
app.use("/api/warranty", warrantyRoute);
app.use("/api/warranty/filter", filterRoute);

server.listen(3001, () => {
  console.log("Server is running on http://localhost:3001");
});
