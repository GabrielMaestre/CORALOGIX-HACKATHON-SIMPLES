const express = require('express');
const router = express.Router();
const logger = require('../otel/logger');
const path = require('path');

// Middleware para proteger rotas
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).send('Não autorizado. Faça login ou registre-se.');
}

// Rota protegida para completar perfil
router.get('/user', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/complete-profile.html'));
  logger.info(`[INFO] (/user) User Access`);
});

// Rota protegida para retornar a imagem do rosto da sessão
router.get('/session-face', requireAuth, (req, res) => {
  const faceImage = req.session.faceImage || null;
  res.json({ faceImage });
});

// Rota para retornar o email do usuário logado
router.get('/user-info', requireAuth, (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Não autenticado' });
  // Buscar email do usuário
  const { User } = require('../database');
  User.findByPk(req.session.userId).then(user => {
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json({ email: user.email });
  });
});

module.exports = router; 