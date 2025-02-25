const ctrlWrapper = require("../helpers/ctrlWrapper");
const reservationModel = require("../models/reserve");

const addReserve = async (req, res) => {
  try {
    const {
      repairNumber,
      requestDate,
      initiator,
      approvalStatus,
      reserveStatus,
      comment,
      executor,
    } = req.body;
    const newReserve = await reservationModel.create({
      repairNumber,
      requestDate,
      initiator,
      approvalStatus,
      reserveStatus,
      comment,
      executor,
    });
    res.status(201).json({
      message: "Додано новий запит",
      data: newReserve,
    });
  } catch (error) {
    res.status(500).json({ error: "Помилка при створенні сертифіката." });
  }
};

const getAll = async (req, res) => {
  try {
    const reservation = await reservationModel.find({});
    res.json({ reservation });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Помилка отримання списку резервувань", error });
  }
};

module.exports = {
  getAll: ctrlWrapper(getAll),
  addReserve: ctrlWrapper(addReserve),
};
