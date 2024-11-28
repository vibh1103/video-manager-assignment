export const MIN_VIDEO_DURATION_SECS = Number(process.env.MIN_VIDEO_DURATION_SECS) || 5; 
export const MAX_VIDEO_DURATION_SECS = Number(process.env.MAX_VIDEO_DURATION_SECS) || 25;
export const FFPROBE_PATH = '/opt/homebrew/bin/ffprobe';