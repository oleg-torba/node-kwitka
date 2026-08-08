require("dotenv").config();

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const Warranty = require("./models/warranty");

const BACKUP_DIR = "D:\\WarrantyBackup";
const BASE_URL = "https://pub-67fa855392514ae0b4e5145578a284e8.r2.dev";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  console.log("✅ Mongo connected");

  const cursor = Warranty.find().cursor();

  let updated = 0;

  for await (const doc of cursor) {

    const folder = path.join(
      BACKUP_DIR,
      doc.repairNumber || doc._id.toString()
    );

    if (!fs.existsSync(folder)) {
      console.log("❌ Немає папки:", folder);
      continue;
    }

    const files = fs.readdirSync(folder);

    let changed = false;

    // ---------- COVER ----------

    const cover = files.find(f => f.startsWith("cover."));

    if (cover) {
      doc.imageUrl =
        `${BASE_URL}/${doc.repairNumber || doc._id}/${cover}`;

      changed = true;
    }

    // ---------- MASTER ----------

    if (doc.masterImages?.length) {

      const masters = files
        .filter(f => f.startsWith("master_"))
        .sort();

      for (let i = 0; i < masters.length; i++) {

        if (!doc.masterImages[i]) continue;

        doc.masterImages[i].url =
          `${BASE_URL}/${doc.repairNumber || doc._id}/${masters[i]}`;
      }

      changed = true;
    }

    if (changed) {

  await Warranty.updateOne(
    { _id: doc._id },
    {
      $set: {
        imageUrl: doc.imageUrl,
        masterImages: doc.masterImages,
      },
    }
  );

  updated++;

  console.log(`✅ ${updated} ${doc.repairNumber}`);
}
  }

  console.log("\n🎉 ГОТОВО");

  await mongoose.disconnect();
}

run().catch(console.error);