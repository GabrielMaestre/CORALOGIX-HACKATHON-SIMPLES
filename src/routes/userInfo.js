const express = require('express');
const router = express.Router();

function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).send('Não autorizado. Faça login ou registre-se.');
}

// Rota para retornar o email do usuário logado
router.get('/user-info', requireAuth, (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Não autenticado' });
  const { User } = require('../database');
  User.findByPk(req.session.userId).then(user => {
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json({ email: user.email });
  });
});

module.exports = router; 