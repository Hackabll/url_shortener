const router = require("express").Router();
const { generateQR } = require("../controllers/qrController");

router.get("/:code", generateQR);

module.exports = router;