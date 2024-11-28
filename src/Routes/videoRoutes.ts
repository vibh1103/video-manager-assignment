import { Router } from 'express';
import {
  mergeVideos,
  trimVideo,
  uploadVideo
} from '../Controllers/videoController';
import { upload } from '../config/multerConfig';
import {
  accessSharedLink,
  generateSharedLink
} from '../Controllers/sharedLinkController';
import JoiValidationError from 'express-joi-validation';
import {
  accessSharedLinkSchema,
  generateSharedLinkSchema,
  mergeVideosSchema,
  trimVideoSchema
} from '../utils/joi.util';
const validator = JoiValidationError.createValidator({});

const router = Router();

/**
 * @swagger
 * /videos/upload:
 *   post:
 *     summary: Upload a video
 *     tags:
 *       - Videos
 *     description: Allows users to upload a video file with configurable size and duration limits.
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: Video file to upload.
 *     responses:
 *       201:
 *         description: Video uploaded successfully.
 *       400:
 *         description: Invalid request or constraints not met.
 *       500:
 *         description: Internal server error.
 */
router.post('/upload', upload.single('video'), uploadVideo);
/**
 * @swagger
 * /videos/trim:
 *   post:
 *     summary: Trim a video
 *     tags:
 *       - Videos
 *     description: Allows users to trim a previously uploaded video from the start or end.
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               videoId:
 *                 type: integer
 *                 description: The ID of the video to trim.
 *               start:
 *                 type: integer
 *                 description: The start time in seconds from which the video should be trimmed.
 *               end:
 *                 type: integer
 *                 description: The end time in seconds up to which the video should be trimmed.
 *     responses:
 *       201:
 *         description: Video trimmed successfully.
 *       400:
 *         description: Invalid request or constraints not met.
 *       404:
 *         description: Video not found.
 *       500:
 *         description: Internal server error.
 */
router.post('/trim', validator.body(trimVideoSchema), trimVideo);
/**
 * @swagger
 * /videos/merge:
 *   post:
 *     summary: Merge multiple videos
 *     tags:
 *       - Videos
 *     description: Allows users to merge multiple previously uploaded videos into one.
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               videoIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of video IDs to be merged.
 *     responses:
 *       201:
 *         description: Videos merged successfully.
 *       400:
 *         description: Invalid request or constraints not met.
 *       404:
 *         description: One or more videos not found.
 *       500:
 *         description: Internal server error.
 */
router.post('/merge', validator.body(mergeVideosSchema), mergeVideos);
/**
 * @swagger
 * /videos/share:
 *   post:
 *     summary: Generate a sharable link
 *     tags:
 *       - Videos
 *     description: Allows users to generate a time-based sharable link for a video.
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               videoId:
 *                 type: integer
 *                 description: The ID of the video to share.
 *               expiresInHours:
 *                 type: integer
 *                 description: The time in hours after which the link will expire.
 *     responses:
 *       201:
 *         description: Sharable link generated successfully.
 *       400:
 *         description: Invalid request or constraints not met.
 *       404:
 *         description: Video not found.
 *       500:
 *         description: Internal server error.
 */
router.post(
  '/share',
  validator.body(generateSharedLinkSchema),
  generateSharedLink
);
/**
 * @swagger
 * /videos/shared/{linkId}:
 *   get:
 *     summary: Access a sharable video link
 *     tags:
 *       - Videos
 *     description: Allows users to access a video through a time-based sharable link.
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *     parameters:
 *       - in: path
 *         name: linkId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the sharable link.
 *     responses:
 *       200:
 *         description: Video retrieved successfully.
 *       404:
 *         description: Link expired or invalid.
 *       500:
 *         description: Internal server error.
 */
router.get(
  '/shared/:link',
  validator.body(accessSharedLinkSchema),
  accessSharedLink
);

export default router;
