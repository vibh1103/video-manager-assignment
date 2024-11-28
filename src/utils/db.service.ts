import { PrismaClient, SharedLink, Video } from '@prisma/client';

const prisma = new PrismaClient();

export const createVideo = async (video: Partial<Video>): Promise<Video> => {
  if (!video.name || !video.size || !video.duration || !video.path) {
    throw new Error('Missing required video fields');
  }

  const videoData = {
    name: video.name,
    size: video.size,
    duration: video.duration,
    path: video.path,
    createdAt: video.createdAt || new Date(),
    uploadedAt: video.uploadedAt || new Date()
  };

  return await prisma.video.create({
    data: {
      ...videoData,
      createdAt: video.createdAt || new Date(),
      uploadedAt: video.uploadedAt || new Date()
    }
  });
};

export const findUniqueVideo = async (
  id: number
): Promise<Video | undefined> => {
  let video = await prisma.video.findUnique({ where: { id } });

  if (video) {
    return video;
  } else {
    return undefined;
  }
};

export const findMultipleVideo = async (
  ids: number[]
): Promise<Video[] | undefined> => {
  let video = await prisma.video.findMany({ where: { id: { in: ids } } });

  if (video.length === ids.length) {
    return video;
  } else {
    return undefined;
  }
};

export const createSharedLink = async (
  shareLink: Partial<SharedLink>
): Promise<SharedLink> => {
  const { link, videoId, expiresAt } = shareLink;
  if (!link || !videoId || !expiresAt) {
    throw new Error('Missing required fields');
  }

  return await prisma.sharedLink.create({
    data: {
      expiresAt,
      link,
      videoId
    }
  });
};

export const findUniqueSharedLink = async (
  id: number
): Promise<(SharedLink & { video: Video }) | undefined> => {
  let sharedLink = await prisma.sharedLink.findUnique({
    where: { id },
    include: { video: true }
  });

  if (sharedLink) {
    return sharedLink;
  } else {
    return undefined;
  }
};
