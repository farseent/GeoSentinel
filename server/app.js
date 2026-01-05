const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const { CLIENT_URL } = require('./config/env');
const checkMaintenance = require('./middleware/checkMaintenance');
// const adminRoutes = require('./routes/admin');

const app = express();
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Maintenance mode check (before routes)
app.use(checkMaintenance);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/admin', require('./routes/admin'));

// Error handling
app.use(errorHandler);

module.exports = app;