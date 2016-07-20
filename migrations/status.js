module.exports = {
  // upgrade database
  // use queryinterface to modify database
  up: function(queryInterface, Sequelize) {
    // make new table
    queryInterface.createTable(
    'status',
    {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      state: { type: Sequelize.STRING, allowNull: true },
      created_person_id: { type: Sequelize.INTEGER, allowNull: true, references: { model:"person", key: "id" } },
      created_at: { type: Sequelize.DATE, allowNull: true },
      updated_at: { type: Sequelize.DATE, allowNull: true },
      deleted_at: { type: Sequelize.DATE, allowNull: true }
    },
    {
      engine: 'INNODB', // default: 'InnoDB'
      charset: 'utf8',
      collate: 'utf8_general_ci'
    }
  ) 
  },
  // downgrades database (reverse changes)
  down: function(queryInterface, Sequelize) {
    queryInterface.dropTable('status');
  }
}