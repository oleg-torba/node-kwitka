const { Schema, model } = require("mongoose");

const WarrantySchema = new Schema({
  repairNumber: { type: String, required: true }, // завжди потрібен
  createdBy: { type: String, enum: ["master", "manager"], required: true },
  createdAt: { type: Date, default: Date.now },

  // --- MASTER ---
  warrantyVerdict: { type: String, enum: ["Гарантія", "Не гарантія"], default: null },
  masterImages: [
    {
      url: String,
      public_id: String,
    }
  ],

  // --- MANAGER ---
  certificateNumber: { type: String, default: null },
  part: { type: String, default: null },
  saleDate: { type: Date, default: null },
  reporting: { type: String, default: null },
  imageUrl: { type: String, default: null }, // одне фото менеджера
  manager: { type: String, default: null },
  brand: { type: String, default: null },

  // --- STATUS ---
  rezolution: { type: String, enum: ["","ok","rejected"], default: "" },
  fixationDate: { type: Date, default: null },
  autoApproved: { type: Boolean, default: false },
  public_id: String,
});

const Warranty = model("warranty", WarrantySchema);
module.exports = Warranty;
