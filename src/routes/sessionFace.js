const express = require('express');
const router = express.Router();

function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).send('Não autorizado. Faça login ou registre-se.');
}

// Rota protegida para retornar a imagem do rosto da sessão
router.get('/session-face', requireAuth, (req, res) => {
  const faceImage = req.session.faceImage || null;
  res.json({ faceImage });
});

module.exports = router; 