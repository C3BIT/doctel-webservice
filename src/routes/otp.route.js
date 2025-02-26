const { Router } = require('express');
const { sendOtpController } = require('../controllers/otp.controller');

const router = Router();

router.post('/send', sendOtpController);

module.exports = router;