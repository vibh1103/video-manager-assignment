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

export const trimVideo = async (req: Request, res: Response): Promise<void> => {
  const { videoId, start, end } = req.body;

  if (typeof videoId !== 'number' || start === undefined || end === undefined) {
    res.status(400).json({ error: 'Invalid input parameters' });
    return;
  }

  try {
    // Fetch the original video metadata
    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    // Validate the trimming range
    if (start < 0 || end > video.duration || start >= end) {
      res.status(400).json({
        error: 'Invalid start or end time. Ensure the range is within the video duration.',
      });
      return;
    }

    // Perform trimming using FFmpeg
    const outputPath = `${video.path.split('.mp4')[0]}_trimmed_${Date.now()}.mp4`;
    ffmpeg(video.path)
      .setStartTime(start) // in seconds
      .setDuration(end - start)
      .output(outputPath)
      .on('end', async () => {
        try {
          // Save trimmed video metadata to the database
          const trimmedVideo = await prisma.video.create({
            data: {
              name: `${video.name}_trimmed`,
              size: (await fs.stat(outputPath)).size,
              duration: end - start,
              path: outputPath,
            },
          });
          res.status(201).json(trimmedVideo);
        } catch (dbError) {
          console.error(dbError);
          res.status(500).json({ error: 'Failed to save trimmed video to the database' });
        }
      })
      .on('error', (ffmpegError) => {
        console.error(ffmpegError);
        res.status(500).json({ error: 'Failed to trim video' });
      })
      .run();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
};