import { Router } from 'express';
import { getSharedVideo } from '../Controllers/sharedLinkController';

const router = Router();

/**
 * @swagger
 * /stream/{linkId}:
 *   get:
 *     summary: Get a shared video by linkId
 *     description: Fetches and streams a video file by its unique shareable linkId.
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: linkId
 *         required: true
 *         description: The unique linkId for accessing the shared video.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video fetched successfully and streamed to the client
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Video not found
 *       410:
 *         description: Link expired (optional, if expiration handling is implemented)
 *       500:
 *         description: Internal server error
 */
router.get('/:linkId', getSharedVideo);

export default router;
