module.exports = (sequelize, DataTypes) => {

    const UserEachAssetTotal = sequelize.define('UserEachAssetTotal', {
        name: {
            type: DataTypes.STRING,
        },
        currentPrice: {
            type: DataTypes.STRING,
        },
        totalAsset: {
            type: DataTypes.STRING,
        },
        date: {
            type: DataTypes.STRING,
        },
    },{
      freezeTableName: true
    });  

    return UserEachAssetTotal;
};