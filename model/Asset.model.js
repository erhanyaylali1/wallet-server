module.exports = (sequelize, DataTypes) => {

    const Asset = sequelize.define('Asset', {
        id: {
            primaryKey: true,
            type: DataTypes.DOUBLE,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
        },
        short: {            
            type: DataTypes.STRING,
        },
        price: {
            type: DataTypes.STRING,
        }
    },{
      freezeTableName: true
    });  

    return Asset;
};