const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');
const redis = require('../src/config/redis');

describe('Task Queue API', () => {
  beforeEach(async () => {
    // Clear Redis queues before each test
    const keys = await redis.keys('queue:*');
    if (keys.length > 0) {
      await redis.del(keys);
    }
  });

  afterAll(async () => {
    await taskService.cleanup();
  });

  test('POST /task should queue task successfully', async () => {
    const response = await request(app)
      .post('/task')
      .send({ user_id: '123' });
    
    expect(response.statusCode).toBe(202);
    expect(response.body).toHaveProperty('message', 'Task queued successfully');
    expect(response.body).toHaveProperty('worker_pid');
  });

  test('POST /task should reject request without user_id', async () => {
    const response = await request(app)
      .post('/task')
      .send({});
    
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error', 'user_id is required');
  });

  test('GET /health should return healthy status', async () => {
    const response = await request(app)
      .get('/health');
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('pid');
    expect(response.body).toHaveProperty('uptime');
  });

  test('Rate limiting should work correctly', async () => {
    const userId = '123';
    const requests = Array(25).fill().map(() => 
      request(app)
        .post('/task')
        .send({ user_id: userId })
    );
    
    const responses = await Promise.all(requests);
    
    // All requests should be accepted
    responses.forEach(response => {
      expect(response.statusCode).toBe(202);
    });

    // Check queue length
    const queueLength = await redis.llen(`queue:${userId}`);
    expect(queueLength).toBeGreaterThan(0);
  });
});