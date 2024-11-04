const express = require('express');
const Redis = require('ioredis');
const winston = require('winston');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Redis client setup
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

// Logger setup
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'tasks.log' })
  ]
});

// Task processing function
async function task(user_id) {
  const message = `${user_id}-task completed at-${Date.now()}`;
  await logger.info(message);
  return message;
}

// Rate limiter middleware
const userRateLimiter = new Map();

const getRateLimiter = (userId) => {
  if (!userRateLimiter.has(userId)) {
    userRateLimiter.set(userId, {
      lastSecond: 0,
      tasksThisMinute: 0,
      lastMinute: Math.floor(Date.now() / 60000)
    });
  }
  return userRateLimiter.get(userId);
};

// Queue management
async function addToQueue(userId, timestamp) {
  await redis.rpush(`queue:${userId}`, timestamp);
}

async function processQueue(userId) {
  const now = Date.now();
  const limiter = getRateLimiter(userId);
  const currentMinute = Math.floor(now / 60000);

  // Reset minute counter if we're in a new minute
  if (currentMinute > limiter.lastMinute) {
    limiter.tasksThisMinute = 0;
    limiter.lastMinute = currentMinute;
  }

  // Check rate limits
  if (now - limiter.lastSecond < 1000 || limiter.tasksThisMinute >= 20) {
    return;
  }

  const nextTask = await redis.lpop(`queue:${userId}`);
  if (nextTask) {
    limiter.lastSecond = now;
    limiter.tasksThisMinute++;
    await task(userId);
    
    // Schedule next queue processing
    setTimeout(() => processQueue(userId), 1000);
  }
}

// API endpoint
app.post('/task', express.json(), async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    await addToQueue(user_id, Date.now());
    processQueue(user_id);
    res.status(202).json({ message: 'Task queued successfully' });
  } catch (error) {
    console.error('Error processing task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', pid: process.pid });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});