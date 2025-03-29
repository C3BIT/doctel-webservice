const { Router } = require("express");
const multer = require("multer");
const {
  registerDoctorController,
  loginDoctorController,
  updateDoctorProfileController,
  uploadDoctorProfileImage,
  getDoctorProfileController,
  createPrescription,
} = require("../controllers/doctor.controller.js");
const { authenticateDoctor } = require("../middlewares/authMiddleware.js");

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
  upload.single("file"),
  updateDoctorProfileController
);
router.post(
  "/profile-image",
  authenticateDoctor,
  upload.single("file"),
  uploadDoctorProfileImage
);
router.get("/profile", authenticateDoctor, getDoctorProfileController);
router.post("/upload/prescription", authenticateDoctor, upload.single("file"), createPrescription);
module.exports = router;
