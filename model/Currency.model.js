module.exports = (sequelize, DataTypes) => {

    const Currency = sequelize.define('Currency', {
        id: {
            primaryKey: true,
            type: DataTypes.DOUBLE,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
        },
        currentPrice: {            
            type: DataTypes.STRING,
        }, 
        totalAsset: {            
            type: DataTypes.DOUBLE,
        }, 
        date: {
            type: DataTypes.STRING,
        }       
    },{
      freezeTableName: true
    });  

    return Currency;
};