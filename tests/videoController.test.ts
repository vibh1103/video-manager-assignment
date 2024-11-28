import request from 'supertest';
import app from '../src/index';

describe('Video Upload API', () => {
  it('should upload a video successfully', async () => {
    const res = await request(app)
      .post('/videos/upload')
      .attach('video', '../uploads/test/video1.mp4')
      .set('x-api-key', process.env.API_TOKEN || '');
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('name');
  });
});

describe('Video Trimming API', () => {
  it('should trim a video successfully', async () => {
    const res = await request(app)
      .post('/videos/trim')
      .send({
        videoId: 1,
        start: 10,
        end: 20,
      })
      .set('x-api-key', process.env.API_TOKEN || '');
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('duration', 10);
  });

  it('should return 400 for invalid start and end times', async () => {
    const res = await request(app)
      .post('/videos/trim')
      .send({
        videoId: 1,
        start: 50,
        end: 10,
      })
      .set('x-api-key', process.env.API_TOKEN || '');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid start or end time. Ensure the range is within the video duration.');
  });
});
