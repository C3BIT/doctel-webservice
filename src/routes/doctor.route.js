const { Router } = require("express");
const multer = require("multer");
const {
  registerDoctorController,
  loginDoctorController,
  updateDoctorProfileController,
  uploadDoctorProfileImage,
} = require("../controllers/doctor.controller.js");
const { authenticateDoctor } = require("../middlewares/authMiddleware.js");
const { profileImageUpload } = require("../configs/multer.js");

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
router.post("/registration", registerDoctorController);
router.post("/login", loginDoctorController);
router.put(
  "/profile/update",
  authenticateDoctor,
  updateDoctorProfileController
);
router.post(
  "/profile-image",
  authenticateDoctor,
  upload.single("file"),
  uploadDoctorProfileImage
);
module.exports = router;
