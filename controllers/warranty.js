const ctrlWrapper = require("../helpers/ctrlWrapper");
const Warranty = require("../models/warranty");
const crypto = require("crypto");
const fetch = require("node-fetch");

const addWarranty = async (req, res) => {
  try {
    const {
      repairNumber,
      certificateNumber,
      part,
      saleDate,
      reporting,
      manager,
      brand,
      imageUrl,
      public_id,
    } = req.body;

    if (
      !repairNumber ||
      !certificateNumber ||
      !part ||
      !saleDate ||
      !reporting ||
      !manager ||
      !brand ||
      !imageUrl ||
      !public_id
    ) {
      return res
        .status(400)
        .json({ error: "Усі обов'язкові поля мають бути заповнені." });
    }

    const existingWarranty = await Warranty.findOne({ certificateNumber });
    if (existingWarranty) {
      return res
        .status(400)
        .json({ error: "Сертифікат із таким номером вже існує." });
    }

    const newWarranty = await Warranty.create({
      repairNumber,
      certificateNumber,
      part,
      saleDate,
      reporting,
      manager,
      brand,
      imageUrl,
      public_id,
    });

    res.status(201).json({
      message: "Гарантійний сертифікат успішно створено.",
      data: newWarranty,
    });
  } catch (error) {
    console.error(
      "Помилка при створенні сертифіката:",
      error.message,
      error.stack
    );
    res.status(500).json({ error: "Помилка при створенні сертифіката." });
  }
};

const editWarranty = async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  const result = await Warranty.findByIdAndUpdate(id, updatedData, {
    new: true,
  });
  if (!result) {
    throw HttpErrors(404, "Not found");
  }
  res.json(result);
};

const getById = async (req, res) => {
  const { id } = req.params;
  const result = await Warranty.findById(id);
  if (!result) {
    throw HttpErrors(404, "Not found");
  }
  res.json(result);
};

const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    // Отримуємо загальну кількість записів
    const totalCount = await Warranty.countDocuments();

    // Якщо limit більше загальної кількості, виправляємо кількість сторінок
    const totalPages = Math.ceil(totalCount / limitNumber) || 1;

    const warranties = await Warranty.find().skip(skip).limit(limitNumber);

    res.json({
      data: warranties,
      totalPages,
      currentPage: pageNumber,
      totalItems: totalCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Помилка отримання гарантій", error });
  }
};

const fileteredWarranty = async (req, res) => {
  const {
    repairNumber,
    certificateNumber,
    reporting,
    startDate,
    endDate,
    brand,
    resolution,
  } = req.body;

  try {
    const filters = {};

    // Фільтрація по номеру ремонту
    if (repairNumber)
      filters.repairNumber = { $regex: repairNumber, $options: "i" };

    // Фільтрація по номеру сертифіката
    if (certificateNumber)
      filters.certificateNumber = { $regex: certificateNumber, $options: "i" };

    // Фільтрація по клієнту
    if (reporting) filters.reporting = { $regex: reporting, $options: "i" };

    // Фільтрація по датам
    if (startDate && endDate) {
      filters.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (startDate) {
      filters.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      filters.date = { $lte: new Date(endDate) };
    }

    // Фільтрація по бренду
    if (brand) filters.brand = brand;

    // Фільтрація по статусу
    if (resolution) filters.resolution = resolution;

    // Запит до бази даних
    const certificates = await Warranty.find(filters);

    res.status(200).json(certificates);
  } catch (error) {
    console.error("Error fetching warranties:", error);
    res.status(500).json({ message: "Error fetching data" });
  }
};
const deleteWarranty = async (req, res) => {
  const { id } = req.params;

  try {
    const warranty = await Warranty.findById(id);

    if (!warranty) {
      return res.status(404).json({ message: "Сертифікат не знайдено" });
    }

    const publicId = warranty.public_id;
    const timestamp = Math.floor(Date.now() / 1000);

    const signature = crypto
      .createHash("sha1")
      .update(
        `public_id=${publicId}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`
      )
      .digest("hex");

    const body = new URLSearchParams({
      public_id: publicId,
      api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
      signature: signature,
      timestamp: timestamp,
    });

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/raw/destroy`,
      {
        method: "POST",
        body: body,
      }
    );

    const cloudinaryData = await cloudinaryResponse.json();

    if (cloudinaryData.result !== "ok") {
      return res.status(500).json({
        message: "Не вдалося видалити файл з Cloudinary",
        error: cloudinaryData,
      });
    }

    const deletedWarranty = await Warranty.findByIdAndDelete(id);

    if (!deletedWarranty) {
      return res.status(404).json({ message: "Сертифікат не знайдено" });
    }

    return res
      .status(200)
      .json({ message: "Сертифікат видалено", cloudinaryData });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Помилка сервера", error: error.message });
  }
};

module.exports = {
  getAll: ctrlWrapper(getAll),
  addWarranty: ctrlWrapper(addWarranty),
  editWarranty: ctrlWrapper(editWarranty),
  getById: ctrlWrapper(getById),
  fileteredWarranty: ctrlWrapper(fileteredWarranty),
  deleteWarranty: ctrlWrapper(deleteWarranty),
};
