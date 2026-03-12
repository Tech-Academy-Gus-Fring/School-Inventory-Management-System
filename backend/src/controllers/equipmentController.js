const equipmentService = require('../services/equipmentService.js');

const getEquipmentDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const equipment = await equipmentService.getEquipmentById(id);

        // Acceptance Criteria: Invalid ID returns 404
        if (!equipment) {
            return res.status(404).json({
                message: `Equipment with ID ${id} not found`
            });
        }

        // Success: returns equipment details
        return res.status(200).json(equipment);
    } catch (error) {
        console.error("Error fetching equipment:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = {
    getEquipmentDetails,
};