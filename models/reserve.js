const { Schema, model } = require("mongoose");

const ReservationSchema = new Schema({
  repairNumber: { type: String, required: true },
  requestDate: { type: Date, default: Date.now },
  initiator: { type: String, required: true },
  approvalStatus: {
    type: String,
    enum: ["Погоджено", "Збірка", "Резерв замовлення", "Уточнення"],
    required: true,
  },
  reserveStatus: {
    type: String,
    enum: ["Повний", "Частковий", "Відсутній", "Помилка"],
  },
  comments: [
    {
      author: String,
      text: String,
      timestamp: { type: Date, default: Date.now }, // Час додавання коментаря
    },
  ],
});

const reservationModel = model("Reservation", ReservationSchema);
module.exports = reservationModel;
