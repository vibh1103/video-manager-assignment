import { Request, Response } from 'express';
import {
  MIN_VIDEO_DURATION_SECS,
  MAX_VIDEO_DURATION_SECS
} from '../config/env.config';
import path from 'path';
import fs from 'fs/promises';
import {
  ffmpegMerge,
  ffmpegTrim,
  getVideoDuration
} from '../utils/ffmpeg.service';
import {
  findUniqueVideo,
  createVideo,
  findMultipleVideo
} from '../utils/db.service';

export const uploadVideo = async (
  req: Request,
  res: Response
): Promise<void> => {
  const file = req.file;

  if (!file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const filePath = path.resolve(file.path);

  try {
    const duration = await getVideoDuration(filePath);

    if (
      duration < MIN_VIDEO_DURATION_SECS ||
      duration > MAX_VIDEO_DURATION_SECS
    ) {
      await fs.unlink(filePath).catch(() => {});
      res.status(400).json({
        error: `Video duration must be between ${MIN_VIDEO_DURATION_SECS} and ${MAX_VIDEO_DURATION_SECS} seconds.`
      });
      return;
    }

    let data = {
      name: file.originalname,
      size: file.size,
      duration: Math.round(duration),
      path: file.path
    };

    let video = await createVideo(data);

    res.status(201).json(video);
  } catch (error) {
    await fs.unlink(filePath).catch(() => {});

    console.error(error);
    res
      .status(500)
      .json({ error: 'An error occurred while processing the video' });
  }
};

export const trimVideo = async (req: Request, res: Response): Promise<void> => {
  const { videoId, start, end } = req.body;

  try {
    const video = await findUniqueVideo(videoId);
    if (!video) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    const outputPath = `${video.path.split('.mp4')[0]}_trimmed_${Date.now()}.mp4`;

    try {
      await ffmpegTrim(video.path, start, end, outputPath);
    } catch (error) {
      res.status(500).json({ error: 'Failed to trim video' });
      return;
    }

    const trimmedVideo = await createVideo({
      name: `${video.name}_trimmed`,
      size: (await fs.stat(outputPath)).size,
      duration: end - start,
      path: outputPath
    });

    res.status(201).json(trimmedVideo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
};

export const mergeVideos = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { videoIds } = req.body;

  try {
    const videos = await findMultipleVideo(videoIds);

    if (videos === undefined || videos.length !== videoIds.length) {
      res.status(404).json({ error: 'One or more videos not found' });
      return;
    }

    // Generate FFmpeg input list
    const fileListPath = `temp_${Date.now()}.mp4`;
    const fileListContent = videos.map((v) => `file '${v.path}'`).join('\n');
    const totalDuration = videos.reduce((sum, v) => sum + v.duration, 0);
    const totalSize = videos.reduce((sum, v) => sum + v.size, 0);

    try {
      await fs.writeFile(fileListPath, fileListContent); // Save file list to the filesystem
    } catch (writeError) {
      console.error('Error writing file list:', writeError);
      res.status(500).json({ error: 'Failed to create temporary file list' });
      return;
    }

    const outputPath = `uploads/merged_${Date.now()}.mp4`;

    await ffmpegMerge(fileListPath, outputPath);
    await fs.unlink(fileListPath);

    const mergedVideo = await createVideo({
      name: 'Merged Video',
      size: totalSize,
      duration: totalDuration,
      path: outputPath
    });

    res.status(201).json(mergedVideo);
    return;
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
};
