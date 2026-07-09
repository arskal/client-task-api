const request = require('supertest');
const app = require('../app');

describe('GET /tasks', () => {
  it('should return 401 when no token is provided', async () => {
    const response = await request(app).get('/tasks');

    expect(response.statusCode).toBe(401);
    expect(response.body).toEqual({ error: 'No token provided' });
  });
});
