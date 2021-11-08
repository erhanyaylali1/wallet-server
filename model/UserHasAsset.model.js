module.exports = (sequelize, DataTypes) => {

    const UserHasAsset = sequelize.define('UserHasAsset', {
        quantity: {
            type: DataTypes.STRING,
            defaultValue: 0
        },
    },{
      freezeTableName: true
    });  

    return UserHasAsset;
};