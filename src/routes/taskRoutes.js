const express = require('express');
const taskService = require('../services/taskService');

const router = express.Router();

router.post('/task', express.json(), async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    await taskService.addToQueue(user_id, Date.now());
    res.status(202).json({ 
      message: 'Task queued successfully',
      worker_pid: process.pid
    });
  } catch (error) {
    console.error('Error processing task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    pid: process.pid,
    uptime: process.uptime()
  });
});

module.exports = router;