import ffmpeg from 'fluent-ffmpeg';
import { FFPROBE_PATH } from '../config/env.config';
ffmpeg.setFfprobePath(FFPROBE_PATH);

export const getVideoDuration = (filePath: string): Promise<number> => {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) return reject(err);
        const duration = metadata.format.duration;
        if (!duration) return reject(new Error('Unable to retrieve video duration'));
        resolve(duration);
      });
    });
  };

export const ffmpegTrim = (path: string, start: number, end: number, outputPath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        ffmpeg(path)
        .setStartTime(start)
        .setDuration(end - start)
        .output(outputPath)
        .on('end', async () => {
            resolve()
        })
        .on('error', (ffmpegError) => {
            console.error(ffmpegError);
            reject('Failed to trim video');
        })
        .run();
    })
}

export const ffmpegMerge = (fileListPath: string, outputPath: string): Promise<void> => {
    return new Promise((resolve, rejects) => {
        ffmpeg()
        .input(fileListPath)
        .inputFormat('concat')
        .outputOptions('-c copy') // Use copy codec to avoid re-encoding
        .output(outputPath)
        .on('end', async () => {
           resolve()
        })
        .on('error', async (ffmpegError) => {
            rejects('Failed to merge videos')
        })
        .run();
    })
}