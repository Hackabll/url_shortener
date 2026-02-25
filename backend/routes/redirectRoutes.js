const router = require("express").Router();
const ipProtection = require("../middleware/ipProtection");

const{ redirectUrl } = require("../controllers/redirectController");


router.get("/:shortCode",ipProtection,redirectUrl);

module.exports = router;