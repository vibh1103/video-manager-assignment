import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import {
  findUniqueVideo,
  createSharedLink,
  findUniqueSharedLink
} from '../utils/db.service';
import { v4 as uuidv4 } from 'uuid';

export const generateSharedLink = async (
  req: Request,
  res: Response
): Promise<void> => {
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
      expiresAt
    });

    res.status(201).json({
      link: `${req.protocol}://${req.get('host')}/stream/${sharedLink.link}`,
      expiresAt: sharedLink.expiresAt
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate shared link' });
  }
};

export const accessSharedLink = async (
  req: Request,
  res: Response
): Promise<void> => {
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
        duration: sharedLink.video.duration
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to access shared link' });
  }
};

export const getSharedVideo = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { linkId } = req.params;

  try {
    const sharedLink = await findUniqueSharedLink(Number(linkId));

    if (!sharedLink || new Date() > sharedLink.expiresAt) {
      res.status(404).json({ error: 'Link expired or invalid' });
      return;
    }
    const videoPath = path.resolve(__dirname, '../..', sharedLink.video.path);

    try {
      fs.existsSync(videoPath); // Check if the file exists
    } catch (error) {
      res.status(404).json({ error: 'Video file not found.' });
      return;
    }

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${sharedLink.video.name}"`
    );

    const videoStream = fs.createReadStream(videoPath);
    videoStream.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error.' });
    return;
  }
};
