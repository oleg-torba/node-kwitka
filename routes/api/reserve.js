const express = require("express");

const router = express.Router();

const ctrl = require("../../controllers/reserve");
router.get("/", ctrl.getAll);

router.post("/addReserve", ctrl.addReserve);

module.exports = router;
