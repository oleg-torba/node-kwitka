const ctrlWrapper = require("../helpers/ctrlWrapper");
const Warranty = require("../models/warranty");
const crypto = require("crypto");
const fetch = require("node-fetch");



const sendAlkoEmail = async (data) => {
  if (data?.brand?.trim().toUpperCase() !== "AL-KO") return;

  const scriptUrl = "https://script.google.com/macros/s/AKfycbzC8IgDUCSH6ni-guyYUpj9p7g-vvbz9Ouryuo2rbJjw_89l22rHiSVFi7WgBGSk77L2A/exec"; // Вставте сюди посилання з Кроку 1

  const payload = {
    key: "AKfycbzC8IgDUCSH6ni-guyYUpj9p7g-vvbz9Ouryuo2rbJjw_89l22rHiSVFi7WgBGSk77L2A", // Має збігатися з ключем у скрипті
    to: process.env.EMAIL_MANAGER,
    subject: `📢 Гарантія AL-KO № ${data.repairNumber}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd;">
        <h2>Подати на гарантію AL-KO</h2>
        <p><b>№ Ремонту:</b> ${data.repairNumber}</p>
        <p><b>Майстер:</b> ${data.master}</p>
        <hr>
        <p><b>Фото:</b></p>
        <ul>
          ${data.masterImages?.map((img, i) => `<li><a href="${typeof img === 'object' ? img.url : img}">Фото №${i+1}</a></li>`).join('') || "<li>Фото відсутні</li>"}
        </ul>
      </div>
    `
  };

  try {
    const response = await fetch(scriptUrl, {
      method: "POST",
      body: JSON.stringify(payload)
      
    });
console.log("Спроба відправити лист на:", process.env.EMAIL_MANAGER);
    if (response.ok) {
      console.log("✅ Лист AL-KO надіслано через Google Proxy");
    }
  } catch (err) {
    console.error("❌ Помилка надсилання через проксі:", err.message);
  }
};
const addWarranty = async (req, res) => {
  const {
    repairNumber, certificateNumber, part, saleDate,
    reporting, masterComment, master, manager,
    brand, imageUrl, public_id, masterImages,
    warrantyVerdict, createdBy,
  } = req.body;

  const newWarranty = await Warranty.create({
    repairNumber, certificateNumber, part, saleDate,
    reporting, manager, master, brand,
    imageUrl, masterComment, masterImages,
    warrantyVerdict,
    createdBy: req.body.createdBy || "manager",
    public_id,
  });


  sendAlkoEmail(newWarranty);

  res.status(201).json({
    message: "Гарантійний сертифікат успішно створено.",
    data: newWarranty,
  });
};


const editWarranty = async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  console.log("Updating warranty with data:", updatedData);
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
    const warranties = await Warranty.find();

    res.json({
      data: warranties,
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
    rezolution,
  } = req.body;

  try {
    const filters = {};

    if (repairNumber)
      filters.repairNumber = { $regex: repairNumber, $options: "i" };

    if (certificateNumber)
      filters.certificateNumber = { $regex: certificateNumber, $options: "i" };

    if (reporting) filters.reporting = { $regex: reporting, $options: "i" };

    if (startDate && endDate) {
      filters.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      filters.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      filters.createdAt = { $lte: new Date(endDate) };
    }

    if (brand) filters.brand = brand;

    if (rezolution) filters.rezolution = rezolution;

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

    const deletedWarranty = await Warranty.findByIdAndDelete(id);

    if (!deletedWarranty) {
      return res.status(404).json({ message: "Сертифікат не знайдено" });
    }

    return res
      .status(200)
      .json({ message: "Сертифікат видалено", data: deletedWarranty });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Помилка сервера", error: error.message });
  }
};

const getLatestCertificates = async (req, res) => {
  try {
    const latestCertificates = await Warranty.find()
      .sort({ createdAt: -1 })
      .limit(16)
      .exec();

    res.status(200).json(latestCertificates);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Помилка при отриманні сертифікатів", error });
  }
};

module.exports = {
  getAll: ctrlWrapper(getAll),
  addWarranty: ctrlWrapper(addWarranty),
  editWarranty: ctrlWrapper(editWarranty),
  getById: ctrlWrapper(getById),
  fileteredWarranty: ctrlWrapper(fileteredWarranty),
  deleteWarranty: ctrlWrapper(deleteWarranty),
  getLatestCertificates: ctrlWrapper(getLatestCertificates),
};
