const { Router } = require('express');
const { registerDoctorController, loginDoctorController } = require('../controllers/doctor.controller.js');
const { authenticateDoctor } = require('../middlewares/authMiddleware.js');

const router = Router();

router.post('/registration', registerDoctorController);
router.post("/login", loginDoctorController);
router.put("/profile/update", authenticateDoctor, updateDoctorProfileController);

module.exports = router;