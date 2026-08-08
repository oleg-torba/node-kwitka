import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import { lookup } from "mime-types";

const ctrlWrapper = require("../helpers/ctrlWrapper");

// Налаштування Cloudflare R2
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const uploadImage = async (req, res) => {
  const form = new formidable.IncomingForm();

  form.keepExtensions = true;

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Помилка під час обробки файлу:", err);

      return res.status(400).json({
        error: "Помилка під час обробки файлу",
      });
    }

    try {
      if (!files.file) {
        return res.status(400).json({
          error: "Файл не було надано",
        });
      }

      const uploadedFile = Array.isArray(files.file)
        ? files.file[0]
        : files.file;

      const filePath = uploadedFile.filepath;

      const originalName =
        uploadedFile.originalFilename || "image";

      const extension = path.extname(originalName).toLowerCase();

      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}${extension}`;

      // Папка в R2
      const key = `warranties/${fileName}`;

      const fileBuffer = fs.readFileSync(filePath);

      const contentType =
        uploadedFile.mimetype ||
        lookup(originalName) ||
        "application/octet-stream";

      // Завантаження у Cloudflare R2
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType,
        })
      );

      // Видаляємо тимчасовий файл
      fs.unlinkSync(filePath);

      // Публічний URL R2 через твій домен
      const imageUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

      console.log("Зображення успішно завантажено:", imageUrl);

      return res.status(200).json({
        imageUrl,
      });
    } catch (error) {
      console.error(
        "Помилка під час завантаження зображення:",
        error
      );

      return res.status(500).json({
        error: "Помилка під час завантаження",
      });
    }
  });
};

module.exports = {
  upload: ctrlWrapper(uploadImage),
};