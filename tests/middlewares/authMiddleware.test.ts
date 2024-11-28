import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../../src/middlewares/authMiddleware';

describe('Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  const originalApiToken = process.env.API_TOKEN;

  beforeEach(() => {
    process.env.API_TOKEN = 'test-secret-token';

    mockRequest = {
      header: jest.fn()
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    process.env.API_TOKEN = originalApiToken;
    jest.clearAllMocks();
  });

  it('should call next() when a valid API token is provided', () => {
    (mockRequest.header as jest.Mock).mockReturnValue('test-secret-token');

    authMiddleware(
      mockRequest as Request, 
      mockResponse as Response, 
      mockNext
    );

    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });

  it('should return 401 when no API token is provided', () => {
    (mockRequest.header as jest.Mock).mockReturnValue(undefined);

    authMiddleware(
      mockRequest as Request, 
      mockResponse as Response, 
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when an incorrect API token is provided', () => {
    (mockRequest.header as jest.Mock).mockReturnValue('wrong-token');

    authMiddleware(
      mockRequest as Request, 
      mockResponse as Response, 
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle edge cases with null or empty token', () => {
    const testCases = [null, ''];
    
    testCases.forEach((testToken) => {
      (mockRequest.header as jest.Mock).mockReturnValue(testToken);

      authMiddleware(
        mockRequest as Request, 
        mockResponse as Response, 
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  it('should be case-sensitive with API token comparison', () => {
    process.env.API_TOKEN = 'CaseSensitiveToken';
    (mockRequest.header as jest.Mock).mockReturnValue('casesensitivetoken');

    authMiddleware(
      mockRequest as Request, 
      mockResponse as Response, 
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(mockNext).not.toHaveBeenCalled();
  });
});