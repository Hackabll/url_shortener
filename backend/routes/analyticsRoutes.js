const router = require("express").Router();
const auth = require("../middleware/auth");
const { getAnalytics } = require("../controllers/analyticsController");

router.get("/:shortCode", auth , getAnalytics);

module.exports = router;
