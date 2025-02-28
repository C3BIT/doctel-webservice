const { Router } = require("express");
const {
  registerDoctorController,
  loginDoctorController,
  updateDoctorProfileController,
  uploadDoctorProfileImage,
} = require("../controllers/doctor.controller.js");
const { authenticateDoctor } = require("../middlewares/authMiddleware.js");
const { profileImageUpload } = require("../configs/multer.js");

const router = Router();

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
  profileImageUpload.single("profileImage"),
  uploadDoctorProfileImage
);
module.exports = router;
