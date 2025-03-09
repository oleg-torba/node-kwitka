const express = require("express");

const router = express.Router();

const ctrl = require("../../controllers/warranty");
router.get("/", ctrl.getAll);
router.get("/update", ctrl.getLatestCertificates);
router.get("/:id", ctrl.getById);
router.put("/edit/:id", ctrl.editWarranty);
router.post("/filter", ctrl.fileteredWarranty);
router.post("/addWarranty", ctrl.addWarranty);
router.delete("/:id", ctrl.deleteWarranty);

module.exports = router;
