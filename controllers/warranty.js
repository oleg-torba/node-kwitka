const ctrlWrapper = require("../helpers/ctrlWrapper");
const Warranty = require("../models/warranty");
const crypto = require("crypto");
const fetch = require("node-fetch");



const sendAlkoEmail = async (data) => {
  if (data?.master?) return;

  const scriptUrl = "https://script.google.com/macros/s/AKfycbzC8IgDUCSH6ni-guyYUpj9p7g-vvbz9Ouryuo2rbJjw_89l22rHiSVFi7WgBGSk77L2A/exec"; // Вставте сюди посилання з Кроку 1

  const payload = {
    key: "AKfycbzC8IgDUCSH6ni-guyYUpj9p7g-vvbz9Ouryuo2rbJjw_89l22rHiSVFi7WgBGSk77L2A", 
    to: process.env.EMAIL_MANAGER,
    subject: `Гарантійний випадок AL-KO № ${data.repairNumber}`,
    html: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; color: #333;">
    <div style="background-color: #d32f2f; padding: 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 1px;">ЗАЯВКА НА ГАРАНТІЮ AL-KO</h1>
    </div>

    <div style="padding: 30px; background-color: #ffffff;">
      <p style="font-size: 16px; line-height: 1.5; color: #555;">
        Вітаємо! У системі сформовано новий звіт по діагностиці техніки <strong>AL-KO</strong>. 
        Будь ласка, розгляньте дані для прийняття рішення щодо гарантійного випадку.
      </p>

      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; color: #888; width: 40%;font-weight: bold;">№ Ремонту:</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">${data.repairNumber}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; color: #888;font-weight: bold;">Майстер:</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">${data.master}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; color: #888;">Пошкоджена запчастина:</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; color: #d32f2f; font-weight: bold;">${data.part}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; color: #888;font-weight: bold;">Вердикт:</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">${data.warrantyVerdict || 'Потребує перевірки'}</td>
        </tr>
      </table>

      <div style="margin-top: 30px;">
        <h3 style="font-size: 14px; text-transform: uppercase; color: #888; margin-bottom: 15px;">Фото несправностей:</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
          ${data.masterImages && data.masterImages.length > 0 
            ? data.masterImages.map((img, i) => {
                const url = typeof img === 'object' ? img.url : img;
                return `
                  <a href="${url}" style="display: inline-block; padding: 10px 18px; background-color: #f4f4f4; color: #333; text-decoration: none; border-radius: 4px; border: 1px solid #ddd; margin-bottom: 5px; font-size: 13px; font-weight: bold;">
                    Переглянути Фото №${i + 1}
                  </a>`;
              }).join(' ')
            : '<p style="color: #999; font-style: italic;">Фото не додано</p>'
          }
        </div>
      </div>
    </div>

    <div style="background-color: #f9f9f9; padding: 20px; border-top: 1px solid #eee; text-align: center;">
      <p style="margin: 0; font-size: 14px; font-weight: bold; color: #333;"Квітка Сервіс"</p>
      <p style="margin: 5px 0 0; font-size: 12px; color: #888;">Автоматизована система гарантійної звітності</p>
      <div style="margin-top: 15px; font-size: 11px; color: #bbb;">
        Цей лист згенеровано автоматично. Будь ласка, не відповідайте на нього.
      </div>
    </div>
  </div>
    `
  };

  try {
    const response = await fetch(scriptUrl, {
      method: "POST",
      body: JSON.stringify(payload)
      
    });
console.log("Спроба відправити лист на:", process.env.EMAIL_MANAGER);
console.log("Спроба відправити лист від:", process.env.EMAIL_USER);
console.log(payload)
    if (response.ok) {
      const result = await response.text(); 
console.log("Відповідь від сервера відправки:", result);
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
