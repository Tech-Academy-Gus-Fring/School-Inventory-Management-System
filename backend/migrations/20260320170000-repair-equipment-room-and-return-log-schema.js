'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const roomIdColumn = await queryInterface.describeTable('equipment').then(
      (table) => table.room_id,
      () => null
    );

    if (!roomIdColumn) {
      await queryInterface.addColumn('equipment', 'room_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'rooms',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }

    const returnLogTable = await queryInterface.describeTable('return_condition_logs');
    if (returnLogTable.request_id && returnLogTable.request_id.allowNull === false) {
      await queryInterface.changeColumn('return_condition_logs', 'request_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'requests',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const roomIdColumn = await queryInterface.describeTable('equipment').then(
      (table) => table.room_id,
      () => null
    );

    if (roomIdColumn) {
      await queryInterface.removeColumn('equipment', 'room_id');
    }

    const returnLogTable = await queryInterface.describeTable('return_condition_logs');
    if (returnLogTable.request_id && returnLogTable.request_id.allowNull === true) {
      await queryInterface.changeColumn('return_condition_logs', 'request_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'requests',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });
    }
  }
};
