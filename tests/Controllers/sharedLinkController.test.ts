import { Request, Response } from 'express';
import { generateSharedLink, accessSharedLink, getSharedVideo } from '../../src/Controllers/sharedLinkController';
import * as dbService from '../../src/services/db.service';
import fs from 'fs';
import path from 'path';

jest.mock('../../src/services/db.service', () => ({
  findUniqueVideo: jest.fn(),
  createSharedLink: jest.fn(),
  findUniqueSharedLink: jest.fn()
}));
jest.mock('fs');
jest.mock('path');

describe('Shared Link Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      protocol: 'http',
      get: jest.fn().mockReturnValue('example.com')
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      pipe: jest.fn()
    };

    jest.clearAllMocks();
  });

  describe('generateSharedLink', () => {
    it('should generate a shared link successfully', async () => {
      mockRequest.body = { videoId: 1, expiresInHours: 24 };
      
      const mockVideo = { id: 1, name: 'test-video.mp4' };
      (dbService.findUniqueVideo as jest.Mock).mockResolvedValue(mockVideo);
      
      const mockSharedLink = {
        link: 'generated-uuid',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
      (dbService.createSharedLink as jest.Mock).mockResolvedValue(mockSharedLink);

      await generateSharedLink(
        mockRequest as Request, 
        mockResponse as Response
      );

      expect(dbService.findUniqueVideo).toHaveBeenCalledWith(1);
      expect(dbService.createSharedLink).toHaveBeenCalledWith(expect.objectContaining({
        videoId: 1,
        link: expect.any(String),
        expiresAt: expect.any(Date)
      }));
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        link: expect.stringContaining('/stream/'),
        expiresAt: expect.any(Date)
      }));
    });

    it('should return 404 if video is not found', async () => {
      mockRequest.body = { videoId: 999, expiresInHours: 24 };
      (dbService.findUniqueVideo as jest.Mock).mockResolvedValue(null);

      await generateSharedLink(
        mockRequest as Request, 
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Video not found' });
    });

    it('should handle internal server errors', async () => {
      mockRequest.body = { videoId: 1, expiresInHours: 24 };
      (dbService.findUniqueVideo as jest.Mock).mockRejectedValue(new Error('DB Error'));

      await generateSharedLink(
        mockRequest as Request, 
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Failed to generate shared link' });
    });
  });

  describe('accessSharedLink', () => {
    it('should return video details for a valid shared link', async () => {
      mockRequest.params = { link: '123' };
      const mockSharedLink = {
        video: {
          id: 1,
          name: 'test-video.mp4',
          size: 1024,
          duration: 60
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
      (dbService.findUniqueSharedLink as jest.Mock).mockResolvedValue(mockSharedLink);

      await accessSharedLink(
        mockRequest as Request, 
        mockResponse as Response
      );

      expect(dbService.findUniqueSharedLink).toHaveBeenCalledWith(123);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        video: {
          id: 1,
          name: 'test-video.mp4',
          size: 1024,
          duration: 60
        }
      });
    });

    it('should return 404 for an expired shared link', async () => {
      mockRequest.params = { link: '123' };
      const mockSharedLink = {
        video: {},
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      };
      (dbService.findUniqueSharedLink as jest.Mock).mockResolvedValue(mockSharedLink);

      await accessSharedLink(
        mockRequest as Request, 
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Link expired or invalid' });
    });

    it('should handle cases where shared link is not found', async () => {
      mockRequest.params = { link: '999' };
      (dbService.findUniqueSharedLink as jest.Mock).mockResolvedValue(undefined);

      await accessSharedLink(
        mockRequest as Request, 
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Link expired or invalid' });
    });
  });

  describe('getSharedVideo', () => {
    it('should stream video for a valid shared link', async () => {
      mockRequest.params = { linkId: '123' };
      const mockSharedLink = {
        video: {
          id: 1,
          name: 'test-video.mp4',
          path: 'videos/test-video.mp4'
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
      (dbService.findUniqueSharedLink as jest.Mock).mockResolvedValue(mockSharedLink);
      
      const mockCreateReadStream = {
        pipe: jest.fn()
      };
      
      (path.resolve as jest.Mock).mockReturnValue('/full/path/to/video');
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.createReadStream as jest.Mock).mockReturnValue(mockCreateReadStream);

      await getSharedVideo(
        mockRequest as Request, 
        mockResponse as Response
      );

      expect(dbService.findUniqueSharedLink).toHaveBeenCalledWith(123);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'video/mp4');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Disposition', 'inline; filename="test-video.mp4"');
      expect(mockCreateReadStream.pipe).toHaveBeenCalledWith(mockResponse);
    });

    it('should return 404 for an expired shared link', async () => {
      mockRequest.params = { linkId: '123' };
      const mockSharedLink = {
        video: {},
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      };
      (dbService.findUniqueSharedLink as jest.Mock).mockResolvedValue(mockSharedLink);

      await getSharedVideo(
        mockRequest as Request, 
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Link expired or invalid' });
    });

    it('should return 404 when video file does not exist', async () => {
      mockRequest.params = { linkId: '123' };
      const mockSharedLink = {
        video: {
          name: 'test-video.mp4',
          path: 'videos/test-video.mp4'
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
      (dbService.findUniqueSharedLink as jest.Mock).mockResolvedValue(mockSharedLink);
      (path.resolve as jest.Mock).mockReturnValue('/full/path/to/video');
      (fs.existsSync as jest.Mock).mockImplementation(() => {
        throw new Error('File not found');
      });

      await getSharedVideo(
        mockRequest as Request, 
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Video file not found.' });
    });
  });
});