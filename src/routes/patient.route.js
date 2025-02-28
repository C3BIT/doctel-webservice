const { Router } = require('express');
const { registerPatientController, updatePatientProfileController, loginPatientController } = require('../controllers/patient.controller');
const { authenticatePatient } = require('../middlewares/authMiddleware');

const router = Router();

router.post('/registration', registerPatientController);
router.post('/login', loginPatientController);
router.put('/update/profile', authenticatePatient, updatePatientProfileController);

module.exports = router;