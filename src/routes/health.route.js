const { Router } = require('express');
const { getHealth } = require('../controllers/health.controller.js');

const router = Router();

router.get('/health', getHealth);

module.exports = router;