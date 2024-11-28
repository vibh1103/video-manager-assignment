import { Router } from 'express';
import { trimVideo, uploadVideo } from '../Controllers/videoController';
import { upload } from '../config/multerConfig';

const router = Router();

router.post('/upload', upload.single('video'), uploadVideo);
router.post('/trim', trimVideo);

export default router;
