const { Sequelize } = require('sequelize');
const AssetsModel = require('./Assets.model');
const CurrencyModel = require('./Currency.model');

const sequelize = new Sequelize('wallet', 'admin', 'efes1998', {
    host: 'wallet-history.czbknzpnkjsg.us-east-2.rds.amazonaws.com',
    dialect: 'mysql'
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Assets = AssetsModel(sequelize, Sequelize);
db.Currency = CurrencyModel(sequelize, Sequelize);

module.exports = db;