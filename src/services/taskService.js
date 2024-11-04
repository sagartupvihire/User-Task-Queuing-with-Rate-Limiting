const logger = require('../config/logger');
const redis = require('../config/redis');

class TaskService {
  constructor() {
    this.userRateLimiter = new Map();
    this.processingQueues = new Set();
  }

  async task(user_id) {
    const message = `${user_id}-task completed at-${Date.now()}`;
    await logger.info(message);
    return message;
  }

  getRateLimiter(userId) {
    if (!userRateLimiter.has(userId)) {
      userRateLimiter.set(userId, {
        lastSecond: 0,
        tasksThisMinute: 0,
        lastMinute: Math.floor(Date.now() / 60000)
      });
    }
    return userRateLimiter.get(userId);
  }

  async addToQueue(userId, timestamp) {
    try {
      await redis.rpush(`queue:${userId}`, timestamp);
      
      // Start processing if not already running
      if (!this.processingQueues.has(userId)) {
        this.processingQueues.add(userId);
        await this.processQueue(userId);
      }
      return true;
    } catch (error) {
      console.error('Error adding to queue:', error);
      throw error;
    }
  }

  async processQueue(userId) {
    try {
      const now = Date.now();
      const limiter = this.getRateLimiter(userId);
      const currentMinute = Math.floor(now / 60000);

      // Reset minute counter if we're in a new minute
      if (currentMinute > limiter.lastMinute) {
        limiter.tasksThisMinute = 0;
        limiter.lastMinute = currentMinute;
      }

      // Check rate limits
      if (now - limiter.lastSecond < 1000 || limiter.tasksThisMinute >= 20) {
        setTimeout(() => this.processQueue(userId), 1000);
        return;
      }

      const nextTask = await redis.lpop(`queue:${userId}`);
      if (nextTask) {
        limiter.lastSecond = now;
        limiter.tasksThisMinute++;
        await this.task(userId);
        setTimeout(() => this.processQueue(userId), 1000);
      } else {
        // No more tasks in queue
        this.processingQueues.delete(userId);
      }
    } catch (error) {
      console.error(`Error processing queue for user ${userId}:`, error);
      this.processingQueues.delete(userId);
    }
  }

  async cleanup() {
    try {
      await redis.quit();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

module.exports = new TaskService();