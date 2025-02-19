const { Router } = require('express');
const { registerDoctorController, loginDoctorController } = require('../controllers/doctor.controller.js');

const router = Router();

router.post('/registration', registerDoctorController);
router.post("/login", loginDoctorController);

module.exports = router;