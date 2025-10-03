const request = require('supertest');
const app = require('../server.js');

describe('NIMC API Tests', () => {
  it('should return health status', async () => {
    const res = await request(app)
      .get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('healthy');
  });
});