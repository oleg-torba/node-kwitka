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

const updateRecord = async (req, res) => {
  try {
    const latestRecords = await reservationModel
      .find()
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(latestRecords);
  } catch (error) {
    console.error("Помилка при отриманні останніх записів:", error);
    res.status(500).json({ message: "Помилка сервера" });
  }
};

const updateReserve = async (req, res) => {
  const { id } = req.params;
  const result = await reservationModel.findByIdAndUpdate(id, req.body, {
    new: true,
  });
  if (!result) {
    throw HttpErrors(404, "Not found");
  }
  res.json(result);
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
  updateReserve: ctrlWrapper(updateReserve),
  updateRecord: ctrlWrapper(updateRecord),
};
