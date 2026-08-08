const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");
const axios = require("axios");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const files = [
  {
    cloud: "Screenshot_1.png",
    wp: "2025/04/screenshot_1.png"
  },
  {
    cloud: "Screenshot_2.png",
    wp: "2025/04/screenshot_2-11.png"
  }
];

const download = async () => {

for (const file of files) {

  const result = await cloudinary.api.resource(
    file.cloud.replace(".png",""),
    { resource_type: "image" }
  );

  const savePath = path.join(
    "uploads",
    file.wp
  );

  fs.mkdirSync(path.dirname(savePath), {
    recursive:true
  });

  const response = await axios({
    url: result.secure_url,
    method:"GET",
    responseType:"stream"
  });

  response.data.pipe(
    fs.createWriteStream(savePath)
  );

  console.log("Завантажено:", savePath);
}

}

download();