const express = require('express');
const router = express.Router();
const logger = require('../otel/logger');
const path = require('path');

// Rota de login (GET)
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
  logger.info(`[INFO] (/login) User Access`);
});

module.exports = router; 