"use strict";

module.exports = function(sequelize, Sequelize) {
  var Status = sequelize.define('status', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      state: { type: Sequelize.STRING, allowNull: true },
      created_person_id: { type: Sequelize.INTEGER, allowNull: true, references: { model:"person", key: "id" } },
      created_at: { type: Sequelize.DATE, allowNull: true },
      updated_at: { type: Sequelize.DATE, allowNull: true },
      deleted_at: { type: Sequelize.DATE, allowNull: true }
  }, {
    // no spacing, use '_'
    underscored: true,
     // don't delete database entries but set the newly added attribute deletedAt
    // to the current date (when deletion was done). paranoid will only work if
    // timestamps are enabled
    paranoid: true,
    // disable modification of table name
    freezeTableName: true,
    instanceMethods: {},
    classMethods: {
      // Associates profile to person through key pid
      associate: function(models) {
        // use belongsto when foreign key is on this table
        Status.belongsTo(models.Person, {foreignKey: 'created_person_id'})
      },
      // Creates instance of profile class 
    createOne: function(data,callback){ 
      Status.create({
        state: data.state,
        created_person_id: data.person_id,
      })
      // newperson is the newly created instance of profile class
      .then(function(newStatus) {
      // first argument to callback shows that there is no errors; second is 
      // return value
          callback(null,newStatus);
        })
      // error handling
        .catch(function(error) {
          callback(error);
        });
    },
    updateOne: function(id,data,callback){ 
      Status.findOne({where:{id:id}})
      // p is first entry of profile table with pid: id
      // returns instance, not object
        .then(function (p) { 
          p.updateAttributes(data)
            .then(function(up) {
              callback(null,up);
            })
            .catch(function(error) {
                callback(error);
              });
        }).catch(function(error) {
            callback(error);
          });
    }
    },
  });
  return Status;
};
