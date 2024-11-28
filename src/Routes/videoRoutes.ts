import { Router } from 'express';
import { uploadVideo } from '../Controllers/videoController';
import { upload } from '../config/multerConfig';

const router = Router();

router.post('/upload', upload.single('video'), uploadVideo);

export default router;
