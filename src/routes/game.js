const express = require('express');
const router = express.Router();
const logger = require('../otel/logger');
const path = require('path');

// Rota para acessar o game (sem autenticação, cria sessão temporária)
router.get('/game', (req, res) => {
  if (!req.session.userId) {
    req.session.userId = Math.random().toString(36).substr(2, 9);
  }
  res.sendFile(path.join(__dirname, '../public/game.html'));
  logger.info(`[INFO] (/game) User Access`);
});

// Rota para receber a imagem do rosto (sem autenticação, salva na sessão temporária)
router.post('/game', (req, res) => {
  const { faceImage } = req.body;
  if (!faceImage) {
    return res.status(400).json({ error: 'Imagem não enviada.' });
  }
  req.session.faceImage = faceImage;
  // A variável image foi removida, pois agora está em outro arquivo
  logger.info(`[INFO] (/game) Face image received for user ${req.session.userId}`);
  return res.status(200).json({ message: 'Imagem recebida com sucesso!' });
});

module.exports = router; 