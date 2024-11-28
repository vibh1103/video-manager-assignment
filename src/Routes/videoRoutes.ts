import { Router } from 'express';
import { mergeVideos, trimVideo, uploadVideo } from '../Controllers/videoController';
import { upload } from '../config/multerConfig';

const router = Router();

router.post('/upload', upload.single('video'), uploadVideo);
router.post('/trim', trimVideo);
router.post('/merge', mergeVideos);

export default router;
