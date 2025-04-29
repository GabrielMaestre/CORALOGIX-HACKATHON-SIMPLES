const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { sequelize, User } = require('./database');

require('./otel/otel-logs');
const logger = require('./otel/logger');

const app = express();
const port = 3000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: 'coralogix_zzVVc2hcWtJr9jrEsF2oos_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
}));
app.use(express.static(__dirname + '/public'));

// Rota de registro
app.post('/register', async (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }
  try {
    const user = await User.create({ nome, email, senha });
    req.session.userId = user.id;
    res.cookie('sessionId', req.sessionID, { httpOnly: true });
    // Redirecionar para /user após registro
    return res.status(201).json({ message: 'Usuário registrado com sucesso!', redirect: '/user' });
  } catch (err) {
    logger.error(`[ERROR] (/register) ${err}`);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Email já cadastrado.' });
    }
    return res.status(500).json({ error: 'Erro ao registrar usuário.' });
  }
});

// Rota de login
app.post('/login', async (req, res) => {
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
    return res.status(200).json({ message: 'Login realizado com sucesso!' });
  } catch (err) {
    logger.error(`[ERROR] (/login) ${err}`);
    return res.status(500).json({ error: 'Erro ao fazer login.' });
  }
});

// Middleware para proteger rotas
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).send('Não autorizado. Faça login ou registre-se.');
}

// Rota protegida para completar perfil
app.get('/user', requireAuth, (req, res) => {
  res.sendFile(__dirname + '/public/complete-profile.html');
  logger.info(`[INFO] (/user) User Access`);
});

app.get('/test', async (req, res) => {

  const valueRandom = Math.floor(Math.random() * 10);

  logger.info(`[INFO] (/test) customAtribute1: 100, customAtribute2: [\"A\",\"B\"] | {data:\"TEST-DATA\"}, "randomValue": ${valueRandom}`);

  res.send(`Hello, Coralogix via OpenTelemetry! | [${valueRandom}]`);
  logger.info(`[INFO] (/test) User Access`);
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
  logger.info(`[INFO] (/login) User Access`);
});

sequelize.sync().then(() => {
  app.listen(port, () => {
    logger.info(`[INFO] (System) Server Started - localhost:${port}`);
  });
}).catch((err) => {
  logger.error(`[ERROR] (System) Sequelize sync failed: ${err}`);
});