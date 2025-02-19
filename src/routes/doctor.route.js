const { Router } = require('express');
const { registerDoctorController } = require('../controllers/doctor.controller.js');

const router = Router();

router.get('/registration', registerDoctorController);

module.exports = router;