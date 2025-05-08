const express = require('express');
const router = express.Router();
const { User } = require('../database');
const logger = require('../otel/logger');
const { userSessionCounter } = require('../otel/otel.js');

// Rota de registro
router.post('/register', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Preencha todos os campos.' });
    }
    // Verifica se já existe usuário com o mesmo email
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email já cadastrado.' });
    }
    const user = await User.create({ nome, email, senha });
    req.session.userId = user.id;
    res.cookie('sessionId', req.sessionID, { httpOnly: true });
    userSessionCounter?.add?.(1, { tipo: 'register', email, ip: req.ip });
    logger.info(`[METRIC] user_sessions | tipo=register | email=${email} | ip=${req.ip}`);
    return res.status(201).json({ message: 'Usuário registrado com sucesso!', redirect: '/user' });
  } catch (err) {
    logger.error(`[ERROR] (/register) ${err}`);
    return res.status(500).json({ error: 'Erro ao registrar usuário.' });
  }
});

// Rota de login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }
  try {
    const user = await User.findOne({ where: { email, senha } });
    if (!user) {
      return res.status(401).json({ error: 'Email ou senha inválidos.' });
    }
    req.session.userId = user.id;
    res.cookie('sessionId', req.sessionID, { httpOnly: true });
    // Métrica customizada: login
    userSessionCounter.add(1, { tipo: 'login', email, ip: req.ip });
    logger.info(`[METRIC] user_sessions | tipo=login | email=${email} | ip=${req.ip}`);
    return res.status(200).json({ message: 'Login realizado com sucesso!' });
  } catch (err) {
    logger.error(`[ERROR] (/login) ${err}`);
    console.log(err);
    return res.status(500).json({ error: 'Erro ao fazer login.' });
  }
});

module.exports = router;