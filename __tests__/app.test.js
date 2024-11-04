const request = require('supertest');
const app = require('../app');

describe('Task Queue API', () => {
  test('POST /task should queue task successfully', async () => {
    const response = await request(app)
      .post('/task')
      .send({ user_id: '123' });
    
    expect(response.statusCode).toBe(202);
    expect(response.body).toHaveProperty('message', 'Task queued successfully');
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
  });
});