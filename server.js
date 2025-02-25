const express = require("express");
const fs = require("fs");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const logger = require("morgan");
const cors = require("cors");
require("dotenv").config();
const filterRoute = require("./routes/api/warranty");
const warrantyRoute = require("./routes/api/warranty");
const reserveRoute = require("./routes/api/reserve");
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
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/api/warranty", warrantyRoute);
app.use("/api/warranty/filter", filterRoute);
app.use(
  "/api/reserve",
  (req, res, next) => {
    req.app.set("io", io);
    next();
  },
  reserveRoute
);

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("message", (msg) => {
    console.log("Message received:", msg);

    io.emit("message", msg);
    io.emit("playSound", { sound: "message.mp3" });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(3001, () => {
  console.log("Server is running on http://localhost:3001");
});
