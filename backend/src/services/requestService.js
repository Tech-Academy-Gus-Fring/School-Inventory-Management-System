const { Op, fn, col } = require('sequelize');
const {
    sequelize,
    Request,
    Equipment,
    ReturnConditionLog,
    User
} = require('../../models');

const HISTORY_REQUEST_ATTRIBUTES = [
    'id',
    'user_id',
    'equipment_id',
    'quantity',
    'request_date',
    'due_date',
    'return_date',
    'status',
    'notes',
    'approved_by',
    'return_condition',
    'return_notes',
    'created_at',
    'updated_at'
];

const HISTORY_INCLUDES = [
    {
        model: Equipment,
        as: 'equipment',
        attributes: ['id', 'name', 'type', 'serial_number', 'condition', 'status']
    },
    {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email']
    },
    {
        model: User,
        as: 'approver',
        attributes: ['id', 'username', 'email']
    }
];

const buildHistoryWhereClause = (filters = {}) => {
    const { status, user_id, equipment_id, startDate, endDate } = filters;
    const whereClause = {};

    if (status) {
        whereClause.status = status;
    }

    if (user_id) {
        whereClause.user_id = user_id;
    }

    if (equipment_id) {
        whereClause.equipment_id = equipment_id;
    }

    if (startDate || endDate) {
        whereClause.request_date = {};

        if (startDate) {
            whereClause.request_date[Op.gte] = new Date(startDate);
        }

        if (endDate) {
            whereClause.request_date[Op.lte] = new Date(endDate);
        }
    }

    return whereClause;
};

/**
 * Creates a new borrow request with full validation
 */
const createBorrowRequest = async (requestData) => {
    const equipment = await Equipment.findByPk(requestData.equipment_id);

    if (!equipment) {
        const error = new Error('Equipment not found');
        error.statusCode = 404;
        throw error;
    }

    if (equipment.status !== 'available') {
        const error = new Error('Equipment is not available for borrowing');
        error.statusCode = 400;
        throw error;
    }

    if (!Number.isInteger(requestData.quantity) || requestData.quantity < 1) {
        const error = new Error('Quantity must be a positive integer');
        error.statusCode = 400;
        throw error;
    }

    if (requestData.quantity > equipment.quantity) {
        const error = new Error('Requested quantity exceeds available inventory');
        error.statusCode = 400;
        throw error;
    }

    return Request.create({
        user_id: requestData.user_id,
        equipment_id: requestData.equipment_id,
        quantity: requestData.quantity,
        request_date: requestData.request_date,
        due_date: requestData.due_date,
        notes: requestData.notes,
        status: 'pending'
    });
};

/**
 * Fetches requests for the logged-in user
 */
const getMyRequests = async (userId) => {
    return Request.findAll({
        where: { user_id: userId },
        include: [{
            model: Equipment,
            as: 'equipment',
            attributes: ['id', 'name', 'type', 'serial_number', 'condition']
        }],
        order: [['created_at', 'DESC']]
    });
};

/**
 * Admin/teacher: Approves a request and updates inventory
 */
