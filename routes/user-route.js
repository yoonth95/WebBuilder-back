const express = require("express");
const router = express.Router();
const userController = require("../controllers/user-controller");

router.post("/login", userController.login);
router.post("/signup", userController.signup);
router.post("/logout", userController.logout);
router.get("/verifyToken", userController.verifyToken);
router.get("/getUserId/:idx", userController.getUserId);
// router.post("/signup", userController.signup);

module.exports = router;
