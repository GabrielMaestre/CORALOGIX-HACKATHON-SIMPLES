const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { sequelize } = require('./database');
const cors = require('cors');
const http = require('http');
const path = require('path');

//require('./otel/otel-logs');
const logger = require('./logger');

const app = express();
const port = 3000;
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
  origin: '*',
  credentials: true
}));

app.use('/static', express.static(path.join(__dirname, 'public')));

// Importação das rotas (exceto game)
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const testRoutes = require('./routes/test');
const pagesRoutes = require('./routes/pages');
const registerPageRoutes = require('./routes/registerPage');
const loginPageRoutes = require('./routes/loginPage');
const userInfoRoutes = require('./routes/userInfo');
const sessionFaceRoutes = require('./routes/sessionFace');

app.use('/', authRoutes);
app.use('/', userRoutes);
app.use('/', testRoutes);
app.use('/', pagesRoutes);
app.use('/', registerPageRoutes);
app.use('/', loginPageRoutes);
app.use('/', userInfoRoutes);
app.use('/', sessionFaceRoutes);

sequelize.sync().then(() => {
  server.listen(port, () => {
    logger.info(`[INFO] (System) Server Started - localhost:${port}`);
  });
}).catch((err) => {
  logger.error(`[ERROR] (System) Sequelize sync failed: ${err}`);
});