const approveRequest = async (requestId, approverId) => {
    return sequelize.transaction(async (transaction) => {
        const request = await Request.findByPk(requestId, {
            include: [{ model: Equipment, as: 'equipment' }],
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!request) {
            const error = new Error('Request not found');
            error.statusCode = 404;
            throw error;
        }

        if (request.status !== 'pending') {
            const error = new Error('Only pending requests can be approved');
            error.statusCode = 400;
            throw error;
        }

        if (!request.equipment || request.equipment.status !== 'available') {
            const error = new Error('Equipment is no longer available');
            error.statusCode = 400;
            throw error;
        }

        if (request.quantity > request.equipment.quantity) {
            const error = new Error('Requested quantity exceeds available inventory');
            error.statusCode = 400;
            throw error;
        }

        request.status = 'approved';
        request.approved_by = approverId;
        await request.save({ transaction });

        request.equipment.quantity -= request.quantity;
        request.equipment.status = request.equipment.quantity === 0 ? 'checked_out' : 'available';
        await request.equipment.save({ transaction });

        return request;
    });
};

/**
 * Admin/teacher: Rejects a request
 */
const rejectRequest = async (requestId, rejectorId, reason) => {
    const request = await Request.findByPk(requestId);

    if (!request) {
        const error = new Error('Request not found');
        error.statusCode = 404;
        throw error;
    }

    if (request.status !== 'pending') {
        const error = new Error('Only pending requests can be rejected');
        error.statusCode = 400;
        throw error;
    }

    request.approved_by = rejectorId;
    if (reason) {
        request.notes = reason;
    }

    request.status = 'rejected';
    await request.save();

    return request;
};

/**
 * User: Returns equipment and records the condition log
 */
const returnRequest = async (requestId, userId, condition, notes) => {
    return sequelize.transaction(async (transaction) => {
        const request = await Request.findByPk(requestId, {
            include: [{ model: Equipment, as: 'equipment' }],
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!request) {
            const error = new Error('Request not found');
            error.statusCode = 404;
            throw error;
        }

        if (request.user_id !== userId) {
            const error = new Error('You can only return your own requests');
            error.statusCode = 400;
            throw error;
        }

        if (request.status !== 'approved') {
            const error = new Error('Only approved requests can be returned');
            error.statusCode = 400;
            throw error;
        }

        request.status = 'returned';
        request.return_date = new Date();
        request.return_condition = condition;
        request.return_notes = notes || null;
        await request.save({ transaction });

        request.equipment.quantity += request.quantity;
        request.equipment.condition = condition;
        request.equipment.status = condition === 'damaged' ? 'under_repair' : 'available';
        await request.equipment.save({ transaction });

        await ReturnConditionLog.create({
            request_id: request.id,
            equipment_id: request.equipment_id,
            condition,
            notes: notes || null,
            recorded_at: request.return_date
        }, { transaction });

        return request;
    });
};

/**
 * BE-021: Borrowing history by equipment
 */
const getEquipmentHistory = async (equipmentId) => {
    return Request.findAll({
        where: { equipment_id: equipmentId },
        attributes: HISTORY_REQUEST_ATTRIBUTES,
        include: HISTORY_INCLUDES,
        order: [['request_date', 'DESC'], ['created_at', 'DESC']]
    });
};

/**
 * BE-022: Usage Report
 */
const getUsageReport = async (filters = {}) => {
    const whereClause = buildHistoryWhereClause(filters);

    return Request.findAll({
        where: whereClause,
        attributes: [
            'equipment_id',
            [fn('COUNT', col('Request.id')), 'total_requests'],
            [fn('SUM', col('Request.quantity')), 'total_quantity_borrowed']
        ],
        include: [{
            model: Equipment,
            as: 'equipment',
            attributes: ['id', 'name', 'type', 'serial_number']
        }],
        group: ['Request.equipment_id', 'equipment.id'],
        order: [[fn('COUNT', col('Request.id')), 'DESC']]
    });
};

/**
 * BE-023: Request history report
 */
const getHistoryReport = async (filters = {}) => {
    const whereClause = buildHistoryWhereClause(filters);

    return Request.findAll({
        where: whereClause,
        attributes: HISTORY_REQUEST_ATTRIBUTES,
        include: HISTORY_INCLUDES,
        order: [['request_date', 'DESC'], ['created_at', 'DESC']]
    });
};

const getRequestConditionHistory = async (requestId) => {
    const request = await Request.findByPk(requestId);

    if (!request) {
        const error = new Error('Request not found');
        error.statusCode = 404;
        throw error;
    }

    return ReturnConditionLog.findAll({
        where: { request_id: requestId },
        include: [
            {
                model: Request,
                as: 'request',
                attributes: ['id', 'user_id', 'quantity', 'request_date', 'due_date', 'return_date', 'status']
            },
            {
                model: Equipment,
                as: 'equipment',
                attributes: ['id', 'name', 'type', 'serial_number']
            }
        ],
        order: [['recorded_at', 'DESC'], ['created_at', 'DESC']]
    });
};

const getUserHistory = async (userId) => {
    return Request.findAll({
        where: { user_id: userId },
        attributes: HISTORY_REQUEST_ATTRIBUTES,
        include: HISTORY_INCLUDES,
        order: [['request_date', 'DESC'], ['created_at', 'DESC']]
    });
};

module.exports = {
    createBorrowRequest,
    getMyRequests,
    approveRequest,
    rejectRequest,
    returnRequest,
    getEquipmentHistory,
    getUsageReport,
    getHistoryReport,
    getRequestConditionHistory,
    getUserHistory
};
