const equipmentService = require('../services/equipmentService');

const getEquipment = async (req, res) => {
    try {
        const filters = req.query; // Тук идват search и type от URL-а
        const list = await equipmentService.getAllEquipment(filters);
        res.status(200).json(list);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch equipment" });
    }
};

module.exports = { getEquipment };