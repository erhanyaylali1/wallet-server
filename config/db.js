const { Sequelize } = require('sequelize');
const UserModel = require('../model/User.model');
const AssetModel = require('../model/Asset.model');
const UserHasAssetModel = require('../model/UserHasAsset.model');
const UserTotalAssetModel = require('../model/UserTotalAsset.model');

require('dotenv').config();

const sequelize = new Sequelize(process.env.DB, process.env.USER, process.env.PASSWORD, {
    host: process.env.HOST,
    dialect: 'mysql'
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = UserModel(sequelize, Sequelize);
db.Asset = AssetModel(sequelize, Sequelize);
db.UserHasAssetModel = UserHasAssetModel(sequelize, Sequelize);
db.UserTotalAsset = UserTotalAssetModel(sequelize, Sequelize);

db.User.belongsToMany(db.Asset, { through: db.UserHasAssetModel });
db.Asset.belongsToMany(db.User, { through: db.UserHasAssetModel });

db.User.hasMany(db.UserTotalAsset, { as: "totalAssets" });
db.UserTotalAsset.belongsTo(db.User, { foreingKey: 'userId', });

module.exports = db;