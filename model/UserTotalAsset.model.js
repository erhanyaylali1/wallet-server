module.exports = (sequelize, DataTypes) => {

    const UserTotalAsset = sequelize.define('UserTotalAsset', {
        id: {
            primaryKey: true,
            type: DataTypes.DOUBLE,
            autoIncrement: true,
        },
        date: {
            type: DataTypes.STRING,
        },
        totalAssets: {            
            type: DataTypes.STRING,
        }
    },{
      freezeTableName: true
    });  

    return UserTotalAsset;
};