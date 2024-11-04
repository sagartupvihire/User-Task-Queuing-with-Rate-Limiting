const Redis = require('ioredis');
require('dotenv').config();

// Create a mock Redis client for testing
const isTesting = process.env.NODE_ENV === 'test';

const redis = isTesting
  ? new Redis({ 
      host: 'localhost',
      port: 6379,
      lazyConnect: true,
      showFriendlyErrorStack: true
    })
  : new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      showFriendlyErrorStack: true
    });

redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

module.exports = redis;