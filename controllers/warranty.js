const ctrlWrapper = require("../helpers/ctrlWrapper");
const Warranty = require("../models/warranty");
const crypto = require("crypto");
const fetch = require("node-fetch");



const sendWarrantyEmail = async (data) => {
  // 1. Визначаємо умови
  const isAlko = data?.brand?.trim().toUpperCase() === "AL-KO";
  const isMaster = data?.createdBy === "master";
  const isManager = data?.createdBy === "manager";
  
  // Перевірка, чи заповнені основні поля майстра
  const masterFieldsFilled = data.master !== "" && data.part !== "" && data.rezolution !== "";

  // Якщо це майстер і НЕ AL-KO — нічого не робимо (за вашою логікою)
  if (isMaster && !isAlko) return;

  const scriptUrl = "https://script.google.com/macros/s/AKfycbzC8IgDUCSH6ni-guyYUpj9p7g-vvbz9Ouryuo2rbJjw_89l22rHiSVFi7WgBGSk77L2A/exec";

  // 2. Формуємо контент залежно від ситуації
  let emailSubject = "";
  let emailHtml = "";

  if (isMaster && isAlko) {
    // --- ОРИГІНАЛЬНИЙ ЛИСТ ДЛЯ AL-KO ---
    emailSubject = `Гарантійний випадок AL-KO № ${data.repairNumber}`;
    emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #d32f2f; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px;">ЗАЯВКА НА ГАРАНТІЮ AL-KO</h1>
        </div>
        <div style="padding: 30px;">
          <p>У системі сформовано новий звіт по діагностиці <strong>AL-KO</strong>.</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><b>№ Ремонту:</b></td><td>${data.repairNumber}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><b>Майстер:</b></td><td>${data.master}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><b>Запчастина:</b></td><td style="color: #d32f2f;">${data.part}</td></tr>
          </table>
          <p style="margin-top: 20px;"><b>Фото:</b> ${data.masterImages?.length > 0 ? 'Додано' : 'Відсутні'}</p>
        </div>
      </div>`;
  } 
  else if (isManager && masterFieldsFilled) {
    // --- НОВИЙ ЛИСТ ДЛЯ МЕНЕДЖЕРА (Будь-який бренд) ---
    emailSubject = `Реєстрація гарантії ${data.brand} № ${data.repairNumber}`;
    emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #2e7d32; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px;">НОВА РЕЄСТРАЦІЯ ГАРАНТІЇ</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px;">Повідомляємо, що менеджер зареєстрував гарантійний випадок для бренду <strong>${data.brand}</strong>.</p>
          <div style="background-color: #f1f8e9; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <p style="margin: 5px 0;"><strong>Номер ремонту:</strong> ${data.repairNumber}</p>
            <p style="margin: 5px 0;"><strong>Бренд:</strong> ${data.brand}</p>
            <p style="margin: 5px 0;"><strong>Майстер:</strong> ${data.master}</p>
            <p style="margin: 5px 0;"><strong>Вердикт:</strong> ${data.rezolution}</p>
          </div>
          <p style="color: #666; font-size: 13px; margin-top: 20px;">На перевірку коректності внесених даних надається 2 дні</p>
        </div>
        <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #888;">
          "Квітка Сервіс" — Автоматичне сповіщення
        </div>
      </div>`;
  } else {
    // Якщо жодна умова не підійшла
    return;
  }

  const payload = {
    key: "AKfycbzC8IgDUCSH6ni-guyYUpj9p7g-vvbz9Ouryuo2rbJjw_89l22rHiSVFi7WgBGSk77L2A",
    to: process.env.EMAIL_MANAGER,
    subject: emailSubject,
    html: emailHtml
  };

  try {
    const response = await fetch(scriptUrl, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log(`✅ Лист (${data.brand}) успішно надіслано. Відправник: ${data.ema}`);
    }
  } catch (err) {
    console.error("❌ Помилка відправки:", err.message);
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


  sendWarrantyEmail(newWarranty);

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
  sendWarrantyEmail(result);
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
