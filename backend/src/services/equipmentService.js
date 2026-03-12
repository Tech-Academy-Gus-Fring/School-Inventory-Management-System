const { Equipment } = require('../../models'); // Points to your models/index.js

const getEquipmentById = async (id) => {
    // findByPk is the Sequelize method for "Find By Primary Key"
    return await Equipment.findByPk(id);
};

module.exports = {
    getEquipmentById,
};