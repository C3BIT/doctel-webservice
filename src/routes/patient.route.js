const { Router } = require('express');
const { registerPatientController, updatePatientProfileController } = require('../controllers/patient.controller');

const router = Router();

router.post('/registration', registerPatientController);
router.post('/update/profile', updatePatientProfileController);

module.exports = router;