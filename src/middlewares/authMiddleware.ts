import { Request, Response, NextFunction } from 'express';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('x-api-key');
  if (!token || token !== process.env.API_TOKEN) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
};
