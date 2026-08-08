require("dotenv").config();


const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: 'ds38ymgr5',
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


async function getAllImages() {

  let next = null;
  let images = [];

  do {

    const result = await cloudinary.api.resources({
      type: "upload",
      resource_type: "image",
      max_results: 500,
      next_cursor: next
    });


    images.push(...result.resources);

    next = result.next_cursor;

  } while(next);


  console.log("Всього зображень:", images.length);


  images.forEach(img => {
    console.log(
      img.public_id + "." + img.format
    );
  });

}


getAllImages();