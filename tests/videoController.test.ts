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

describe('Video Merging API', () => {
  it('should merge multiple videos successfully', async () => {
    const res = await request(app)
      .post('/videos/merge')
      .send({
        videoIds: [1, 2], // Assuming these video IDs exist in the seeded database
      })
      .set('x-api-key', process.env.API_TOKEN || '');
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('name', 'Merged Video');
  });

  it('should return 400 for less than two video IDs', async () => {
    const res = await request(app)
      .post('/videos/merge')
      .send({ videoIds: [1] })
      .set('x-api-key', process.env.API_TOKEN || '');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Provide at least two video IDs to merge');
  });
});


describe('Link Sharing API', () => {
  it('should generate a sharable link successfully', async () => {
    const res = await request(app)
      .post('/videos/share')
      .send({
        videoId: 1, // Assuming this video ID exists in the seeded database
        expiresInHours: 2,
      })
      .set('x-api-key', process.env.API_TOKEN || '');
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('link');
    expect(res.body).toHaveProperty('expiresAt');
  });

  it('should return 404 for an expired or invalid link', async () => {
    const res = await request(app)
      .get('/videos/shared/invalid-link')
      .set('x-api-key', process.env.API_TOKEN || '');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Link expired or invalid');
  });
});


