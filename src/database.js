const { Sequelize, DataTypes } = require('sequelize');

require('dotenv').config()

const sequelize = new Sequelize('coralogix', 'code', '!root123@', {
  host: process.env.DB_HOST,
  dialect: 'mysql',
});

const User = sequelize.define('User', {
  nome: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  senha: { type: DataTypes.STRING, allowNull: false },
});

module.exports = { sequelize, User };