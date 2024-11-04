const express = require('express');
const taskRoutes = require('./routes/taskRoutes');
require('dotenv').config();

const app = express();

// Use routes
app.use('/', taskRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;