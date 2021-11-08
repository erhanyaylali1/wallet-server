module.exports = (sequelize, DataTypes) => {

    const User = sequelize.define('User', {
        id: {
            primaryKey: true,
            type: DataTypes.DOUBLE,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
        },
        email: {            
            type: DataTypes.STRING,
        }, 
        password: {            
            type: DataTypes.STRING,
        }
    },{
      freezeTableName: true
    });  

    return User;
};