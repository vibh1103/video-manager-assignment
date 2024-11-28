import request from 'supertest';
import app from '../src/index'; // Adjust to point to your app
import prisma from '../prisma/client';

describe('Integration Tests for Video Processing API', () => {
  let videoId: number;
  let sharedLink: string;

  // Before running the tests, ensure the database is clean
  beforeAll(async () => {
    await prisma.video.deleteMany({});
    await prisma.sharedLink.deleteMany({});
  });

  it('should upload a video', async () => {
    const res = await request(app)
      .post('/videos/upload')
      .set('Authorization', process.env.API_TOKEN || '')
      .attach('file', 'test_assets/sample.mp4') // Replace with an actual test file
      .field('maxSize', 10) // 10 MB
      .field('minDuration', 5) // 5 seconds
      .field('maxDuration', 120); // 2 minutes

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    videoId = res.body.id; // Save the video ID for further tests
  });

  it('should trim the uploaded video', async () => {
    const res = await request(app)
      .post('/videos/trim')
      .set('Authorization', process.env.API_TOKEN || '')
      .send({
        videoId,
        start: 5, // Trim 5 seconds from the start
        end: 20, // Trim to 20 seconds
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  it('should merge two videos', async () => {
    // Upload another video for merging
    const resUpload = await request(app)
      .post('/videos/upload')
      .set('Authorization', process.env.API_TOKEN || '')
      .attach('file', 'test_assets/sample2.mp4') // Replace with an actual test file
      .field('maxSize', 10)
      .field('minDuration', 5)
      .field('maxDuration', 120);

    const videoId2 = resUpload.body.id;

    const resMerge = await request(app)
      .post('/videos/merge')
      .set('Authorization', process.env.API_TOKEN || '')
      .send({
        videoIds: [videoId, videoId2],
      });

    expect(resMerge.status).toBe(201);
    expect(resMerge.body).toHaveProperty('id'); // ID of the merged video
  });

  it('should generate a sharable link', async () => {
    const res = await request(app)
      .post('/videos/share')
      .set('Authorization', process.env.API_TOKEN || '')
      .send({
        videoId,
        expiresInHours: 1,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('link');
    sharedLink = res.body.link; // Save the link for the next test
  });

  it('should access the sharable link', async () => {
    const res = await request(app).get(`/videos/shared/${sharedLink}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('video');
  });

  it('should invalidate an expired sharable link', async () => {
    // Simulate expiry by setting system time forward (mocking expiry would be better)
    await prisma.sharedLink.update({
      where: { link: sharedLink.split('/').pop() },
      data: { expiresAt: new Date(Date.now() - 1000) }, // Set expiry to the past
    });

    const res = await request(app).get(`/videos/shared/${sharedLink}`);
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Link expired or invalid');
  });
});
