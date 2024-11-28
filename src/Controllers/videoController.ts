import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import ffmpeg from 'fluent-ffmpeg';
ffmpeg.setFfprobePath('/opt/homebrew/bin/ffprobe');
import path from 'path';
import fs from 'fs/promises'; 

const prisma = new PrismaClient();

const MIN_VIDEO_DURATION_SECS = Number(process.env.MIN_VIDEO_DURATION_SECS) || 5; 
const MAX_VIDEO_DURATION_SECS = Number(process.env.MAX_VIDEO_DURATION_SECS) || 25;

const getVideoDuration = (filePath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      const duration = metadata.format.duration;
      if (!duration) return reject(new Error('Unable to retrieve video duration'));
      resolve(duration);
    });
  });
};

export const uploadVideo = async (req: Request, res: Response): Promise<void> => {
  const file = req.file;

  if (!file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const filePath = path.resolve(file.path);

  try {
    const duration = await getVideoDuration(filePath);

    if (duration < MIN_VIDEO_DURATION_SECS || duration > MAX_VIDEO_DURATION_SECS) {
      await fs.unlink(filePath).catch(() => {}); // Ignore errors in cleanup
      res.status(400).json({
        error: `Video duration must be between ${MIN_VIDEO_DURATION_SECS} and ${MAX_VIDEO_DURATION_SECS} seconds.`,
      });
      return;
    }

    const video = await prisma.video.create({
      data: {
        name: file.originalname,
        size: file.size,
        duration: Math.round(duration),
        path: file.path,
      },
    });

    res.status(201).json(video);
  } catch (error) {
    await fs.unlink(filePath).catch(() => {});

    console.error(error); 
    res.status(500).json({ error: 'An error occurred while processing the video' });
  }
};
