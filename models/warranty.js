const { Schema, model } = require("mongoose");

const WarrantySchema = new Schema({
  repairNumber: { type: String }, // завжди потрібен
  createdBy: { type: String, enum: ["master", "manager"] },
  createdAt: { type: Date, default: Date.now },

  warrantyVerdict: {
    type: String,
    enum: ["Гарантія", "Не гарантія"],
    default: null,
  },
  masterImages: [
    {
      url: String,
      public_id: String,
    },
  ],
  masterComment: { type: String, default: "" },

  certificateNumber: { type: String, default: null },
  part: { type: String, default: null },
  saleDate: { type: Date, default: null },
  reporting: { type: String, default: null },
  imageUrl: { type: String, default: null }, 
  manager: { type: String, default: null },
  master: { type: String, default: null },
  brand: { type: String, default: null },

  rezolution: { type: String, enum: ["", "ok", "rejected"], default: "" },
  fixationDate: { type: Date, default: null },
  autoApproved: { type: Boolean, default: false },
  public_id: String,
});

const Warranty = model("warranty", WarrantySchema);
module.exports = Warranty;
