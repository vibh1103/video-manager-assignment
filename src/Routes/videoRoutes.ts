import { Router } from 'express';
import { accessSharedLink, generateSharedLink, mergeVideos, trimVideo, uploadVideo } from '../Controllers/videoController';
import { upload } from '../config/multerConfig';

const router = Router();

router.post('/upload', upload.single('video'), uploadVideo);
router.post('/trim', trimVideo);
router.post('/merge', mergeVideos);
router.post('/share', generateSharedLink);
router.get('/shared/:link', accessSharedLink);

export default router;
