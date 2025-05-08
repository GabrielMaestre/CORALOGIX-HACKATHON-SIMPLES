const express = require('express');
const router = express.Router();
const logger = require('../otel/logger');
const path = require('path');

// Rota de registro (GET)
router.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/register.html'));
  logger.info(`[INFO] (/register) User Access`);
});

module.exports = router; 