const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const logger = require("morgan");
const cors = require("cors");
require("dotenv").config();
const filterRoute = require("./routes/api/warranty");
const warrantyRoute = require("./routes/api/warranty");
const dbHost =
  "mongodb+srv://olegtorba011:UYjNG5FujVfQmCeQ@cluster0.hk1w0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
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
// Створення Express сервера
const app = express();
const server = http.createServer(app);
const formatsLogger = app.get("env") === "development" ? "dev" : "short";
const io = socketIo(server, {
  cors: {
    origin: "*", // Дозволяємо доступ з усіх джерел (можна налаштувати під ваші потреби)
    methods: ["GET", "POST"],
  },
});

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/api/warranty", warrantyRoute);
app.use("/api/warranty/filter", filterRoute);
// Підключення клієнта до WebSocket
io.on("connection", (socket) => {
  console.log("A user connected");

  // Прийом повідомлення від клієнта
  socket.on("message", (msg) => {
    console.log("Message received:", msg);
    // Надсилання повідомлення всім клієнтам
    io.emit("message", msg);
  });

  // Відключення користувача
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Запуск сервера на порту 3001
server.listen(3001, () => {
  console.log("Server is running on http://localhost:3001");
});
