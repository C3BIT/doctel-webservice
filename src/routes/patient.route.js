const { Router } = require('express');
const { registerPatientController, loginPatientController } = require('../controllers/patient.controller');

const router = Router();

router.post('/registration', registerPatientController);
router.post('/login', loginPatientController);

module.exports = router;