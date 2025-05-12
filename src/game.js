const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const http = require('http');
const cors = require('cors');
const path = require('path');

//require('./otel/otel-logs');
const logger = require('./logger');

const app = express();
const port = 3001;
const server = http.createServer(app);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  name: 'connect.sid',
  secret: 'coralogix_zzVVc2hcWtJr9jrEsF2oos_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000, sameSite: 'lax' },
}));

app.set('trust proxy', true);

app.use(cors({
  origin: 'http://3.88.216.174:30800',
  credentials: true
}));

app.use(express.static(__dirname + '/public'));

// Importação das rotas
const gameRoutes = require('./routes/game');
app.use('/', gameRoutes);

app.get('/game', (req, res) => {
  if (!req.session.userId) {
    req.session.userId = Math.random().toString(36).substr(2, 9);
  }
  res.sendFile(path.join(__dirname, '../public/game.html'));
  logger.info(`[INFO] (/game) User Access`);
});

// Inicia o servidor HTTP
server.listen(port, () => {
  logger.info(`[INFO] (System) Server (game) Started - localhost:${port}`);
});

// Importa e inicializa o servidor WebSocket
require('./gameSocket')(server);