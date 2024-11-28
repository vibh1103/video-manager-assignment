import { Request, Response } from 'express';
import { MIN_VIDEO_DURATION_SECS, MAX_VIDEO_DURATION_SECS } from '../config/env.config';
import path from 'path';
import fs from 'fs/promises';
import fsOld from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ffmpegMerge, ffmpegTrim, getVideoDuration } from '../utils/ffmpeg.service';
import { findUniqueVideo, createVideo, findMultipleVideo, createSharedLink, findUniqueSharedLink } from '../utils/db.service';


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
      await fs.unlink(filePath).catch(() => {});
      res.status(400).json({
        error: `Video duration must be between ${MIN_VIDEO_DURATION_SECS} and ${MAX_VIDEO_DURATION_SECS} seconds.`,
      });
      return;
    }

    let data =  {
        name: file.originalname,
        size: file.size,
        duration: Math.round(duration),
        path: file.path,
      }

    let video = await createVideo(data)
    
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
    const video = await findUniqueVideo(videoId);
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

    try {
      await ffmpegTrim(video.path, start, end, outputPath)
    } catch (error) {
      res.status(500).json({ error: 'Failed to trim video' });
      return;
    }
    

      const trimmedVideo = await createVideo({
            name: `${video.name}_trimmed`,
            size: (await fs.stat(outputPath)).size,
            duration: end - start,
            path: outputPath,
        })
      

      res.status(201).json(trimmedVideo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
};

export const mergeVideos = async (req: Request, res: Response): Promise<void> => {
  const { videoIds } = req.body;

  // Validate request input
  if (!Array.isArray(videoIds) || videoIds.length < 2) {
    res.status(400).json({ error: 'Provide at least two video IDs to merge' });
    return;
  }

  try {
    // Fetch video metadata for all provided IDs
    const videos = await findMultipleVideo(videoIds)

    if (videos === undefined) {
      res.status(404).json({ error: 'One or more videos not found' });
      return;
    }

    if (videos.length !== videoIds.length) {
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
          path: outputPath,
      });

      res.status(201).json(mergedVideo);
      return;
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
};


export const generateSharedLink = async (req: Request, res: Response): Promise<void> => {
  const { videoId, expiresInHours } = req.body;

  if (!videoId || typeof expiresInHours !== 'number' || expiresInHours <= 0) {
    res.status(400).json({ error: 'Invalid input parameters' });
    return;
  }

  try {
    // Check if the video exists
    const video = await findUniqueVideo(videoId);
    if (!video) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    // Generate the sharable link
    const link = uuidv4(); // Generate a unique link identifier
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    // Save the link in the database
    const sharedLink = await createSharedLink({
      videoId,
      link,
      expiresAt,
    });

    res.status(201).json({
      link: `${req.protocol}://${req.get('host')}/stream/${sharedLink.link}`,
      expiresAt: sharedLink.expiresAt,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate shared link' });
  }
};

export const accessSharedLink = async (req: Request, res: Response): Promise<void> => {
  const { link } = req.params;

  try {
    // Check if the link exists and is still valid
    const sharedLink = await findUniqueSharedLink(Number(link));

    if (sharedLink === undefined) {
      res.status(404).json({ error: 'Link expired or invalid' });
      return;
    }

    if (!sharedLink || new Date() > sharedLink.expiresAt) {
      res.status(404).json({ error: 'Link expired or invalid' });
      return;
    }

    // Respond with video metadata or streaming URL
    res.status(200).json({
      video: {
        id: sharedLink.video.id,
        name: sharedLink.video.name,
        size: sharedLink.video.size,
        duration: sharedLink.video.duration,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to access shared link' });
  }
};

export const getSharedVideo = async (req: Request, res: Response): Promise<void> => {
  const { linkId } = req.params;  

  try {
    const sharedLink = await findUniqueSharedLink(Number(linkId));

    if (!sharedLink || new Date() > sharedLink.expiresAt) {
      res.status(404).json({ error: 'Link expired or invalid' });
      return;
    }
    const videoPath = path.resolve(__dirname, '../..' ,sharedLink.video.path);

    try {
      await fs.access(videoPath);  // Check if the file exists
    } catch (error) {
      res.status(404).json({ error: 'Video file not found.' });
      return;
    }

    res.setHeader('Content-Type', 'video/mp4'); 
    res.setHeader('Content-Disposition', `inline; filename="${sharedLink.video.name}"`);  

    const videoStream = fsOld.createReadStream(videoPath);
    videoStream.pipe(res);  
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error.' }); 
    return;
  }
};