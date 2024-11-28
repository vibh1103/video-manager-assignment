import { Request, Response } from 'express';
import { uploadVideo, trimVideo, mergeVideos } from '../../src/Controllers/videoController';
import { findUniqueVideo, createVideo, findMultipleVideo } from '../../src/services/db.service';
import { ffmpegMerge, ffmpegTrim, getVideoDuration } from '../../src/services/ffmpeg.service';
import fs from 'fs/promises';  
import { MAX_VIDEO_DURATION_SECS, MIN_VIDEO_DURATION_SECS } from '../../src/config/env.config';

jest.mock('../../src/services/db.service');
jest.mock('../../src/services/ffmpeg.service');
jest.mock('fs/promises');

describe('Video Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadVideo', () => {
    it('should upload a video and return video data on success', async () => {
      const mockRequest = {
        file: {
          originalname: 'test-video.mp4',
          size: 5000000,
          path: '/tmp/test-video.mp4'
        }
      } as Request;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as unknown as Response;

      const mockDuration = 120; 
      const mockCreateVideo = { id: 1, ...mockRequest.file, duration: mockDuration };

      fs.unlink = jest.fn().mockResolvedValue(undefined); 
      fs.stat = jest.fn().mockResolvedValue({ size: 5000000 }); 

      (findUniqueVideo as jest.Mock).mockResolvedValue(null); 
      (ffmpegMerge as jest.Mock).mockResolvedValue(undefined); 
      (createVideo as jest.Mock).mockResolvedValue(mockCreateVideo);

      const getVideoDuration = jest.fn().mockResolvedValue(mockDuration);

      await uploadVideo(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining(mockCreateVideo));
    });

    it('should return an error if video duration is out of bounds', async () => {
      const mockRequest = {
        file: {
          originalname: 'test-video.mp4',
          size: 5000000,
          path: '/tmp/test-video.mp4'
        }
      } as Request;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as unknown as Response;

      const mockDuration = 2;

      (getVideoDuration as jest.Mock).mockResolvedValue(mockDuration);
      (fs.unlink as jest.Mock).mockResolvedValue({})

      await uploadVideo(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: `Video duration must be between ${MIN_VIDEO_DURATION_SECS} and ${MAX_VIDEO_DURATION_SECS} seconds.`
      });
    });
  });

  describe('trimVideo', () => {
    it('should trim a video and return the trimmed video', async () => {
      const mockRequest = {
        body: {
          videoId: 1,
          start: 10,
          end: 50
        }
      } as Request;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as unknown as Response;

      const mockVideo = { id: 1, path: '/tmp/test-video.mp4', duration: 100, name: 'test-video.mp4' };

      
      (findUniqueVideo as jest.Mock).mockResolvedValue(mockVideo);
      (ffmpegTrim as jest.Mock).mockResolvedValue(undefined); 
      fs.stat = jest.fn().mockResolvedValue({ size: 1000000 });
      (createVideo as jest.Mock).mockResolvedValue({ id: 1, name: 'test-video_trimmed.mp4' });

      await trimVideo(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ name: 'test-video_trimmed.mp4' }));
    });

    it('should return an error if the video is not found', async () => {
      const mockRequest = {
        body: {
          videoId: 9999,
          start: 10,
          end: 50
        }
      } as Request;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as unknown as Response;

      (findUniqueVideo as jest.Mock).mockResolvedValue(null); 

      await trimVideo(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Video not found' });
    });
  });

  describe('mergeVideos', () => {
    it('should merge videos and return the merged video', async () => {
      const mockRequest = {
        body: {
          videoIds: [1, 2]
        }
      } as Request;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as unknown as Response;

      const mockVideos = [
        { id: 1, path: '/tmp/video1.mp4', size: 5000000, duration: 100 },
        { id: 2, path: '/tmp/video2.mp4', size: 5000000, duration: 100 }
      ];

      (findMultipleVideo as jest.Mock).mockResolvedValue(mockVideos);
      (ffmpegMerge as jest.Mock).mockResolvedValue(undefined); 
      fs.writeFile = jest.fn().mockResolvedValue(undefined);
      fs.unlink = jest.fn().mockResolvedValue(undefined);
      (createVideo as jest.Mock).mockResolvedValue({ id: 1, name: 'Merged Video' });

      await mergeVideos(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ name: 'Merged Video' }));
    });

    it('should return an error if one or more videos are not found', async () => {
      const mockRequest = {
        body: {
          videoIds: [1, 2]
        }
      } as Request;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as unknown as Response;

      (findMultipleVideo as jest.Mock).mockResolvedValue(undefined); 

      await mergeVideos(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'One or more videos not found' });
    });
  });
});
