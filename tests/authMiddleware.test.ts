import request from 'supertest';
import app from '../src/index';

describe('Auth Middleware', () => {
  it('should return 401 if no token is provided', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('should return 200 if valid token is provided', async () => {
    const res = await request(app)
      .get('/')
      .set('Authorization', process.env.API_TOKEN || '');
    expect(res.status).toBe(200);
  });
});


