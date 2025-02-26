const { Router } = require('express');
const { registerPatientController } = require('../controllers/patient.controller');

const router = Router();

router.post('/registration', registerPatientController);

module.exports = router;