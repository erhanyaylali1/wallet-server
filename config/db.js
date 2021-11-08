const { Sequelize } = require('sequelize');
const AssetsModel = require('../model/Assets.model');
const CurrencyModel = require('../model/Currency.model');
const UserModel = require('../model/User.model');
const AssetModel = require('../model/Asset.model');
const UserHasAssetModel = require('../model/UserHasAsset.model');
const UserTotalAssetModel = require('../model/UserTotalAsset.model');
const UserEachAssetTotalModel = require('../model/UserEachAssetTotal.model');

const sequelize = new Sequelize('wallet', 'admin', 'efes1998', {
    host: 'wallet-history.czbknzpnkjsg.us-east-2.rds.amazonaws.com',
    dialect: 'mysql'
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Assets = AssetsModel(sequelize, Sequelize);
db.Currency = CurrencyModel(sequelize, Sequelize);
db.User = UserModel(sequelize, Sequelize);
db.Asset = AssetModel(sequelize, Sequelize);
db.UserHasAssetModel = UserHasAssetModel(sequelize, Sequelize);
db.UserTotalAsset = UserTotalAssetModel(sequelize, Sequelize);
db.UserEachAssetTotal = UserEachAssetTotalModel(sequelize, Sequelize);

db.User.belongsToMany(db.Asset, { through: db.UserHasAssetModel });
db.Asset.belongsToMany(db.User, { through: db.UserHasAssetModel });

db.User.hasMany(db.UserTotalAsset, { as: "totalAssets" });
db.UserTotalAsset.belongsTo(db.User, { foreingKey: 'userId', });

db.User.hasMany(db.UserEachAssetTotal, { as: "eachAssets" });
db.UserEachAssetTotal.belongsTo(db.User, { foreingKey: 'userId', });

module.exports = db;