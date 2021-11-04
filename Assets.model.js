module.exports = (sequelize, DataTypes) => {

    const Assets = sequelize.define('Assets', {
        id: {
            primaryKey: true,
            type: DataTypes.DOUBLE,
            autoIncrement: true,
        },
        totalAssets: {            
            type: DataTypes.DOUBLE,
        }, 
        date: {
            type: DataTypes.STRING,
        }       
    },{
      freezeTableName: true
    });  

    return Assets;
};