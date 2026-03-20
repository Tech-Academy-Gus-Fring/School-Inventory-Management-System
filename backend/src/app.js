const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/errorHandler');

// Импорт на маршрутите
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const requestRoutes = require('./routes/requestRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');
const spatialRoutes = require('./routes/spatialRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Дефиниране на API маршрутите
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/equipment', equipmentRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/request', requestRoutes);
app.use('/requests', requestRoutes);
app.use('/api/request', requestRoutes);
app.use('/api/requests', requestRoutes);
app.use('/reports', reportRoutes);
app.use('/api/reports', reportRoutes);
app.use('/users', userRoutes);
app.use('/api/users', userRoutes);
app.use('/spatial', spatialRoutes);
app.use('/api/spatial', spatialRoutes);

// Базов маршрут за проверка
app.get('/', (req, res) => {
    res.send('School Inventory Management System API is running...');
});

// Error handling middleware (по избор, но силно препоръчително)
app.use(errorHandler);

module.exports = app;
