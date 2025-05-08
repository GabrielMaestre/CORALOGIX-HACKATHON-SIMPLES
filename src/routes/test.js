const express = require('express');
const router = express.Router();
const logger = require('../otel/logger');

// Teste simples
router.get('/test', async (req, res) => {
  const valueRandom = Math.floor(Math.random() * 10);
  logger.info(`[INFO] (/test) customAtribute1: 100, customAtribute2: ["A","B"] | {data:"TEST-DATA"}, "randomValue": ${valueRandom}`);
  res.send(`Hello, Coralogix via OpenTelemetry! | [${valueRandom}]`);
  logger.info(`[INFO] (/test) User Access`);
});

// Teste de throughput: retorna rapidamente
router.get('/test/throughput', (req, res) => {
  logger.info(`[THROUGHPUT] Fast response`);
  res.json({ status: 'ok', ts: Date.now() });
});

// Teste de erro aleatório
router.get('/test/random-error', (req, res) => {
  if (Math.random() < 0.5) {
    logger.error(`[ERROR] (/test/random-error) Simulated random error`);
    return res.status(500).json({ error: 'Erro aleatório simulado!' });
  }
  logger.info(`[INFO] (/test/random-error) Success`);
  res.json({ status: 'success', ts: Date.now() });
});

// Teste de sucesso garantido
router.get('/test/success', (req, res) => {
  logger.info(`[INFO] (/test/success) Always success`);
  res.json({ status: 'success', ts: Date.now() });
});

// Teste de erro garantido
router.get('/test/fail', (req, res) => {
  logger.error(`[ERROR] (/test/fail) Always fail`);
  res.status(500).json({ error: 'Erro garantido!' });
});

// Teste de requisições aleatórias (sucesso ou erro)
router.get('/test/random', (req, res) => {
  const n = Math.floor(Math.random() * 100);
  if (n % 2 === 0) {
    logger.info(`[INFO] (/test/random) Random success`);
    res.json({ status: 'random-success', value: n });
  } else {
    logger.error(`[ERROR] (/test/random) Random error`);
    res.status(400).json({ error: 'Random error', value: n });
  }
});

module.exports = router; 