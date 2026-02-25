const router = require("express").Router();
const controller = require("../controllers/authController");
const { logout } = require("../controllers/authController");
const auth = require("../middleware/auth");

router.post("/signup",controller.signup);
router.post("/login",controller.login);
router.post("/forgot-password", controller.forgotPassword);
router.post("/reset-password", controller.resetPassword);
router.post("/logout",auth,logout);

module.exports = router;