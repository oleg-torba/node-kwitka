require("dotenv").config();

const fs = require("fs");
const path = require("path");
const {
  S3Client,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");

const ROOT = "D:\\WarrantyBackup";

const client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function upload(filePath) {
  const relative = path.relative(ROOT, filePath).replace(/\\/g, "/");

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: relative,
    Body: fs.createReadStream(filePath),
    ContentType: getContentType(filePath),
  });

  await client.send(command);

  console.log("✅", relative);
}

function getContentType(file) {
  const ext = path.extname(file).toLowerCase();

  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}

async function walk(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const full = path.join(dir, file);

    if (fs.statSync(full).isDirectory()) {
      await walk(full);
    } else {
      await upload(full);
    }
  }
}

(async () => {
  console.log("Uploading...");

  await walk(ROOT);

  console.log("🎉 DONE");
})();