const express = require("express");

const router = express.Router();

const ctrl = require("../../controllers/warranty");
router.get("/", ctrl.getAll);

module.exports = router;
