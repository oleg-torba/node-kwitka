import { v2 as cloudinary } from "cloudinary";
import formidable from "formidable";
import fs from "fs";
const ctrlWrapper = require("../helpers/ctrlWrapper");

// Налаштування Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImage = async (req, res) => {
  const form = new formidable.IncomingForm();
  form.keepExtensions = true; // Зберігаємо розширення файлу

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Помилка під час обробки файлу:", err);
      return res.status(400).json({ error: "Помилка під час обробки файлу" });
    }

    try {
      if (!files.file) {
        return res.status(400).json({ error: "Файл не було надано" });
      }

      const filePath = files.file.filepath; // Отримуємо шлях до тимчасового файлу

      // Завантажуємо файл на Cloudinary
      const result = await cloudinary.uploader.upload(filePath, {
        folder: "warranties",
      });

      // Видаляємо тимчасовий файл
      fs.unlinkSync(filePath);

      console.log("Зображення успішно завантажено:", result.secure_url);
      res.status(200).json({ imageUrl: result.secure_url });
    } catch (error) {
      console.error("Помилка під час завантаження зображення:", error);
      res.status(500).json({ error: "Помилка під час завантаження" });
    }
  });
};
module.exports = {
  upload: ctrlWrapper(uploadImage),
};
