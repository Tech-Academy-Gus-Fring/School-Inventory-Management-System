const { Equipment } = require('../../models'); // Points to your models/index.js

const getEquipmentById = async (id) => {
    // findByPk is the Sequelize method for "Find By Primary Key"
    return await Equipment.findByPk(id);
};

module.exports = {
    getEquipmentById,
};
const { Equipment } = require('../../models');
const { Op } = require('sequelize');

const getAllEquipment = async (filters) => {
    const { search, type, status } = filters;
    let whereClause = {};

    // Търсене по име ИЛИ сериен номер (case-insensitive)
    if (search) {
        whereClause[Op.or] = [
            { name: { [Op.iLike]: `%${search}%` } },
            { serial_number: { [Op.iLike]: `%${search}%` } }
        ];
    }

    // Филтър по точно съвпадение на тип или статус
    if (type) whereClause.type = type;
    if (status) whereClause.status = status;

    return await Equipment.findAll({ where: whereClause });
};

module.exports = { getAllEquipment };
