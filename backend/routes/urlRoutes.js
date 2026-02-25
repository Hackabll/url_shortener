const router = require("express").Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/urlController");

router.get("/my-urls", auth, controller.getMyUrls);
router.put("/:shortCode", auth, controller.updateUrl);
router.delete("/:shortCode", auth, controller.deleteUrl);
router.get("/:shortCode/stats", controller.getStats);
router.post("/", auth, controller.createUrls);

module.exports = router;