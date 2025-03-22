const { Router } = require("express");
const multer = require("multer");
const {
  registerPatientController,
  updatePatientProfileController,
  loginPatientController,
  getPatientProfileController,
} = require("../controllers/patient.controller");
const { authenticatePatient } = require("../middlewares/authMiddleware");

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
router.post("/registration", registerPatientController);
router.post("/login", loginPatientController);
router.put(
  "/update/profile",
  authenticatePatient,
  upload.single("file"),
  updatePatientProfileController
);

router.get("/profile", authenticatePatient, getPatientProfileController);
module.exports = router;
